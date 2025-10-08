// ----------------- SERVICE WORKER -----------------
self.addEventListener('install', () => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker activated');
  return self.clients.claim();
});

self.addEventListener('message', event => {
  const data = event.data;
  if (data && data.type === 'NEW_TASK') {
    const { title, assigner } = data.payload;
    self.registration.showNotification('🆕 Topik Baru Ditambahkan!', {
      body: `${title} oleh ${assigner}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
