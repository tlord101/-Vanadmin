
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

// Firebase configuration moved from App.tsx
const firebaseConfig = {
  apiKey: "AIzaSyBbvjDDFf7kb5tdvv5iOR2v29HFcb-vBhU",
  authDomain: "tick-c20ac.firebaseapp.com",
  databaseURL: "https://tick-c20ac-default-rtdb.firebaseio.com",
  projectId: "tick-c20ac",
  storageBucket: "tick-c20ac.appspot.com",
  messagingSenderId: "717973440095",
  appId: "1:717973440095:web:3e388dc40755",
  measurementId: "G-B5MQ1LETCL"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Get Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);

export { app, auth, db, functions };
