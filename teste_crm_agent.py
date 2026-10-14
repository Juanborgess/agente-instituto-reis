import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Garante que a pasta src é encontrada
RAIZ_PROJETO = Path(__file__).resolve().parent
sys.path.append(str(RAIZ_PROJETO))
sys.path.append(str(RAIZ_PROJETO / "src"))

from services.crm_agent import avaliar_lead_crm, calcular_decisao_deterministica

def rodar_testes():
    print("=== [TESTE FASE 3] DECISOR DO CRM (OPÇÃO A: GROQ + DETERMINÍSTICO) ===")
    
    hoje = datetime.now().date()
    
    # 1. Simulação D+1
    lead_1 = {
        "Nome_Lead": "CARLOS EDUARDO SILVA",
        "Curso_Interesse": "Barbeiro Profissional",
        "Data_Entrada": (hoje - timedelta(days=1)).strftime("%d/%m/%Y"),
        "Fase_Cadencia": ""
    }
    r1 = avaliar_lead_crm(lead_1)
    print(f"\nCenário D+1 -> Template: {r1['template']} | Fase: {r1['proxima_fase']} | Nome: {r1['nome']} | Origem: {r1['origem']}")
    assert r1["template"] == "resgate_ficha_d1"
    assert r1["proxima_fase"] == "D1"
    assert r1["nome"] == "Carlos"

    # 2. Simulação D+4
    lead_4 = {
        "Nome_Lead": "ANA BEATRIZ SOUZA",
        "Curso_Interesse": "Design de Sobrancelhas",
        "Data_Entrada": (hoje - timedelta(days=4)).strftime("%d/%m/%Y"),
        "Fase_Cadencia": "D1"
    }
    r4 = avaliar_lead_crm(lead_4)
    print(f"Cenário D+4 -> Template: {r4['template']} | Fase: {r4['proxima_fase']} | Nome: {r4['nome']} | Origem: {r4['origem']}")
    assert r4["template"] == "aviso_reserva_d4"
    assert r4["proxima_fase"] == "D4"
    assert r4["nome"] == "Ana"

    # 3. Simulação D+7
    lead_7 = {
        "Nome_Lead": "ROBERTO CARVALHO",
        "Curso_Interesse": "Tranças Profissionais",
        "Data_Entrada": (hoje - timedelta(days=7)).strftime("%d/%m/%Y"),
        "Fase_Cadencia": "D4"
    }
    r7 = avaliar_lead_crm(lead_7)
    print(f"Cenário D+7 -> Template: {r7['template']} | Fase: {r7['proxima_fase']} | Nome: {r7['nome']} | Origem: {r7['origem']}")
    assert r7["template"] == "encerramento_ficha_d7"
    assert r7["proxima_fase"] == "D7"
    assert r7["nome"] == "Roberto"

    # 4. Simulação de Resiliência: Forçando teste 100% Determinístico
    rf = calcular_decisao_deterministica(
        data_entrada_str=(hoje - timedelta(days=1)).strftime("%d/%m/%Y"),
        fase_atual="",
        nome_bruto="LUCAS GOMES PEREIRA",
        curso_bruto="Barbeiro Profissional"
    )
    print(f"Cenário Local Offline -> Template: {rf['template']} | Fase: {rf['proxima_fase']} | Nome: {rf['nome']} | Origem: {rf['origem']}")
    assert rf["template"] == "resgate_ficha_d1"
    assert rf["nome"] == "Lucas"

    print("\n✅ TODOS OS TESTES APROVADOS COM SUCESSO E ZERO RISCO DE QUEDA!")

if __name__ == "__main__":
    rodar_testes()