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
    return await fetch(event.request)
      .then(response => {
        const clonedResp = response.clone();
        console.log("fetch happened", clonedResp);
        return clearAllData("posts")
          .then(() => clonedResp.json())
          .then(json => {
            console.log("json", json);
            const pArr = Object.keys(json).map(key =>
              writeData("posts", json[key])
            );
            return Promise.all(pArr);
          })
          .then(() => response)
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

self.addEventListener("sync", event => {
  console.log("bg sync", event);
  if (event.tag === "sync-new-post") {
    console.log("syn new post");
    event.waitUntil(
      readAllData("sync-posts").then(data => {
        for (let dt of data) {
          console.log("db data", dt);
          const postData = new FormData();
          postData.append("id", dt.id);
          postData.append("title", dt.title);
          postData.append("location", dt.location);
          postData.append("file", dt.picture, dt.id + ".png");
          postData.append("rawLocationLat", dt.rawLocation.lat);
          postData.append("rawLocationLng", dt.rawLocation.lng);
          fetch(
            "https://us-central1-pwagram-6bbfe.cloudfunctions.net/storePostData",
            {
              method: "POST",
              body: postData
            }
          )
            .then(resp => {
              console.log("Send Data", resp);
              if (resp.ok) {
                resp.json().then(resData => {
                  deletItemFromData("sync-posts", resData.id);
                });
              }
            })
            .catch(err => console.error("Error sending data", err));
        }
      })
    );
  }
});

self.addEventListener("notificationclick", event => {
  const { notification, action } = event;
  console.log("noti action", notification, action);
  if (action == "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(clnts => {
        const client = clnts.find(clnt => {
          return (clnt.visibilityState = "visible");
        });
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          client.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", event => {
  console.log("noti closed", event);
});

self.addEventListener("push", event => {
  console.log("push notification rec", event);
  let data = { title: "New", content: "dummy data", openUrl: "/" };
  if (!event.data) return;
  data = JSON.parse(event.data.text());
  const options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: { url: data.openUrl }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
