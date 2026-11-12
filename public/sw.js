self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title = typeof payload.title === 'string' ? payload.title : 'Portal NKL'
  const options = {
    body: typeof payload.body === 'string' ? payload.body : 'Você tem uma nova notificação.',
    data: (() => {
      if (typeof payload.href !== 'string') return '/perfil/notificacoes'
      try {
        const url = new URL(payload.href, self.location.origin)
        return url.origin === self.location.origin ? url.href : '/perfil/notificacoes'
      } catch {
        return '/perfil/notificacoes'
      }
    })(),
    icon: '/nkl.png',
    badge: '/nkl.png',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data || '/perfil/notificacoes'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === targetUrl)
      if (existing) return existing.focus()
      return self.clients.openWindow(targetUrl)
    }),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})
