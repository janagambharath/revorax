/* Revorax PG app shell — cache-first */
const CACHE = 'revorax-pg-v3';
const ASSETS = [
  '/pg/app/',
  '/pg/app/index.html',
  '/pg/app/styles.css',
  '/pg/app/app.js',
  '/pg/app/manifest.json',
  '/pg/app/icons/icon-192.png',
  '/pg/app/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
