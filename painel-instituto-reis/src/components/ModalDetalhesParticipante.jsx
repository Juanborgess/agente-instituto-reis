import React from 'react'
import { 
  X, User, Phone, MapPin, Mail, Calendar, Briefcase, 
  Target, HeartHandshake, AlertCircle, MessageCircle, ArrowRight, UserPlus, Trophy
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ModalDetalhesParticipante({ 
  participante, 
  isOpen, 
  onClose, 
  onEnviarParaCRM,
  onToggleSorteado
}) {
  if (!isOpen || !participante) return null

  const telLimpo = String(participante.whatsapp || '').replace(/\D/g, '')
  const telFormatado = telLimpo.startsWith('55') ? telLimpo : '55' + telLimpo
  const primeiroNome = (participante.nome_completo || 'Participante').split(' ')[0]
  const msgWhats = encodeURIComponent(
    `Olá, ${primeiroNome}! Tudo bem? Sou da equipe do Instituto Reis sobre a sua participação no sorteio do curso de ${participante.curso_interesse || 'qualificação profissional'}.`
  )
  const linkWhatsApp = `https://wa.me/${telFormatado}?text=${msgWhats}`

  const handleTransferirCRM = async () => {
    try {
      const dataHojeIso = new Date().toISOString().split('T')[0]
      const { error } = await supabase
        .from('leads_crm')
        .insert([{
          nome_lead: participante.nome_completo,
          telefone: telFormatado,
          curso_interesse: participante.curso_interesse || 'Barbeiro',
          status_funil: 'Novo',
          fase_cadencia: 'Sorteio QR',
          data_entrada: dataHojeIso,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (!error) {
        // Marca como enviado ao CRM
        await supabase
          .from('sorteio_participantes')
          .update({ enviado_crm: true })
          .eq('id', participante.id)

        if (onEnviarParaCRM) {
          onEnviarParaCRM(participante)
        }
      }
    } catch (err) {
      console.error("Erro ao transferir lead para CRM:", err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo: Número, Nome e Badge do Curso */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex flex-col items-center justify-center text-white font-black shadow-glow flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-white/80">Nº</span>
            <span className="text-xl leading-none">#{participante.numero_participante}</span>
          </div>

          <div className="pr-8">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {participante.curso_interesse || 'Curso Geral'}
              </span>
              {participante.sorteado ? (
                <button
                  type="button"
                  onClick={() => onToggleSorteado && onToggleSorteado(participante)}
                  title="Clique para desmarcar como sorteado"
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sorteado (Clique p/ Desmarcar)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleSorteado && onToggleSorteado(participante)}
                  title="Clique para marcar como sorteado manualmente"
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-white/10 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Marcar como Sorteado</span>
                </button>
              )}
              {participante.enviado_crm && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  No CRM de Vendas
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {participante.nome_completo}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Formulário enviado em: {participante.data_hora || 'Recente'}
            </p>
          </div>
        </div>

        {/* Informações Básicas de Contato */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{participante.whatsapp || 'Sem telefone'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span className="truncate">{participante.bairro || 'Bairro não inf.'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>{participante.idade ? `${participante.idade} anos` : 'Idade não inf.'}</span>
          </div>
          {participante.email && (
            <div className="sm:col-span-3 flex items-center gap-2 pt-2 border-t border-white/5 text-slate-400">
              <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="truncate">{participante.email}</span>
            </div>
          )}
        </div>

        {/* Respostas da Pesquisa de Perfil */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Respostas da Pesquisa de Perfil:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Contato Anterior com a Área</span>
              <p className="text-slate-200 font-medium">{participante.contato_anterior || '-'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Nível de Conhecimento</span>
              <p className="text-slate-200 font-medium">{participante.conhecimento || '-'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Situação Profissional / Trabalha?</span>
              <p className="text-slate-200 font-medium">{participante.trabalha || '-'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">Área de Atuação Atual</span>
              <p className="text-slate-200 font-medium">{participante.area_atual || '-'}</p>
            </div>
          </div>

          {/* Seção Emocional / Objetivos */}
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-brand-500/10 space-y-1.5">
              <span className="text-[11px] text-brand-400 font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Objetivo para os Próximos Meses
              </span>
              <p className="text-white text-sm font-semibold">{participante.objetivo_meses || '-'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Objetivo Profissional a Longo Prazo
              </span>
              <p className="text-slate-200 text-xs leading-relaxed italic">
                "{participante.objetivo_profissional || '-'}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
                O que mudaria na sua vida com a profissão?
              </span>
              <p className="text-slate-200 text-xs leading-relaxed italic">
                "{participante.o_que_mudaria || '-'}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1.5">
              <span className="text-[11px] text-red-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                O que te impede hoje de começar?
              </span>
              <p className="text-red-200 text-xs font-semibold">
                {participante.impedimento || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Ações Inferiores */}
        <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Iniciar WhatsApp com Participante</span>
          </a>

          {!participante.enviado_crm ? (
            <button
              onClick={handleTransferirCRM}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-600/20 active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Transformar em Lead do CRM</span>
            </button>
          ) : (
            <span className="text-xs text-purple-400 font-bold px-3 py-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center">
              ✓ Já cadastrado no CRM
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
