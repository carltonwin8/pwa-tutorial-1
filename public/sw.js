self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("static").then(cache => {
      console.log("precaching app shell");
      cache.add("/");
      cache.add("/index.html");
      cache.add("/src/js/app.js");
    })
  );
});

self.addEventListener("activate", e => {
  return self.clients.claim();
});

self.addEventListener("fetch", e => {
  try {
    e.respondWith(
      caches
        .match(e.request)
        .then(resp => {
          if (resp) console.log(e.request, resp);
          if (resp) return resp;
          else return fetch(e.request);
        })
        .catch(e => console.log("cache error", e))
    );
  } catch (e) {
    console.error("Error! Fetch failed with:", e);
  }
});
