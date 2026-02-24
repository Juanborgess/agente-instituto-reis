from agno.agent import Agent
import sys

print("--- INICIANDO TESTE DE AMBIENTE ---")
print(f"Versão do Python: {sys.version}")

try:
    test_agent = Agent()
    print("Biblioteca Agno importada com sucesso!")
    print("Ambiente Virtual configurado corretamente.")
except Exception as e:
    print(f"Erro ao importar Agno: {e}")

print("--- FIM DO TESTE ---")