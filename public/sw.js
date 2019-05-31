var CACHE_STATIC_NAME = "static-v4";
var CACHE_DYNAMIC_NAME = "dynamic-v2";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log("precaching app shell");
      cache.addAll([
        "/",
        "/index.html",
        "/src/images/main-image.jpg",
        "/src/js/app.js",
        "/src/js/feed.js",
        "/src/css/app.css",
        "/src/css/feed.css",
        "/src/js/material.min.js",
        "https://fonts.googleapis.com/css?family=Roboto:400,700",
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
      ]);
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("deleting cache", key);
            return caches.delete(key);
          } else return null;
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", e => {
  try {
    e.respondWith(
      caches
        .match(e.request)
        .then(resp => {
          if (resp) return resp;
          else
            return fetch(e.request)
              .then(response => {
                return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                  cache.put(e.request.url, response.clone());
                  return response;
                });
              })
              .catch(e => console.log("fetch err", e));
        })
        .catch(e => console.log("cache error", e))
    );
  } catch (e) {
    console.error("Error! Fetch failed with:", e);
  }
});
