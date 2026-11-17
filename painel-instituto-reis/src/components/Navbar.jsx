import React, { useState, useEffect } from 'react'
import { BadgeDollarSign, Users, LogOut, Sparkles, Trophy, Download, Smartphone } from 'lucide-react'
import ModalInstalarApp from './ModalInstalarApp'

export default function Navbar({ activeTab, setActiveTab, onLogout, userEmail, countCobranca, countCRM, countSorteio }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isModalInstalarOpen, setIsModalInstalarOpen] = useState(false)

  // Escuta o evento nativo de instalação do PWA no Chrome / Edge / Android
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallNative = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('[PWA] Usuário instalou o aplicativo!')
      }
      setDeferredPrompt(null)
      setIsModalInstalarOpen(false)
    }
  }

  return (
    <>
      {/* HEADER DESKTOP / TABLET / MOBILE */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl pt-safe px-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo e Nome */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white p-0.5 shadow-md ring-2 ring-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img 
                src="/logo-instituto.png" 
                alt="Instituto Reis" 
                className="w-full h-full object-contain rounded-full" 
              />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-white text-sm lg:text-base tracking-tight flex items-center gap-2 whitespace-nowrap">
                <span>Instituto Reis</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full whitespace-nowrap shrink-0">
                  Painel Oficial
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block whitespace-nowrap leading-tight">
                Cobrança, CRM & Sorteio QR Code
              </p>
            </div>
          </div>

          {/* Abas de Navegação (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-white/5 shrink-0">
            <button
              onClick={() => setActiveTab('cobranca')}
              className={`flex items-center gap-2 px-2.5 lg:px-3.5 py-2 rounded-xl text-xs lg:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'cobranca'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BadgeDollarSign className="w-4 h-4 shrink-0" />
              <span>Cobrança Preventiva</span>
              {countCobranca > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'cobranca' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {countCobranca}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-2 px-2.5 lg:px-3.5 py-2 rounded-xl text-xs lg:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'crm'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>CRM de Vendas</span>
              {countCRM > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'crm' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {countCRM}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sorteio')}
              className={`flex items-center gap-2 px-2.5 lg:px-3.5 py-2 rounded-xl text-xs lg:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'sorteio'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Sorteio QR Code</span>
              {countSorteio > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'sorteio' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {countSorteio}
                </span>
              )}
            </button>
          </nav>

          {/* Usuário, Instalação PWA e Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botão Instalar Aplicativo (Desktop & Tablets) */}
            <button
              onClick={() => setIsModalInstalarOpen(true)}
              title="Instalar Aplicativo Oficial no seu Computador ou Celular"
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer border border-emerald-300/40 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <span>Instalar <span className="hidden lg:inline">Aplicativo</span></span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0"></span>
            </button>

            <div className="hidden xl:flex flex-col text-right whitespace-nowrap">
              <span className="text-xs font-semibold text-white">Equipe Recepção</span>
              <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {userEmail}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Encerrar Sessão"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* BOTTOM NAVIGATION (MOBILE APENAS - 4 COLUNAS: COBRANÇA, CRM, SORTEIO E INSTALAR) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 pb-safe px-safe">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => setActiveTab('cobranca')}
            className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
              activeTab === 'cobranca' ? 'text-brand-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {activeTab === 'cobranca' && (
              <span className="absolute top-0 w-10 h-1 bg-gradient-to-r from-brand-500 to-brand-400 rounded-b-full"></span>
            )}
            <BadgeDollarSign className="w-5 h-5" />
            <span className="text-[10px]">Cobrança</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
              activeTab === 'crm' ? 'text-brand-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {activeTab === 'crm' && (
              <span className="absolute top-0 w-10 h-1 bg-gradient-to-r from-brand-500 to-brand-400 rounded-b-full"></span>
            )}
            <Users className="w-5 h-5" />
            <span className="text-[10px]">CRM</span>
          </button>

          <button
            onClick={() => setActiveTab('sorteio')}
            className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
              activeTab === 'sorteio' ? 'text-amber-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {activeTab === 'sorteio' && (
              <span className="absolute top-0 w-10 h-1 bg-gradient-to-r from-amber-500 to-amber-400 rounded-b-full"></span>
            )}
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">Sorteio</span>
          </button>

          {/* 4ª Aba: Instalar Aplicativo no Celular */}
          <button
            onClick={() => setIsModalInstalarOpen(true)}
            className="flex flex-col items-center justify-center gap-1 relative text-emerald-400 font-bold transition-all duration-200 cursor-pointer active:scale-95"
          >
            <div className="relative">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold">Instalar</span>
          </button>
        </div>
      </div>

      {/* MODAL PASSO A PASSO DE INSTALAÇÃO DO APP (ANDROID / IOS / PC) */}
      <ModalInstalarApp
        isOpen={isModalInstalarOpen}
        onClose={() => setIsModalInstalarOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallNative={handleInstallNative}
      />
    </>
  )
}


