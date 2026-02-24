import os
from agno.agent import Agent
from agno.models.groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Configuração do Modelo (Llama 3 via Groq)
agent = Agent(
    model=Groq(id="llama-3.3-70b-versatile"),
    description="Você é a assistente virtual do setor financeiro do Instituto Reis.",
    instructions=[
        "Seu objetivo é criar mensagens curtas e educadas de lembrete de mensalidade.",
        "TOM DE VOZ: Profissional, Institucional, Cordial e Direto.",
        "PROIBIDO: Não use gírias como 'Tmj', 'Fala aí', 'Beleza'.",
        "PROIBIDO: Não cobre de forma agressiva. Use palavras como 'regularização', 'pendência'.",
        "VARIEDADE: Sempre mude ligeiramente a frase para não parecer um robô repetitivo.",
        "IMPORTANTE: A mensagem deve caber em uma notificação de celular (máximo 2 frases).",
        "Se o atraso for negativo (ex: -5), é um lembrete antecipado. Não fale em dívida.",
        "Se o atraso for 0, é dia de vencimento.",
        "OBRIGATÓRIO: O texto DEVE obrigatoriamente terminar com a seguinte frase e link, pulando uma linha antes: '\n\nPara enviar o comprovante ou tirar dúvidas, fale com o financeiro: wa.me/5521966666335'"
    ]
)

def gerar_mensagem_ia(nome, dias_atraso):
    """
    Gera uma mensagem única usando IA baseada no status do aluno.
    """
    try:
        # Define o contexto para a IA saber o que escrever
        if dias_atraso > 0:
            contexto = f"O aluno {nome} está com a mensalidade atrasada há {dias_atraso} dias. Crie uma mensagem cordial perguntando sobre a regularização."
        elif dias_atraso == 0:
            contexto = f"Hoje é o dia do vencimento da mensalidade do aluno {nome}. Crie um lembrete amigável."
        elif dias_atraso == -1:
            contexto = f"A mensalidade do aluno {nome} vence amanhã. Crie um aviso prévio para ele se programar."
        elif dias_atraso <= -2:
            dias_para_vencer = abs(dias_atraso)
            contexto = f"A mensalidade do aluno {nome} vence em {dias_para_vencer} dias. Apenas um lembrete de organização."
        else:
            return "Erro: Data inválida."

        # Pede para a IA gerar
        response = agent.run(contexto)
        
        # O Agno retorna um objeto, pegamos apenas o texto (content)
        return response.content

    except Exception as e:
        print(f"⚠️ Erro na IA (usando backup): {e}")
        # Fallback (Plano B) caso a IA falhe ou a internet caia
        return f"Olá {nome}, contato do financeiro Instituto Reis sobre sua mensalidade. Poderia nos responder?"