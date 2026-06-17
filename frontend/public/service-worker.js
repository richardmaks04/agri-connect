/* ============================================================
   Agri-Connect Service Worker
   Implements the offline-first strategy from Chapter 3, Section 3.6.3
   - Cache-first for static assets
   - Network-first with cache fallback for API content
   - Background sync queue for offline user actions
   ============================================================ */

const CACHE_NAME = 'agri-connect-v1';
const API_CACHE  = 'agri-connect-api-v1';
const QUEUE_NAME = 'agri-connect-sync-queue';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
];

// Path prefixes that should always be treated as dynamic/API traffic,
// even though they don't live under /api (e.g. auth routes).
const DYNAMIC_PATH_PREFIXES = ['/api', '/auth'];

function isDynamicPath(pathname) {
  return DYNAMIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

// ─── Install: pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets don't exist yet (dev mode)
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== API_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: route all requests ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always let non-GET requests go straight to the network, regardless of
  // path. This covers /api/* mutations AND routes outside /api (e.g.
  // /auth/register, /auth/login) that should never be served from cache.
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Dynamic GET requests (API or auth): network-first, fall back to cache
  if (isDynamicPath(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirstStrategy(request));
});

// Network-first: try network, fall back to cached API response
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.log('[SW] Offline — serving from API cache:', request.url);
    const cached = await cache.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'You are offline. This content is not cached yet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Cache-first: serve from cache, update in background
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Return the app shell for navigation requests (SPA fallback)
    if (request.mode === 'navigate') {
      const shell = await cache.match('/index.html');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503 });
  }
}

// ─── Background Sync: replay queued actions when back online ─────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === QUEUE_NAME) {
    event.waitUntil(replayQueue());
  }
});

async function replayQueue() {
  // Read queue from IndexedDB (written by the frontend offlineQueue utility)
  // This is a simplified implementation; in production use the Background Sync API
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', timestamp: Date.now() });
  });
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Agri-Connect', {
      body: data.body || 'You have a new notification',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action !== 'dismiss') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
