import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, RefreshCw, CheckCircle2, MessageCircle, AlertTriangle, 
  Calendar, CreditCard, User, BookOpen, Clock, Check, Filter
} from 'lucide-react'

export default function CobrancaView() {
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroAba, setFiltroAba] = useState('todos')
  const [busca, setBusca] = useState('')
  const [processandoId, setProcessandoId] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  const carregarAlunos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .table('alunos_cobranca')
        .select('*')
        .order('vencimento_atual', { ascending: true, nullsFirst: false })

      if (!error && data) {
        setAlunos(data)
      }
    } catch (err) {
      console.error("Erro ao carregar alunos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  // Calcula a diferença de dias entre hoje e o vencimento
  const calcularDiferencaDias = (vencimentoStr) => {
    if (!vencimentoStr) return null
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const partes = vencimentoStr.split('-')
      const dataVenc = new Date(partes[0], partes[1] - 1, partes[2])
      dataVenc.setHours(0, 0, 0, 0)

      const diffTime = dataVenc - hoje
      return Math.round(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  // Ação de Marcar como Pago (1 clique com update otimista)
  const handleMarcarComoPago = async (aluno) => {
    setProcessandoId(aluno.id)
    try {
      const { error } = await supabase
        .table('alunos_cobranca')
        .update({ 
          status_pagamento: 'CONCLUÍDO',
          updated_at: new Date().toISOString()
        })
        .eq('id', aluno.id)

      if (!error) {
        setAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, status_pagamento: 'CONCLUÍDO' } : a))
        mostrarToast(`Pagamento de ${aluno.nome_aluno.split(' ')[0]} registrado com sucesso!`)
      }
    } catch (err) {
      mostrarToast("Erro ao atualizar pagamento.")
    } finally {
      setProcessandoId(null)
    }
  }

  const mostrarToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // Filtragem dos alunos
  const alunosFiltrados = useMemo(() => {
    return alunos.filter(aluno => {
      // Filtro de busca textual
      const termo = busca.toLowerCase()
      const matchBusca = 
        aluno.nome_aluno?.toLowerCase().includes(termo) ||
        aluno.telefone_whatsapp?.includes(termo) ||
        aluno.curso?.toLowerCase().includes(termo)

      if (!matchBusca) return false

      const diffDias = calcularDiferencaDias(aluno.vencimento_atual)
      const isConcluido = aluno.status_pagamento?.toUpperCase().includes('CONCLU') || aluno.status_pagamento?.toUpperCase().includes('PAGO')

      if (filtroAba === 'hoje') {
        return diffDias === 0 && !isConcluido
      }
      if (filtroAba === 'd1') {
        return diffDias === 1 && !isConcluido
      }
      if (filtroAba === 'd5') {
        return diffDias === 5 && !isConcluido
      }
      if (filtroAba === 'concluidos') {
        return isConcluido
      }
      if (filtroAba === 'pendentes') {
        return !isConcluido
      }
      return true
    })
  }, [alunos, busca, filtroAba])

  // Contadores para as abas
  const contadores = useMemo(() => {
    let hoje = 0, d1 = 0, d5 = 0, concluidos = 0, pendentes = 0
    alunos.forEach(a => {
      const isConcluido = a.status_pagamento?.toUpperCase().includes('CONCLU') || a.status_pagamento?.toUpperCase().includes('PAGO')
      const diff = calcularDiferencaDias(a.vencimento_atual)
      if (isConcluido) {
        concluidos++
      } else {
        pendentes++
        if (diff === 0) hoje++
        if (diff === 1) d1++
        if (diff === 5) d5++
      }
    })
    return { hoje, d1, d5, concluidos, pendentes, total: alunos.length }
  }, [alunos])

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return 'Sem data definida'
    try {
      const [ano, mes, dia] = dataIso.split('-')
      return `${dia}/${mes}/${ano}`
    } catch {
      return dataIso
    }
  }

  const formatarTelefone = (tel) => {
    if (!tel) return ''
    const num = tel.replace(/\D/g, '')
    if (num.length === 13) {
      return `+${num.slice(0, 2)} (${num.slice(2, 4)}) ${num.slice(4, 9)}-${num.slice(9)}`
    }
    return tel
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 glass-panel border border-emerald-500/30 bg-emerald-950/80 text-emerald-200 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER DA SEÇÃO & CARDS DE RESUMO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Cobrança Preventiva</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10 font-bold">
              {contadores.total} Alunos
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Acompanhamento de vencimentos e baixa de pagamentos em tempo real
          </p>
        </div>

        <button
          onClick={carregarAlunos}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* CARDS DE RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setFiltroAba('hoje')}
          className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroAba === 'hoje' ? 'border-red-500/50 bg-red-500/10' : 'hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-red-400 mb-1">
            <span>VENCE HOJE</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{contadores.hoje}</div>
          <div className="text-[11px] text-slate-400 mt-1">Disparo imediato com PIX</div>
        </div>

        <div 
          onClick={() => setFiltroAba('d1')}
          className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroAba === 'd1' ? 'border-amber-500/50 bg-amber-500/10' : 'hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-1">
            <span>FALTA 1 DIA</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{contadores.d1}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lembrete amanhã</div>
        </div>

        <div 
          onClick={() => setFiltroAba('d5')}
          className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroAba === 'd5' ? 'border-indigo-500/50 bg-indigo-500/10' : 'hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-1">
            <span>FALTAM 5 DIAS</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{contadores.d5}</div>
          <div className="text-[11px] text-slate-400 mt-1">Aviso prévio</div>
        </div>

        <div 
          onClick={() => setFiltroAba('concluidos')}
          className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroAba === 'concluidos' ? 'border-emerald-500/50 bg-emerald-500/10' : 'hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
            <span>PAGOS / CONCLUÍDOS</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{contadores.concluidos}</div>
          <div className="text-[11px] text-slate-400 mt-1">Alunos em dia</div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas de Filtro de Toque */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos', count: contadores.total },
            { id: 'hoje', label: 'Hoje', count: contadores.hoje, color: 'text-red-400' },
            { id: 'd1', label: '1 Dia', count: contadores.d1, color: 'text-amber-400' },
            { id: 'd5', label: '5 Dias', count: contadores.d5, color: 'text-indigo-400' },
            { id: 'concluidos', label: 'Pagos', count: contadores.concluidos, color: 'text-emerald-400' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroAba(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                filtroAba === tab.id
                  ? 'bg-slate-800 text-white border-white/20 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filtroAba === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por aluno, telefone ou curso..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* LISTAGEM DE ALUNOS */}
      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Carregando carteira de alunos...</p>
        </div>
      ) : alunosFiltrados.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum aluno encontrado</h3>
          <p className="text-xs text-slate-400 mt-1">
            Nenhum registro atende aos filtros selecionados no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alunosFiltrados.map((aluno) => {
            const isConcluido = aluno.status_pagamento?.toUpperCase().includes('CONCLU') || aluno.status_pagamento?.toUpperCase().includes('PAGO')
            const diffDias = calcularDiferencaDias(aluno.vencimento_atual)
            const telLimpo = aluno.telefone_whatsapp?.replace(/\D/g, '')

            // Mensagem pré-formatada para o WhatsApp
            const msgWhats = encodeURIComponent(
              `Olá, ${aluno.nome_aluno.split(' ')[0]}! Tudo bem? Aqui é do Instituto Reis sobre o seu curso de ${aluno.curso}.`
            )
            const linkWhatsApp = `https://wa.me/${telLimpo}?text=${msgWhats}`

            return (
              <div 
                key={aluno.id}
                className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Topo do Card */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-800 text-brand-400 border border-brand-500/20">
                      {aluno.curso}
                    </span>

                    {/* Badge de Status */}
                    {isConcluido ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        PAGO
                      </span>
                    ) : diffDias === 0 ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        VENCE HOJE
                      </span>
                    ) : diffDias === 1 ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        AMANHÃ (-1D)
                      </span>
                    ) : diffDias === 5 ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        EM 5 DIAS
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        PENDENTE
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {aluno.nome_aluno}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>Vencimento: <strong className="text-slate-300">{formatarDataBR(aluno.vencimento_atual)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{formatarTelefone(aluno.telefone_whatsapp)}</span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                  {!isConcluido ? (
                    <button
                      onClick={() => handleMarcarComoPago(aluno)}
                      disabled={processandoId === aluno.id}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                    >
                      {processandoId === aluno.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar como Pago</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
                      Pagamento Quitado
                    </div>
                  )}

                  <a
                    href={linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Conversar no WhatsApp"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
