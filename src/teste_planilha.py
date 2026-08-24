import gspread
import os
import sys

# Define o caminho para o arquivo de credenciais
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'config', 'credentials.json')

print("--- INICIANDO TESTE DE CONEXÃO COM A PLANILHA ---")

if not os.path.exists(CREDENTIALS_PATH):
    print("ERRO CRÍTICO: Arquivo de credenciais não encontrado.")
    print(f"Caminho esperado: {CREDENTIALS_PATH}")
    print("Verifique se o arquivo 'credentials.json' está na pasta 'src/config'.")
    sys.exit(1)

try:
    print("Autenticando com o Google Workspace...")
    gc = gspread.service_account(filename=CREDENTIALS_PATH)
    
    NOME_PLANILHA = "SISTEMA_COBRANCA_INSTITUTO_REIS"
    print(f"Buscando a planilha: '{NOME_PLANILHA}'...")
    
    sh = gc.open(NOME_PLANILHA)
    worksheet = sh.get_worksheet(0)
    
    dados = worksheet.get_all_records()
    
    print("SUCESSO: Conexão estabelecida.")
    print(f"Total de registros encontrados: {len(dados)}")
    print("-" * 50)
    
    # Exibe os 5 primeiros registros para validação de leitura
    for i, aluno in enumerate(dados[:5]):
        nome = aluno.get('NOME_ALUNO', 'N/A')
        status = aluno.get('STATUS_PAGAMENTO', 'N/A')
        vencimento = aluno.get('VENCIMENTO_ATUAL', 'N/A')
        print(f"Registro {i+1}: {nome} | Status: {status} | Vence: {vencimento}")
        
    print("-" * 50)
    print("TESTE CONCLUÍDO: Leitura da planilha operando corretamente.")

except gspread.exceptions.SpreadsheetNotFound:
    print("ERRO: Planilha não localizada.")
    print(f"Verifique se o nome exato no Google Sheets é '{NOME_PLANILHA}'.")
    print("Certifique-se de ter compartilhado a planilha com o e-mail da conta de serviço (service account).")
except Exception as e:
    print(f"FALHA INESPERADA: {e}")