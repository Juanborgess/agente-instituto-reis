import os
import sys
import time
import random
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Configuração de caminhos
RAIZ_PROJETO = Path(__file__).resolve().parent
sys.path.append(str(RAIZ_PROJETO))
sys.path.append(str(RAIZ_PROJETO / "src"))

from services.crm_manager import buscar_leads_cadencia, atualizar_status_lead
from services.crm_agent import avaliar_lead_crm
from services.whatsapp_client import enviar_mensagem_whatsapp

load_dotenv(RAIZ_PROJETO / ".env")

# Variáveis de Controlo
MODO_PRODUCAO = os.getenv("MODO_PRODUCAO", "False").lower() in ("true", "1", "t")
SEU_NUMERO = os.getenv("MY_PHONE_NUMBER")

def processar_cadencia_vendas():
    print("==================================================")
    print("--- INICIANDO MOTOR DE CADÊNCIA CRM (FASE 4) ---")
    print(f"Modo de Execução: {'PRODUÇÃO (DADOS REAIS)' if MODO_PRODUCAO else 'HOMOLOGAÇÃO / TESTE'}")
    print("==================================================")

    leads = buscar_leads_cadencia()
    if not leads:
        print("Nenhum lead elegível ('Novo' ou 'Em Cadência') encontrado na planilha.")
        return

    hoje_str = datetime.now().strftime("%d/%m/%Y")
    processados = 0

    for lead in leads:
        linha_idx = lead["_linha_planilha"]
        nome_bruto = lead.get("Nome_Lead", "Desconhecido")
        telefone = str(lead.get("Telefone", "")).strip()
        ultimo_envio = str(lead.get("Data_Ultimo_Envio", "")).strip()

        # Regra de Segurança: Impede mais de um disparo no mesmo dia civil
        if ultimo_envio == hoje_str:
            print(f"[Pular] Linha {linha_idx} ({nome_bruto}): Lead já recebeu mensagem hoje.")
            continue

        # Avalia a cadência usando o motor resiliente (IA + Determinístico)
        decisao = avaliar_lead_crm(lead)
        template = decisao["template"]
        nova_fase = decisao["proxima_fase"]
        nome_formatado = decisao["nome"]
        curso_formatado = decisao["curso"]

        if template == "NENHUM":
            continue

        processados += 1
        destino = telefone if MODO_PRODUCAO else SEU_NUMERO

        print(f"\n[Lead {processados}] Linha {linha_idx}: {nome_formatado} | Curso: {curso_formatado}")
        print(f"Disparando: {template} -> Atualizando para Fase {nova_fase}")
        print(f"Enviando para: {destino}...")

        sucesso = enviar_mensagem_whatsapp(
            numero_destino=destino,
            template_name=template,
            parametros=[nome_formatado, curso_formatado]
        )

        if sucesso:
            # Em produção, o ideal é capturar o ID real retornado pela requisição na Meta.
            # Aqui simulamos a gravação de um ID único para registo na coluna H.
            msg_id = f"ID_META_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            atualizar_status_lead(linha_planilha=linha_idx, fase=nova_fase, msg_id=msg_id)
            print(f"✅ Disparo concluído e planilha atualizada com sucesso.")
        else:
            print(f"❌ Falha no envio para o lead da linha {linha_idx}.")

        # Pausa anti-spam para conformidade com a Meta (15 a 30 segundos)
        # Só faz a pausa se não for o último lead da lista
        if processados < len(leads) and sucesso:
            pausa = random.randint(15, 30)
            print(f"Aguardando {pausa}s para evitar bloqueio anti-spam...")
            time.sleep(pausa)

    print("\n==================================================")
    print(f"PROCESSAMENTO FINALIZADO. Total de disparos realizados: {processados}")
    print("==================================================")

if __name__ == "__main__":
    if not MODO_PRODUCAO and not SEU_NUMERO:
        print("ERRO: MY_PHONE_NUMBER não está configurado no .env para o modo de teste.")
        sys.exit(1)
        
    processar_cadencia_vendas()