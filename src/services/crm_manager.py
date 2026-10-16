import os
import sys
import re
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

def obter_aba_crm():
    """Conecta à folha de cálculo do Google e retorna a aba do CRM."""
    creds = Credentials.from_service_account_file(str(CREDENTIALS_FILE), scopes=ESCOPOS)
    cliente = gspread.authorize(creds)
    planilha = cliente.open_by_key(SPREADSHEET_ID)
    return planilha.worksheet(ABA_CRM)

def formatar_data_para_br(data_iso: str | None) -> str:
    """Converte YYYY-MM-DD para DD/MM/AAAA."""
    if not data_iso:
        return ""
    try:
        return datetime.strptime(str(data_iso).strip(), "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        return str(data_iso)

def buscar_leads_cadencia():
    """
    Busca os leads com status 'Novo' ou 'Em Cadência'.
    Estratégia Híbrida Resiliente:
    1. Tenta consultar diretamente no Supabase (alta performance, tempo real).
    2. Fallback automático para o Google Sheets se a conexão falhar.
    """
    try:
        supabase = obter_supabase_client()
        res = supabase.table("leads_crm")\
            .select("*")\
            .in_("status_funil", ["Novo", "Em Cadência"])\
            .order("data_entrada", desc=False)\
            .execute()
        
        leads_sb = res.data or []
        print(f"[Supabase] {len(leads_sb)} leads elegiveis encontrados no banco de dados.")

        # Mapeia linhas físicas da planilha para manter paridade documental
        mapa_linhas_sheets = {}
        try:
            aba = obter_aba_crm()
            linhas_sheet = aba.get_all_records()
            for idx, r in enumerate(linhas_sheet, start=2):
                tel = re.sub(r"\D", "", str(r.get("Telefone", "")))
                curso = str(r.get("Curso_Interesse", "")).strip().lower()
                mapa_linhas_sheets[(tel, curso)] = idx
        except Exception as e_sheet:
            print(f"[Aviso] Nao foi possivel mapear linhas fisicas do Sheets: {e_sheet}")

        leads_formatados = []
        for lead in leads_sb:
            tel_limpo = re.sub(r"\D", "", str(lead.get("telefone", "")))
            curso = str(lead.get("curso_interesse", "")).strip()
            chave = (tel_limpo, curso.lower())

            linha_sheets = mapa_linhas_sheets.get(chave)

            item = {
                "Data_Entrada": formatar_data_para_br(lead.get("data_entrada")),
                "Nome_Lead": lead.get("nome_lead", ""),
                "Telefone": tel_limpo,
                "Curso_Interesse": curso,
                "Status_Funil": lead.get("status_funil", "Novo"),
                "Fase_Cadencia": lead.get("fase_cadencia", "") or "",
                "Data_Ultimo_Envio": formatar_data_para_br(lead.get("data_ultimo_envio")),
                "ID_Mensagem_Meta": lead.get("id_mensagem_meta", "") or "",
                "_id_supabase": lead.get("id"),
                "_linha_planilha": linha_sheets,
                "_origem": "supabase"
            }
            leads_formatados.append(item)

        return leads_formatados

    except Exception as e:
        print(f"[Aviso] Falha ao consultar Supabase ({e}). Ativando Fallback para Google Sheets...")
        try:
            aba = obter_aba_crm()
            registros = aba.get_all_records()
            
            leads_elegiveis = []
            for index, linha in enumerate(registros, start=2):
                status = str(linha.get("Status_Funil", "")).strip()
                if status in ["Novo", "Em Cadência"]:
                    linha["_linha_planilha"] = index
                    linha["_id_supabase"] = None
                    linha["_origem"] = "sheets"
                    leads_elegiveis.append(linha)
                    
            return leads_elegiveis
        except Exception as e_fatal:
            print(f"[Erro fatal] Impossivel conectar ao Google Sheets: {e_fatal}")
            return []

def atualizar_status_lead(linha_planilha: int = None, fase: str = None, msg_id: str = None, lead: dict = None):
    """
    Atualiza o lead disparado tanto no Supabase quanto no Google Sheets:
    - No Supabase: atualiza fase_cadencia, data_ultimo_envio, id_mensagem_meta e status_funil.
    - No Google Sheets: atualiza as colunas E, F, G e H (Status, Fase, Data, ID Meta).
    """
    data_hoje_br = datetime.now().strftime("%d/%m/%Y")
    data_hoje_iso = datetime.now().strftime("%Y-%m-%d")

    id_sb = lead.get("_id_supabase") if lead else None
    linha_sheet = linha_planilha or (lead.get("_linha_planilha") if lead else None)

    # 1. Atualiza no Supabase
    if id_sb:
        try:
            supabase = obter_supabase_client()
            supabase.table("leads_crm").update({
                "fase_cadencia": fase,
                "data_ultimo_envio": data_hoje_iso,
                "id_mensagem_meta": msg_id,
                "status_funil": "Em Cadência",
                "updated_at": datetime.now().isoformat()
            }).eq("id", id_sb).execute()
            print(f"  [Supabase] Lead ID {id_sb} atualizado: Fase={fase}, Data={data_hoje_iso}")
        except Exception as e_sb:
            print(f"  [Aviso] Erro ao atualizar lead no Supabase: {e_sb}")

    # 2. Atualiza no Google Sheets (Paridade Documental)
    try:
        aba = obter_aba_crm()
        if linha_sheet:
            aba.update_cell(linha_sheet, 5, "Em Cadência")
            aba.update_cell(linha_sheet, 6, fase)
            aba.update_cell(linha_sheet, 7, data_hoje_br)
            aba.update_cell(linha_sheet, 8, msg_id)
            print(f"  [Sheets] Linha {linha_sheet} atualizada com sucesso: Fase={fase}, Data={data_hoje_br}")
        elif lead:
            # Se a linha física não estava mapeada, adiciona ou atualiza por telefone
            nova_linha = [
                lead.get("Data_Entrada", data_hoje_br),
                lead.get("Nome_Lead", ""),
                lead.get("Telefone", ""),
                lead.get("Curso_Interesse", ""),
                "Em Cadência",
                fase,
                data_hoje_br,
                msg_id
            ]
            aba.append_row(nova_linha)
            print(f"  [Sheets] Nova linha de disparo registrada na planilha.")
    except Exception as e_sheet:
        print(f"  [Aviso] Erro ao atualizar linha no Google Sheets: {e_sheet}")

if __name__ == "__main__":
    print("--- TESTE DE LEITURA HÍBRIDA DA CADÊNCIA (FASE 4) ---")
    leads = buscar_leads_cadencia()
    print(f"Total de leads 'Novo' ou 'Em Cadência' encontrados: {len(leads)}")
    for l in leads:
        print(f"- Lead: {l.get('Nome_Lead')} | Curso: {l.get('Curso_Interesse')} | Origem: {l.get('_origem')} | Fase: {l.get('Fase_Cadencia') or 'Nenhuma'}")