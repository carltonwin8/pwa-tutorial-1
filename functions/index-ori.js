const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webpush = require("web-push");
const formidable = require("formidable");
const fs = require("fs");
const UUID = require("uuid-v4");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./serviceAccountKey.json");

const gcconfig = {
  projectId: "pwagram-6bbfe",
  keyFilename: "serviceAccountKey.json"
};

const gcs = require("@google-cloud/storage")(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-6bbfe.firebaseio.com"
});

exports.helloWorld = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const uuid = UUID();
    const formData = new formidable.IncomingForm();
    formData.parse(request, (err, fields, files) => {
      fs.renameSync(file.file.path, "/tmp/" + files.file.name);
      const bucket = gcs.bucket("gs://pwagram-6bbfe.appspot.com");
      bucket.upload(
        "/tmp/" + files.file.name,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: file.file.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        (err, file) => {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(file.name) +
                  "?alt=media&token=" +
                  uuid
              })
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
                return response
                  .status(201)
                  .json({ message: "data stored", id: fields.id });
              })
              .catch(err => response.status(500).json({ error: err }));
          } else {
            console.log(err);
          }
        }
      );
    });
  });
});
