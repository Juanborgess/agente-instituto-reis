import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Garante que a raiz do projeto e a pasta src fiquem visíveis para o Python
RAIZ_PROJETO = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(RAIZ_PROJETO))
sys.path.append(str(RAIZ_PROJETO / "src"))

from services.whatsapp_client import enviar_mensagem_whatsapp

load_dotenv(RAIZ_PROJETO / ".env")

SEU_NUMERO = os.getenv("MY_PHONE_NUMBER")

def testar_disparo_template():
    print("--- TESTE DE HOMOLOGAÇÃO DE TEMPLATES (FASE 1) ---")
    
    if not SEU_NUMERO:
        print("ERRO: MY_PHONE_NUMBER não configurado no .env.")
        return

    # Dados de teste para simular o lead
    template_teste = "resgate_ficha_d1"
    parametros_teste = ["Carlos", "Barbeiro Profissional"]

    print(f"Destinatário de teste: {SEU_NUMERO}")
    print(f"Template selecionado: {template_teste}")
    print(f"Parâmetros: {parametros_teste}")
    print("Enviando requisição à Cloud API da Meta...")

    sucesso = enviar_mensagem_whatsapp(
        numero_destino=SEU_NUMERO,
        template_name=template_teste,
        parametros=parametros_teste
    )

    if sucesso:
        print("✅ SUCESSO: Template validado e entregue pela Meta!")
    else:
        print("❌ FALHA: Verifique se o template já se encontra com status APROVADO no painel.")

if __name__ == "__main__":
    testar_disparo_template()