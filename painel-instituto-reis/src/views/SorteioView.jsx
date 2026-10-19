import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Trophy, Search, RefreshCw, MessageCircle, Phone, 
  MapPin, Calendar, User, Eye, UserPlus, Sparkles, Filter, CheckCircle2, AlertCircle
} from 'lucide-react'
import ModalDetalhesParticipante from '../components/ModalDetalhesParticipante'
import ModalSorteador from '../components/ModalSorteador'

export default function SorteioView() {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroCurso, setFiltroCurso] = useState('todos')
  const [participanteSelecionado, setParticipanteSelecionado] = useState(null)
  const [modalSorteadorAberto, setModalSorteadorAberto] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const carregarParticipantes = async (silencioso = false) => {
    if (!silencioso) {
      if (participantes.length === 0) {
        setLoading(true)
      } else {
        setRecarregando(true)
      }
    }

    try {
      const { data, error } = await supabase
        .from('sorteio_participantes')
        .select('*')
        .order('numero_participante', { ascending: false })

      if (!error && data) {
        setParticipantes(data)
      }
    } catch (err) {
      console.error("Erro ao carregar sorteio_participantes:", err)
    } finally {
      setLoading(false)
      setRecarregando(false)
    }
  }

  useEffect(() => {
    carregarParticipantes(false)

    // Conexão em tempo real: qualquer resposta enviada no site ou planilha reflete aqui na hora!
    const channel = supabase
      .channel('realtime_sorteio_participantes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sorteio_participantes' }, () => {
        carregarParticipantes(true)
      })
      .subscribe()

    const intervalo = setInterval(() => {
      carregarParticipantes(true)
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(intervalo)
    }
  }, [])

  const mostrarToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // Estatísticas calculadas dinamicamente
  const metricas = useMemo(() => {
    const total = participantes.length
    if (total === 0) {
      return { total: 0, topCurso: '-', topBairro: '-', principalImpedimento: '-' }
    }

    const cursosCount = {}
    const bairrosCount = {}
    const impedimentosCount = {}

    participantes.forEach(p => {
      const c = p.curso_interesse || 'Outro'
      cursosCount[c] = (cursosCount[c] || 0) + 1

      const b = p.bairro?.trim() || 'Não inf.'
      bairrosCount[b] = (bairrosCount[b] || 0) + 1

      const imp = p.impedimento?.trim() || 'Nenhum'
      impedimentosCount[imp] = (impedimentosCount[imp] || 0) + 1
    })

    const topCurso = Object.entries(cursosCount).sort((a, b) => b[1] - a[1])[0]
    const topBairro = Object.entries(bairrosCount).sort((a, b) => b[1] - a[1])[0]
    const topImp = Object.entries(impedimentosCount).sort((a, b) => b[1] - a[1])[0]

    return {
      total,
      topCurso: topCurso ? `${topCurso[0]} (${topCurso[1]})` : '-',
      topBairro: topBairro ? `${topBairro[0]} (${topBairro[1]})` : '-',
      principalImpedimento: topImp ? topImp[0] : '-'
    }
  }, [participantes])

  // Cursos distintos para os filtros
  const cursosDisponiveis = useMemo(() => {
    const setCursos = new Set(participantes.map(p => p.curso_interesse).filter(Boolean))
    return Array.from(setCursos)
  }, [participantes])

  // Filtragem
  const participantesFiltrados = useMemo(() => {
    return participantes.filter(p => {
      const termo = busca.toLowerCase()
      const matchBusca = 
        p.nome_completo?.toLowerCase().includes(termo) ||
        p.whatsapp?.includes(termo) ||
        p.bairro?.toLowerCase().includes(termo) ||
        p.curso_interesse?.toLowerCase().includes(termo) ||
        String(p.numero_participante).includes(termo)

      if (!matchBusca) return false

      if (filtroCurso !== 'todos' && p.curso_interesse !== filtroCurso) {
        return false
      }

      return true
    })
  }, [participantes, busca, filtroCurso])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32 md:pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 glass-panel border border-brand-500/30 bg-slate-900/90 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-brand-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Modal de Detalhes da Pesquisa */}
      <ModalDetalhesParticipante
        participante={participanteSelecionado}
        isOpen={!!participanteSelecionado}
        onClose={() => setParticipanteSelecionado(null)}
        onEnviarParaCRM={(p) => {
          setParticipantes(prev => prev.map(item => item.id === p.id ? { ...item, enviado_crm: true } : item))
          mostrarToast(`Participante ${p.nome_completo} enviado ao CRM com sucesso!`)
          setParticipanteSelecionado(null)
        }}
      />

      {/* Modal de Roleta / Sorteador */}
      <ModalSorteador
        isOpen={modalSorteadorAberto}
        onClose={() => setModalSorteadorAberto(false)}
        participantes={participantes}
        onGanhadorSorteado={(ganhador) => {
          setParticipantes(prev => prev.map(p => p.id === ganhador.id ? { ...p, sorteado: true } : p))
          mostrarToast(`🎉 Sorteado com sucesso: #${ganhador.numero_participante} ${ganhador.nome_completo}!`)
        }}
      />

      {/* HEADER DA SEÇÃO & BOTÃO DO SORTEADOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Sorteio & Pesquisa QR Code</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              {metricas.total} Participantes
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Respostas do formulário externo sincronizadas em tempo real com o Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => carregarParticipantes(false)}
            disabled={loading || recarregando}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${recarregando || loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setModalSorteadorAberto(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Trophy className="w-4 h-4 text-white" />
            <span>🎲 Realizar Sorteio</span>
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Participantes
          </span>
          <div className="text-2xl font-black text-white">
            {metricas.total}
          </div>
          <span className="text-[10px] text-slate-500">Cadastrados via formulário</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-1">
          <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider block">
            Curso Mais Procurado
          </span>
          <div className="text-base font-bold text-white truncate" title={metricas.topCurso}>
            {metricas.topCurso}
          </div>
          <span className="text-[10px] text-slate-500">Maior interesse no momento</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Principal Bairro
          </span>
          <div className="text-base font-bold text-white truncate" title={metricas.topBairro}>
            {metricas.topBairro}
          </div>
          <span className="text-[10px] text-slate-500">Região com mais inscrições</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-1">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block">
            Maior Impedimento
          </span>
          <div className="text-base font-bold text-white truncate" title={metricas.principalImpedimento}>
            {metricas.principalImpedimento}
          </div>
          <span className="text-[10px] text-slate-500">Fator citado para não começar</span>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas por Curso */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFiltroCurso('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
              filtroCurso === 'todos'
                ? 'bg-slate-800 text-white border-white/20 shadow-md'
                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Todos ({metricas.total})
          </button>
          {cursosDisponiveis.map(curso => (
            <button
              key={curso}
              onClick={() => setFiltroCurso(curso)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                filtroCurso === curso
                  ? 'bg-slate-800 text-white border-white/20 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {curso} ({participantes.filter(p => p.curso_interesse === curso).length})
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, WhatsApp, nº..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* LISTA DE PARTICIPANTES */}
      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Carregando participantes do sorteio...</p>
        </div>
      ) : participantesFiltrados.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum participante encontrado</h3>
          <p className="text-xs text-slate-400 mt-1">
            As respostas enviadas pelo formulário do site aparecerão automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participantesFiltrados.map((p) => {
            const telLimpo = String(p.whatsapp || '').replace(/\D/g, '')
            const msgWhats = encodeURIComponent(
              `Olá, ${p.nome_completo.split(' ')[0]}! Tudo bem? Sou da equipe do Instituto Reis sobre o sorteio do curso de ${p.curso_interesse}.`
            )
            const linkWhatsApp = `https://wa.me/${telLimpo.startsWith('55') ? telLimpo : '55' + telLimpo}?text=${msgWhats}`

            return (
              <div
                key={p.id}
                className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div>
                  {/* Topo do Card: Número do Sorteio e Curso */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        #{p.numero_participante}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-800 text-brand-400 border border-brand-500/20">
                        {p.curso_interesse}
                      </span>
                    </div>

                    {p.sorteado ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        SORTEADO
                      </span>
                    ) : p.enviado_crm ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        NO CRM
                      </span>
                    ) : null}
                  </div>

                  {/* Nome Completo */}
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {p.nome_completo}
                  </h3>

                  {/* Detalhes Rápidos */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{p.whatsapp || 'Sem telefone'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{p.bairro || 'Bairro não informado'} {p.idade ? `(${p.idade} anos)` : ''}</span>
                    </div>

                    {p.impedimento && (
                      <div className="pt-2 text-[11px] text-slate-400 line-clamp-2">
                        <strong className="text-red-400/90">Impedimento: </strong>
                        <span>{p.impedimento}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => setParticipanteSelecionado(p)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Respostas</span>
                  </button>

                  <a
                    href={linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 border border-white/10 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                    title="Conversar no WhatsApp"
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
