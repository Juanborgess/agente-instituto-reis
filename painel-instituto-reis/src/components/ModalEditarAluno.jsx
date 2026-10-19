import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Edit3, Calendar, Phone, BookOpen, User, Check, AlertCircle, DollarSign, Bookmark, Trash2 } from 'lucide-react'
import { sincronizarComPlanilha, excluirAlunoNaPlanilha } from '../services/sheetsSync'
import { parseMoedaSegura } from '../utils/exportCsv'

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

export default function ModalEditarAluno({ aluno, isOpen, onClose, onAlunoAtualizado, onAlunoExcluido }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [curso, setCurso] = useState('Barbeiro')
  const [vencimento, setVencimento] = useState('')
  const [status, setStatus] = useState('PENDENTE')
  const [valorParcela, setValorParcela] = useState('')
  const [parcelaAtual, setParcelaAtual] = useState('')
  const [customCurso, setCustomCurso] = useState('')
  const [avisoAvanco, setAvisoAvanco] = useState('')
  const [loading, setLoading] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (aluno) {
      setNome(aluno.nome_aluno || '')
      setTelefone(formatarTelefoneVisual(aluno.telefone_whatsapp || ''))
      if (CURSOS_OFICIAIS.includes(aluno.curso)) {
        setCurso(aluno.curso)
        setCustomCurso('')
      } else if (aluno.curso) {
        setCurso('__OUTRO__')
        setCustomCurso(aluno.curso)
      } else {
        setCurso('Barbeiro')
        setCustomCurso('')
      }
      setVencimento(aluno.vencimento_atual || '')
      setStatus(aluno.status_pagamento || 'PENDENTE')
      setValorParcela(aluno.valor_parcela ? String(aluno.valor_parcela) : '')
      setParcelaAtual(aluno.parcela_atual || '')
      setAvisoAvanco('')
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
    const cursoFinal = curso === '__OUTRO__' ? (customCurso.trim() || 'Curso Especial') : curso

    const dadosAtualizados = {
      nome_aluno: nome.trim(),
      telefone_whatsapp: telFormatado,
      curso: cursoFinal,
      vencimento_atual: vencimento || null,
      status_pagamento: status,
      valor_parcela: parseMoedaSegura(valorParcela),
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

  // Avança o vencimento para o próximo mês (+30 dias) e incrementa a parcela
  const handleAvancarParcela = () => {
    let novaData = ''
    if (vencimento) {
      const [ano, mes, dia] = vencimento.split('-').map(Number)
      const d = new Date(ano, mes, dia) // soma 1 mês
      const a = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const diaStr = String(dia).padStart(2, '0')
      novaData = `${a}-${m}-${diaStr}`
    } else {
      const hoje = new Date()
      hoje.setMonth(hoje.getMonth() + 1)
      novaData = hoje.toISOString().split('T')[0]
    }
    setVencimento(novaData)

    let novaParcela = parcelaAtual
    const matchBarra = String(parcelaAtual).match(/^(\d+)\/(\d+)$/)
    if (matchBarra) {
      const atual = parseInt(matchBarra[1], 10)
      const total = parseInt(matchBarra[2], 10)
      novaParcela = `${atual + 1}/${total}`
    } else {
      const num = parseInt(parcelaAtual, 10)
      if (!isNaN(num)) {
        novaParcela = String(num + 1)
      } else {
        novaParcela = '2/6'
      }
    }
    setParcelaAtual(novaParcela)
    setStatus('PENDENTE')

    try {
      const [a, m, d] = novaData.split('-')
      setAvisoAvanco(`✓ Vencimento avançado para ${d}/${m}/${a} e parcela ${novaParcela} (Status: PENDENTE). Clique em "Salvar Alterações" para confirmar!`)
    } catch {
      setAvisoAvanco('✓ Próxima parcela calculada!')
    }
  }

  const handleExcluir = async () => {
    const confirmou = window.confirm(
      `Deseja realmente excluir o aluno "${aluno.nome_aluno}"?\n\nEsta ação removerá o aluno tanto do painel quanto da planilha Google Sheets permanentemente.`
    )
    if (!confirmou) return

    setExcluindo(true)
    setErro('')

    try {
      // 1. Remove do Supabase
      const { error } = await supabase
        .from('alunos_cobranca')
        .delete()
        .eq('id', aluno.id)

      if (error) {
        setErro(error.message)
        setExcluindo(false)
        return
      }

      // 2. Remove da planilha Google Sheets em segundo plano
      excluirAlunoNaPlanilha(aluno.telefone_whatsapp, aluno.curso, aluno.nome_aluno)

      if (onAlunoExcluido) {
        onAlunoExcluido(aluno.id)
      }
      onClose()
    } catch (err) {
      setErro('Erro ao excluir o aluno.')
    } finally {
      setExcluindo(false)
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
                  <option value="__OUTRO__" className="bg-slate-900 text-amber-300 font-bold">
                    + Outro Curso (Digitar Novo)...
                  </option>
                </select>
              </div>

              {curso === '__OUTRO__' && (
                <div className="mt-2 animate-fadeIn">
                  <input
                    type="text"
                    required
                    value={customCurso}
                    onChange={(e) => setCustomCurso(e.target.value)}
                    placeholder="Digite o nome do novo curso..."
                    className="w-full px-3.5 py-2 bg-slate-900/90 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              )}
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
            <p className="text-[11px] text-slate-400 mt-1 mb-2.5">
              O robô da VPS lê essa data para disparar no D-5, D-1 e no dia do vencimento.
            </p>

            {/* Botão de Avançar Próxima Parcela */}
            <button
              type="button"
              onClick={handleAvancarParcela}
              className="w-full py-2 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              title="Avança 1 mês no vencimento e incrementa a parcela atual (ex: 1/6 para 2/6)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 Renovar Mensalidade: Criar Próxima Parcela (+1 Mês)</span>
            </button>

            {avisoAvanco && (
              <p className="text-[11px] text-emerald-400 font-semibold mt-2 animate-fadeIn bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                {avisoAvanco}
              </p>
            )}
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
          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/10">
            {/* Botão de Excluir Aluno */}
            <button
              type="button"
              onClick={handleExcluir}
              disabled={loading || excluindo}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              title="Excluir Aluno do Painel e da Planilha"
            >
              {excluindo ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Excluir Aluno</span>
            </button>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || excluindo}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading || excluindo}
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
          </div>
        </form>
      </div>
    </div>
  )
}
