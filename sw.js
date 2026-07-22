// SQL Practice — offline service worker
//
// The SQLite engine (sql.js + wasm) is embedded directly inside index.html,
// so caching index.html alone is enough to make the whole app work with
// zero network requests after the first successful visit.
//
// IMPORTANT: bump CACHE_NAME any time index.html changes and gets
// re-deployed, so returning visitors actually pick up the new version
// instead of being stuck on a stale cached copy forever.
const CACHE_NAME = 'sql-practice-v6';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first: serve instantly from cache when offline, but also fetch
// a fresh copy in the background when online so the cache stays current.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // offline: fall back to whatever's cached

      return cached || networkFetch;
    })
  );
});
