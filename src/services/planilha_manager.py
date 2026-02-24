import os
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]

def conectar_planilha():
    """Conecta ao Google Sheets"""
    try:
        arquivo_credenciais = "src/config/credentials.json"
        
        if not os.path.exists(arquivo_credenciais):
            print(f"❌ ERRO: Arquivo não encontrado em: {arquivo_credenciais}")
            return None

        creds = Credentials.from_service_account_file(arquivo_credenciais, scopes=SCOPES)
        client = gspread.authorize(creds)
        
        SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID") 
        sheet = client.open_by_key(SPREADSHEET_ID).sheet1
        return sheet
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return None

def buscar_devedores():
    """Lê a planilha e filtra Atrasados, Hoje, D-1 e D-5"""
    sheet = conectar_planilha()
    if not sheet:
        return []

    print("📊 Lendo dados da planilha...")
    try:
        dados = sheet.get_all_records()
    except Exception as e:
        print(f"❌ Erro ao baixar dados: {e}")
        return []
    
    lista_cobranca = []
    hoje = datetime.now().date()

    for linha in dados:
        try:
            nome = linha.get("NOME_ALUNO")
            vencimento_str = linha.get("VENCIMENTO_ATUAL")
            telefone = str(linha.get("TELEFONE_WHATSAPP"))
            status_pagamento = linha.get("STATUS_PAGAMENTO")

            if not nome or not vencimento_str:
                continue

            status_upper = str(status_pagamento).upper()
            if "CONCLUÍDO" in status_upper or "PAGO" in status_upper:
                continue

            try:
                data_venc = datetime.strptime(vencimento_str, "%d/%m/%Y").date()
            except:
                continue 

            # CÁLCULO DA LÓGICA
            # Se vence dia 05/02 e hoje é 31/01 -> 31 - 05 = -5 (Negativo)
            diferenca = (hoje - data_venc).days

            # --- CORREÇÃO AQUI ---
            # Aceita: Atrasados (>0), Hoje (0), Amanhã (-1) e Pré-Aviso (-5)
            if diferenca >= 0 or diferenca == -1 or diferenca == -5:
                
                telefone_limpo = "".join(filter(str.isdigit, telefone))
                
                lista_cobranca.append({
                    "nome": nome,
                    "telefone": telefone_limpo,
                    "dias_atraso": diferenca, # Vai ser negativo para futuro, positivo para atraso
                    "vencimento_original": vencimento_str
                })

        except Exception as e:
            print(f"⚠️ Erro linha {nome}: {e}")
            continue

    return lista_cobranca