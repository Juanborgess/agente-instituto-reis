import os
import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("WHATSAPP_TOKEN")
# Correção: O nome correto da variável no .env é WHATSAPP_PHONE_NUMBER_ID
PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
SEU_NUMERO = os.getenv("MY_PHONE_NUMBER")

def enviar_hello_world():
    print("--- INICIANDO TESTE DA CLOUD API (WHATSAPP) ---")
    
    if not TOKEN or not PHONE_ID or not SEU_NUMERO:
        print("ERRO: Variáveis TOKEN, PHONE_ID ou SEU_NUMERO não configuradas no .env.")
        return

    url = f"https://graph.facebook.com/v22.0/{PHONE_ID}/messages"

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": SEU_NUMERO, 
        "type": "text",
        "text": {
            "body": "Olá! Teste de conexão via Python concluído com sucesso."
        }
    }

    print(f"Enviando requisição de teste para: {SEU_NUMERO}...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        resposta_json = response.json()
        
        if response.status_code == 200:
            print("SUCESSO: Mensagem entregue aos servidores da Meta.")
            print(f"ID da Mensagem: {resposta_json.get('messages', [{}])[0].get('id', 'N/A')}")
        else:
            print(f"FALHA NA REQUISIÇÃO [HTTP {response.status_code}]")
            print(f"Detalhes: {resposta_json}")
            
    except Exception as e:
        print(f"FALHA DE COMUNICAÇÃO: {e}")

if __name__ == "__main__":
    enviar_hello_world()