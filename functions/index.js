const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
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
      .then(() => response.status(201).json({ message: "data stored", id }))
      .catch(err => response.status(500).json({ error: err }));
  });
});
