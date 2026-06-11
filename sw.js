/**
 * Campus Hub Service Worker
 * 
 * Handles caching for offline support and PWA installation.
 * With baseUrl: '/app' in Expo Router, all paths are prefixed with /app/.
 */

const STATIC_CACHE = 'campus-hub-static-v1';
const DYNAMIC_CACHE = 'campus-hub-dynamic-v1';

// Base path for Expo Router app
const APP_BASE = '/app';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/app/',
  '/app/manifest.webmanifest',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Handle fetch events with appropriate caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Determine if this is a navigation request (HTML page)
  const isNavigation = request.mode === 'navigate' || 
    request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // For navigation requests, use network-first with cache fallback
    // This ensures fresh content for pages while supporting offline
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response for future offline use
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cached) => {
            // If we have a cached version, return it
            if (cached) return cached;
            
            // Otherwise return the app root page from cache or network
            return caches.match('/app/').then((rootCache) => {
              if (rootCache) return rootCache;
              
              // Last resort: try to fetch the app root
              return fetch('/app/').then((htmlResponse) => htmlResponse);
            });
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images), use cache-first
  const isStaticAsset = ['script', 'style', 'image', 'font', 'media'].includes(
    request.destination
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // For API requests, use network-only (always get fresh data)
  // Let them pass through without caching
});
