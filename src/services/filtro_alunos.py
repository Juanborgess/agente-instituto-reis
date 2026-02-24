import os
import sys
from datetime import datetime, timedelta
import gspread

# --- CONFIGURAÇÃO DE CAMINHOS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'config', 'credentials.json')

def conectar_planilha():
    if not os.path.exists(CREDENTIALS_PATH):
        raise FileNotFoundError(f"Arquivo de credenciais não encontrado: {CREDENTIALS_PATH}")
    
    gc = gspread.service_account(filename=CREDENTIALS_PATH)
    sh = gc.open("SISTEMA_COBRANCA_INSTITUTO_REIS")
    return sh.get_worksheet(0).get_all_records()

def processar_alunos():
    print("--- INICIANDO PROCESSAMENTO LÓGICO V2 ---")
    
    try:
        alunos = conectar_planilha()
    except Exception as e:
        print(f" Erro ao conectar: {e}")
        return

    # --- DEFINIÇÃO DAS DATAS ALVO ---
    hoje = datetime.now().date()
    amanha = hoje + timedelta(days=1)      
    daqui_5_dias = hoje + timedelta(days=5) 
    
    print(f"Hoje: {hoje.strftime('%d/%m')}")
    print(f"Alvo Amanhã (D-1): {amanha.strftime('%d/%m')}")
    print(f"Alvo Antecipado (D-5): {daqui_5_dias.strftime('%d/%m')}")
    print("-" * 50)

    # --- LISTAS DE AÇÃO ---
    lista_antecipada = [] 
    lista_amanha = []    
    lista_hoje = []       
    lista_atrasados = []  
    
    total_pendentes = 0

    for aluno in alunos:
        status = str(aluno.get('STATUS_PAGAMENTO', '')).strip().upper()
        if status != 'PENDENTE':
            continue

        total_pendentes += 1
        nome = aluno.get('NOME_ALUNO')
        data_texto = aluno.get('VENCIMENTO_ATUAL')

        try:
            vencimento = datetime.strptime(str(data_texto), "%d/%m/%Y").date()
        except ValueError:
            print(f"⚠️ Data inválida para {nome}: '{data_texto}'")
            continue

        # --- LÓGICA DE DECISÃO (O CÉREBRO) ---
        
        # 1. Vence Hoje
        if vencimento == hoje:
            lista_hoje.append(aluno)
        
        # 2. Vence Amanhã (D-1)
        elif vencimento == amanha:
            lista_amanha.append(aluno)

        # 3. Vence em 5 dias (D-5)
        elif vencimento == daqui_5_dias:
            lista_antecipada.append(aluno)
            
        # 4. Atrasado (Menor que hoje)
        elif vencimento < hoje:
            dias_atraso = (hoje - vencimento).days
            aluno['dias_atraso'] = dias_atraso 
            lista_atrasados.append(aluno)

    # --- RELATÓRIO FINAL ---
    print(f"RELATÓRIO DE DISPAROS:")
    
    print(f"\nATRASADOS ({len(lista_atrasados)}):")
    for a in lista_atrasados: print(f"   -> {a['NOME_ALUNO']} ({a['dias_atraso']} dias)")
        
    print(f"\nVENCE HOJE ({len(lista_hoje)}):")
    for a in lista_hoje: print(f"   -> {a['NOME_ALUNO']}")

    print(f"\nVENCE AMANHÃ ({len(lista_amanha)}):")
    for a in lista_amanha: print(f"   -> {a['NOME_ALUNO']}")
        
    print(f"\nVENCE EM 5 DIAS ({len(lista_antecipada)}):")
    for a in lista_antecipada: print(f"   -> {a['NOME_ALUNO']}")

if __name__ == "__main__":
    processar_alunos()