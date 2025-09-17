// config/firebase.js
const admin = require('firebase-admin');   // <-- you forgot this
const { v4: uuid } = require('uuid');
const fs = require('fs');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

async function uploadToFirebase(localPath, destPath) {
  const token = uuid();
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  fs.unlinkSync(localPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destPath)}?alt=media&token=${token}`;
}

module.exports = { uploadToFirebase };
