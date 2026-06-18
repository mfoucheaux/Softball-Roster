// Softball Lineup 2026 — Service Worker v11
const CACHE_NAME = 'softball-lineup-v11';
const STATIC_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/fonts/tabler-icons.woff2'
];

// On install: cache only static assets (NOT the HTML)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(e => console.warn('[SW]', e)))
      .then(() => self.skipWaiting())
  );
});

// On activate: wipe all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// HTML → ALWAYS network-first (never serve stale HTML that could reset localStorage)
// Icons/CSS/fonts → cache-first (safe to cache, never contains app state)
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const isHTML = url.endsWith('.html') || url.endsWith('/') || url.includes('/Softball-Roster');
  const isIcon = url.endsWith('.png');

  if(isHTML){
    // Network first — always get fresh HTML
    event.respondWith(
      fetch(event.request, {cache: 'no-store'})
        .catch(() => caches.match('./index.html'))
    );
  } else if(isIcon){
    // Cache first for icons
    event.respondWith(
      caches.match(event.request).then(cached => cached ||
        fetch(event.request).then(r => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, r.clone()));
          return r;
        })
      )
    );
  } else {
    // Cache first for CSS/fonts
    event.respondWith(
      caches.match(event.request).then(cached => cached ||
        fetch(event.request).then(r => {
          if(r && r.status === 200){
            caches.open(CACHE_NAME).then(c => c.put(event.request, r.clone()));
          }
          return r;
        })
      )
    );
  }
});
