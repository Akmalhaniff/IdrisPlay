// Idris Play service worker — makes the app installable and playable offline.
// All paths are relative to where the app is hosted (e.g. https://akmalhaniff.github.io/IdrisPlay/).
const CACHE = 'idrisplay-v5';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'css/fun.css',
  'js/fun.js',
  'js/phrases.js'
];
const scopePath = new URL(self.registration.scope).pathname;
const appUrl = (p) => new URL(p, self.registration.scope).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // keep the current app cache and the saved voice packs (idrisplay-voice-*)
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && !k.startsWith('idrisplay-voice-')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function saveCopy(req, res, cacheName = CACHE) {
  if (res.ok) { const copy = res.clone(); caches.open(cacheName).then((c) => c.put(req, copy)); }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const rel = url.origin === location.origin && url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : null;

  // Live voice from the PC server: keep each phrase so it plays instantly (and offline) next time.
  if (rel === 'api/tts') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => saveCopy(req, res, CACHE + '-tts'))));
    return;
  }
  if (rel !== null && rel.startsWith('api/')) return;

  // Voice pack: the list of recordings is checked online first (new sentences), the recordings never change.
  if (rel !== null && rel.startsWith('voice/')) {
    if (rel.endsWith('index.json')) {
      e.respondWith(fetch(req).then((res) => saveCopy(req, res)).catch(() => caches.match(req)));
    } else {
      e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => saveCopy(req, res))));
    }
    return;
  }

  // App pages: network first so updates arrive, cached copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(appUrl('index.html'), copy)); } return res; })
        .catch(() => caches.match(appUrl('index.html')))
    );
    return;
  }

  // Everything else (scripts, styles, icons, fonts): serve the cached copy instantly,
  // and refresh it in the background so the next launch gets any update.
  const cacheable = url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com');
  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => (cacheable ? saveCopy(req, res) : res));
      if (hit) { fresh.catch(() => {}); return hit; }
      return fresh;
    })
  );
});
