import os
import time
import random
import re
from dotenv import load_dotenv
from services.whatsapp_client import enviar_mensagem_whatsapp
from services.planilha_manager import buscar_devedores
from services.billing_agent import gerar_mensagem_ia 

# CONFIGURAÇÃO DE AMBIENTE
MODO_PRODUCAO = False 

def limpar_numero(numero):
    """Remove caracteres não numéricos e garante o DDI 55."""
    apenas_numeros = re.sub(r'\D', '', str(numero))
    if not apenas_numeros.startswith('55'):
        apenas_numeros = '55' + apenas_numeros
    return apenas_numeros

def main():
    load_dotenv()
    
    MEU_NUMERO_TESTE = os.getenv("MY_PHONE_NUMBER") 
    
    print("--- INICIANDO PROCESSAMENTO DE NOTIFICAÇÕES ---")
    print(f"Modo de Execução: {'PRODUÇÃO (DADOS REAIS)' if MODO_PRODUCAO else 'HOMOLOGAÇÃO (TESTE)'}")
    print("-" * 50)

    alunos_para_notificar = buscar_devedores()

    if not alunos_para_notificar:
        print("Nenhum aluno atende aos critérios de notificação hoje.")
        return

    print(f"Total de notificações agendadas: {len(alunos_para_notificar)}")

    for i, aluno in enumerate(alunos_para_notificar):
        nome_completo = aluno["nome"]
        dias_atraso = aluno["dias_atraso"] 
        telefone_aluno = limpar_numero(aluno["telefone"])
        
        numero_destino = telefone_aluno if MODO_PRODUCAO else MEU_NUMERO_TESTE

        print(f"\n[{i+1}/{len(alunos_para_notificar)}] Processando: {nome_completo}")

        decisao_ia = gerar_mensagem_ia(nome_completo, dias_atraso)
        
        try:
            # Tenta extrair os dados se a IA respondeu no padrão correto
            template_name = ""
            primeiro_nome = nome_completo.split()[0].title()
            
            if "TEMPLATE:" in decisao_ia:
                linhas = decisao_ia.strip().split('\n')
                template_name = linhas[0].split(':')[1].strip()
                # Tenta pegar o nome da IA, se falhar usa o que cortamos acima
                try:
                    primeiro_nome = linhas[1].split(':')[1].strip()
                except IndexError:
                    pass

            # FALLBACK DE FERRO: Se a IA falhou, devolveu erro ou o modelo caiu, o código resolve sozinho
            if not template_name or "aviso_vencimento" not in template_name:
                print("⚠️ Retorno da IA falhou, aplicando template por regra matemática de segurança...")
                if dias_atraso == -5:
                    template_name = "aviso_vencimento_d5"
                elif dias_atraso == -1:
                    template_name = "aviso_vencimento_d1"
                else:
                    template_name = "aviso_vencimento_hoje"
            
            # Ajuste das variáveis conforme a exigência de cada Template na Meta
            if template_name == "aviso_vencimento_hoje":
                chave_pix = os.getenv("CHAVE_PIX", "financeiro@institutoreis.com.br")
                parametros_envio = [primeiro_nome, chave_pix]
            else:
                parametros_envio = [primeiro_nome]
            
            print(f"Template selecionado: {template_name}")
            print(f"Enviando para: {numero_destino}...")
            
            sucesso = enviar_mensagem_whatsapp(
                numero_destino=numero_destino, 
                template_name=template_name, 
                parametros=parametros_envio
            )

            if sucesso:
                print("Status: Mensagem enviada com sucesso.")
            else:
                print("Status: Falha ao enviar mensagem pela Cloud API.")

        except Exception as e:
            print(f"Erro no processamento dos dados do aluno {nome_completo}. Detalhes: {e}")

        # Delay entre requisições
        if i < len(alunos_para_notificar) - 1:
            tempo_espera = random.randint(15, 30)
            print(f"Aguardando {tempo_espera}s para a próxima requisição...")
            time.sleep(tempo_espera)

    print("-" * 50)
    print("PROCESSAMENTO FINALIZADO.")

if __name__ == "__main__":
    main()