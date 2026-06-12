// Firebase Configuration
// Replace these values with your actual Firebase project configuration
// Get these from: Firebase Console > Project Settings > Your apps > Firebase SDK snippet

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

// Get Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Super Admin email configuration
const SUPER_ADMIN_EMAILS = [
    'aryamansingh2w16@gmail.com',
    'gk123ganubanu@gmail.com'
];

// Export for use in other files
window.auth = auth;
window.database = database;
window.SUPER_ADMIN_EMAILS = SUPER_ADMIN_EMAILS;
