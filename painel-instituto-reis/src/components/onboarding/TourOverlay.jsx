import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'

function findVisibleTarget(selector) {
  if (!selector || typeof document === 'undefined') return null
  const nodes = document.querySelectorAll(selector)
  for (const el of nodes) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return el
    }
  }
  return null
}

function isFixedOrSticky(el) {
  let curr = el
  while (curr && curr !== document.body) {
    const pos = window.getComputedStyle(curr).position
    if (pos === 'fixed' || pos === 'sticky') return true
    curr = curr.parentElement
  }
  return false
}

export default function TourOverlay() {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    activeSteps,
    simulatedToast,
    nextStep,
    prevStep,
    endTour
  } = useOnboarding()

  const [targetRect, setTargetRect] = useState(null)
  const [popoverStyle, setPopoverStyle] = useState({ opacity: 0 })
  const popoverRef = useRef(null)

  const atualizarPosicao = useCallback(
    (autoScroll = false) => {
      if (!isTourActive || !currentStep) return

      const el = findVisibleTarget(currentStep.target)
      if (!el) {
        setTargetRect(null)
        return
      }

      if (autoScroll && !isFixedOrSticky(el)) {
        const r = el.getBoundingClientRect()
        const foraDaTela = r.top < 84 || r.bottom > window.innerHeight - 96
        if (foraDaTela) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }
      }

      const rect = el.getBoundingClientRect()
      const padding = 6
      setTargetRect({
        top: Math.max(4, rect.top - padding),
        left: Math.max(4, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        rawTop: rect.top,
        rawBottom: rect.bottom,
        rawLeft: rect.left,
        rawWidth: rect.width
      })
    },
    [isTourActive, currentStep]
  )

  // Localiza e acompanha o elemento alvo após trocas de aba/modal
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null)
      return
    }

    atualizarPosicao(true)

    const timers = [
      setTimeout(() => atualizarPosicao(true), 80),
      setTimeout(() => atualizarPosicao(true), 220),
      setTimeout(() => atualizarPosicao(false), 450)
    ]

    const onUpdate = () => atualizarPosicao(false)
    window.addEventListener('resize', onUpdate)
    window.addEventListener('scroll', onUpdate, true)

    const observer = new MutationObserver(() => atualizarPosicao(false))
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', onUpdate)
      window.removeEventListener('scroll', onUpdate, true)
      observer.disconnect()
    }
  }, [isTourActive, currentStep, atualizarPosicao])

  // Calcula posição inteligente do balão para nunca vazar da tela (desktop ou mobile)
  useEffect(() => {
    if (!isTourActive) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const margem = 12
    const popWidth = Math.min(380, vw - margem * 2)
    const popHeight = popoverRef.current?.offsetHeight || 270

    if (!targetRect) {
      setPopoverStyle({
        width: `${popWidth}px`,
        top: `${Math.max(margem, (vh - popHeight) / 2)}px`,
        left: `${Math.max(margem, (vw - popWidth) / 2)}px`,
        opacity: 1
      })
      return
    }

    const espacoAbaixo = vh - (targetRect.top + targetRect.height) - 16
    const espacoAcima = targetRect.top - 16

    let top
    if (currentStep?.placement === 'top') {
      top =
        espacoAcima >= popHeight
          ? targetRect.top - popHeight - 14
          : espacoAbaixo >= popHeight
          ? targetRect.top + targetRect.height + 14
          : Math.max(margem, vh - popHeight - 20)
    } else {
      top =
        espacoAbaixo >= popHeight
          ? targetRect.top + targetRect.height + 14
          : espacoAcima >= popHeight
          ? targetRect.top - popHeight - 14
          : Math.max(margem, vh - popHeight - 20)
    }

    top = Math.min(Math.max(margem, top), Math.max(margem, vh - popHeight - margem))

    const centroAlvo = targetRect.left + targetRect.width / 2
    let left = centroAlvo - popWidth / 2
    left = Math.min(Math.max(margem, left), vw - popWidth - margem)

    setPopoverStyle({
      width: `${popWidth}px`,
      top: `${top}px`,
      left: `${left}px`,
      opacity: 1
    })
  }, [isTourActive, targetRect, currentStep, currentStepIndex])

  // Atalhos de teclado (ESC, Setas)
  useEffect(() => {
    if (!isTourActive) return
    const handleKey = (e) => {
      if (e.key === 'Escape') endTour()
      if (e.key === 'ArrowRight') nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isTourActive, endTour, nextStep, prevStep])

  if (!isTourActive || !currentStep) return null

  const total = activeSteps.length
  const progresso = Math.round(((currentStepIndex + 1) / total) * 100)
  const isUltimo = currentStepIndex === total - 1

  return (
    <>
      {/* Toast de Simulação Segura (quando o usuário testa cliques durante o tour) */}
      {simulatedToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-md z-[110] glass-panel border border-emerald-500/40 bg-emerald-950/95 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{simulatedToast}</span>
        </div>
      )}

      {/* Máscara Escura com Recorte Spotlight (não bloqueia o botão destacado) */}
      <svg
        className="fixed inset-0 w-full h-full z-[90] pointer-events-none transition-all duration-300"
        aria-hidden="true"
      >
        <defs>
          <mask id="ir-tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.78)"
          mask="url(#ir-tour-spotlight-mask)"
        />
      </svg>

      {/* Anel luminoso ao redor do elemento destacado */}
      {targetRect && (
        <div
          className="fixed z-[91] pointer-events-none rounded-2xl border-2 border-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.22),0_0_28px_rgba(245,158,11,0.45)] transition-all duration-300"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`
          }}
        />
      )}

      {/* Balão Explicativo (Popover) */}
      <div
        ref={popoverRef}
        style={popoverStyle}
        className="fixed z-[100] glass-panel bg-slate-900/95 border border-amber-500/35 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/70 transition-all duration-300"
        role="dialog"
        aria-label={currentStep.titulo}
      >
        {/* Barra Superior: Passo + Fechar */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              Passo {currentStepIndex + 1} de {total}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              <ShieldCheck className="w-3 h-3" />
              Modo Treino
            </span>
          </div>

          <button
            type="button"
            onClick={endTour}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Fechar tutorial (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Título e Explicação */}
        <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
          {currentStep.titulo}
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed mt-1.5">
          {currentStep.descricao}
        </p>

        {/* Dica / Regra de Ouro opcional */}
        {currentStep.dica && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200 leading-snug font-medium">
              {currentStep.dica}
            </p>
          </div>
        )}

        {/* Rodapé de Navegação */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={endTour}
            className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1.5"
          >
            Pular tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white text-xs font-extrabold shadow-lg shadow-brand-600/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>{isUltimo ? 'Concluir Tour!' : 'Próximo'}</span>
              {!isUltimo && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
