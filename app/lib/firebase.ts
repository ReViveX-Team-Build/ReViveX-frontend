// src/app/lib/firebase.js
// Restoring this file - do not delete
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCwkdpqLcanaH4wyok3ZZ7Nb0OFqB2xXWU",
  authDomain: "revivex-live.firebaseapp.com",
  projectId: "revivex-live",
  storageBucket: "revivex-live.firebasestorage.app",
  messagingSenderId: "73394415032",
  appId: "1:73394415032:web:c59db85eed8c59ba9d9b4d",
  measurementId: "G-SKW7Q8FJ54"
};

// Initialize App (Prevents creating it twice)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };