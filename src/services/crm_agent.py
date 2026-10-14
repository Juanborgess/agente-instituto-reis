import os
import re
from pathlib import Path
from datetime import datetime, date
import requests
from dotenv import load_dotenv

RAIZ_PROJETO = Path(__file__).resolve().parent.parent.parent
load_dotenv(RAIZ_PROJETO / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ARQUIVO_PROMPT = RAIZ_PROJETO / "src" / "prompts" / "regras_vendas.md"

def sanitizar_primeiro_nome(nome_completo: str) -> str:
    """Extrai apenas o primeiro nome e formata com inicial maiúscula."""
    if not nome_completo:
        return "Aluno(a)"
    partes = str(nome_completo).strip().split()
    return partes[0].capitalize() if partes else "Aluno(a)"

def parse_data_entrada(data_str: str) -> date | None:
    """Converte strings de datas (DD/MM/AAAA ou AAAA-MM-DD) para date."""
    if not data_str:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(data_str).strip(), fmt).date()
        except ValueError:
            pass
    return None

def obter_prompt_sistema() -> str:
    """Lê o prompt do arquivo regras_vendas.md com fallback de segurança."""
    if ARQUIVO_PROMPT.exists():
        try:
            return ARQUIVO_PROMPT.read_text(encoding="utf-8")
        except Exception:
            pass
    
    # Fallback caso o arquivo não seja encontrado ou ocorra erro de leitura
    return (
        "Você é o assistente decisor do CRM do Instituto Reis. Responda ESTRITAMENTE neste formato de 3 linhas:\n"
        "TEMPLATE: [resgate_ficha_d1 | aviso_reserva_d4 | encerramento_ficha_d7 | NENHUM]\n"
        "NOME: [Primeiro Nome com inicial maiúscula]\n"
        "CURSO: [Nome do Curso formatado]"
    )

def calcular_decisao_deterministica(data_entrada_str: str, fase_atual: str, nome_bruto: str, curso_bruto: str) -> dict:
    """
    Motor Central Determinístico: Regra de ferro matemática executada localmente.
    Garante 100% de disponibilidade.
    """
    dt_entrada = parse_data_entrada(data_entrada_str)
    nome_formatado = sanitizar_primeiro_nome(nome_bruto)
    curso_formatado = str(curso_bruto).strip()

    if not dt_entrada:
        return {
            "template": "NENHUM",
            "proxima_fase": None,
            "nome": nome_formatado,
            "curso": curso_formatado,
            "origem": "deterministico_invalido"
        }

    dias_corridos = (datetime.now().date() - dt_entrada).days
    fase = str(fase_atual).strip().upper()

    template = "NENHUM"
    proxima_fase = None

    if dias_corridos >= 7 and fase == "D4":
        template = "encerramento_ficha_d7"
        proxima_fase = "D7"
    elif dias_corridos >= 4 and fase == "D1":
        template = "aviso_reserva_d4"
        proxima_fase = "D4"
    elif dias_corridos >= 1 and (fase == "" or fase == "NONE"):
        template = "resgate_ficha_d1"
        proxima_fase = "D1"

    return {
        "template": template,
        "proxima_fase": proxima_fase,
        "nome": nome_formatado,
        "curso": curso_formatado,
        "origem": "deterministico"
    }

def avaliar_lead_crm(lead: dict) -> dict:
    """
    Avalia o lead. Tenta a IA (Groq) com o prompt externo do arquivo;
    se houver erro ou lentidão, ativa o Fallback Determinístico imediatamente.
    """
    data_entrada = lead.get("Data_Entrada", "")
    fase_atual = lead.get("Fase_Cadencia", "")
    nome_bruto = lead.get("Nome_Lead", "")
    curso_bruto = lead.get("Curso_Interesse", "")

    if not GROQ_API_KEY:
        return calcular_decisao_deterministica(data_entrada, fase_atual, nome_bruto, curso_bruto)

    url_groq = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt_sistema = obter_prompt_sistema()

    prompt_lead = (
        f"Data_Entrada: {data_entrada}\n"
        f"Data_Hoje: {datetime.now().strftime('%d/%m/%Y')}\n"
        f"Fase_Cadencia_Atual: {fase_atual or 'Vazia'}\n"
        f"Nome: {nome_bruto}\n"
        f"Curso: {curso_bruto}\n"
        "Determine o template de utilidade a ser disparado."
    )

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": prompt_lead}
        ],
        "temperature": 0.1,
        "max_tokens": 100
    }

    try:
        response = requests.post(url_groq, headers=headers, json=payload, timeout=3.5)
        if response.status_code == 200:
            texto = response.json()["choices"][0]["message"]["content"].strip()
            
            match_temp = re.search(r"TEMPLATE:\s*(\w+)", texto, re.IGNORECASE)
            match_nome = re.search(r"NOME:\s*(.+)", texto, re.IGNORECASE)
            match_curso = re.search(r"CURSO:\s*(.+)", texto, re.IGNORECASE)

            template_ia = match_temp.group(1).strip() if match_temp else None
            
            if template_ia in ["resgate_ficha_d1", "aviso_reserva_d4", "encerramento_ficha_d7", "NENHUM"]:
                mapa_fases = {
                    "resgate_ficha_d1": "D1",
                    "aviso_reserva_d4": "D4",
                    "encerramento_ficha_d7": "D7",
                    "NENHUM": None
                }
                return {
                    "template": template_ia,
                    "proxima_fase": mapa_fases.get(template_ia),
                    "nome": match_nome.group(1).strip() if match_nome else sanitizar_primeiro_nome(nome_bruto),
                    "curso": match_curso.group(1).strip() if match_curso else str(curso_bruto).strip(),
                    "origem": "groq_ia"
                }

    except Exception:
        pass

    return calcular_decisao_deterministica(data_entrada, fase_atual, nome_bruto, curso_bruto)