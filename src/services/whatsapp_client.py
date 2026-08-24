import os
import requests
from dotenv import load_dotenv

load_dotenv()

def enviar_mensagem_whatsapp(numero_destino, template_name, parametros=None):
    """
    Envia mensagem de template usando a API Oficial da Meta (Cloud API).
    """
    token = os.getenv("WHATSAPP_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    
    if not all([token, phone_id]):
        print("ERRO: Variáveis de ambiente da Meta API (TOKEN ou PHONE_ID) não configuradas no .env.")
        return False

    # Endpoint oficial da Graph API
    url = f"https://graph.facebook.com/v22.0/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Estruturação dos componentes dinâmicos (variáveis do template)
    components = []
    if parametros:
        components.append({
            "type": "body",
            "parameters": [{"type": "text", "text": str(p)} for p in parametros]
        })

    payload = {
        "messaging_product": "whatsapp",
        "to": numero_destino,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "pt_BR"},
            "components": components
        }
    }
    
    try:
        # Adicionado timeout por segurança para não travar a automação
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code in [200, 201]:
            print(f"SUCESSO: Template '{template_name}' enviado para {numero_destino}.")
            return True
        else:
            print(f"ERRO META API [{response.status_code}]: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("FALHA DE CONEXÃO: Tempo de resposta da Meta esgotado.")
        return False
    except Exception as e:
        print(f"FALHA DE CONEXÃO: Não foi possível comunicar com a Meta. Detalhes: {e}")
        return False