// service-worker.js
const CACHE = "naira-lingua-v1";
const SHELL = [
  "./", "./index.html", "./app.css", "./manifest.webmanifest",
  "./assets/icons/icon.svg",
  "./js/main.js", "./js/util.js", "./js/i18n.js", "./js/langs.js", "./js/store.js",
  "./js/router.js", "./js/data.js", "./js/pairs.js",
  "./js/views/common.js", "./js/views/home.js", "./js/views/pick.js",
  "./js/views/study.js", "./js/views/quiz.js", "./js/views/lessons.js",
  "./js/views/dictionary.js", "./js/views/progress.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Datos del corpus: cache-first con actualización en segundo plano.
  if (url.pathname.includes("/data/")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const cached = await c.match(e.request);
        const network = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
  // Shell y navegación: cache-first.
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
