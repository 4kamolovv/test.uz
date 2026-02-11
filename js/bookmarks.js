import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const wrapper = document.querySelector(".test-card-wrapper");
const openAuthBtn = document.getElementById("openAuth");

const savedKeys = new Set();
let currentUser = null;

function getKey(subject, topic) {
  return `${subject}|||${topic}`;
}

function getDocId(key) {
  return encodeURIComponent(key);
}

function showLoginRequired() {
  openAuthBtn?.click();
  if (typeof window.showToast === "function") {
    window.showToast("warning", "Saqlash uchun tizimga kiring");
  } else {
    alert("Saqlash uchun tizimga kiring");
  }
}

function applySavedState() {
  if (!wrapper) return;
  wrapper.querySelectorAll(".test-card").forEach((card) => {
    const subject = card.getAttribute("data-subject") || "";
    const topic = card.getAttribute("data-topic") || "";
    const key = getKey(subject, topic);
    const btn = card.querySelector(".test-bookmark-btn");
    if (!btn) return;
    btn.classList.toggle("saved", savedKeys.has(key));
  });
}

async function loadSavedKeys() {
  savedKeys.clear();
  if (!currentUser) return;

  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "savedTests"),
  );
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data?.key) savedKeys.add(data.key);
  });
}

async function toggleSaved(card) {
  if (!currentUser) {
    showLoginRequired();
    return;
  }

  const subject = card.getAttribute("data-subject") || "";
  const topic = card.getAttribute("data-topic") || "";
  const displaySubject = card.getAttribute("data-display-subject") || subject;
  const count = Number(card.getAttribute("data-count") || "0");
  const key = getKey(subject, topic);
  const docId = getDocId(key);
  const ref = doc(db, "users", currentUser.uid, "savedTests", docId);

  if (savedKeys.has(key)) {
    await deleteDoc(ref);
    savedKeys.delete(key);
  } else {
    await setDoc(ref, {
      key,
      subject,
      topic,
      displaySubject,
      count,
      updatedAt: serverTimestamp(),
    });
    savedKeys.add(key);
  }

  applySavedState();
}

function bindEvents() {
  if (!wrapper) return;

  wrapper.addEventListener("click", (e) => {
    const btn = e.target.closest(".test-bookmark-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const card = btn.closest(".test-card");
    if (!card) return;
    toggleSaved(card).catch((err) => console.error("Bookmark error:", err));
  });
}

document.addEventListener("cards-rendered", () => {
  applySavedState();
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user && user.emailVerified ? user : null;
  if (currentUser) {
    await loadSavedKeys();
  } else {
    savedKeys.clear();
  }
  applySavedState();
});

bindEvents();
