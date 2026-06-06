// Basic Service Worker for PWA Installability

const CACHE_NAME = 'campus-hub-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for basic offline fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});