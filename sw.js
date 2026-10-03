const CACHE = 'injera-v4';
const STATIC = [
  '/',
  '/index.html',
  '/menu.html',
  '/menu-translations.json',
  '/fonts/fonts.css',
  '/fonts/fonts-menu.css',
  '/supabase.config.js',
  '/Photos-opt/Injera_Cover_1.jpg',
  '/Photos-opt/Injera_Cover_2.png',
  '/Photos-opt/Injera_Cover_3.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Web Push (Bestellbenachrichtigungen auch bei geschlossenem Browser) ──────
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}
  const title   = data.title   || '🛍 Neue Bestellung';
  const body    = data.body    || 'Tippen zum Öffnen & Drucken';
  const orderId = data.orderId || '';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      tag: 'order-' + orderId,
      renotify: true,
      requireInteraction: true,
      data: { orderId },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('admin.html')) {
          c.focus();
          c.postMessage({ type: 'NEW_ORDER_NOTIF', orderId: e.notification.data?.orderId });
          return;
        }
      }
      return clients.openWindow('/admin.html');
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Cache-first for fonts and images (immutable assets)
  if (url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/Photos-opt/')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }
  // Network-first for HTML and JSON (always fresh), with cache fallback
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Stale-while-revalidate for everything else
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(res => {
          c.put(e.request, res.clone());
          return res;
        });
        return cached || fresh;
      })
    )
  );
});
