import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginView from './views/LoginView'
import Navbar from './components/Navbar'
import CobrancaView from './views/CobrancaView'
import CRMView from './views/CRMView'
import SorteioView from './views/SorteioView'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cobranca')

  // Monitora a sessão de autenticação em tempo real
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl ring-4 ring-white/10 mb-4 animate-pulse overflow-hidden flex items-center justify-center">
          <img src="/logo-instituto.png" alt="Instituto Reis" className="w-full h-full object-contain rounded-full" />
        </div>
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Se o usuário não estiver logado, exibe a tela de login
  if (!session) {
    return <LoginView onLoginSuccess={(user) => setSession({ user })} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0b101b] to-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navegação Superior & Mobile */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userEmail={session.user?.email || 'Recepção'}
      />

      {/* Conteúdo Principal da Aba Selecionada */}
      <main className="flex-1 w-full animate-fadeIn">
        {activeTab === 'cobranca' ? (
          <CobrancaView />
        ) : activeTab === 'crm' ? (
          <CRMView />
        ) : (
          <SorteioView />
        )}
      </main>
    </div>
  )
}
