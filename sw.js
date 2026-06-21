/**
 * ⚔️ WARRIOR OS 2.0 — SERVICE WORKER
 * 
 * Enables offline functionality and PWA capabilities
 */

const CACHE_NAME = 'warrior-os-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/router.js',
  '/src/styles/variables.css',
  '/src/styles/reset.css',
  '/src/styles/typography.css',
  '/src/styles/layout.css',
  '/src/styles/warrior-os-surrealist.css',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Silently fail if cache fails
        console.log('Cache installation failed - continuing without cache');
      });
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page if needed
        return new Response('Offline - please check your connection', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});
