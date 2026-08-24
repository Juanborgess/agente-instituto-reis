import os
from agno.agent import Agent
from agno.models.groq import Groq
from dotenv import load_dotenv

load_dotenv()

def carregar_prompt():
    # Garante a resolução correta do caminho relativo ao arquivo atual
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho_prompt = os.path.join(base_dir, "prompts", "regras_cobranca.md")
    
    # Fallback se o prompt estiver direto em src/prompts/
    if not os.path.exists(caminho_prompt):
        caminho_prompt = os.path.join(os.getcwd(), "src", "prompts", "regras_cobranca.md")
        
    try:
        with open(caminho_prompt, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Erro ao ler arquivo de prompt: {e}")
        return "Responda apenas no formato TEMPLATE: [nome] e ALUNO: [nome]"

agent = Agent(
    model=Groq(id="openai/gpt-oss-120b", temperature=0.1),
    description="Você é o Cérebro de Decisão Financeira do Instituto Reis.",
    instructions=[carregar_prompt()]
)

def gerar_mensagem_ia(nome, dias_atraso):
    """
    Analisa os dados e retorna apenas o Comando de Template para a Meta.
    """
    try:
        contexto = f"ALUNO: {nome} | DIAS DE ATRASO: {dias_atraso}"
        
        response = agent.run(contexto)
        return response.content

    except Exception as e:
        print(f"⚠️ Falha na IA, acionando fallback determinístico: {e}")
        
        # Fallback de segurança com os nomes exatos aprovados na Meta
        primeiro_nome = nome.split()[0].title() if nome else "Aluno"
        
        if dias_atraso == -5:
            return f"TEMPLATE: aviso_vencimento_d5\nALUNO: {primeiro_nome}"
        elif dias_atraso == -1:
            return f"TEMPLATE: aviso_vencimento_d1\nALUNO: {primeiro_nome}"
        else:
            return f"TEMPLATE: aviso_vencimento_hoje\nALUNO: {primeiro_nome}"