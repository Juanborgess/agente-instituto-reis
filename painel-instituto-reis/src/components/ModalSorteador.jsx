import React, { useState, useEffect } from 'react'
import { Trophy, Sparkles, X, RotateCcw, MessageCircle, CheckCircle2, User, Phone, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ModalSorteador({ isOpen, onClose, participantes, onGanhadorSorteado }) {
  const [sorteando, setSorteando] = useState(false)
  const [ganhador, setGanhador] = useState(null)
  const [destaqueAtual, setDestaqueAtual] = useState(null)
  const [filtroCurso, setFiltroCurso] = useState('todos')

  useEffect(() => {
    if (isOpen) {
      setGanhador(null)
      setDestaqueAtual(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Elegíveis para o sorteio
  const elegiveis = participantes.filter(p => {
    if (filtroCurso !== 'todos' && p.curso_interesse !== filtroCurso) {
      return false
    }
    return true
  })

  // Cursos distintos presentes para filtrar
  const cursosDisponiveis = Array.from(new Set(participantes.map(p => p.curso_interesse).filter(Boolean)))

  const iniciarSorteio = () => {
    if (elegiveis.length === 0) return

    setSorteando(true)
    setGanhador(null)

    let velocidade = 50
    let tempoDecorrido = 0
    const duracaoTotal = 3500 // 3.5 segundos girando

    const roleta = setInterval(() => {
      const indiceAleatorio = Math.floor(Math.random() * elegiveis.length)
      setDestaqueAtual(elegiveis[indiceAleatorio])
      tempoDecorrido += velocidade

      if (tempoDecorrido >= duracaoTotal) {
        clearInterval(roleta)
        const vencedor = elegiveis[indiceAleatorio]
        setGanhador(vencedor)
        setSorteando(false)

        // Marca como sorteado no banco
        supabase
          .from('sorteio_participantes')
          .update({ sorteado: true })
          .eq('id', vencedor.id)
          .then(() => {
            if (onGanhadorSorteado) {
              onGanhadorSorteado(vencedor)
            }
          })
      }
    }, velocidade)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative text-center max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          disabled={sorteando}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-brand-500/20 border border-amber-500/30 mb-3 shadow-glow">
          <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight">
          Sorteador Oficial do Instituto Reis
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Sorteio randômico auditado com base nos participantes cadastrados via QR Code
        </p>

        {/* Filtro de Categoria antes de sortear */}
        {!ganhador && !sorteando && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Filtrar por:</span>
            <button
              onClick={() => setFiltroCurso('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                filtroCurso === 'todos'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              Todos ({participantes.length})
            </button>
            {cursosDisponiveis.map(curso => (
              <button
                key={curso}
                onClick={() => setFiltroCurso(curso)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filtroCurso === curso
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {curso} ({participantes.filter(p => p.curso_interesse === curso).length})
              </button>
            ))}
          </div>
        )}

        {/* ÁREA DA ROLETA / DESTAQUE */}
        <div className="my-6 p-6 rounded-3xl bg-slate-900/90 border border-white/10 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden">
          {sorteando ? (
            <div className="space-y-3 animate-pulse">
              <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wider">
                #{destaqueAtual?.numero_participante || '...'}
              </span>
              <p className="text-lg font-bold text-white truncate max-w-sm">
                {destaqueAtual?.nome_completo || 'Girando...'}
              </p>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                {destaqueAtual?.curso_interesse}
              </span>
            </div>
          ) : ganhador ? (
            <div className="space-y-3 animate-scaleUp">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-widest">
                🎉 GANHADOR(A) SELECIONADO(A)!
              </div>
              <div className="text-5xl font-black text-amber-400">
                #{ganhador.numero_participante}
              </div>
              <h4 className="text-2xl font-black text-white tracking-tight">
                {ganhador.nome_completo}
              </h4>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 pt-1">
                <span className="font-semibold text-brand-400">Curso: {ganhador.curso_interesse}</span>
                <span>•</span>
                <span>Bairro: {ganhador.bairro || 'Não inf.'}</span>
                <span>•</span>
                <span>WhatsApp: {ganhador.whatsapp}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-slate-400">
              <Sparkles className="w-10 h-10 text-amber-400/50 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                {elegiveis.length} participantes elegíveis para o sorteio
              </p>
              <p className="text-xs text-slate-500">
                Clique no botão abaixo para iniciar a roleta automática
              </p>
            </div>
          )}
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {!ganhador ? (
            <button
              onClick={iniciarSorteio}
              disabled={sorteando || elegiveis.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-brand-500 to-amber-600 hover:from-amber-400 hover:to-brand-500 text-white font-black text-sm tracking-wide shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Trophy className="w-5 h-5 text-white" />
              <span>{sorteando ? 'Sorteando...' : '🎲 GIRAR ROLETA E SORTEAR'}</span>
            </button>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href={`https://wa.me/${String(ganhador.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(`Parabéns ${ganhador.nome_completo.split(' ')[0]}! Você foi sorteado(a) no Instituto Reis no curso de ${ganhador.curso_interesse}!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notificar Vencedor no WhatsApp</span>
              </a>

              <button
                onClick={iniciarSorteio}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Sortear Novamente</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
