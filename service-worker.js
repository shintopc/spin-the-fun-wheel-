const CACHE = "funwheel-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./tick.wav",
  "./celebration.wav"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(net => {
      // optional: cache new GET requests
      if (e.request.method === "GET") {
        const copy = net.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return net;
    }).catch(() => caches.match("./index.html")))
  );
});
