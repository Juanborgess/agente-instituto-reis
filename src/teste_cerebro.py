from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.groq import Groq

load_dotenv()

print("--- INICIANDO TESTE DE CONEXÃO COM API GROQ ---")

try:
    agente = Agent(
        model=Groq(id="openai/gpt-oss-120b"),
        markdown=True
    )

    print("Agente instanciado. Tentando contato com a API...")

    agente.print_response("Apenas responda: 'Conexão estabelecida com sucesso, Sr. Desenvolvedor!'")
    
    print("\n--- TESTE CONCLUÍDO COM SUCESSO ---")

except Exception as e:
    print("\nERRO CRÍTICO: Não foi possível conectar ao provedor Groq.")
    print(f"Detalhes: {e}")
    print("Ação: Verifique a validade da GROQ_API_KEY no arquivo .env.")