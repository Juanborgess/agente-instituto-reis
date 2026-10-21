import React, { useState, useEffect } from 'react'
import { 
  X, 
  Smartphone, 
  Laptop, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react'

export default function ModalInstalarApp({ isOpen, onClose, deferredPrompt, onInstallNative }) {
  const [tab, setTab] = useState('android')
  const [copiado, setCopiado] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // Detecta o sistema operacional do usuário para abrir na aba correta
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || ''
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
      const isAndroid = /android/i.test(ua)

      if (isIOS) {
        setTab('ios')
      } else if (isAndroid) {
        setTab('android')
      } else {
        setTab('desktop')
      }

      // Verifica se já está rodando em modo standalone (já instalado)
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
      setIsStandalone(isPWA)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(window.location.origin)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div 
        className="relative w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overscroll-contain cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-brand-600/20 via-transparent to-brand-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                <img src="/icons/icon-192x192.png" alt="Instituto Reis" className="w-9 h-9 object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Instalar Aplicativo</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> PWA Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acesse o painel direto da sua tela inicial ou área de trabalho
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* CASO JÁ ESTEJA INSTALADO */}
          {isStandalone && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Você já está usando o aplicativo instalado!</p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Este painel está rodando no modo aplicativo direto do seu dispositivo, com desempenho total e sem barras de navegação.
                </p>
              </div>
            </div>
          )}

          {/* BOTÃO NATIVO 1-CLIQUE (SE DISPONÍVEL NO CHROME/EDGE/ANDROID) */}
          {deferredPrompt && !isStandalone && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600/30 via-brand-500/20 to-brand-600/30 border border-brand-500/40 shadow-lg shadow-brand-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-sm font-extrabold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Download className="w-4 h-4 text-brand-400 animate-bounce" /> Instalação Rápida Detectada!
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seu navegador suporta instalação direta em 1 clique.
                </p>
              </div>
              <button
                onClick={onInstallNative}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Instalar Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SELETOR DE ABAS */}
          <div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-white/5">
              <button
                onClick={() => setTab('android')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'android'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setTab('ios')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'ios'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-200" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setTab('desktop')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'desktop'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Computador</span>
              </button>
            </div>
          </div>

          {/* CONTEÚDO DA ABA: ANDROID */}
          {tab === 'android' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Abra no Google Chrome</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Certifique-se de estar usando o <strong>Google Chrome</strong> no seu celular ou tablet Android.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Toque no Menu de Opções <MoreVertical className="w-3.5 h-3.5 text-brand-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Toque nos <strong>três pontinhos verticais</strong> no canto superior direito da tela do Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Toque em "Instalar aplicativo"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Procure e toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">Pronto! Ícone criado</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Confirme em <strong>"Instalar"</strong>. O aplicativo do Instituto Reis ficará disponível na tela principal e na lista de apps!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA: IPHONE / IPAD (IOS) */}
          {tab === 'ios' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Abra no navegador Safari</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No iPhone e iPad, a Apple só permite instalar aplicativos PWA através do navegador <strong>Safari oficial</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Toque no botão Compartilhar <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Toque no ícone de <strong>Compartilhar</strong> (quadradinho azul com uma seta apontando para cima) no rodapé do Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Selecione "Adicionar à Tela de Início" <PlusSquare className="w-3.5 h-3.5 text-slate-300 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Role a lista de opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">Toque em "Adicionar"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No canto superior direito, toque em <strong>"Adicionar"</strong>. O ícone do Instituto Reis aparecerá direto na tela do seu iPhone!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA: COMPUTADOR (DESKTOP) */}
          {tab === 'desktop' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Abra no Google Chrome ou Microsoft Edge</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Os navegadores Chrome e Edge possuem suporte nativo à instalação de aplicativos web no Windows e Mac.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Localize o Ícone na Barra de Endereços</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No final da barra onde você digita o endereço (ao lado da estrelinha de favoritos), clique no ícone de <strong>Instalar Aplicativo (💻 ou ⊕)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Ou use o Menu ⋮ do Navegador</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clique no menu de 3 pontinhos do Chrome/Edge &gt; <strong>Salvar e Compartilhar</strong> &gt; <strong>"Instalar Instituto Reis"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">Janela Própria e Atalho na Área de Trabalho</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      O painel abrirá como um programa nativo do Windows/Mac, com janela própria sem poluição de abas do navegador!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VANTAGENS DO APLICATIVO */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-3 gap-2 text-center">
            <div className="p-2">
              <span className="text-sm font-bold text-white block">🚀 Mais Rápido</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Abertura instantânea</span>
            </div>
            <div className="p-2 border-x border-white/5">
              <span className="text-sm font-bold text-white block">📱 Tela Cheia</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Sem barras do browser</span>
            </div>
            <div className="p-2">
              <span className="text-sm font-bold text-white block">🔄 Tempo Real</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Sempre atualizado</span>
            </div>
          </div>

          {/* COPIAR LINK PARA OUTRO NAVEGADOR */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-white/5 gap-3">
            <div className="truncate">
              <span className="text-[11px] text-slate-400 block truncate">Link do Painel:</span>
              <span className="text-xs font-mono text-slate-300 truncate block">{window.location.origin}</span>
            </div>
            <button
              onClick={handleCopiarLink}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {copiado ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* RODAPÉ */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Entendi / Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
