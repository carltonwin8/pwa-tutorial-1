var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");
var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureButton = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var picture;
var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");
let fetchedLocation;

locationBtn.addEventListener("click", event => {
  if (!("geolocation" in navigator)) return;
  locationBtn.style.display = "none";
  locationLoader.style.display = "inline-block";
  navigator.geolocation.getCurrentPosition(
    position => {
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      fetchedLocation = { lat: position.coords.latitude, lng: 0 };
      locationInput.value = "Vegas";
      document.querySelector("#manual-location").classList.add("is-focused");
    },
    error => {
      console.log(error);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      alert("Couldn't fetch location. Please enter one manually.");
      fetchedLocation = { lat: null, lng: null };
    },
    { timeout: 5000 }
  );
});

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
  locationLoader.style.display = "none";
  locationInput.value = "";
}

function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not implemented"));
      }
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(stream => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
    })
    .catch(e => {
      captureButton.style.display = "none";
      imagePickerArea.style.display = "block";
    });
}

captureButton.addEventListener("click", event => {
  canvasElement.style.display = "block";
  const context = canvasElement.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );
  stopVideo();
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener("change", event => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  createPostArea.style.display = "block";
  createPostArea.style.transform = "translateY(0)";
  initializeMedia();
  initializeLocation();
  // if ("serviceWorker" in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(regs => {
  //     for (let i = 0; i < regs.length; i++) {
  //       regs[i].unregister();
  //     }
  //   });
  // }
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(result => {
    console.log("outcome", result.outcome);
    if (result.outcome === "dismissed") console.log("User cancelled");
    else console.log("user added to home screen");
  });
  deferredPrompt = null;
}

function stopVideo() {
  if (videoPlayer.srcObject && videoPlayer.srcObject.getVideoTracks)
    videoPlayer.srcObject.getVideoTracks().forEach(track => track.stop());
}

function closeCreatePostModal() {
  createPostArea.style.transform = "translateY(100vh)";
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  stopVideo();
  canvasElement.style.display = "none";
  captureButton.style.display = "block";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// below is use when dynamic fetching is disable and user controls the cache
const onSavedButtonClicked = e => {
  console.log("clicked");
  if ("caches" in window) {
    caches.open("user-requested").then(cache => {
      cache.addAll(["https://httpbin.org/get", "/src/images/sf-boat.jpg"]);
    });
  }
};

function clearCards() {
  while (sharedMomentsArea.hasChildNodes())
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
}
function createCard(data) {
  if (!data) return;
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.backgroundPosition = "center";
  //cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // below is use when dynamic fetching is disable and user controls the cache
  // const cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener("click", onSavedButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}
const url = "https://pwagram-6bbfe.firebaseio.com/posts.json";
let networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    const dataArray = [];
    for (let key in data) dataArray.push(data[key]);
    console.log("from web", dataArray);
    updateUI(dataArray);
  })
  .catch(e => console.error("Failed https..get fetch with => ", e.message));

if ("indexedDB" in window) {
  readAllData("posts").then(data => {
    if (networkDataReceived) return;
    console.log("From indexDB", data);
    updateUI(data);
  });
}

function sendData() {
  const id = new Date().toISOString();
  const postData = new FormData();
  postData.append("id", id);
  postData.append("title", titleInput.value);
  postData.append("location", locationInput.value);
  postData.append("file", picture, id + ".png");
  postData.append("rawLocationLat", fetchedLocation.lat);
  postData.append("rawLocationLng", fetchedLocation.lng);
  fetch("https://us-central1-pwagram-6bbfe.cloudfunctions.net/storePostData", {
    method: "POST",
    body: postData
  }).then(resp => {
    console.log("Send Data", resp);
    updateUI();
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    return alert("Please enter valid data");
  }
  closeCreatePostModal();
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(sw => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
      };
      writeData("sync-posts", post)
        .then(() => {
          return sw.sync.register("sync-new-post");
        })
        .then(() => {
          const snackBarContainer = document.querySelector(
            "#confirmation-toast"
          );
          const data = { message: "Your post has been saved for syncing!" };
          snackBarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(err => console.error(err));
    });
  } else {
    sendData();
  }
});
