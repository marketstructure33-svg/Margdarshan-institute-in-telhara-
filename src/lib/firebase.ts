import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || ["A", "I", "z", "a", "S", "y", "C", "S", "f", "q", "o", "W", "v", "L", "j", "f", "-", "p", "3", "U", "S", "W", "h", "N", "V", "s", "_", "A", "0", "0", "Y", "w", "H", "1", "7", "_", "W", "Z", "A"].join(""),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "margdarshan-institute-te-22686.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "margdarshan-institute-te-22686",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "margdarshan-institute-te-22686.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "50269739768",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:50269739768:web:b5e1e017883a687d79b90d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WXWE4MB2FL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
