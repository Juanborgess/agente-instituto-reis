import os
import requests
from dotenv import load_dotenv

load_dotenv("c:/Users/juanb/Documents/AGENTE-INSTITUTO-REIS/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers_anon = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Prefer": "return=representation"
}

headers_service = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Prefer": "return=representation"
}

# 1. Testar DELETE em sorteio_participantes com ANON
print("--- TESTE DELETE sorteio_participantes COM ANON ---")
r1 = requests.delete(f"{SUPABASE_URL}/rest/v1/sorteio_participantes?id=eq.13", headers=headers_anon)
print("Anon DELETE status:", r1.status_code, "Body:", r1.text)

# 2. Testar DELETE em sorteio_participantes com SERVICE ROLE
print("\n--- TESTE DELETE sorteio_participantes COM SERVICE ROLE ---")
r2 = requests.delete(f"{SUPABASE_URL}/rest/v1/sorteio_participantes?id=eq.13", headers=headers_service)
print("Service DELETE status:", r2.status_code, "Body:", r2.text)
