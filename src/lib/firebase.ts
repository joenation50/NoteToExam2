import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChHPI-XFrFl_u8ycffd4xucOir6Gf3zGQ",
  authDomain: "notetoexam.web.app",
  projectId: "notetoexam",
  storageBucket: "notetoexam.firebasestorage.app",
  messagingSenderId: "1027570273647",
  appId: "1:1027570273647:web:f4da16eef89e76a9be2c9a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore so the rest of your app can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
