import os
import requests
from dotenv import load_dotenv

# Carrega as chaves secretas
load_dotenv()

# Pega as configurações do .env
TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")
SEU_NUMERO = os.getenv("MY_PHONE_NUMBER")

def enviar_hello_world():
    print("--- 📲 INICIANDO TESTE DE WHATSAPP ---")
    
    # Verifica se as chaves existem
    if not TOKEN or not PHONE_ID or not SEU_NUMERO:
        print("ERRO: Faltam variáveis no arquivo .env!")
        return

    # URL oficial da API da Meta
    url = f"https://graph.facebook.com/v22.0/{PHONE_ID}/messages"

    # Cabeçalho de Autenticação (A "Crachá" do Robô)
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    # O Corpo da Mensagem
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": 5521967122042,
        "type": "text",
        "text": {
            "body": "🤖 Olá! Se você está lendo isso, o Python venceu o Zuckerberg!"
        }
    }

    print(f"Enviando para: {SEU_NUMERO}...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        resposta_json = response.json()
        
        # Verifica se deu certo (Código 200 = OK)
        if response.status_code == 200:
            print("SUCESSO! Mensagem enviada.")
            print(f"ID da Mensagem: {resposta_json['messages'][0]['id']}")
            print("OLHE SEU WHATSAPP AGORA!")
        else:
            print(f"FALHA NO ENVIO: {response.status_code}")
            print(resposta_json)
            
    except Exception as e:
        print(f"Erro de conexão: {e}")

if __name__ == "__main__":
    enviar_hello_world()