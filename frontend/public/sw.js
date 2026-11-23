// Mindora 2.0 — Safe Offline Application Shell Service Worker
// Strictly caches ONLY static immutable application shell assets.
// NEVER caches PHQ-9 responses, Item 9 triggers, assessment inputs, or student personal data.

const CACHE_NAME = 'mindora-app-shell-v2';

const STATIC_APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up previous cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message: Support immediate client updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Safe offline application shell strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // STRICT PRIVACY RULE: Only GET requests are handled by service worker
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // STRICT PRIVACY RULE: Never intercept or cache requests containing query parameters
  if (url.search && url.search.length > 0) {
    return;
  }

  // Handle static assets with Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            // Only cache valid basic same-origin responses
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              // Cache static script, style, image, or html assets
              const pathname = url.pathname;
              if (
                pathname === '/' ||
                pathname.endsWith('.html') ||
                pathname.endsWith('.js') ||
                pathname.endsWith('.css') ||
                pathname.endsWith('.svg') ||
                pathname.endsWith('.json')
              ) {
                cache.put(request, networkResponse.clone());
              }
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached response if offline, or fallback to app shell for navigation
            return cachedResponse || (request.mode === 'navigate' ? cache.match('/index.html') : undefined);
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
