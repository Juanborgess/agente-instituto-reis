import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, UserPlus, Phone, BookOpen, User, Check, AlertCircle } from 'lucide-react'

const CURSOS_DISPONIVEIS = [
  'Barbeiro',
  'Barbeiro Avançado',
  'Trança',
  'Design de Sobrancelhas',
  'Lashes / Extensão de Cílios',
  'Cabeleireiro',
  'Manicure & Pedicure',
  'Estética Facial',
  'Outro Curso'
]

export default function ModalNovoLead({ isOpen, onClose, onLeadCriado }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [curso, setCurso] = useState('Barbeiro')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  if (!isOpen) return null

  // Máscara dinâmica de telefone brasileiro (DDD + 9 dígitos)
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
      setErro('Informe um número de telefone com DDD válido (ex: 21 99999-9999).')
      setLoading(false)
      return
    }

    const telFormatado = numLimpo.startsWith('55') ? numLimpo : '55' + numLimpo
    const dataHojeIso = new Date().toISOString().split('T')[0]

    try {
      const { data, error } = await supabase
        .table('leads_crm')
        .insert([{
          nome_lead: nome.trim(),
          telefone: telFormatado,
          curso_interesse: curso,
          status_funil: 'Novo',
          fase_cadencia: '',
          data_entrada: dataHojeIso,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        setErro(error.message)
      } else if (data && data.length > 0) {
        setNome('')
        setTelefone('')
        setCurso('Barbeiro')
        if (onLeadCriado) onLeadCriado(data[0])
        onClose()
      }
    } catch (err) {
      setErro('Falha de conexão ao cadastrar o lead.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
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
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Novo Lead de Vendas</h3>
            <p className="text-xs text-slate-400">Cadastre uma nova pessoa interessada nos cursos</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nome do Lead
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Curso de Interesse
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all cursor-pointer"
              >
                {CURSOS_DISPONIVEIS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
