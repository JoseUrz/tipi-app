const CACHE_NAME = 'tipi-v1';          // Cambia esta versión al actualizar
const ASSETS = [
  './',                                // raíz de /tipi-app/
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png',
  './js/gsap.min.js',
  './js/tsparticles.bundle.min.js',
  // fuente Google: se cacheará cuando la primera vez se solicite
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700&display=swap'
];

// ---------- INSTALACIÓN ----------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------- ACTIVACIÓN ----------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ---------- FETCH ----------
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Solo cacheamos respuestas válidas (status 200 mismos origenes)
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Si la red falla y era navegación, servimos copia de index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

