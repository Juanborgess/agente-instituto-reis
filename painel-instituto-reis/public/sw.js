/**
 * Service Worker - Painel Instituto Reis (PWA)
 * Versão do Cache: instituto-reis-v1
 * Estratégia: Network-First para navegação/APIs e Cache seguro para ativos estáticos.
 */

const CACHE_NAME = 'instituto-reis-pwa-v1';

// Ativos essenciais para inicialização imediata
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-instituto.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Aviso ao pré-carregar ativos:', err);
      });
    })
  );
});

// Ativação e limpeza de versões antigas de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação inteligente de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Apenas intercepta requisições GET
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Ignora extensões do Chrome e esquemas não http/https
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. REQUISIÇÕES DE API / DADOS EM TEMPO REAL: NETWORK-ONLY
  // Supabase, Google Apps Script e APIs externas NUNCA devem ser cacheadas
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('facebook.com')
  ) {
    return; // Deixa o navegador executar diretamente pela rede
  }

  // 2. NAVEGAÇÃO DE PÁGINAS (HTML): NETWORK-FIRST COM FALLBACK
  // Garante que o usuário sempre veja o app mais atualizado ao abrir
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Atualiza o cache do index.html em segundo plano
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Se estiver sem internet, retorna o index.html em cache
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 3. ATIVOS ESTÁTICOS (JS, CSS, Imagens, Fontes): STALE-WHILE-REVALIDATE
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Retorna o cache se disponível para carregamento instantâneo, ou espera a rede
      return cachedResponse || fetchPromise;
    })
  );
});
