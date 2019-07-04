const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webpush = require("web-push");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-6bbfe.firebaseio.com"
});

exports.helloWorld = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const { id, title, location, image } = request.body;
    admin
      .database()
      .ref("posts")
      .push({ id, title, location, image })
      .then(() => {
        webpush.setVapidDetails(
          "mailto:carlton.joseph@gmail.com",
          "BNHpuT3_GM0OItLIxbt71a36JD4g6XD3kOJuD3iLpHUs4i3tlll4eSisMRc7Ezt5mx1D0qG2hN_N2GhXBunTKno",
          "IyIuYXmvFSqXH7S6eAMC4_ZR_HbnjigQCbiZR3nR-qU"
        );
        return admin
          .database()
          .ref("subscriptions")
          .once("value");
      })
      .then(subscriptions => {
        subscriptions.forEach(sub => {
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New post added!",
                openUrl: "/help"
              })
            )
            .catch(e => console.log("web push error", e));
        });
        return response.status(201).json({ message: "data stored", id });
      })
      .catch(err => response.status(500).json({ error: err }));
  });
});
