import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export function setupAuth(onLogin) {
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  const authBox = document.getElementById("authBox");
  const appDiv = document.getElementById("app");
  const topBar = document.getElementById("topBar");
  const topUser = document.getElementById("topUserEmail");
  const topLogout = document.getElementById("topLogout");
  const header = document.querySelector(".app-header");
  const footer = document.querySelector("footer");

  document.getElementById("signup").onclick = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
      alert("Signup OK 🎉");
    } catch (e) {
      alert(e.message);
    }
  };

  document.getElementById("login").onclick = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } catch (e) {
      alert(e.message);
    }
  };

  topLogout.onclick = async () => {
    await signOut(auth);
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      authBox.style.display = "none";
      appDiv.style.display = "block";
      footer.style.display = "block";
      topBar.style.display = "flex";
      header.style.display = "flex";
      topUser.textContent = user.email;

      if (onLogin) await onLogin(user.uid);
    } else {
      authBox.style.display = "block";
      header.style.display = "none";
      appDiv.style.display = "none";
      footer.style.display = "none";
      topBar.style.display = "none";
      topUser.textContent = "Guest";
    }
  });
}
