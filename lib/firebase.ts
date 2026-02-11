import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6ECop87RCB1rWN4QM2M_ZsnyhPRT_FeM",
  authDomain: "revivex-5254b.firebaseapp.com",
  projectId: "revivex-5254b",
  storageBucket: "revivex-5254b.firebasestorage.app",
  messagingSenderId: "781678186006",
  appId: "1:781678186006:web:cd8eeed252203f134caf37"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);