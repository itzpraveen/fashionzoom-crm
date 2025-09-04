self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('fzcrm-shell-v1')
    await cache.addAll(['/', '/leads', '/manifest.json'])
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
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

