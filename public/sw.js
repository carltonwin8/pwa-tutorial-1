const version = "v7";
var CACHE_STATIC_NAME = `static-${version}`;
var CACHE_DYNAMIC_NAME = `dynamic-${version}`;

const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/favicon.ico",
  "/manifest.json",
  "/src/images/main-image.jpg",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/js/material.min.js",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log("precaching app shell");
      cache.addAll(STATIC_FILES);
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

// cache and networks with off line support
// change event name to "fetch" to enable
// self.addEventListener("fetch-and-cache-network", e => {
self.addEventListener("fetch", event => {
  try {
    const url = "https://httpbin.org/get";
    if (event.request.url.indexOf(url) > -1) {
      event.respondWith(
        caches.open(CACHE_DYNAMIC_NAME).then(cache => {
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    } else if (
      new RegExp("\\b" + STATIC_FILES.join("\\b|\\b") + "\\b").test(
        event.request.url
      )
    ) {
      event.respondWith(caches.match(event.request));
    } else {
      event.respondWith(
        caches
          .match(event.request)
          .then(resp => {
            if (resp) return resp;
            else
              return fetch(event.request)
                .then(response => {
                  return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                    cache.put(event.request.url, response.clone());
                    return response;
                  });
                })
                .catch(err => {
                  console.log("dynamic response failed for", event.request);
                  return caches.open(CACHE_STATIC_NAME).then(cache => {
                    if (event.request.url.indexOf("/help") > -1) {
                      return cache.match("/offline.html").then(resp2 => {
                        console.log("match", resp2);
                        return resp2;
                      });
                    }
                  });
                });
          })
          .catch(e => console.log("cache error", e))
      );
    }
  } catch (e) {
    console.error("Error! Fetch failed with:", e);
  }
});

// cache first then networks - change event name to "fetch" to enable
// self.addEvßentListener("fetch", e => {
self.addEventListener("fetch-cache-network", e => {
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
              .catch(err => {
                console.log("dynamic response failed for", e.request);
                return caches.open(CACHE_STATIC_NAME).then(cache => {
                  return cache.match("/offline.html").then(resp2 => {
                    console.log("match", resp2);
                    return resp2;
                  });
                });
              });
        })
        .catch(e => console.log("cache error", e))
    );
  } catch (e) {
    console.error("Error! Fetch failed with:", e);
  }
});

// network first then cache - change event name to "fetch" to enable
// self.addEventListener("fetch", e => {
self.addEventListener("fetch-network-cache", e => {
  try {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
            cache.put(e.request.url, resp.clone());
            return resp;
          });
        })
        .catch(() => caches.match(e.request))
    );
  } catch (e) {
    console.error("Error! Fetch failed with:", e);
  }
});
