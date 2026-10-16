import React from 'react'
import { BadgeDollarSign, Users, LogOut, Sparkles } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, onLogout, userEmail, countCobranca, countCRM }) {
  return (
    <>
      {/* HEADER DESKTOP / TABLET */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md ring-2 ring-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img 
                src="/logo-instituto.png" 
                alt="Instituto Reis" 
                className="w-full h-full object-contain rounded-full" 
              />
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                <span>Instituto Reis</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
                  Painel Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cobrança & Gestão de Leads
              </p>
            </div>
          </div>

          {/* Abas de Navegação (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('cobranca')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'cobranca'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BadgeDollarSign className="w-4 h-4" />
              <span>Cobrança Preventiva</span>
              {countCobranca > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'cobranca' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {countCobranca}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'crm'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>CRM de Vendas</span>
              {countCRM > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'crm' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {countCRM}
                </span>
              )}
            </button>
          </nav>

          {/* Usuário e Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">Equipe Recepção</span>
              <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {userEmail}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Encerrar Sessão"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 flex items-center gap-2 text-xs font-medium transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* BOTTOM NAVIGATION (MOBILE APENAS) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 pb-safe">
        <div className="grid grid-cols-2 h-16">
          <button
            onClick={() => setActiveTab('cobranca')}
            className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
              activeTab === 'cobranca' ? 'text-brand-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {activeTab === 'cobranca' && (
              <span className="absolute top-0 w-12 h-1 bg-gradient-to-r from-brand-500 to-brand-400 rounded-b-full"></span>
            )}
            <BadgeDollarSign className="w-5 h-5" />
            <span className="text-[11px]">Cobrança</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
              activeTab === 'crm' ? 'text-brand-400 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            {activeTab === 'crm' && (
              <span className="absolute top-0 w-12 h-1 bg-gradient-to-r from-brand-500 to-brand-400 rounded-b-full"></span>
            )}
            <Users className="w-5 h-5" />
            <span className="text-[11px]">CRM Vendas</span>
          </button>
        </div>
      </div>
    </>
  )
}
