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

# 1. Cria aluno teste
res_c = requests.post(f"{SUPABASE_URL}/rest/v1/alunos_cobranca", headers=headers_service, json={
    "nome_aluno": "TESTE_ALUNO",
    "telefone_whatsapp": "5511999998888",
    "curso": "Barbeiro",
    "status_pagamento": "PENDENTE"
})
print("Criou aluno teste:", res_c.status_code, res_c.text)
aluno_id = res_c.json()[0]["id"]

# 2. Tenta deletar com ANON
res_d = requests.delete(f"{SUPABASE_URL}/rest/v1/alunos_cobranca?id=eq.{aluno_id}", headers=headers_anon)
print("Deletou aluno com ANON:", res_d.status_code, "Body:", res_d.text)
if not res_d.json():
    print("ANON NÃO tem permissão de DELETE em alunos_cobranca!")
    requests.delete(f"{SUPABASE_URL}/rest/v1/alunos_cobranca?id=eq.{aluno_id}", headers=headers_service)
else:
    print("ANON DELETOU COM SUCESSO em alunos_cobranca!")
