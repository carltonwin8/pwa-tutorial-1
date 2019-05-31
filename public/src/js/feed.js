var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");

function openCreatePostModal() {
  createPostArea.style.display = "block";
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(result => {
    console.log("outcome", result.outcome);
    if (result.outcome === "dismissed") console.log("User cancelled");
    else console.log("user added to home screen");
  });
  deferredPrompt = null;
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
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
function createCard() {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.textContent = "San Francisco Trip";
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = "In San Francisco";
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

const url = "https://httpbin.org/get";
let networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log("from web", data);
    clearCards();
    createCard();
  })
  .catch(e => console.error("Failed https..get fetch with => ", e.message));

if ("caches" in window) {
  caches
    .match(url)
    .then(response => (response ? response.json() : null))
    .then(data => {
      console.log("from cache", data);
      if (!networkDataReceived) {
        clearCards();
        createCard();
      }
    });
}
