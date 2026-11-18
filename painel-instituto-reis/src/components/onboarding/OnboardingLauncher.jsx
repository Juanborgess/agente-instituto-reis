import React, { useState } from 'react'
import { GraduationCap, Play, BookOpen, Compass, X, Sparkles } from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'

const NOMES_ABAS = {
  cobranca: 'Cobrança Preventiva',
  crm: 'CRM de Vendas',
  sorteio: 'Sorteio QR Code'
}

export default function OnboardingLauncher({ activeTab, setActiveTab }) {
  const { isTourActive, hasSeenWelcome, dismissWelcome, startTour } = useOnboarding()
  const [menuAberto, setMenuAberto] = useState(false)

  // Esconde o botão flutuante enquanto o tour já está rodando
  if (isTourActive) return null

  const nomeTelaAtual = NOMES_ABAS[activeTab]

  return (
    <div className="fixed bottom-20 right-3.5 md:bottom-6 md:right-6 z-[70] flex flex-col items-end gap-2.5">
      {/* Convite discreto no primeiro acesso */}
      {!hasSeenWelcome && !menuAberto && (
        <div className="w-64 sm:w-72 glass-panel bg-slate-900/95 border border-amber-500/35 rounded-2xl p-3.5 shadow-2xl animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Bem-vindo ao Painel!</span>
            </div>
            <button
              type="button"
              onClick={dismissWelcome}
              className="p-0.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
            Quer aprender a mexer em cada botão passo a passo em modo treino seguro?
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => startTour('completo')}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <Play className="w-3 h-3" />
              <span>Iniciar Onboarding</span>
            </button>
            <button
              type="button"
              onClick={dismissWelcome}
              className="py-1.5 px-2.5 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-semibold cursor-pointer hover:text-white"
            >
              Depois
            </button>
          </div>
        </div>
      )}

      {/* Menu Rápido ao clicar no botão do canto */}
      {menuAberto && (
        <div className="w-68 sm:w-72 glass-panel bg-slate-900/95 border border-white/15 rounded-2xl p-2 shadow-2xl animate-fadeIn space-y-1">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-white">Central de Aprendizado</p>
              <p className="text-[10px] text-slate-400">Treino seguro sem alterar dados reais</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuAberto(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMenuAberto(false)
              startTour('completo')
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                Tour Completo do Painel
              </p>
              <p className="text-[10px] text-slate-400">
                Passa por Cobrança, CRM e Sorteio
              </p>
            </div>
          </button>

          {nomeTelaAtual && (
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false)
                startTour(activeTab)
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Tour desta Tela
                </p>
                <p className="text-[10px] text-slate-400">
                  Aprender só {nomeTelaAtual}
                </p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMenuAberto(false)
              dismissWelcome()
              setActiveTab('onboarding')
            }}
            className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                Abrir Guia, Rotina & Mensagens
              </p>
              <p className="text-[10px] text-slate-400">
                Checklist do dia, robô WhatsApp e FAQ
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Botão Flutuante no Canto */}
      <button
        type="button"
        onClick={() => {
          dismissWelcome()
          setMenuAberto((prev) => !prev)
        }}
        data-tour="onboarding-launcher"
        className="group px-3.5 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white border border-amber-500/40 shadow-xl shadow-black/50 flex items-center gap-2 transition-all cursor-pointer active:scale-95 backdrop-blur-xl"
        title="Iniciar Onboarding / Aprender a mexer no sistema"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shrink-0">
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-extrabold tracking-tight">
          <span className="hidden sm:inline">Aprender a Mexer</span>
          <span className="sm:hidden">Guia</span>
        </span>
      </button>
    </div>
  )
}
