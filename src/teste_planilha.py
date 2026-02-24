import gspread
import os
import sys

# Define onde está o arquivo de senha
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'config', 'credentials.json')

print("--- INICIANDO TESTE DE LEITURA DA PLANILHA ---")

# 1. Verifica se o arquivo JSON existe
if not os.path.exists(CREDENTIALS_PATH):
    print(f" ERRO CRÍTICO: Arquivo de credenciais não encontrado em:")
    print(f"{CREDENTIALS_PATH}")
    print("Verifique se você salvou como 'credentials.json' dentro da pasta 'src/config'.")
    sys.exit(1)

try:
    # 2. Autentica com o Robô
    print("Autenticando com o Google...")
    gc = gspread.service_account(filename=CREDENTIALS_PATH)
    
    # 3. Abre a planilha pelo nome
    NOME_PLANILHA = "SISTEMA_COBRANCA_INSTITUTO_REIS"
    print(f"Procurando planilha: {NOME_PLANILHA}...")
    
    sh = gc.open(NOME_PLANILHA)
    worksheet = sh.get_worksheet(0) # Pega a primeira aba
    
    # 4. Pega todos os dados
    dados = worksheet.get_all_records()
    
    print(f"SUCESSO! Conectado.")
    print(f"Total de alunos encontrados: {len(dados)}")
    print("-" * 50)
    
    # 5. Mostra os 3 primeiros alunos (para vermos se leu certo)
    for i, aluno in enumerate(dados[:5]):
        print(f"Aluno {i+1}: {aluno.get('NOME_ALUNO')} | Status: {aluno.get('STATUS_PAGAMENTO')} | Vence: {aluno.get('VENCIMENTO_ATUAL')}")
        
    print("-" * 50)
    print("Teste concluído. O Python consegue ler sua planilha!")

except gspread.exceptions.SpreadsheetNotFound:
    print("ERRO: Planilha não encontrada!")
    print(f"Confira se o nome no Google Sheets é EXATAMENTE: '{NOME_PLANILHA}'")
    print("Confira se você COMPARTILHOU a planilha com o e-mail do robô.")
except Exception as e:
    print(f"ERRO DESCONHECIDO: {e}")