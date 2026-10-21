// Gör att appen startar även utan nät. Hämtar alltid färskt när det går
// (så ändringar syns direkt) och faller tillbaka på sparad kopia offline.
const CACHE = "rabatter-v2";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "hero-guld.webp",
  "startbild2-cirkel.webp",
  "stockholms-nation-logga.png",
  "qrcode.min.js",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request, { ignoreSearch: true })
          .then((hit) => hit || (event.request.mode === "navigate" ? caches.match("index.html") : undefined))
          .then((hit) => hit || Response.error())
      )
  );
});
