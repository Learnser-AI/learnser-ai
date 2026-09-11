// Firebase Configuration Template
// Copy this file to firebase-config.js and fill in your actual credentials.

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    databaseURL: "https://your-app-default-rtdb.region.firebasedatabase.app",
    projectId: "your-project-id",
    storageBucket: "your-app.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export services for global use
window.auth = firebase.auth();
window.database = firebase.database();

let storage = null;
try {
    storage = firebase.storage();
} catch (e) {
    console.error("Firebase Storage initialization failed:", e);
}
window.storage = storage;

window.SUPER_ADMIN_EMAILS = [
    'admin@example.com'
];
