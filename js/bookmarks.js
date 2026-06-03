import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const wrapper = document.querySelector(".test-card-wrapper");
const openAuthBtn = document.getElementById("openAuth");
const savedKeys = new Set();
let currentUser = null;

function t(key, fallback) {
  const lang = localStorage.getItem("siteLang") || "uz";
  return window.langData?.[lang]?.[key] || fallback;
}

function getKey(subject, topic) { return `${subject}|||${topic}`; }
function getDocId(key) { return encodeURIComponent(key); }

function showLoginRequired() {
  openAuthBtn?.click();
  if (typeof window.showToast === "function") {
    window.showToast("warning", t("BookmarkNeedLogin", "Saqlash uchun tizimga kiring"));
  }
}

function applySavedState() {
  if (!wrapper) return;
  wrapper.querySelectorAll(".test-card").forEach((card) => {
    const key = getKey(
      card.getAttribute("data-subject") || "",
      card.getAttribute("data-topic") || ""
    );
    card.querySelector(".test-bookmark-btn")?.classList.toggle("is-saved", savedKeys.has(key));
  });
}

async function loadSavedKeys() {
  savedKeys.clear();
  if (!currentUser) return;
  const snap = await getDocs(collection(db, "users", currentUser.uid, "savedTests"));
  snap.forEach((d) => { if (d.data()?.key) savedKeys.add(d.data().key); });
}

async function toggleSaved(card, btn) {
  if (!currentUser) { showLoginRequired(); return; }

  const subject = card.getAttribute("data-subject") || "";
  const topic   = card.getAttribute("data-topic")   || "";
  const displaySubject = card.getAttribute("data-display-subject") || subject;
  const count   = Number(card.getAttribute("data-count") || "0");
  const key     = getKey(subject, topic);
  const ref     = doc(db, "users", currentUser.uid, "savedTests", getDocId(key));

  btn.classList.remove("bm-animate", "bm-unsave-animate");
  void btn.offsetWidth;

  if (savedKeys.has(key)) {
    savedKeys.delete(key);
    btn.classList.remove("is-saved");
    btn.classList.add("bm-unsave-animate");
    btn.addEventListener("animationend", () => btn.classList.remove("bm-unsave-animate"), { once: true });
    await deleteDoc(ref).catch(console.error);
  } else {
    savedKeys.add(key);
    btn.classList.add("is-saved", "bm-animate");
    btn.addEventListener("animationend", () => btn.classList.remove("bm-animate"), { once: true });
    await setDoc(ref, { key, subject, topic, displaySubject, count, updatedAt: serverTimestamp() }).catch(console.error);
  }
}

wrapper?.addEventListener("click", (e) => {
  const btn = e.target.closest(".test-bookmark-btn");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const card = btn.closest(".test-card");
  if (card) toggleSaved(card, btn);
});

document.addEventListener("cards-rendered", applySavedState);

onAuthStateChanged(auth, async (user) => {
  currentUser = user?.emailVerified ? user : null;
  if (currentUser) await loadSavedKeys();
  else savedKeys.clear();
  applySavedState();
});