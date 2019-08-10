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

workbox.precaching.precacheAndRoute([]);
