import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  UserPlus, Search, RefreshCw, MessageCircle, UserCheck, 
  Trophy, XCircle, Clock, Calendar, CheckCircle2, AlertCircle, Phone, ArrowRight
} from 'lucide-react'
import ModalNovoLead from '../components/ModalNovoLead'

export default function CRMView() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [processandoId, setProcessandoId] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  const carregarLeads = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .table('leads_crm')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setLeads(data)
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarLeads()
  }, [])

  const mostrarToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // Atualização rápida de status do funil
  const handleAlterarStatus = async (leadId, novoStatus) => {
    setProcessandoId(leadId)
    try {
      const { error } = await supabase
        .table('leads_crm')
        .update({ 
          status_funil: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (!error) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status_funil: novoStatus } : l))
        mostrarToast(`Status atualizado para: ${novoStatus}`)
      } else {
        mostrarToast(`Erro: ${error.message}`)
      }
    } catch (err) {
      mostrarToast("Erro ao conectar ao servidor.")
    } finally {
      setProcessandoId(null)
    }
  }

  // Contadores por estágio do funil
  const contadores = useMemo(() => {
    const counts = {
      todos: leads.length,
      Novo: 0,
      'Em Cadência': 0,
      'Atendimento Humano': 0,
      Ganhou: 0,
      Perdeu: 0
    }
    leads.forEach(l => {
      if (counts[l.status_funil] !== undefined) {
        counts[l.status_funil]++
      }
    })
    return counts
  }, [leads])

  // Filtragem
  const leadsFiltrados = useMemo(() => {
    return leads.filter(lead => {
      const termo = busca.toLowerCase()
      const matchBusca = 
        lead.nome_lead?.toLowerCase().includes(termo) ||
        lead.telefone?.includes(termo) ||
        lead.curso_interesse?.toLowerCase().includes(termo)

      if (!matchBusca) return false

      if (filtroStatus !== 'todos' && lead.status_funil !== filtroStatus) {
        return false
      }
      return true
    })
  }, [leads, busca, filtroStatus])

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return '-'
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
        <div className="fixed top-20 right-4 z-50 glass-panel border border-brand-500/30 bg-slate-900/90 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-brand-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Modal de Novo Lead */}
      <ModalNovoLead
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onLeadCriado={(novoLead) => {
          setLeads(prev => [novoLead, ...prev])
          mostrarToast(`Lead ${novoLead.nome_lead} cadastrado com sucesso!`)
        }}
      />

      {/* HEADER DA SEÇÃO & BOTÃO NOVO LEAD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>CRM & Funil de Vendas</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10 font-bold">
              {contadores.todos} Leads
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Cadência de resgate e gestão de matrículas do Instituto Reis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarLeads}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setModalAberto(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Lead</span>
          </button>
        </div>
      </div>

      {/* ABAS DO FUNIL DE VENDAS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos', count: contadores.todos },
            { id: 'Novo', label: 'Novos (D1)', count: contadores['Novo'], color: 'text-blue-400' },
            { id: 'Em Cadência', label: 'Em Cadência', count: contadores['Em Cadência'], color: 'text-amber-400' },
            { id: 'Atendimento Humano', label: 'Atendimento', count: contadores['Atendimento Humano'], color: 'text-purple-400' },
            { id: 'Ganhou', label: 'Matriculados', count: contadores['Ganhou'], color: 'text-emerald-400' },
            { id: 'Perdeu', label: 'Perdidos', count: contadores['Perdeu'], color: 'text-slate-400' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroStatus(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                filtroStatus === tab.id
                  ? 'bg-slate-800 text-white border-white/20 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filtroStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
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
            placeholder="Buscar por lead, telefone ou curso..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* LISTAGEM DE LEADS */}
      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Carregando funil comercial...</p>
        </div>
      ) : leadsFiltrados.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum lead nesta fase</h3>
          <p className="text-xs text-slate-400 mt-1">
            Clique no botão "+ Novo Lead" para cadastrar o primeiro interessado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leadsFiltrados.map((lead) => {
            const telLimpo = lead.telefone?.replace(/\D/g, '')
            const msgWhats = encodeURIComponent(
              `Olá, ${lead.nome_lead.split(' ')[0]}! Tudo bem? Sou da equipe do Instituto Reis sobre o curso de ${lead.curso_interesse}.`
            )
            const linkWhatsApp = `https://wa.me/${telLimpo}?text=${msgWhats}`

            const isHumano = lead.status_funil === 'Atendimento Humano'
            const isGanhou = lead.status_funil === 'Ganhou'
            const isPerdeu = lead.status_funil === 'Perdeu'

            return (
              <div 
                key={lead.id}
                className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Topo do Card */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-800 text-brand-400 border border-brand-500/20">
                      {lead.curso_interesse}
                    </span>

                    {/* Badge de Status do Funil */}
                    {isGanhou ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        MATRICULADO
                      </span>
                    ) : isHumano ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        HUMANO
                      </span>
                    ) : isPerdeu ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                        PERDIDO
                      </span>
                    ) : lead.status_funil === 'Em Cadência' ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        CADÊNCIA {lead.fase_cadencia || 'D4'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        NOVO LEAD
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {lead.nome_lead}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>Entrada: <strong className="text-slate-300">{formatarDataBR(lead.data_entrada)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>Último envio: <strong className="text-slate-300">{formatarDataBR(lead.data_ultimo_envio)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{formatarTelefone(lead.telefone)}</span>
                    </div>
                  </div>
                </div>

                {/* AÇÕES DE ATENDIMENTO & FUNIL */}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  {/* Botão de Assumir Atendimento (Stop Rule do Robô) */}
                  {!isHumano && !isGanhou && !isPerdeu && (
                    <button
                      onClick={() => handleAlterarStatus(lead.id, 'Atendimento Humano')}
                      disabled={processandoId === lead.id}
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Assumir Atendimento (Pausar Robô)</span>
                    </button>
                  )}

                  {/* Botões Secundários: WhatsApp + Ganhou + Perdeu */}
                  <div className="flex items-center gap-2">
                    <a
                      href={linkWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {!isGanhou && (
                      <button
                        onClick={() => handleAlterarStatus(lead.id, 'Ganhou')}
                        disabled={processandoId === lead.id}
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        title="Matriculou! Marcar como Ganhou"
                      >
                        <Trophy className="w-4 h-4" />
                      </button>
                    )}

                    {!isPerdeu && (
                      <button
                        onClick={() => handleAlterarStatus(lead.id, 'Perdeu')}
                        disabled={processandoId === lead.id}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                        title="Desistiu / Não tem interesse"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
