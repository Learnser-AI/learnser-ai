// Firebase Configuration
// Initialized from the learnser-ai project credentials.

const firebaseConfig = {
    apiKey: "AIzaSyC5_jj24rIgXT8L_L797lhCFAN7w5ElgNo",
    authDomain: "learnser-ai.firebaseapp.com",
    databaseURL: "https://learnser-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "learnser-ai",
    storageBucket: "learnser-ai.firebasestorage.app",
    messagingSenderId: "129594512127",
    appId: "1:129594512127:web:64033b173fb222732972ca",
    measurementId: "G-XRHE3YK3BZ"
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
    'aryamansingh2w16@gmail.com',
    'gk123ganubanu@gmail.com'
];
