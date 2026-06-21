// Service Worker Stub
const CACHE_NAME = 'wws-v1';

self.addEventListener('install', event => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activated');
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network first strategy
  event.respondWith(fetch(event.request));
});
