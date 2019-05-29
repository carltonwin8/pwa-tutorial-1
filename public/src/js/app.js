var deferredPrompt;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => {
      console.log("service worker registered");
    })
    .catch(e => console.error("Error Registering sw", e));
}

window.addEventListener("beforeinstallprompt", e => {
  console.log("beforeinstall prompt fired", e);
  e.preventDefault();
  deferredPrompt = e;
  return false;
});
