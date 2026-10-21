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

# 1. Cria um lead teste em leads_crm
res_c = requests.post(f"{SUPABASE_URL}/rest/v1/leads_crm", headers=headers_service, json={
    "nome_lead": "TESTE_DELETE_LEAD", 
    "telefone": "5511999999999",
    "curso_interesse": "Barbeiro",
    "status_funil": "Novo"
})
print("Criou lead teste:", res_c.status_code, res_c.text)
lead_id = res_c.json()[0]["id"]

# 2. Tenta deletar esse lead com ANON
res_d = requests.delete(f"{SUPABASE_URL}/rest/v1/leads_crm?id=eq.{lead_id}", headers=headers_anon)
print("Deletou lead com ANON:", res_d.status_code, "Body:", res_d.text)
if not res_d.json():
    print("ANON também NÃO tem permissão de DELETE em leads_crm!")
    requests.delete(f"{SUPABASE_URL}/rest/v1/leads_crm?id=eq.{lead_id}", headers=headers_service)
else:
    print("ANON DELETOU COM SUCESSO em leads_crm!")
