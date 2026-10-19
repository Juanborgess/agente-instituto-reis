import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Edit3, Calendar, Phone, BookOpen, User, Check, AlertCircle, Trash2, Filter } from 'lucide-react'
import { editarLeadNaPlanilha, excluirLeadNaPlanilha } from '../services/sheetsSync'

export const CURSOS_OFICIAIS = [
  'Barbeiro',
  'Barbeiro Avançado',
  'Lashes',
  'Sobrancelha',
  'Trança',
  'trança avançado',
  'Brow Lamination'
]

export const STATUS_FUNIL_OFICIAIS = [
  'Novo',
  'Em Cadência',
  'Atendimento Humano',
  'Ganhou',
  'Perdeu'
]

export default function ModalEditarLead({ lead, isOpen, onClose, onLeadAtualizado, onLeadExcluido }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [curso, setCurso] = useState('Barbeiro')
  const [status, setStatus] = useState('Novo')
  const [dataEntrada, setDataEntrada] = useState('')
  const [loading, setLoading] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (lead) {
      setNome(lead.nome_lead || '')
      setTelefone(formatarTelefoneVisual(lead.telefone || ''))
      setCurso(lead.curso_interesse || 'Barbeiro')
      setStatus(lead.status_funil || 'Novo')
      setDataEntrada(lead.data_entrada || '')
      setErro('')
    }
  }, [lead])

  if (!isOpen || !lead) return null

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
    let v = e.target.value.replace(/\D/g, '')
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
      nome_lead: nome.trim(),
      telefone: telFormatado,
      curso_interesse: curso,
      status_funil: status,
      data_entrada: dataEntrada || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('leads_crm')
        .update(dadosAtualizados)
        .eq('id', lead.id)
        .select()

      if (error) {
        setErro(error.message)
      } else if (data && data.length > 0) {
        const leadAtualizado = data[0]

        // Sincroniza em segundo plano com a aba CRM_Vendas da planilha
        editarLeadNaPlanilha({
          nome_lead: leadAtualizado.nome_lead,
          telefone: leadAtualizado.telefone,
          curso_interesse: leadAtualizado.curso_interesse,
          status_funil: leadAtualizado.status_funil,
          data_entrada: leadAtualizado.data_entrada,
          antigo_telefone: lead.telefone,
          antigo_curso: lead.curso_interesse
        })

        if (onLeadAtualizado) onLeadAtualizado(leadAtualizado)
        onClose()
      }
    } catch (err) {
      setErro('Falha de conexão ao salvar alterações do lead.')
    } finally {
      setLoading(false)
    }
  }

  const handleExcluir = async () => {
    const confirmou = window.confirm(
      `Deseja realmente excluir o lead "${lead.nome_lead}"?\n\nEsta ação removerá o lead tanto do painel quanto da aba CRM_Vendas da planilha permanentemente.`
    )
    if (!confirmou) return

    setExcluindo(true)
    setErro('')

    try {
      // 1. Remove do Supabase
      const { error } = await supabase
        .from('leads_crm')
        .delete()
        .eq('id', lead.id)

      if (error) {
        setErro(error.message)
        setExcluindo(false)
        return
      }

      // 2. Remove da planilha Google Sheets em segundo plano
      excluirLeadNaPlanilha(lead.telefone, lead.curso_interesse)

      if (onLeadExcluido) {
        onLeadExcluido(lead.id)
      }
      onClose()
    } catch (err) {
      setErro('Erro ao excluir o lead.')
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
            <h3 className="text-xl font-bold text-white tracking-tight">Editar Lead do CRM</h3>
            <p className="text-xs text-slate-400">Atualize dados cadastrais, curso ou fase do funil</p>
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
              Nome Completo do Lead
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
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
                placeholder="(21) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Grid: Curso e Status do Funil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Curso de Interesse */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Curso de Interesse
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                >
                  {CURSOS_OFICIAIS.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status do Funil */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Status no Funil
              </label>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                >
                  {STATUS_FUNIL_OFICIAIS.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white font-medium">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data de Entrada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Data de Entrada do Lead</span>
            </label>
            <input
              type="date"
              value={dataEntrada}
              onChange={(e) => setDataEntrada(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/10">
            {/* Botão de Excluir Lead */}
            <button
              type="button"
              onClick={handleExcluir}
              disabled={loading || excluindo}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              title="Excluir Lead do Painel e da Planilha"
            >
              {excluindo ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Excluir Lead</span>
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
