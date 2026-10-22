import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChHPI-XFrFl_u8ycffd4xucOir6Gf3zGQ",
  authDomain: "notetoexam.pages.dev",
  projectId: "notetoexam",
  storageBucket: "notetoexam.firebasestorage.app",
  messagingSenderId: "1027570273647",
  appId: "1:1027570273647:web:f4da16eef89e76a9be2c9a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// CRITICAL FIX: Force Firebase to remember the user across app reloads
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set auth persistence:", error);
});

export const db = getFirestore(app);
