importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const version = "v9";
var CACHE_STATIC_NAME = `static-${version}`;
var CACHE_DYNAMIC_NAME = `dynamic-${version}`;

const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/favicon.ico",
  "/manifest.json",
  "/src/images/main-image.jpg",
  "/src/js/utility.js",
  "/src/js/app.js",
  "/src/js/idb.js",
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

// use function before adding new item to dynamic cache so it does grow indefinitely
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  cache.delete(keys[0]);
  trimCache(cacheName, maxItems);
}

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}
// cache and networks with off line support
// change event name to "fetch" to enable
// self.addEventListener("fetch-and-cache-network", e => {
self.addEventListener("fetch", event => {
  try {
    const url = "https://pwagram-6bbfe.firebaseio.com/posts.json";
    if (event.request.url.indexOf(url) > -1) {
      event.respondWith(
        fetch(event.request).then(response => {
          const clonedResp = response.clone();
          console.log("fetch happened", clonedResp);
          clearAllData("posts")
            .then(() => clonedResp.json())
            .then(data => {
              for (let key in data) writeData("posts", data[key]);
            });
          return response;
        })
      );
    } else if (isInArray(event.request.url, STATIC_FILES)) {
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
                    if (
                      event.request.headers.get("accept").includes("text/html")
                    ) {
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
