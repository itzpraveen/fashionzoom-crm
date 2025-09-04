// Cache only static assets. Avoid caching authenticated HTML routes.
const CACHE_NAME = 'fzcrm-static-v3'

self.addEventListener('install', (event) => {
  // Take over immediately on update to reduce old SWs lingering
  self.skipWaiting()
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    // Precache only truly static assets
    await cache.addAll(['/manifest.json', '/icons/icon-192.svg', '/icons/icon-512.svg'])
  })())
})

self.addEventListener('activate', (event) => {
  // Clean up old caches and claim clients
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'

  if (!isStatic) return // do not cache dynamic or authenticated routes

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached
    try {
      const fresh = await fetch(request)
      if (fresh && fresh.status === 200) cache.put(request, fresh.clone())
      return fresh
    } catch (e) {
      return cached || Response.error()
    }
  })())
})
