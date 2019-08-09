importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

workbox.routing.registerRoute(
  new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "firebase-images",
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
      })
    ]
  })
);

workbox.routing.registerRoute(
  new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "google-fonts" })
);

workbox.routing.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "material-css" })
);

/*
workbox.routing.registerRoute(
  new RegExp(/.*(?:firebaseio)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "firebase-json" })
);
*/

workbox.routing.registerRoute(
  "https://pwagram-6bbfe.firebaseio.com/posts.json",
  async args => {
    console.log("args", args);
    return await fetch(args.event.request).then(response => {
      const clonedResp = response.clone();
      console.log("fetch happened", clonedResp);
      clearAllData("posts")
        .then(() => clonedResp.json())
        .then(data => {
          for (let key in data) writeData("posts", data[key]);
        });
      return response;
    });
  }
);

workbox.routing.registerRoute(
  routeData =>
    routeData.url.pathname !== "/" &&
    routeData.event.request.headers.get("accept").includes("text/html"),
  async ({ event }) => {
    try {
      const resp = await caches.match(event.request);
      if (resp) return resp;
      try {
        const response = await fetch(event.request);
        const cache = await caches.open("dynamic");
        cache.put(event.request.url, response.clone());
        return response;
      } catch (err) {
        console.log("dynamic response failed for", event.request);
        let resp2 = await caches.match(
          workbox.precaching.getCacheKeyForURL("/offline.html")
        );
        console.log("match", resp2);
        return resp2;
      }
    } catch (e) {
      console.log("cache error", e);
    }
  }
);

workbox.precaching.precacheAndRoute([]);
