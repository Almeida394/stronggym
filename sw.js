/* StrongGym — service worker: funcionamento offline da interface e notificações.
   Pedidos à API (/api/) e config.js vão sempre à rede; os restantes ficheiros
   vêm da rede e ficam guardados para funcionar sem ligação. */
const CACHE = 'stronggym-v5';
const SHELL = ['./', './index.html', './styles.css', './i18n.js', './i18n-en.js', './demo.js', './myplan.js', './food.js', './app.js', './demo-seed.json', './favicon.svg', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(SHELL.map(url => cache.add(url)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.includes('/api/') || url.pathname.endsWith('/__version')) return;
  /* Rede primeiro: com o servidor ligado mostra sempre a versão mais recente;
     sem rede, usa a cópia guardada. */
  event.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(cached => cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
/* Notifications are produced by the open application. No background push service is configured. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windows => {
    if (windows.length) return windows[0].focus();
    return clients.openWindow('./#notices');
  }));
});
