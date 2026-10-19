import os
import re
import sys
from pathlib import Path
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv
from supabase import create_client, Client

RAIZ_PROJETO = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(RAIZ_PROJETO))

load_dotenv(RAIZ_PROJETO / ".env")

CREDENTIALS_FILE = RAIZ_PROJETO / "src" / "config" / "credentials.json"
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

SHEET_NAME_SORTEIO = "Sorteio_QR_Code"

ESCOPOS = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def obter_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY devem estar definidos no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def obter_planilha():
    if not CREDENTIALS_FILE.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {CREDENTIALS_FILE}")
    creds = Credentials.from_service_account_file(str(CREDENTIALS_FILE), scopes=ESCOPOS)
    cliente = gspread.authorize(creds)
    return cliente.open_by_key(SPREADSHEET_ID)

def limpar_telefone(tel):
    if not tel:
        return ""
    num = re.sub(r"\D", "", str(tel).strip())
    if len(num) in [10, 11] and not num.startswith("55"):
        num = "55" + num
    return num

def sincronizar_sorteio_para_supabase():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Sincronizando '{SHEET_NAME_SORTEIO}' -> Supabase ('sorteio_participantes')...")
    
    planilha = obter_planilha()
    aba = planilha.worksheet(SHEET_NAME_SORTEIO)
    valores = aba.get_all_values()

    if len(valores) <= 1:
        print("Aba de sorteio vazia ou apenas com cabeçalho.")
        return {"total": 0, "inseridos": 0, "atualizados": 0}

    sb = obter_supabase()
    
    # Busca existentes
    try:
        res = sb.table("sorteio_participantes").select("id, numero_participante, whatsapp").execute()
        existentes = {r["numero_participante"]: r["id"] for r in res.data}
    except Exception as e:
        print(f"Erro ao consultar sorteio_participantes: {e}")
        return {"erro": str(e)}

    inseridos = 0
    atualizados = 0

    for idx, row in enumerate(valores[1:], start=1):
        if len(row) < 11:
            continue
        
        num_part = int(row[0]) if row[0] and row[0].isdigit() else idx
        nome = str(row[10] if len(row) > 10 else "").strip()
        tel = limpar_telefone(row[12] if len(row) > 12 else "")
        
        if not nome and not tel:
            continue

        payload = {
            "numero_participante": num_part,
            "curso_interesse": str(row[1] if len(row) > 1 else "").strip(),
            "contato_anterior": str(row[2] if len(row) > 2 else "").strip(),
            "conhecimento": str(row[3] if len(row) > 3 else "").strip(),
            "trabalha": str(row[4] if len(row) > 4 else "").strip(),
            "area_atual": str(row[5] if len(row) > 5 else "").strip(),
            "objetivo_meses": str(row[6] if len(row) > 6 else "").strip(),
            "objetivo_profissional": str(row[7] if len(row) > 7 else "").strip(),
            "o_que_mudaria": str(row[8] if len(row) > 8 else "").strip(),
            "impedimento": str(row[9] if len(row) > 9 else "").strip(),
            "nome_completo": nome,
            "idade": str(row[11] if len(row) > 11 else "").strip(),
            "whatsapp": tel,
            "bairro": str(row[13] if len(row) > 13 else "").strip(),
            "email": str(row[14] if len(row) > 14 else "").strip(),
            "data_hora": str(row[15] if len(row) > 15 else "").strip(),
            "updated_at": datetime.now().isoformat()
        }

        if num_part in existentes:
            sb.table("sorteio_participantes").update(payload).eq("id", existentes[num_part]).execute()
            atualizados += 1
        else:
            payload["created_at"] = datetime.now().isoformat()
            payload["sorteado"] = False
            payload["enviado_crm"] = False
            sb.table("sorteio_participantes").insert(payload).execute()
            inseridos += 1

    print(f"✅ Sincronização concluída! Inseridos: {inseridos} | Atualizados: {atualizados}")
    return {"total": len(valores) - 1, "inseridos": inseridos, "atualizados": atualizados}

if __name__ == "__main__":
    sincronizar_sorteio_para_supabase()
