import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function addTodo(uid, text, date) {
  await addDoc(collection(db, "todos"), {
    userId: uid,
    text,
    date,
    completed: false,
    createdAt: Date.now(),
  });
}

export async function loadTodos(uid) {
  const q = query(collection(db, "todos"), where("userId", "==", uid));
  const snapshot = await getDocs(q);

  const todos = [];
  snapshot.forEach((d) => todos.push({ id: d.id, ...d.data() }));
  return todos;
}

export async function toggleTodo(id, completed) {
  const ref = doc(db, "todos", id);
  await updateDoc(ref, { completed });
}

export async function deleteTodo(id) {
  const ref = doc(db, "todos", id);
  await deleteDoc(ref);
}
