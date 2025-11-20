// sw.js - debugable (version v2)
const CACHE = 'pena-static-v2';
const ASSETS = [
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (evt) => {
  console.log('[SW] install');
  evt.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[SW] activate');
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isApi(url, req) {
  return (
    url.pathname.startsWith('/api/') ||
    req.headers.get('accept')?.includes('application/json')
  );
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webmanifest|woff2?)$/);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Log básico
  console.log('[SW] fetch', req.method, url.pathname, 'mode:', req.mode, 'accept:', req.headers.get('accept'));

  // 1) APIs -> pasar directo (respondWith fetch)
  if (isApi(url, req)) {
    console.log('[SW] PASS (API) -> ', url.pathname);
    event.respondWith(fetch(req));
    return;
  }

  // 2) No-GET o cross-origin -> dejar pasar
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    console.log('[SW] IGNORE (method/origin)', req.method, url.origin);
    return;
  }

  // 3) Navegaciones -> dejar pasar (no cachear HTML)
  if (req.mode === 'navigate') {
    console.log('[SW] IGNORE (navigate)', url.pathname);
    return;
  }

  // 4) URLs con query -> dejar pasar
  if (url.search) {
    console.log('[SW] IGNORE (query)', url.pathname, url.search);
    return;
  }

  // 5) sólo static assets por extensión
  if (!isStaticAsset(url)) {
    console.log('[SW] IGNORE (not static ext)', url.pathname);
    return;
  }

  // 6) Cache-first para assets
  console.log('[SW] CACHE-FETCH', url.pathname);
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        console.log('[SW] cache HIT', url.pathname);
        return cached;
      }
      console.log('[SW] cache MISS -> fetch', url.pathname);
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch((err) => {
          console.log('[SW] fetch error', err, url.pathname);
          return caches.match('/favicon.ico') || new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});

self.addEventListener('push', (e) => {
  console.log('[SW] push', e);
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Peña';
  const options = { body: data.body || '', icon: '/icons/icon-192.png', data: data.data || {} };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  console.log('[SW] notificationclick', e.action, e.notification?.data);
  e.notification.close();
  const d = e.notification.data || {};
  let url = d.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) if ('focus' in w) { w.navigate(url); return w.focus(); }
    })
  );
});
