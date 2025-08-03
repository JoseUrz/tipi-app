const CACHE_NAME = 'tipi-v1'; // Cambia esta versión cuando actualices la app
const ASSETS = [
  '/', // raíz
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/js/gsap.min.js',
  '/js/tsparticles.bundle.min.js',
  // fuentes de Google (se cachean bajo demanda)
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700&display=swap'
];

// Instalación: cachear todo lo esencial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Agrega todos los assets definidos
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar versiones antiguas si las hay
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(old => caches.delete(old))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones y responder desde cache o red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cached => {
        if (cached) {
          return cached;
        }
        // Si no está en cache, lo trae de la red y lo guarda (cache dinámico)
        return fetch(event.request)
          .then(response => {
            // Si es una respuesta válida, la clonamos y la guardamos para futuro
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
            return response;
          })
          .catch(() => {
            // Fallback: si falla y es navegación, retornar index.html (para que no rompa)
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
}
);
