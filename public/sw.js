self.addEventListener("install", e => {
  console.log("Installing service worker", e);
});

self.addEventListener("activate", e => {
  console.log("Activating service worker", e);
  return self.clients.claim();
});

self.addEventListener("fetch", e => {
  console.log("fetch e", e.request.url);
  try {
    e.respondWith(fetch(e.request));
  } catch (e) {
    donsole.error("Error! Fetch failed with:", e);
  }
});
