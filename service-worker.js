const CACHE_NAME = "bel-sekolah-cache-v2";
const URLS_TO_CACHE = [
  "/index.html",
  "/script.js",
  "/jadwal.csv",
  "/manifest.json",
  "/audio/036.mp3",
  "/audio/055.mp3",
  "/audio/056.mp3",
  "/audio/067.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
