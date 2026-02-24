from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.groq import Groq

# 1. Carrega as senhas do arquivo .env
load_dotenv()

print("--- INICIANDO TESTE DO CÉREBRO (GROQ) ---")

try:
    # 2. Configura o Agente usando o modelo Llama-3 (Versatile) da Groq
    # Estou usando temperatura 0.7 para ele ser criativo mas não alucinar muito
    agente = Agent(
        model=Groq(id="llama-3.3-70b-versatile"),
        markdown=True
    )

    print("Agente instanciado. Tentando contato com a Groq...")

    # 3. Envia uma instrução simples
    response = agente.print_response("Apenas responda: 'Conexão estabelecida com sucesso, Sr. Desenvolvedor!'")
    
    print("\n--- ✅ TESTE CONCLUÍDO ---")

except Exception as e:
    print(f"\n❌ ERRO CRÍTICO: Não foi possível conectar ao cérebro.")
    print(f"Detalhe do erro: {e}")
    print("DICA: Verifique se você salvou a API Key correta no arquivo .env")