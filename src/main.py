import os
import time
import random  
from dotenv import load_dotenv
from services.whatsapp_client import enviar_mensagem_whatsapp
from services.planilha_manager import buscar_devedores
from services.billing_agent import gerar_mensagem_ia 

def main():
    load_dotenv()
    
    # MODO DE SEGURANÇA (ADMIN)
    MEU_NUMERO_TESTE = os.getenv("MY_PHONE_NUMBER") 
    
    print("🤖 --- ROBÔ DO INSTITUTO REIS (IA + HUMAN DELAY) ---")
    print("🛡️ Modo: Seguro (Variação de Texto e Pausa Aleatória)")
    print("-" * 50)

    # 1. Busca na Planilha
    lista_devedores = buscar_devedores()

    if not lista_devedores:
        print("✅ Ninguém na lista de envio hoje.")
        return

    print(f"🎯 Encontrados {len(lista_devedores)} alunos para contato.")

    # 2. Processamento
    for i, aluno in enumerate(lista_devedores):
        nome = aluno["nome"]
        dias_atraso = aluno["dias_atraso"]
        
        print(f"\n🔍 [{i+1}/{len(lista_devedores)}] Gerando texto para: {nome} (Status: {dias_atraso}d)")

        # A. IA Escreve (Cada vez sai diferente)
        mensagem = gerar_mensagem_ia(nome, dias_atraso)
        print(f"📝 Texto IA: '{mensagem}'")

        # B. Envio Seguro
        print(f"🚀 Enviando para ADMIN ({MEU_NUMERO_TESTE})...")
        
        # TRAVA: Manda sempre para você enquanto testamos
        sucesso = enviar_mensagem_whatsapp(MEU_NUMERO_TESTE, mensagem)

        if sucesso:
            print("✅ Enviado com sucesso.")
        else:
            print("❌ Falha no envio.")

        # C. DELAY HUMANO (Aleatório entre 20 e 40 segundos)
        # Isso evita que o WhatsApp detecte padrão de robô
        tempo_espera = random.randint(20, 40)
        print(f"⏳ Comportamento Humano: Aguardando {tempo_espera} segundos...")
        time.sleep(tempo_espera)

    print("-" * 50)
    print("🏁 FIM DO PROCESSAMENTO")

if __name__ == "__main__":
    main()