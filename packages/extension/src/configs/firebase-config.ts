import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDVSJDYjFev2h5QNsJ6u7TzDNKmXB-pWcQ",
    authDomain: "enkrypt-security.firebaseapp.com",
    projectId: "enkrypt-security",
    storageBucket: "enkrypt-security.firebasestorage.app",
    messagingSenderId: "334347249787",
    appId: "1:334347249787:web:dc54d39dc02383dc45dade",
    measurementId: "G-5RRLNXVKKC"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Explicitly export these functions
export { auth, RecaptchaVerifier, signInWithPhoneNumber };
