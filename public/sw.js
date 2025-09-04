// Cache only static assets. Avoid caching authenticated HTML routes.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('fzcrm-shell-v1')
    await cache.addAll(['/', '/manifest.json'])
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
    const cache = await caches.open('fzcrm-shell-v1')
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
