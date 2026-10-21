import os
import requests
from dotenv import load_dotenv

load_dotenv("c:/Users/juanb/Documents/AGENTE-INSTITUTO-REIS/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

# Consultar OpenAPI spec do PostgREST para ver todas as funções e tabelas
res = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
print("Status OpenAPI:", res.status_code)
if res.status_code == 200:
    spec = res.json()
    paths = list(spec.get("paths", {}).keys())
    print("Endpoints disponíveis:")
    for p in paths:
        if p.startswith("/rpc/"):
            print(" -", p)
