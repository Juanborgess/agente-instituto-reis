import React, { useState } from 'react'
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Circle,
  RotateCcw,
  MessageSquare,
  Clock,
  HelpCircle,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ShieldAlert,
  Download,
  PlusCircle,
  Smartphone,
  ArrowRight
} from 'lucide-react'
import { useOnboarding } from '../contexts/OnboardingContext'
import {
  TRILHAS_TOUR,
  MENSAGENS_ROBO_CRM,
  REGUA_COBRANCA,
  REGRAS_DISPARO_ROBOS,
  ROTINA_DIARIA,
  CURSOS_PADRAO_MANUAL,
  FAQ_ITENS
} from '../data/onboardingSteps'

export default function OnboardingView({ setActiveTab }) {
  const { startTour, checklistMarcados, toggleChecklistItem, resetChecklist } = useOnboarding()
  const [secaoAtiva, setSecaoAtiva] = useState('roteiro')
  const [copiadoIdx, setCopiadoIdx] = useState(null)
  const [faqAberto, setFaqAberto] = useState(0)

  const totalChecklist = ROTINA_DIARIA.reduce((acc, b) => acc + b.itens.length, 0)
  const totalMarcados = ROTINA_DIARIA.reduce(
    (acc, b) => acc + b.itens.filter((i) => checklistMarcados[i.id]).length,
    0
  )
  const progressoChecklist = totalChecklist > 0 ? Math.round((totalMarcados / totalChecklist) * 100) : 0

  const handleCopiarMensagem = (texto, idx) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto)
      setCopiadoIdx(idx)
      setTimeout(() => setCopiadoIdx(null), 2000)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 pb-8 md:pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
            <span>Central de Onboarding & Guia da Recepção</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Modo Treino Seguro
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Aprenda passo a passo cada botão do painel, a rotina diária e o que os robôs enviam no WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={() => startTour('completo')}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white text-xs font-extrabold shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] self-start sm:self-auto"
        >
          <Play className="w-4 h-4" />
          <span>Iniciar Tour Interativo Completo</span>
        </button>
      </div>

      {/* CARDS DAS TRILHAS DE TOUR GUIADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {TRILHAS_TOUR.map((trilha) => (
          <button
            key={trilha.id}
            type="button"
            onClick={() => startTour(trilha.id)}
            className="glass-card rounded-2xl p-4 border border-white/10 hover:border-amber-500/40 text-left flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r ${trilha.cor} text-white`}
                >
                  {trilha.badge}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">{trilha.duracao}</span>
              </div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                {trilha.titulo}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{trilha.subtitulo}</p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Passar botão por botão</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* AVISO SOBRE SINCRONIZAÇÃO EM TEMPO REAL */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-500/25 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              O mais importante: conversa sozinho e em tempo real com a Planilha do Google e os Robôs
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Deu baixa ou cadastrou alguém no painel? A planilha atualiza na hora. Alguém mexeu na planilha? O painel atualiza sozinho sem precisar apertar F5.
            </p>
          </div>
        </div>
      </div>

      {/* SUB-ABAS DO MANUAL */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
        {[
          { id: 'roteiro', label: 'Passo a Passo & Dicas', icon: BookOpen },
          { id: 'rotina', label: `Rotina Diária (${totalMarcados}/${totalChecklist})`, icon: Clock },
          { id: 'robos', label: 'Mensagens & Quando Dispara', icon: MessageSquare },
          { id: 'faq', label: 'Dúvidas Frequentes (FAQ)', icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSecaoAtiva(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                secaoAtiva === tab.id
                  ? 'bg-slate-800 text-white border-white/20 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* CONTEÚDO DA SUB-ABA SELECIONADA */}
      {secaoAtiva === 'roteiro' && (
        <div className="space-y-4">
          {/* REGRA DE OURO + PASSO A PASSO DE LEAD NOVO */}
          <div className="glass-panel rounded-2xl p-5 border border-purple-500/30 bg-purple-500/5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                  Regra de Ouro da Recepção
                </span>
                <h3 className="text-base font-extrabold text-white">
                  O que fazer quando entrar ou responder um Lead no CRM
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-1.5">
                <p className="font-bold text-blue-300">1. Alguém chamou no WhatsApp, Instagram ou balcão</p>
                <p className="text-slate-300 leading-relaxed">
                  Abra <strong>CRM de Vendas</strong>, clique em <strong>+ Novo Lead</strong>, preencha Nome, WhatsApp com DDD e Curso de Interesse. Ele entra na planilha com status <em>Novo</em>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
                <p className="font-bold text-purple-300">2. O interessado respondeu no WhatsApp (CRÍTICO!)</p>
                <p className="text-slate-200 leading-relaxed">
                  Procure o card dele no CRM e clique imediatamente no botão roxo{' '}
                  <strong>Assumir Atendimento (Pausar Robô)</strong>. Isso desliga o robô na hora para ele nunca atravessar sua conversa!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-1.5">
                <p className="font-bold text-emerald-300">3. Cliente fechou a matrícula! 🏆</p>
                <p className="text-slate-300 leading-relaxed">
                  No card do CRM, clique no troféu verde (<strong>Ganhou</strong>). Depois vá em{' '}
                  <strong>Cobrança Preventiva</strong> e cadastre ele em <strong>+ Novo Aluno</strong> com dia de vencimento, valor e curso.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-1.5">
                <p className="font-bold text-slate-300">4. Não quer no momento / Chamar no WhatsApp</p>
                <p className="text-slate-300 leading-relaxed">
                  Se desistiu, clique no <strong>X ❌</strong> (vai para Perdidos e para os envios). Para chamar direto, clique em <strong>WhatsApp</strong> — a mensagem já vai pronta com nome e curso!
                </p>
              </div>
            </div>
          </div>

          {/* EXPORTAR EXCEL, CURSOS NOVOS E INSTALAR PWA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Exportar Listas para o Excel</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Em todas as 3 abas existe o botão <strong>Exportar Excel</strong>. Ele baixa um arquivo com acentos 100% legíveis e exporta{' '}
                <strong>exatamente o filtro aberto na tela</strong> (ex.: só os de &quot;Hoje&quot; ou só de &quot;Barbeiro&quot;).
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <PlusCircle className="w-4 h-4" />
                <span>Criar Cursos Novos sem Programador</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cursos padrão: {CURSOS_PADRAO_MANUAL.join(', ')}. Para lançar um curso novo (ex.: Maquiagem), abra <strong>+ Novo Aluno</strong> ou <strong>+ Novo Lead</strong>, escolha{' '}
                <strong>+ Outro Curso (Digitar Novo)...</strong> e salve!
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Instalar no Celular ou PC (App PWA)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clique em <strong>Instalar Aplicativo</strong> no topo da tela (ou no rodapé do celular). O painel abre o passo a passo exato para Android (Chrome), iPhone (Safari) ou Computador (Chrome/Edge).
              </p>
            </div>
          </div>
        </div>
      )}

      {secaoAtiva === 'rotina' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white">
                Checklist Diário Recomendado para a Recepção
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Progresso salvo no navegador para o dia de hoje ({totalMarcados} de {totalChecklist} tarefas feitas)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${progressoChecklist}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-emerald-400">{progressoChecklist}%</span>
              {totalMarcados > 0 && (
                <button
                  type="button"
                  onClick={resetChecklist}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                  title="Desmarcar checklist de hoje"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {ROTINA_DIARIA.map((grupo) => (
              <div key={grupo.bloco} className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
                <h4 className={`text-sm font-extrabold ${grupo.cor}`}>{grupo.bloco}</h4>
                <div className="space-y-2.5">
                  {grupo.itens.map((item) => {
                    const marcado = !!checklistMarcados[item.id]
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                          marcado
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800/70'
                        }`}
                      >
                        {marcado ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs leading-relaxed ${marcado ? 'line-through opacity-80' : ''}`}>
                          {item.texto}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {secaoAtiva === 'robos' && (
        <div className="space-y-6">
          {/* Regras Gerais de Disparo (Travas de Segurança) */}
          <div className="glass-panel rounded-2xl p-5 border border-brand-500/25 bg-brand-500/5 space-y-3">
            <div className="flex items-center gap-2 text-brand-300 font-extrabold text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Regras de Segurança: Quando os Robôs Enviam e Quando Param</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {REGRAS_DISPARO_ROBOS.map((regra, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/70 border border-white/5 text-xs text-slate-200 leading-relaxed flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{regra}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Régua de Cobrança */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-extrabold text-white">
                1. Robô de Cobrança Preventiva — Quando Dispara e O Que Envia
              </h3>
              <p className="text-xs text-slate-400">
                Ele olha todos os dias a data de vencimento de cada aluno pendente e escolhe o modelo exato:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REGUA_COBRANCA.map((item) => (
                <div key={item.momento} className={`rounded-2xl p-4 border ${item.cor} flex flex-col justify-between gap-2.5`}>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider block">
                      {item.momento}
                    </span>
                    <h4 className="text-sm font-bold text-white">{item.titulo}</h4>
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{item.quandoDispara}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300 leading-relaxed pt-1 border-t border-white/10">
                    <p><strong className="text-white">O que envia:</strong> {item.oQueEnvia}</p>
                    <p className="text-[11px] text-slate-400">{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensagens Exatas do Robô de Vendas (CRM) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  2. Robô do CRM de Vendas — Quando Manda Cada Mensagem (D+1, D+4, D+7)
                </h3>
                <p className="text-xs text-slate-400">
                  A contagem começa a partir da <strong>Data de Entrada</strong> do lead. Se o lead responder e você clicar em <strong>Assumir Atendimento</strong>, os próximos disparos são cancelados na hora.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {MENSAGENS_ROBO_CRM.map((msg, idx) => (
                <div key={msg.fase} className={`glass-card rounded-2xl p-5 border ${msg.cor} flex flex-col justify-between gap-4`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${msg.badgeCor}`}>
                        {msg.fase}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopiarMensagem(msg.texto, idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiadoIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-white">{msg.titulo}</h4>

                    {/* Quando dispara e Condição */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Quando manda: {msg.quandoDispara}</span>
                      </div>
                      <p className="text-slate-300 leading-snug">
                        <strong className="text-slate-100">Condição:</strong> {msg.condicao}
                      </p>
                      <p className="text-emerald-300 leading-snug">
                        <strong className="text-emerald-200">Depois do envio:</strong> {msg.aposEnvio}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-100 leading-relaxed italic selectable-text">
                      &ldquo;{msg.texto}&rdquo;
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-1">
                      Por que funciona?
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{msg.porque}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {secaoAtiva === 'faq' && (
        <div className="space-y-2.5 max-w-4xl">
          {FAQ_ITENS.map((item, idx) => {
            const aberto = faqAberto === idx
            return (
              <div key={idx} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFaqAberto(aberto ? -1 : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{item.pergunta}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      aberto ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>
                {aberto && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-[13px] text-slate-300 leading-relaxed border-t border-white/5">
                    {item.resposta}
                  </div>
                )}
              </div>
            )
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('cobranca')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Voltar para Cobrança Preventiva</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
