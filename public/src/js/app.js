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
  const options = {
    body: "You successfully subscribed to our Notificatin service."
  };
  new Notification("Successfully subscribed!", options);
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
