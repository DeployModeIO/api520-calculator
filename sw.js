/* ============================================================
   sw.js — Service worker cache-first (PWA offline).
   Estrategia: precachea el núcleo; sirve de caché y actualiza.
   ============================================================ */
const CACHE = 'bpi-api520-v11';
const NUCLEO = [
  './index.html',
  './css/styles.css',
  './js/fluids.js',
  './js/orifices.js',
  './js/api520.js',
  './js/i18n.js',
  './js/chart.js',
  './js/datasheet.js',
  './js/ui.js',
  './manifest.json',
  './icons/icon.svg',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(NUCLEO)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    caches.match(ev.request).then((hit) => {
      if (hit) {
        // revalidación en segundo plano
        fetch(ev.request).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(ev.request, res));
        }).catch(() => {});
        return hit;
      }
      return fetch(ev.request).then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(ev.request, copia));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
