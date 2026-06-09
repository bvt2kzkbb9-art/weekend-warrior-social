/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — Service Worker
 * Offline support + Cache strategy
 * ============================================================
 */

const CACHE_NAME  = 'wws-v1';
const CACHE_PAGES = 'wws-pages-v1';

// Assets to cache immediately on install
const PRECACHE = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './feed.html',
  './ranking.html',
  './profile.html',
  './challenges.html',
  './achievements.html',
  './quizzes.html',
  './onboarding.html',
  './css/style.css',
  './css/challenges.css',
  './js/firebase.js',
  './js/auth.js',
  './js/feed.js',
  './js/profile.js',
  './js/ranking.js',
  './js/challenges.js',
  './js/achievements.js',
  './js/quizzes.js',
  './js/xp.js',
  './assets/icons/icon-512.svg',
  './manifest.json',
];

// ── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE).catch(err => {
        console.warn('[SW] Precache partial fail (ok):', err.message);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CACHE_PAGES)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and Firebase/Google API requests
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('firebase.googleapis.com')) return;
  if (url.hostname.includes('identitytoolkit.googleapis.com')) return;
  if (url.hostname.includes('firebasestorage.googleapis.com')) return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('gstatic.com')) return;
  if (url.hostname.includes('fonts.googleapis.com')) return;

  // HTML pages — Network first, cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_PAGES).then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./offline.html')))
    );
    return;
  }

  // Assets — Cache first, network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (!response.ok) return response;
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
      }).catch(() => {
        // Return placeholder for images
        if (request.destination === 'image') {
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="#121317"/>
              <text x="50" y="55" font-size="30" text-anchor="middle" fill="#D4AF37">⚔️</text>
            </svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});

// ── Push notifications ────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Weekend Warrior Social', body: event.data.text() };
  }

  const options = {
    body:    data.body  || 'Na Arenie coś się dzieje ⚔️',
    icon:    data.icon  || './assets/icons/icon-192.png',
    badge:   './assets/icons/icon-192.png',
    tag:     data.tag   || 'wws-notification',
    data:    { url: data.url || './index.html' },
    actions: [
      { action: 'open',    title: '⚔️ Otwórz Arenę' },
      { action: 'dismiss', title: 'Zamknij' },
    ],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Weekend Warrior Social ⚔️', options)
  );
});

// ── Notification click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
