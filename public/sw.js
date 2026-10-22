const CACHE = "nte-v2";
const PRECACHE = ["/", "/index.html", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  
  // 1. Only handle GET requests
  if (req.method !== "GET") return;

  // 2. DO NOT intercept Firebase Auth or API requests!
  const url = new URL(req.url);
  if (
    url.pathname.startsWith("/__/auth") || 
    url.hostname.includes("firebaseapp.com") || 
    url.hostname.includes("googleapis.com")
  ) {
    return; // Let the browser handle it normally
  }

  // 3. Cache everything else
  event.respondWith(
    caches.match(req).then((hit) => {
      const live = fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => hit);
      return hit || live;
    }),
  );
});
