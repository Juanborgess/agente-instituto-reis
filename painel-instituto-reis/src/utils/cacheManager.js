/**
 * Gerenciador de Versão e Limpeza Automática de Cache (PWA & Web)
 * Garante que a cada deploy feito, todos os dispositivos (celulares, tablets e PCs)
 * atualizem instantaneamente sem ficar presos em versões antigas em cache.
 */

const STORAGE_KEY = 'instituto_reis_build_time'

export function initCacheBuster() {
  if (typeof window === 'undefined') return

  // 1. Função de checagem no servidor
  const verificarNovaVersao = async () => {
    try {
      // Faz a requisição de version.json forçando bypass total de cache
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!res.ok) return

      const data = await res.json()
      const buildServidor = data.buildTime
      const buildLocal = localStorage.getItem(STORAGE_KEY)

      if (!buildLocal) {
        // Primeira vez abrindo
        localStorage.setItem(STORAGE_KEY, buildServidor)
        return
      }

      // Se a versão do servidor for diferente da salva localmente, houve novo deploy!
      if (buildServidor && buildServidor !== buildLocal) {
        console.log('[CacheManager] 🚀 Nova versão detectada:', data.version, buildServidor)
        
        // Atualiza a chave salva
        localStorage.setItem(STORAGE_KEY, buildServidor)

        // Limpa todas as instâncias de CacheStorage do navegador/PWA
        if ('caches' in window) {
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map((key) => caches.delete(key)))
          console.log('[CacheManager] 🧹 Caches antigos limpos com sucesso!')
        }

        // Força atualização do Service Worker se disponível
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (let reg of registrations) {
            await reg.update()
          }
        }

        // Recarrega a página automaticamente para carregar o novo build
        setTimeout(() => {
          window.location.reload()
        }, 300)
      }
    } catch (err) {
      console.warn('[CacheManager] Verificação silenciosa de versão:', err)
    }
  }

  // Verifica imediatamente ao carregar a página
  setTimeout(verificarNovaVersao, 1500)

  // Verifica toda vez que o usuário volta para o app (trocou de aba ou desbloqueou o celular)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      verificarNovaVersao()
    }
  })

  // Checagem periódica a cada 2 minutos
  setInterval(verificarNovaVersao, 120000)
}

/**
 * Função utilitária para forçar a limpeza manual completa caso necessário
 */
export async function forcarLimpezaCacheTotal() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (let reg of registrations) {
        await reg.unregister()
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  } catch (err) {
    console.error('Erro ao limpar cache:', err)
    window.location.reload()
  }
}
