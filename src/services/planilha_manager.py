import os
import re
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def obter_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)

def conectar_planilha():
    """Conecta ao Google Sheets utilizando caminho absoluto para as credenciais."""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        arquivo_credenciais = os.path.join(base_dir, "config", "credentials.json")
        
        # Fallback se executado direto da raiz
        if not os.path.exists(arquivo_credenciais):
            arquivo_credenciais = os.path.join(os.getcwd(), "src", "config", "credentials.json")

        if not os.path.exists(arquivo_credenciais):
            print(f"ERRO: Arquivo de credenciais não encontrado em: {arquivo_credenciais}")
            return None

        creds = Credentials.from_service_account_file(arquivo_credenciais, scopes=SCOPES)
        client = gspread.authorize(creds)
        
        SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID") 
        if not SPREADSHEET_ID:
            print("ERRO: GOOGLE_SHEET_ID não definido no arquivo .env")
            return None

        ABA_COBRANCA = "Cobranca_Alunos"
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(ABA_COBRANCA)
        return sheet
    except Exception as e:
        print(f"Erro na conexão com o Google Sheets: {e}")
        return None

def buscar_devedores():
    """
    Busca alunos para notificação de vencimento: Hoje (0), Amanhã (-1) e Pré-Aviso (-5).
    Estratégia Híbrida:
    1. Tenta consultar primeiramente no Supabase (alta velocidade).
    2. Fallback automático para a planilha do Google Sheets.
    """
    hoje = datetime.now().date()
    lista_cobranca = []

    # 1. Tentativa via Supabase
    try:
        supabase = obter_supabase_client()
        if supabase:
            res = supabase.table("alunos_cobranca")\
                .select("id, nome_aluno, telefone_whatsapp, curso, vencimento_atual, status_pagamento")\
                .not_.is_("vencimento_atual", "null")\
                .execute()

            alunos_sb = res.data or []
            for a in alunos_sb:
                status = str(a.get("status_pagamento", "")).upper()
                if "CONCLU" in status or "PAGO" in status:
                    continue

                venc_str = a.get("vencimento_atual")
                if not venc_str:
                    continue

                try:
                    data_venc = datetime.strptime(str(venc_str).strip(), "%Y-%m-%d").date()
                except ValueError:
                    continue

                diferenca = (hoje - data_venc).days
                if diferenca in [-5, -1, 0]:
                    tel_limpo = re.sub(r"\D", "", str(a.get("telefone_whatsapp", "")))
                    if len(tel_limpo) in [10, 11] and not tel_limpo.startswith("55"):
                        tel_limpo = "55" + tel_limpo

                    lista_cobranca.append({
                        "id_supabase": a.get("id"),
                        "nome": str(a.get("nome_aluno", "")).strip(),
                        "telefone": tel_limpo,
                        "curso": str(a.get("curso", "")).strip(),
                        "dias_atraso": diferenca,
                        "vencimento_original": data_venc.strftime("%d/%m/%Y"),
                        "origem": "supabase"
                    })

            print(f"[Supabase] {len(lista_cobranca)} alunos elegíveis para cobrança hoje.")
            return lista_cobranca

    except Exception as e:
        print(f"[Aviso] Falha ao consultar Supabase para cobranca ({e}). Ativando fallback Google Sheets...")

    # 2. Fallback via Google Sheets
    sheet = conectar_planilha()
    if not sheet:
        return []

    print("Lendo dados da planilha do Google Sheets...")
    try:
        dados = sheet.get_all_records()
    except Exception as e:
        print(f"Erro ao baixar dados da planilha: {e}")
        return []

    for linha in dados:
        nome = linha.get("NOME_ALUNO")
        try:
            vencimento_str = str(linha.get("VENCIMENTO_ATUAL", "")).strip()
            telefone = str(linha.get("TELEFONE_WHATSAPP", "")).strip()
            status_pagamento = str(linha.get("STATUS_PAGAMENTO", "")).strip()

            if not nome or not vencimento_str:
                continue

            status_upper = status_pagamento.upper()
            if "CONCLUÍDO" in status_upper or "PAGO" in status_upper:
                continue

            try:
                data_venc = datetime.strptime(vencimento_str, "%d/%m/%Y").date()
            except ValueError:
                try:
                    data_venc = datetime.strptime(vencimento_str, "%Y-%m-%d").date()
                except ValueError:
                    continue

            diferenca = (hoje - data_venc).days
            if diferenca in [-5, -1, 0]:
                telefone_limpo = "".join(filter(str.isdigit, telefone))
                if len(telefone_limpo) in [10, 11] and not telefone_limpo.startswith("55"):
                    telefone_limpo = "55" + telefone_limpo
                
                lista_cobranca.append({
                    "id_supabase": None,
                    "nome": str(nome).strip(),
                    "telefone": telefone_limpo,
                    "curso": str(linha.get("CURSO", "")).strip(),
                    "dias_atraso": diferenca, 
                    "vencimento_original": vencimento_str,
                    "origem": "sheets"
                })

        except Exception as e:
            continue

    return lista_cobranca