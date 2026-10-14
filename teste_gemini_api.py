import os
import requests
from pathlib import Path
from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parent
load_dotenv(RAIZ / ".env")

api_key = os.getenv("GEMINI_API_KEY")

print("--- TESTE DE COMUNICAÇÃO OFICIAL GOOGLE GEMINI (REST) ---")
if not api_key:
    print("❌ ERRO: GEMINI_API_KEY não encontrada no .env!")
    exit(1)

print("Chave localizada no .env. Enviando requisição para a API...")

# Modelo oficial ativo recomendado pela resposta da API
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"

payload = {
    "contents": [
        {
            "parts": [
                {"text": "Responda apenas com a palavra: CONEXAO_OK"}
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=15)
    dados = response.json()
    
    if response.status_code == 200:
        texto_resposta = dados["candidates"][0]["content"]["parts"][0]["text"].strip()
        print(f"✅ Retorno da API: {texto_resposta}")
        print("Status HTTP: 200 - Autenticação e modelo Gemini 3.8 Flash validados com sucesso!")
    else:
        print(f"❌ Erro retornado pela API [HTTP {response.status_code}]:")
        print(dados)

except Exception as e:
    print(f"❌ Falha de conexão: {e}")