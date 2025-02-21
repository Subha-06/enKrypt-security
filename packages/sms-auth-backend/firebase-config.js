const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

// Load Firebase Admin SDK
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
