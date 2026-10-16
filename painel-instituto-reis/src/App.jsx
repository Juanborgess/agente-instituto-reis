import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginView from './views/LoginView'
import Navbar from './components/Navbar'
import CobrancaView from './views/CobrancaView'
import CRMView from './views/CRMView'

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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-glow mb-4 animate-pulse">
          <span className="text-white font-black text-lg tracking-wider">IR</span>
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
        ) : (
          <CRMView />
        )}
      </main>
    </div>
  )
}
