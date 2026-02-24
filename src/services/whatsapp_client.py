import os
import requests
from dotenv import load_dotenv

load_dotenv()

def enviar_mensagem_whatsapp(numero_destino, texto_mensagem):
    """
    Envia mensagem usando a Evolution API hospedada na Hostinger.
    """
    base_url = os.getenv("EVOLUTION_API_URL")
    api_key = os.getenv("EVOLUTION_API_KEY")
    instancia = os.getenv("EVOLUTION_INSTANCE")
    
    # Validação de segurança
    if not all([base_url, api_key, instancia]):
        print("❌ ERRO: Faltam variáveis da Evolution API no .env!")
        return False

    url = f"{base_url}/message/sendText/{instancia}"
    
    headers = {
        "apikey": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "number": numero_destino,
        "options": {
            "delay": 1200, # Fica "digitando..." por 1.2 segundos
            "presence": "composing"
        },
        "textMessage": {
            "text": texto_mensagem
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print(f"✅ Enviado para {numero_destino} (Evolution API)!")
            return True
        else:
            print(f"❌ Erro da API: {response.text}")
            return False
    except Exception as e:
        print(f"🚨 Falha de conexão com a VPS: {e}")
        return False