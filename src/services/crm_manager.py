import os
import sys
from pathlib import Path
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

RAIZ_PROJETO = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(RAIZ_PROJETO))
sys.path.append(str(RAIZ_PROJETO / "src"))

load_dotenv(RAIZ_PROJETO / ".env")

CREDENTIALS_FILE = RAIZ_PROJETO / "src" / "config" / "credentials.json"
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID")
ABA_CRM = "CRM_Vendas"

ESCOPOS = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def obter_aba_crm():
    """Conecta à folha de cálculo do Google e retorna a aba do CRM."""
    creds = Credentials.from_service_account_file(str(CREDENTIALS_FILE), scopes=ESCOPOS)
    cliente = gspread.authorize(creds)
    planilha = cliente.open_by_key(SPREADSHEET_ID)
    return planilha.worksheet(ABA_CRM)

def buscar_leads_cadencia():
    """
    Lê a aba CRM_Vendas e retorna os leads com status 'Novo' ou 'Em Cadência'
    junto com o índice da linha física para atualização posterior.
    """
    aba = obter_aba_crm()
    registros = aba.get_all_records()
    
    leads_elegiveis = []
    # No get_all_records(), a linha 1 é o cabeçalho. O primeiro item é a linha 2.
    for index, linha in enumerate(registros, start=2):
        status = str(linha.get("Status_Funil", "")).strip()
        if status in ["Novo", "Em Cadência"]:
            linha["_linha_planilha"] = index
            leads_elegiveis.append(linha)
            
    return leads_elegiveis

def atualizar_status_lead(linha_planilha: int, fase: str, msg_id: str):
    """
    Atualiza as colunas de Fase_Cadencia, Data_Ultimo_Envio e ID_Mensagem_Meta
    (Colunas F, G e H - índices 6, 7 e 8).
    """
    aba = obter_aba_crm()
    data_hoje = datetime.now().strftime("%d/%m/%Y")
    
    aba.update_cell(linha_planilha, 6, fase)
    aba.update_cell(linha_planilha, 7, data_hoje)
    aba.update_cell(linha_planilha, 8, msg_id)
    print(f"Linha {linha_planilha} atualizada com sucesso: Fase={fase}, Data={data_hoje}")

if __name__ == "__main__":
    print("--- TESTE DE LEITURA DA ABA CRM_Vendas ---")
    try:
        leads = buscar_leads_cadencia()
        print(f"Total de leads 'Novo' ou 'Em Cadência' encontrados: {len(leads)}")
        for lead in leads:
            print(f"- Linha {lead['_linha_planilha']}: {lead.get('Nome_Lead')} | {lead.get('Curso_Interesse')} | Fase atual: {lead.get('Fase_Cadencia') or 'Nenhuma'}")
    except Exception as e:
        print(f"Erro ao conectar ou ler a aba CRM_Vendas: {e}")