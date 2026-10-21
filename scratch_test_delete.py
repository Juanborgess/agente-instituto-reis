import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("c:/Users/juanb/Documents/AGENTE-INSTITUTO-REIS/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sb_anon = create_client(SUPABASE_URL, ANON_KEY)
sb_admin = create_client(SUPABASE_URL, SERVICE_KEY)

print("--- CONSULTANDO sorteio_participantes COM SERVICE ROLE ---")
res = sb_admin.table("sorteio_participantes").select("id, numero_participante, nome_completo, whatsapp").order("numero_participante", desc=True).execute()
print(f"Total de registros encontrados: {len(res.data)}")
for p in res.data[:5]:
    print(p)

print("\n--- TESTANDO DELETE COM ANON KEY (O que o frontend usa) ---")
# Procura se tem o registro 12
reg12 = [p for p in res.data if p.get("numero_participante") == 12]
if reg12:
    id12 = reg12[0]["id"]
    print(f"Tentando excluir ID {id12} (numero 12) usando ANON KEY...")
    del_res = sb_anon.table("sorteio_participantes").delete().eq("id", id12).execute()
    print("Resultado com ANON KEY:", del_res)
else:
    print("Registro 12 não encontrado no banco.")
