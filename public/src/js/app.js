var deferredPrompt;
let enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if ("serviceWorker" in navigator) {
  try {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("service worker registered");
      })
      .catch(e => console.error("Error Registering sw", e));
  } catch (e) {
    console.error("Error Registering sw", e);
  }
}

window.addEventListener("beforeinstallprompt", e => {
  console.log("beforeinstall prompt fired", e);
  e.preventDefault();
  deferredPrompt = e;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    const options = {
      body: "You successfully subscribed to our Notificatin service.",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US", // BCP 47 language tag
      vibrate: [100, 50, 200], // vibration, pause, vibration
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "OK",
          icon: "/src/images/icons/app-icon-96x96.png"
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png"
        }
      ]
    };
    navigator.serviceWorker.ready.then(swreg => {
      swreg.showNotification("sw Successfully subscribed", options);
    });
  }
}
function askForNotificationPermision() {
  Notification.requestPermission(result => {
    if (result !== "granted") return;
    displayConfirmNotification();
  });
}

if ("Notification" in window) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermision
    );
  }
}
