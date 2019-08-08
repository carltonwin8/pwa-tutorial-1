importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);

workbox.routing.registerRoute(
  new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "firebase-images" })
);

workbox.routing.registerRoute(
  new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "google-fonts" })
);

workbox.routing.registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "material-css" })
);

workbox.routing.registerRoute(
  new RegExp(/.*(?:firebaseio)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "firebase-json" })
);

workbox.precaching.precacheAndRoute([]);
