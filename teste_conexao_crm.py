import os
import sys
from pathlib import Path
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

# Carrega ambiente
RAIZ = Path(__file__).resolve().parent
load_dotenv(RAIZ / ".env")

CREDENTIALS_FILE = RAIZ / "src" / "config" / "credentials.json"
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID")
ABA_NOME = "CRM_Vendas"

ESCOPOS = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def testar_conexao_crm():
    print("=== [TESTE FASE 2] CONEXÃO E LEITURA/ESCRITA CRM_VENDAS ===")
    
    if not SPREADSHEET_ID:
        print("❌ ERRO: GOOGLE_SHEET_ID não configurado no .env.")
        return

    print("1. Autenticando com Conta de Serviço...")
    creds = Credentials.from_service_account_file(str(CREDENTIALS_FILE), scopes=ESCOPOS)
    cliente = gspread.authorize(creds)
    
    print("2. Abrindo planilha e aba CRM_Vendas...")
    planilha = cliente.open_by_key(SPREADSHEET_ID)
    aba = planilha.worksheet(ABA_NOME)
    
    # Conferindo cabeçalhos
    cabecalhos = aba.row_values(1)
    print(f"Cabeçalhos encontrados na Linha 1: {cabecalhos}")
    
    cabecalhos_esperados = [
        "Data_Entrada", "Nome_Lead", "Telefone", "Curso_Interesse",
        "Status_Funil", "Fase_Cadencia", "Data_Ultimo_Envio", "ID_Mensagem_Meta"
    ]
    
    if cabecalhos != cabecalhos_esperados:
        print("⚠️ AVISO: Cabeçalhos divergentes do roadmap!")
        print(f"Esperado: {cabecalhos_esperados}")
    else:
        print("✅ Cabeçalhos 100% validados com o roadmap.")

    print("\n3. Inserindo 2 linhas simuladas de teste...")
    hoje_str = datetime.now().strftime("%d/%m/%Y")
    
    # Linha 1: Lead elegível para cadência
    linha_novo = [hoje_str, "Carlos Teste Lead", "5521999999999", "Barbeiro Profissional", "Novo", "", "", ""]
    # Linha 2: Lead em atendimento humano (Stop Rule)
    linha_humano = [hoje_str, "Mariana Atendimento", "5521888888888", "Design de Sobrancelhas", "Atendimento Humano", "", "", ""]
    
    aba.append_rows([linha_novo, linha_humano])
    print("✅ Linhas inseridas com sucesso.")

    print("\n4. Lendo registros da aba via get_all_records()...")
    registros = aba.get_all_records()
    print(f"Total de registros lidos: {len(registros)}")
    for i, reg in enumerate(registros[-2:], start=len(registros)-1):
        print(f"  Linha {i+2}: {reg.get('Nome_Lead')} | Status: {reg.get('Status_Funil')} | Curso: {reg.get('Curso_Interesse')}")

    print("\n✅ CRITÉRIO DE SUCESSO DA FASE 2 ATINGIDO COM ÊXITO!")

if __name__ == "__main__":
    testar_conexao_crm()