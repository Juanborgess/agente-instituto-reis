import os
import requests
from dotenv import load_dotenv

load_dotenv("c:/Users/juanb/Documents/AGENTE-INSTITUTO-REIS/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Consultar policies via SQL REST endpoint se disponível ou postgres meta
# Vamos ver se rpc ou sql endpoint responde
sql = """
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('sorteio_participantes', 'alunos_cobranca', 'leads_crm');
"""

# Tenta consultar via /rest/v1/rpc ou via pg meta
print("Consultando politicas...")
# Supabase tem endpoint de rpc se existir funcao exec_sql ou pgadmin
# Vamos testar se conseguimos consultar
res = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={"query": sql}
)
print("Resposta exec_sql:", res.status_code, res.text)
