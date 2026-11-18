import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TOUR_STEPS } from '../data/onboardingSteps'

const OnboardingContext = createContext(null)

const STORAGE_SEEN_KEY = 'ir_onboarding_seen_v1'
const STORAGE_CHECKLIST_KEY = 'ir_rotina_checklist_v1'

function getHojeISO() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function OnboardingProvider({ children, activeTab, setActiveTab }) {
  const [isTourActive, setIsTourActive] = useState(false)
  const [activeTrilha, setActiveTrilha] = useState('completo')
  const [activeSteps, setActiveSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [simulatedToast, setSimulatedToast] = useState('')

  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_SEEN_KEY) === 'true'
    } catch {
      return false
    }
  })

  // Checklist diário salvo por data (reseta automaticamente no dia seguinte)
  const [checklistMarcados, setChecklistMarcados] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHECKLIST_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      if (parsed.data === getHojeISO()) {
        return parsed.marcados || {}
      }
      return {}
    } catch {
      return {}
    }
  })

  const currentStep = isTourActive ? activeSteps[currentStepIndex] || null : null
  const demoModal = currentStep?.modalDemo || null

  const dismissWelcome = useCallback(() => {
    setHasSeenWelcome(true)
    try {
      localStorage.setItem(STORAGE_SEEN_KEY, 'true')
    } catch {
      // ignora erro de storage
    }
  }, [])

  const notifySimulacao = useCallback((msg) => {
    setSimulatedToast(msg)
  }, [])

  useEffect(() => {
    if (!simulatedToast) return
    const timer = setTimeout(() => setSimulatedToast(''), 3500)
    return () => clearTimeout(timer)
  }, [simulatedToast])

  // Sincroniza a aba ativa automaticamente sempre que o passo atual exigir outra tela
  useEffect(() => {
    if (isTourActive && currentStep?.tab && currentStep.tab !== activeTab) {
      setActiveTab(currentStep.tab)
    }
  }, [isTourActive, currentStep, activeTab, setActiveTab])

  const startTour = useCallback(
    (trilhaId = 'completo') => {
      const stepsFiltrados =
        trilhaId === 'completo'
          ? TOUR_STEPS
          : TOUR_STEPS.filter((s) => s.trilha === trilhaId)

      if (stepsFiltrados.length === 0) return

      dismissWelcome()
      setActiveTrilha(trilhaId)
      setActiveSteps(stepsFiltrados)
      setCurrentStepIndex(0)
      setIsTourActive(true)

      if (stepsFiltrados[0].tab) {
        setActiveTab(stepsFiltrados[0].tab)
      }
    },
    [dismissWelcome, setActiveTab]
  )

  const endTour = useCallback(() => {
    setIsTourActive(false)
    setActiveSteps([])
    setCurrentStepIndex(0)
    setSimulatedToast('')
  }, [])

  const nextStep = useCallback(() => {
    if (currentStepIndex + 1 < activeSteps.length) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      endTour()
    }
  }, [currentStepIndex, activeSteps.length, endTour])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }, [currentStepIndex])

  const toggleChecklistItem = useCallback((itemId) => {
    setChecklistMarcados((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] }
      try {
        localStorage.setItem(
          STORAGE_CHECKLIST_KEY,
          JSON.stringify({ data: getHojeISO(), marcados: next })
        )
      } catch {
        // ignora erro de storage
      }
      return next
    })
  }, [])

  const resetChecklist = useCallback(() => {
    setChecklistMarcados({})
    try {
      localStorage.setItem(
        STORAGE_CHECKLIST_KEY,
        JSON.stringify({ data: getHojeISO(), marcados: {} })
      )
    } catch {
      // ignora erro de storage
    }
  }, [])

  return (
    <OnboardingContext.Provider
      value={{
        isTourActive,
        activeTrilha,
        activeSteps,
        currentStepIndex,
        currentStep,
        demoModal,
        simulatedToast,
        hasSeenWelcome,
        checklistMarcados,
        startTour,
        endTour,
        nextStep,
        prevStep,
        dismissWelcome,
        notifySimulacao,
        toggleChecklistItem,
        resetChecklist
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider')
  }
  return ctx
}
