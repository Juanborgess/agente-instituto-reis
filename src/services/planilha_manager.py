import os
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

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

        sheet = client.open_by_key(SPREADSHEET_ID).sheet1
        return sheet
    except Exception as e:
        print(f"Erro na conexão com o Google Sheets: {e}")
        return None

def buscar_devedores():
    """Lê a planilha e filtra EXCLUSIVAMENTE: Hoje (0), Amanhã (-1) e Pré-Aviso (-5)."""
    sheet = conectar_planilha()
    if not sheet:
        return []

    print("Lendo dados da planilha...")
    try:
        dados = sheet.get_all_records()
    except Exception as e:
        print(f"Erro ao baixar dados da planilha: {e}")
        return []
    
    lista_cobranca = []
    hoje = datetime.now().date()

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
                # Tenta formato alternativo caso a planilha use AAAA-MM-DD
                try:
                    data_venc = datetime.strptime(vencimento_str, "%Y-%m-%d").date()
                except ValueError:
                    continue

            # (hoje - data_venc): se data_venc for futura (ex: daqui a 5 dias), retorna -5
            diferenca = (hoje - data_venc).days

            # REGRA: Apenas D-5 (-5), D-1 (-1) e Hoje (0). Inadimplentes passados ignorados.
            if diferenca in [-5, -1, 0]:
                telefone_limpo = "".join(filter(str.isdigit, telefone))
                
                lista_cobranca.append({
                    "nome": str(nome).strip(),
                    "telefone": telefone_limpo,
                    "dias_atraso": diferenca, 
                    "vencimento_original": vencimento_str
                })

        except Exception as e:
            print(f"Erro ao processar linha do aluno {nome}: {e}")
            continue

    return lista_cobranca