const STATIC_CACHE = 'campus-hub-static-v1';
const DYNAMIC_CACHE = 'campus-hub-dynamic-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );
  self.clients.claim();
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => cached)
      .then((response) => response || new Response('Offline', { status: 503, statusText: 'Offline' }));
  });
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
      }
      return response;
    })
    .catch(() => caches.match(request))
    .then((response) => response || new Response('Offline', { status: 503, statusText: 'Offline' }));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');

  if (isSameOrigin && acceptsHtml) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isSameOrigin && ['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(networkFirst(request));
    return;
  }
});