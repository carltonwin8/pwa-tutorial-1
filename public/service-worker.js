importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

workbox.routing.registerRoute(
  new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "google-fonts",
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
      })
    ]
  })
);

workbox.routing.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "material-css" })
);

workbox.routing.registerRoute(
  new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "post-images"
  })
);

/*
workbox.routing.registerRoute(
  new RegExp(/.*(?:firebaseio)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "firebase-json" })
);
*/

workbox.routing.registerRoute(
  "https://pwagram-6bbfe.firebaseio.com/posts.json",
  async ({ event }) => {
    let r;
    return await fetch(event.request)
      .then(response => {
        r = response;
        const clonedResp = response.clone();
        console.log("fetch happened", clonedResp);
        clearAllData("posts")
          .then(() => clonedResp.json())
          .then(json => {
            console.log("json", json);
            const pArr = Object.keys(json).map(key =>
              writeData("posts", json[key])
            );
            return Promise.all(pArr);
          })
          .then(() => r)
          .catch(err => console.error("Error! With posts indexDb", err));
      })
      .catch(err => console.log("Failed fetch for", event.request));
  }
);

workbox.routing.registerRoute(
  routeData =>
    routeData.url.pathname !== "/" &&
    routeData.event.request.headers.get("accept").includes("text/html"),
  async ({ event }) => {
    return await caches
      .match(event.request)
      .then(resp => {
        if (resp) return resp;
        console.log("fetching because no cache for", event.request);
        return fetch(event.request)
          .then(response => {
            return caches
              .open("dynamic")
              .then(cache => {
                cache.put(event.request.url, response.clone());
                return response;
              })
              .catch(e => console.log("dynamic cache error", e));
          })
          .catch(err => {
            console.log("fetch response failed for", event.request);
            return caches
              .match(workbox.precaching.getCacheKeyForURL("/offline.html"))
              .then(resp2 => {
                console.log("match", resp2);
                return resp2;
              })
              .catch(e => console.log("precache cache error", e));
          });
      })
      .catch(e => console.log("cache error", e));
  }
);

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "addc985f716614cda09b7da6e5532849"
  },
  {
    "url": "manifest.json",
    "revision": "15f17d38c46d3f4786b17b7a9faad4cb"
  },
  {
    "url": "offline.html",
    "revision": "4c787dffc58fb14378aea137170d393e"
  },
  {
    "url": "src/css/app.css",
    "revision": "59d917c544c1928dd9a9e1099b0abd71"
  },
  {
    "url": "src/css/feed.css",
    "revision": "2176bb0f99f5d8289cb7b8890f64580e"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "e21adf5f055c1a08df57334f6abf443e"
  },
  {
    "url": "src/js/feed.js",
    "revision": "aee7139b7a29e6826cba928e17f34f16"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/utility.js",
    "revision": "ab7b581340f73baaebaca6d0094bdb7f"
  },
  {
    "url": "sw-base.js",
    "revision": "5653abed08c83467fb75e7149d46fc87"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);
