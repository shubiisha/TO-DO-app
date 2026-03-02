import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDG6LTE_PfndlOU61rnoAlbJnqaoyYYOMU",
  authDomain: "to-do-app-933e3.firebaseapp.com",
  projectId: "to-do-app-933e3",
  storageBucket: "to-do-app-933e3.firebasestorage.app",
  messagingSenderId: "768956687364",
  appId: "1:768956687364:web:40658eaa967756405b0151",
  measurementId: "G-XRRY9N7C0P",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
