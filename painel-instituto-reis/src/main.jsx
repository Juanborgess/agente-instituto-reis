import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initCacheBuster } from './utils/cacheManager'

// Inicia o verificador automático de novos deploys para limpar cache dos dispositivos
initCacheBuster()

// Previne gestos de zoom acidental (pinch-to-zoom) em celulares e tablets
if (typeof window !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault())
  document.addEventListener('gesturechange', (e) => e.preventDefault())
  document.addEventListener('gestureend', (e) => e.preventDefault())
}

// Registra o Service Worker do PWA com query param de versão para forçar atualização no deploy
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `/sw.js?v=${typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : Date.now()}`
    navigator.serviceWorker.register(swUrl).then(
      (reg) => {
        // Verifica se há uma atualização pendente
        reg.update()
      },
      (err) => {
        console.warn('[PWA] Erro ao registrar Service Worker:', err)
      }
    )
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


