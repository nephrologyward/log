// Renal Ward Log service worker: app works offline; updates arrive on next open.
const CACHE = "rwl-v1";
const SHELL = ["./", "index.html", "app.js", "firebase.js", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Firebase data/auth calls are handled by Firebase itself.
  if (/googleapis\.com$|firebaseio\.com$/.test(url.hostname) && !url.hostname.startsWith("fonts")) return;
  const isShell = url.origin === location.origin;
  const isLib = url.hostname === "www.gstatic.com" || url.hostname.startsWith("fonts.");
  if (isShell) { // network first, so new versions show up; cache when offline
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
  } else if (isLib) { // libraries and fonts: cache first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; })));
  }
});
