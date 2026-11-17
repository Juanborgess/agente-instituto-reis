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

from services.crm_manager import buscar_leads_cadencia, atualizar_status_lead, limpar_telefone
from services.crm_agent import avaliar_lead_crm
from services.whatsapp_client import enviar_mensagem_whatsapp_com_id

load_dotenv(RAIZ_PROJETO / ".env")

# Variáveis de Controlo (mesmo padrão de produção do src/main.py)
MODO_PRODUCAO = True
SEU_NUMERO = os.getenv("MY_PHONE_NUMBER")

def processar_cadencia_vendas():
    print("==================================================")
    print("--- INICIANDO MOTOR DE CADÊNCIA CRM (FASE 4) ---")
    print(f"Modo de Execução: {'PRODUÇÃO (DADOS REAIS)' if MODO_PRODUCAO else 'HOMOLOGAÇÃO / TESTE'}")
    print("==================================================")

    leads = buscar_leads_cadencia()
    if not leads:
        print("Nenhum lead elegível ('Novo' ou 'Em Cadência') encontrado.")
        return

    hoje_str = datetime.now().strftime("%d/%m/%Y")
    disparos_sucesso = 0
    tentativas = 0

    for idx, lead in enumerate(leads):
        linha_idx = lead.get("_linha_planilha")
        lead_ref = f"Linha {linha_idx}" if linha_idx else f"Supabase ID {lead.get('_id_supabase')}"
        nome_bruto = lead.get("Nome_Lead", "Desconhecido")
        telefone = limpar_telefone(lead.get("Telefone", ""))
        ultimo_envio = str(lead.get("Data_Ultimo_Envio", "")).strip()

        # Regra de Segurança: Impede mais de um disparo no mesmo dia civil
        if ultimo_envio == hoje_str:
            print(f"[Pular] {lead_ref} ({nome_bruto}): Lead já recebeu mensagem hoje.")
            continue

        # Avalia a cadência usando o motor resiliente (Determinístico + IA)
        decisao = avaliar_lead_crm(lead)
        template = decisao["template"]
        nova_fase = decisao["proxima_fase"]
        nome_formatado = (decisao["nome"] or "").strip() or "Aluno(a)"
        curso_formatado = (decisao["curso"] or "").strip() or "Geral"

        if template == "NENHUM" or not nova_fase:
            continue

        destino = telefone if MODO_PRODUCAO else limpar_telefone(SEU_NUMERO)
        if not destino:
            print(f"[Pular] {lead_ref} ({nome_bruto}): Telefone de destino vazio ou inválido.")
            continue

        tentativas += 1
        print(f"\n[Lead {tentativas}] {lead_ref}: {nome_formatado} | Curso: {curso_formatado}")
        print(f"Disparando: {template} -> Atualizando para Fase {nova_fase}")
        print(f"Enviando para: {destino}...")

        sucesso, msg_id_meta = enviar_mensagem_whatsapp_com_id(
            numero_destino=destino,
            template_name=template,
            parametros=[nome_formatado, curso_formatado]
        )

        if sucesso:
            disparos_sucesso += 1
            msg_id = msg_id_meta or f"ID_META_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            atualizar_status_lead(linha_planilha=linha_idx, fase=nova_fase, msg_id=msg_id, lead=lead)
            print(f"✅ Disparo concluído (ID: {msg_id}) e status atualizado no Supabase e na planilha.")
        else:
            print(f"❌ Falha no envio para o lead ({lead_ref}).")

        # Pausa anti-spam para conformidade com a Meta (15 a 30 segundos)
        # Só faz a pausa se houver mais leads na fila e o envio atual teve sucesso
        if idx < len(leads) - 1 and sucesso:
            pausa = random.randint(15, 30)
            print(f"Aguardando {pausa}s para evitar bloqueio anti-spam...")
            time.sleep(pausa)

    print("\n==================================================")
    print(f"PROCESSAMENTO FINALIZADO. Disparos com sucesso: {disparos_sucesso}/{tentativas}")
    print("==================================================")

if __name__ == "__main__":
    if not MODO_PRODUCAO and not SEU_NUMERO:
        print("ERRO: MY_PHONE_NUMBER não está configurado no .env para o modo de teste.")
        sys.exit(1)
        
    processar_cadencia_vendas()