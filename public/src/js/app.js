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
      swreg.showNotification("Successfully subscribed", options);
    });
  }
}

function configurePushSub() {
  if (!("serviceWorker" in navigator)) return;

  let reg;
  navigator.serviceWorker.ready
    .then(swreg => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(sub => {
      if (sub === null) {
        const vapidPublicKey =
          "BNHpuT3_GM0OItLIxbt71a36JD4g6XD3kOJuD3iLpHUs4i3tlll4eSisMRc7Ezt5mx1D0qG2hN_N2GhXBunTKno";
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // old sub
      }
    })
    .then(newSub => {
      return fetch("https://pwagram-6bbfe.firebaseio.com/subscriptions.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(newSub)
      });
    })
    .then(res => {
      if (res.ok) displayConfirmNotification();
    })
    .catch(e => console.error("Conf push sub failed.", e));
}

function askForNotificationPermision() {
  Notification.requestPermission(result => {
    if (result !== "granted") return;
    //displayConfirmNotification();
    configurePushSub();
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  for (let i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = "inline-block";
    enableNotificationsButtons[i].addEventListener(
      "click",
      askForNotificationPermision
    );
  }
}
