import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Edit3, Calendar, Phone, BookOpen, User, Check, AlertCircle, DollarSign, Bookmark } from 'lucide-react'
import { sincronizarComPlanilha } from '../services/sheetsSync'

export const CURSOS_OFICIAIS = [
  'Barbeiro',
  'Barbeiro Avançado',
  'Lashes',
  'Sobrancelha',
  'Trança',
  'trança avançado',
  'Brow Lamination'
]

export const STATUS_OFICIAIS = [
  'PENDENTE',
  'PAGO',
  'CONCLUÍDO',
  'DESISTIU'
]

export default function ModalEditarAluno({ aluno, isOpen, onClose, onAlunoAtualizado }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [curso, setCurso] = useState('Barbeiro')
  const [vencimento, setVencimento] = useState('')
  const [status, setStatus] = useState('PENDENTE')
  const [valorParcela, setValorParcela] = useState('')
  const [parcelaAtual, setParcelaAtual] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (aluno) {
      setNome(aluno.nome_aluno || '')
      setTelefone(formatarTelefoneVisual(aluno.telefone_whatsapp || ''))
      setCurso(aluno.curso || 'Barbeiro')
      setVencimento(aluno.vencimento_atual || '')
      setStatus(aluno.status_pagamento || 'PENDENTE')
      setValorParcela(aluno.valor_parcela ? String(aluno.valor_parcela) : '')
      setParcelaAtual(aluno.parcela_atual || '')
      setErro('')
    }
  }, [aluno])

  if (!isOpen || !aluno) return null

  function formatarTelefoneVisual(tel) {
    let v = String(tel).replace(/\D/g, '')
    if (v.startsWith('55') && v.length >= 12) v = v.slice(2)
    if (v.length > 11) v = v.slice(0, 11)
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`
    if (v.length > 0) return `(${v}`
    return ''
  }

  const handleTelefoneChange = (e) => {
    setNomeTelefone(e.target.value)
  }

  const setNomeTelefone = (val) => {
    let v = val.replace(/\D/g, '')
    if (v.length > 11) v = v.slice(0, 11)
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`
    } else if (v.length > 0) {
      v = `(${v}`
    }
    setTelefone(v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const numLimpo = telefone.replace(/\D/g, '')
    if (numLimpo.length < 10) {
      setErro('Informe um número de WhatsApp com DDD válido.')
      setLoading(false)
      return
    }

    const telFormatado = numLimpo.startsWith('55') ? numLimpo : '55' + numLimpo

    const dadosAtualizados = {
      nome_aluno: nome.trim(),
      telefone_whatsapp: telFormatado,
      curso: curso,
      vencimento_atual: vencimento || null,
      status_pagamento: status,
      valor_parcela: valorParcela ? parseFloat(valorParcela.replace(',', '.')) || 0 : 0,
      parcela_atual: parcelaAtual.trim(),
      updated_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('alunos_cobranca')
        .update(dadosAtualizados)
        .eq('id', aluno.id)
        .select()

      if (error) {
        setErro(error.message)
      } else if (data && data.length > 0) {
        const alunoAtualizado = data[0]

        // Sincroniza a alteração em segundo plano com a planilha Google Sheets
        sincronizarComPlanilha({
          action: 'editar_aluno',
          antigo_telefone: aluno.telefone_whatsapp,
          antigo_curso: aluno.curso,
          nome_aluno: alunoAtualizado.nome_aluno,
          telefone_whatsapp: alunoAtualizado.telefone_whatsapp,
          curso: alunoAtualizado.curso,
          vencimento_atual: alunoAtualizado.vencimento_atual,
          status_pagamento: alunoAtualizado.status_pagamento,
          valor_parcela: alunoAtualizado.valor_parcela,
          parcela_atual: alunoAtualizado.parcela_atual
        })

        if (onAlunoAtualizado) onAlunoAtualizado(alunoAtualizado)
        onClose()
      }
    } catch (err) {
      setErro('Falha de conexão ao salvar alterações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-glow">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Editar Dados do Aluno</h3>
            <p className="text-xs text-slate-400">Atualize vencimento, status ou dados cadastrais</p>
          </div>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nome Completo do Aluno
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              WhatsApp (com DDD)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={telefone}
                onChange={handleTelefoneChange}
                placeholder="(21) 98765-4321"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Curso e Status em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Curso (Oficial)
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all cursor-pointer"
                >
                  {CURSOS_OFICIAIS.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Status de Pagamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all cursor-pointer ${
                  status === 'PAGO' || status === 'CONCLUÍDO'
                    ? 'text-emerald-400'
                    : status === 'DESISTIU'
                    ? 'text-purple-400'
                    : 'text-red-400'
                }`}
              >
                {STATUS_OFICIAIS.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white font-medium">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data de Vencimento (CRUCIAL PARA O ROBÔ) */}
          <div className="p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/20">
            <label className="block text-xs font-bold text-brand-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Data de Vencimento Atual (Disparo do Robô)</span>
            </label>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              O robô da VPS lê essa data para disparar no D-5, D-1 e no dia do vencimento.
            </p>
          </div>

          {/* Valor da Parcela e Parcela Atual (Opcionais) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Valor (R$)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={valorParcela}
                  onChange={(e) => setValorParcela(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Parcela Atual
              </label>
              <div className="relative">
                <Bookmark className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={parcelaAtual}
                  onChange={(e) => setParcelaAtual(e.target.value)}
                  placeholder="Ex: 2/6"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
