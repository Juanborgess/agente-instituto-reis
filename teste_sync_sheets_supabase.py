import sys
from pathlib import Path
from datetime import datetime

RAIZ_PROJETO = Path(__file__).resolve().parent
sys.path.append(str(RAIZ_PROJETO))
sys.path.append(str(RAIZ_PROJETO / "src"))

from src.services.sync_manager import (
    sincronizar_cobranca_sheets_para_supabase,
    sincronizar_crm_bi_direcional,
    obter_supabase_client
)

def executar_teste():
    print("=" * 60)
    print("--- INICIANDO TESTE DE SINCRONIZAÇÃO (FASE 2) ---")
    print(f"Data e Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

    # 1. Sincronização da Cobrança
    print("\n[1/2] Sincronizando aba 'Cobranca_Alunos' -> Supabase ('alunos_cobranca')...")
    try:
        res_cobranca = sincronizar_cobranca_sheets_para_supabase()
        print(f"  -> Total lidos da planilha: {res_cobranca['total_lidos']}")
        print(f"  -> Inseridos no Supabase:   {res_cobranca['inseridos']}")
        print(f"  -> Atualizados no Supabase: {res_cobranca['atualizados']}")
        print(f"  -> Ignorados (sem nome/tel):{res_cobranca['ignorados']}")
    except Exception as e:
        print(f"❌ Erro ao sincronizar cobrança: {e}")
        return

    # 2. Sincronização do CRM (Bi-direcional)
    print("\n[2/2] Sincronizando CRM Bi-direcional ('CRM_Vendas' <-> 'leads_crm')...")
    try:
        res_crm = sincronizar_crm_bi_direcional()
        print(f"  -> Total na planilha:            {res_crm['total_planilha']}")
        print(f"  -> Total no Supabase:            {res_crm['total_supabase']}")
        print(f"  -> Inseridos no Supabase:        {res_crm['inseridos_no_supabase']}")
        print(f"  -> Atualizados no Supabase:      {res_crm['atualizados_no_supabase']}")
        print(f"  -> Exportados para o Sheets:     {res_crm['exportados_para_planilha']}")
    except Exception as e:
        print(f"❌ Erro ao sincronizar CRM: {e}")
        return

    # 3. Verificação no Supabase
    print("\n[3/3] Verificando integridade no banco Supabase...")
    supabase = obter_supabase_client()
    qtd_alunos = supabase.table("alunos_cobranca").select("id", count="exact").execute().count
    qtd_leads = supabase.table("leads_crm").select("id", count="exact").execute().count

    print(f"  [OK] Total de Alunos em 'alunos_cobranca': {qtd_alunos}")
    print(f"  [OK] Total de Leads em 'leads_crm':        {qtd_leads}")

    print("\n" + "=" * 60)
    print(">>> TESTE DE HOMOLOGACAO DA FASE 2 CONCLUIDO COM SUCESSO! <<<")
    print("=" * 60)

if __name__ == "__main__":
    executar_teste()
