const CACHE_NAME = 'weekend-warrior-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './feed.html',
  './challenges.html',
  './ranking.html',
  './profile.html',
  './messenger.html',
  './login.html',
  './manifest.json',
  './css/design-system.css',
  './css/layout.css',
  './css/components.css',
  './css/premium-components.css',
  './css/animations.css',
  './css/style.css',
  './css/arena.css',
  './css/rpg-theme.css',
  './css/unified-system.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {});
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
