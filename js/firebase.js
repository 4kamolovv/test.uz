// /js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPXxtI1sXQvEAuDBPhfRxvKKKBrWPeIEo",
  authDomain: "login-f3dac.firebaseapp.com",
  projectId: "login-f3dac",
  storageBucket: "login-f3dac.firebasestorage.app",
  messagingSenderId: "258979847774",
  appId: "1:258979847774:web:704aa42eaae376bd541ecf",
  measurementId: "G-T0HF7NK32M"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
