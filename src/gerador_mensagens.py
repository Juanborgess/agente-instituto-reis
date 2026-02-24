from agno.agent import Agent
from agno.models.groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

# Carrega as regras do arquivo de texto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAMINHO_PROMPT = os.path.join(BASE_DIR, 'prompts', 'regras_cobranca.md')

with open(CAMINHO_PROMPT, 'r', encoding='utf-8') as f:
    PROMPT_REGRAS = f.read()

# Configura o Agente Inteligente
agente_cobranca = Agent(
    model=Groq(id="llama-3.3-70b-versatile",
    temperature=0.9
    ),
    description=PROMPT_REGRAS,
    markdown=False  # WhatsApp não usa Markdown complexo
)

def gerar_mensagem(nome, curso, vencimento, dias_atraso=0, status_envio="HOJE"):
    """
    Função que a IA usa para escrever a mensagem personalizada.
    status_envio pode ser: 'ANTECIPADO', 'AMANHA', 'HOJE', 'ATRASADO'
    """
    
    # Monta o pedido para a IA
    pedido = f"""
    Gere uma mensagem para o aluno:
    - Nome: {nome}
    - Curso: {curso}
    - Data Vencimento: {vencimento}
    - Status: {status_envio}
    """
    
    if status_envio == "ATRASADO":
        pedido += f"\n- Dias de Atraso: {dias_atraso}"

    # A IA pensa e responde
    try:
        resposta = agente_cobranca.run(pedido)
        return resposta.content
    except Exception as e:
        return f"Erro ao gerar mensagem: {e}"

# --- ÁREA DE TESTE DE ESTRESSE (Validando Anti-Ban) ---
if __name__ == "__main__":
    print("--- 🤖 TESTE DE VARIAÇÃO (ANTI-BAN) ---")
    print("Gerando 5 mensagens para o MESMO cenário para ver se muda...")
    
    # Vamos simular 5 vezes o mesmo aluno para ver se a IA é criativa
    for i in range(1, 6):
        print(f"\nTentativa {i}:")
        msg = gerar_mensagem("Gabriel", "Barbeiro", "30/01/2026", 0, "HOJE")
        print(msg)
        print("." * 10)