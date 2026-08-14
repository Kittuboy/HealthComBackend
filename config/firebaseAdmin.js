const {
    initializeApp,
    cert
} = require("firebase-admin/app");

const {
    getMessaging
} = require("firebase-admin/messaging");

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined
};

if (
    !serviceAccount.projectId ||
    !serviceAccount.clientEmail ||
    !serviceAccount.privateKey
) {
    throw new Error(
        "Firebase environment variables are missing"
    );
}

const firebaseApp = initializeApp({
    credential: cert(serviceAccount)
});

const messaging = getMessaging(firebaseApp);

module.exports = {
    firebaseApp,
    messaging
};
