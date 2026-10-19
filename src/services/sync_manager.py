import os
import re
import sys
from pathlib import Path
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv
from supabase import create_client, Client

RAIZ_PROJETO = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(RAIZ_PROJETO))
sys.path.append(str(RAIZ_PROJETO / "src"))

load_dotenv(RAIZ_PROJETO / ".env")

CREDENTIALS_FILE = RAIZ_PROJETO / "src" / "config" / "credentials.json"
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ABA_COBRANCA = "Cobranca_Alunos"
ABA_CRM = "CRM_Vendas"

ESCOPOS = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def obter_supabase_client() -> Client:
    """Retorna uma instância autenticada do cliente Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY devem estar definidos no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def obter_planilha_sheets():
    """Retorna a folha de cálculo aberta pelo Google Sheets."""
    if not SPREADSHEET_ID:
        raise ValueError("GOOGLE_SHEET_ID não está configurado no .env")
    if not CREDENTIALS_FILE.exists():
        raise FileNotFoundError(f"Arquivo de credenciais não encontrado em: {CREDENTIALS_FILE}")
    
    creds = Credentials.from_service_account_file(str(CREDENTIALS_FILE), scopes=ESCOPOS)
    cliente = gspread.authorize(creds)
    return cliente.open_by_key(SPREADSHEET_ID)

def limpar_telefone(telefone: str) -> str:
    """Extrai apenas os números e garante o DDI 55."""
    if not telefone:
        return ""
    apenas_numeros = re.sub(r"\D", "", str(telefone).strip())
    if not apenas_numeros:
        return ""
    if len(apenas_numeros) in [10, 11] and not apenas_numeros.startswith("55"):
        apenas_numeros = "55" + apenas_numeros
    return apenas_numeros

def parse_data_iso(data_str: str) -> str | None:
    """Converte datas em formatos comuns para YYYY-MM-DD para o PostgreSQL."""
    if not data_str:
        return None
    texto = str(data_str).strip()
    if not texto:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"):
        try:
            return datetime.strptime(texto, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None

def parse_valor_moeda(valor) -> float:
    """Converte valores de moeda ou texto em float seguro."""
    if valor is None:
        return 0.0
    texto = str(valor).strip()
    if not texto or texto == ".":
        return 0.0
    texto_limpo = re.sub(r"[^\d,\.]", "", texto)
    if "," in texto_limpo and "." in texto_limpo:
        texto_limpo = texto_limpo.replace(".", "").replace(",", ".")
    elif "," in texto_limpo:
        texto_limpo = texto_limpo.replace(",", ".")
    try:
        return float(texto_limpo)
    except ValueError:
        return 0.0

def sincronizar_cobranca_sheets_para_supabase() -> dict:
    """
    Lê a aba Cobranca_Alunos do Google Sheets e sincroniza com a tabela alunos_cobranca.
    Faz upsert inteligente baseado em (telefone_whatsapp, curso).
    """
    planilha = obter_planilha_sheets()
    aba = planilha.worksheet(ABA_COBRANCA)
    registros = aba.get_all_records()
    supabase = obter_supabase_client()

    # Busca registros existentes no Supabase para comparar
    existentes = supabase.table("alunos_cobranca").select("id, telefone_whatsapp, curso, nome_aluno").execute()
    mapa_existentes = {}
    for item in existentes.data:
        chave = (str(item.get("telefone_whatsapp", "")).strip(), str(item.get("curso", "")).strip().lower())
        mapa_existentes[chave] = item["id"]

    inseridos = 0
    atualizados = 0
    ignorados = 0

    for i, linha in enumerate(registros, start=2):
        nome = str(linha.get("NOME_ALUNO", "")).strip()
        tel_bruto = str(linha.get("TELEFONE_WHATSAPP", "")).strip()
        curso = str(linha.get("CURSO", "")).strip()
        venc_bruto = str(linha.get("VENCIMENTO_ATUAL", "")).strip()
        status_pag = str(linha.get("STATUS_PAGAMENTO", "")).strip() or "PENDENTE"
        valor_bruto = linha.get("VALOR_PARCELA")
        parcela_atual = str(linha.get("PARCELA_ATUAL", "")).strip()

        telefone = limpar_telefone(tel_bruto)
        if not nome or not telefone:
            ignorados += 1
            continue

        vencimento_iso = parse_data_iso(venc_bruto)
        valor_float = parse_valor_moeda(valor_bruto)

        dados_aluno = {
            "nome_aluno": nome,
            "telefone_whatsapp": telefone,
            "curso": curso or "Geral",
            "vencimento_atual": vencimento_iso,
            "status_pagamento": status_pag,
            "valor_parcela": valor_float,
            "parcela_atual": parcela_atual,
            "updated_at": datetime.now().isoformat()
        }

        chave = (telefone, (curso or "Geral").lower())
        if chave in mapa_existentes:
            aluno_id = mapa_existentes[chave]
            supabase.table("alunos_cobranca").update(dados_aluno).eq("id", aluno_id).execute()
            atualizados += 1
        else:
            dados_aluno["created_at"] = datetime.now().isoformat()
            res = supabase.table("alunos_cobranca").insert(dados_aluno).execute()
            if res.data:
                mapa_existentes[chave] = res.data[0]["id"]
            inseridos += 1

    return {
        "total_lidos": len(registros),
        "inseridos": inseridos,
        "atualizados": atualizados,
        "ignorados": ignorados
    }

def sincronizar_crm_bi_direcional() -> dict:
    """
    Sincroniza a aba CRM_Vendas com a tabela leads_crm de forma bi-direcional:
    1. Importa leads da planilha para o Supabase.
    2. Exporta leads cadastrados no Supabase (via web) de volta para a planilha.
    """
    planilha = obter_planilha_sheets()
    aba = planilha.worksheet(ABA_CRM)
    linhas_planilha = aba.get_all_records()
    supabase = obter_supabase_client()

    # 1. Lê todos os leads do Supabase
    res_supabase = supabase.table("leads_crm").select("*").execute()
    leads_sb = res_supabase.data or []

    mapa_sb = {}
    for lead in leads_sb:
        chave = (limpar_telefone(lead.get("telefone", "")), str(lead.get("curso_interesse", "")).strip().lower())
        mapa_sb[chave] = lead

    # 2. Sincroniza da Planilha -> Supabase
    inseridos_sb = 0
    atualizados_sb = 0

    mapa_planilha = {}
    for i, linha in enumerate(linhas_planilha, start=2):
        tel = limpar_telefone(linha.get("Telefone", ""))
        curso = str(linha.get("Curso_Interesse", "")).strip()
        chave = (tel, curso.lower())
        mapa_planilha[chave] = {"linha_idx": i, "dados": linha}

        if not tel:
            continue

        status = str(linha.get("Status_Funil", "")).strip() or "Novo"
        if status not in ["Novo", "Em Cadência", "Atendimento Humano", "Ganhou", "Perdeu"]:
            status = "Novo"

        dados_lead = {
            "data_entrada": parse_data_iso(linha.get("Data_Entrada")) or datetime.now().strftime("%Y-%m-%d"),
            "nome_lead": str(linha.get("Nome_Lead", "")).strip() or "Lead Sem Nome",
            "telefone": tel,
            "curso_interesse": curso or "Geral",
            "status_funil": status,
            "fase_cadencia": str(linha.get("Fase_Cadencia", "")).strip(),
            "data_ultimo_envio": parse_data_iso(linha.get("Data_Ultimo_Envio")),
            "id_mensagem_meta": str(linha.get("ID_Mensagem_Meta", "")).strip(),
            "updated_at": datetime.now().isoformat()
        }

        if chave in mapa_sb:
            lead_id = mapa_sb[chave]["id"]
            supabase.table("leads_crm").update(dados_lead).eq("id", lead_id).execute()
            atualizados_sb += 1
        else:
            dados_lead["created_at"] = datetime.now().isoformat()
            res = supabase.table("leads_crm").insert(dados_lead).execute()
            if res.data:
                mapa_sb[chave] = res.data[0]
            inseridos_sb += 1

    # 3. Sincroniza do Supabase -> Planilha (Leads novos criados via Web que ainda não estão no Sheets)
    inseridos_sheets = 0
    for chave, lead in mapa_sb.items():
        if chave not in mapa_planilha and chave[0]:  # chave[0] é o telefone
            dt_entrada_fmt = ""
            if lead.get("data_entrada"):
                try:
                    dt_entrada_fmt = datetime.strptime(lead["data_entrada"], "%Y-%m-%d").strftime("%d/%m/%Y")
                except ValueError:
                    dt_entrada_fmt = str(lead["data_entrada"])

            dt_envio_fmt = ""
            if lead.get("data_ultimo_envio"):
                try:
                    dt_envio_fmt = datetime.strptime(lead["data_ultimo_envio"], "%Y-%m-%d").strftime("%d/%m/%Y")
                except ValueError:
                    dt_envio_fmt = str(lead["data_ultimo_envio"])

            nova_linha = [
                dt_entrada_fmt,
                lead.get("nome_lead", ""),
                lead.get("telefone", ""),
                lead.get("curso_interesse", ""),
                lead.get("status_funil", "Novo"),
                lead.get("fase_cadencia", ""),
                dt_envio_fmt,
                lead.get("id_mensagem_meta", "")
            ]
            aba.append_row(nova_linha)
            inseridos_sheets += 1

    return {
        "total_planilha": len(linhas_planilha),
        "total_supabase": len(leads_sb),
        "inseridos_no_supabase": inseridos_sb,
        "atualizados_no_supabase": atualizados_sb,
        "exportados_para_planilha": inseridos_sheets
    }

def marcar_aluno_pago_hibrido(telefone_aluno: str, curso: str = None) -> bool:
    """
    Operação de 1 clique: Atualiza o status do aluno para CONCLUÍDO no Supabase
    e sincroniza a alteração diretamente na célula correspondente do Google Sheets.
    """
    tel_limpo = limpar_telefone(telefone_aluno)
    supabase = obter_supabase_client()

    # 1. Atualiza no Supabase
    query = supabase.table("alunos_cobranca").update({
        "status_pagamento": "CONCLUÍDO",
        "updated_at": datetime.now().isoformat()
    }).eq("telefone_whatsapp", tel_limpo)
    
    if curso:
        query = query.ilike("curso", f"%{curso}%")
    res = query.execute()

    # 2. Atualiza no Google Sheets
    try:
        planilha = obter_planilha_sheets()
        aba = planilha.worksheet(ABA_COBRANCA)
        registros = aba.get_all_records()

        for index, linha in enumerate(registros, start=2):
            tel_planilha = limpar_telefone(linha.get("TELEFONE_WHATSAPP", ""))
            curso_planilha = str(linha.get("CURSO", "")).strip().lower()

            if tel_planilha == tel_limpo:
                if not curso or curso.lower() in curso_planilha:
                    # Coluna E é a coluna 5 (STATUS_PAGAMENTO)
                    aba.update_cell(index, 5, "CONCLUÍDO")
                    return True
    except Exception as e:
        print(f"Erro ao sincronizar baixa de pagamento com o Google Sheets: {e}")

    return len(res.data) > 0

def criar_lead_crm_hibrido(nome: str, telefone: str, curso: str) -> dict:
    """
    Insere um novo lead no Supabase e imediatamente cria a linha na aba CRM_Vendas.
    """
    tel_limpo = limpar_telefone(telefone)
    data_hoje_iso = datetime.now().strftime("%Y-%m-%d")
    data_hoje_br = datetime.now().strftime("%d/%m/%Y")

    supabase = obter_supabase_client()
    dados_lead = {
        "data_entrada": data_hoje_iso,
        "nome_lead": nome.strip(),
        "telefone": tel_limpo,
        "curso_interesse": curso.strip(),
        "status_funil": "Novo",
        "fase_cadencia": "",
        "data_ultimo_envio": None,
        "id_mensagem_meta": "",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    res = supabase.table("leads_crm").insert(dados_lead).execute()

    # Insere no Google Sheets
    try:
        planilha = obter_planilha_sheets()
        aba = planilha.worksheet(ABA_CRM)
        nova_linha = [
            data_hoje_br,
            nome.strip(),
            tel_limpo,
            curso.strip(),
            "Novo",
            "",
            "",
            ""
        ]
        aba.append_row(nova_linha)
    except Exception as e:
        print(f"Erro ao replicar novo lead para o Google Sheets: {e}")

    return res.data[0] if res.data else {}

def formatar_data_br(data_str) -> str:
    """Converte datas em YYYY-MM-DD para DD/MM/AAAA."""
    if not data_str:
        return ""
    texto = str(data_str).strip()
    if "-" in texto:
        partes = texto.split("T")[0].split("-")
        if len(partes) == 3:
            return f"{partes[2]}/{partes[1]}/{partes[0]}"
    return texto

def obter_primeira_linha_vazia_planilha(aba) -> int:
    """
    Escaneia a coluna A para encontrar a PRIMEIRA linha exatamente vazia.
    Garante que novos cadastros nunca sejam jogados no final de linhas em branco pré-existentes.
    """
    col_a = aba.col_values(1)
    for idx, val in enumerate(col_a[1:], start=2):
        if not val or not str(val).strip():
            return idx
    return len(col_a) + 1

def adicionar_aluno_planilha_linha_exata(dados_aluno: dict) -> dict:
    """
    Adiciona um novo aluno na linha exata vazia da planilha Cobranca_Alunos.
    Garante a formatação correta de data (DD/MM/AAAA) e status.
    """
    try:
        planilha = obter_planilha_sheets()
        aba = planilha.worksheet(ABA_COBRANCA)
        linha_vazia = obter_primeira_linha_vazia_planilha(aba)

        nome = str(dados_aluno.get("nome_aluno", "")).strip()
        tel = limpar_telefone(dados_aluno.get("telefone_whatsapp", ""))
        curso = str(dados_aluno.get("curso", "Barbeiro")).strip()
        venc_br = formatar_data_br(dados_aluno.get("vencimento_atual", ""))
        status = str(dados_aluno.get("status_pagamento", "PENDENTE")).strip().upper()
        valor = dados_aluno.get("valor_parcela", "")
        parcela = str(dados_aluno.get("parcela_atual", "")).strip()

        valores = [[nome, tel, curso, venc_br, status, valor, parcela]]
        aba.update(range_name=f"A{linha_vazia}:G{linha_vazia}", values=valores)
        print(f"[Google Sheets] Aluno {nome} inserido com sucesso na linha exata {linha_vazia}.")
        return {"sucesso": True, "linha": linha_vazia, "operacao": "inserido"}
    except Exception as e:
        print(f"[Google Sheets] Erro ao adicionar aluno na linha exata: {e}")
        return {"sucesso": False, "erro": str(e)}

def atualizar_aluno_planilha(telefone_busca: str, curso_busca: str, novos_dados: dict) -> dict:
    """
    Localiza o aluno na planilha pelo telefone/curso e atualiza suas células exatas (A:G).
    Se não encontrar, insere na primeira linha vazia.
    """
    try:
        planilha = obter_planilha_sheets()
        aba = planilha.worksheet(ABA_COBRANCA)
        tel_alvo = limpar_telefone(telefone_busca)
        curso_alvo = (curso_busca or "").strip().lower()

        linhas = aba.get_all_values()
        linha_encontrada = None

        for idx, linha in enumerate(linhas[1:], start=2):
            tel_linha = limpar_telefone(linha[1] if len(linha) > 1 else "")
            curso_linha = (linha[2] if len(linha) > 2 else "").strip().lower()

            if tel_linha == tel_alvo:
                if not curso_alvo or curso_alvo in curso_linha or curso_linha in curso_alvo:
                    linha_encontrada = idx
                    break

        nome = str(novos_dados.get("nome_aluno", "")).strip()
        tel = limpar_telefone(novos_dados.get("telefone_whatsapp", tel_alvo))
        curso = str(novos_dados.get("curso", curso_busca or "Barbeiro")).strip()
        venc_br = formatar_data_br(novos_dados.get("vencimento_atual", ""))
        status = str(novos_dados.get("status_pagamento", "PENDENTE")).strip().upper()
        valor = novos_dados.get("valor_parcela", "")
        parcela = str(novos_dados.get("parcela_atual", "")).strip()

        valores = [[nome, tel, curso, venc_br, status, valor, parcela]]

        if linha_encontrada:
            aba.update(range_name=f"A{linha_encontrada}:G{linha_encontrada}", values=valores)
            print(f"[Google Sheets] Aluno {nome} atualizado na linha {linha_encontrada}.")
            return {"sucesso": True, "linha": linha_encontrada, "operacao": "atualizado"}
        else:
            return adicionar_aluno_planilha_linha_exata(novos_dados)
    except Exception as e:
        print(f"[Google Sheets] Erro ao atualizar aluno na planilha: {e}")
        return {"sucesso": False, "erro": str(e)}

