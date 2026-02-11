import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
const SELECTION_KEY = "quizSelection";

const wrapper = document.getElementById("savedCards");
const emptyState = document.getElementById("savedEmpty");
const openAuthBtn = document.getElementById("openAuth");
const searchInput = document.getElementById("savedSearch");

let currentUser = null;
let allSavedItems = [];

function t(key, fallback) {
  const lang = localStorage.getItem("siteLang") || "uz";
  return window.langData?.[lang]?.[key] || fallback;
}

function getKey(subject, topic) {
  return `${subject}|||${topic}`;
}

function getDocId(key) {
  return encodeURIComponent(key);
}

function showLoginRequired() {
  openAuthBtn?.click();
  const msg = t(
    "SavedNeedLoginToast",
    "Saqlanganlarni ko'rish uchun tizimga kiring",
  );
  if (typeof window.showToast === "function") {
    window.showToast("warning", msg);
  } else {
    alert(msg);
  }
}

function renderEmpty(text) {
  if (emptyState) {
    emptyState.textContent = text;
    emptyState.style.display = "block";
  }
  if (wrapper) wrapper.innerHTML = "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlight(text, query) {
  const safeText = escapeHtml(text);
  const q = String(query || "").trim();
  if (!q) return safeText;
  const safeQuery = escapeHtml(q);
  const regex = new RegExp(
    safeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi",
  );
  return safeText.replace(regex, (match) => `<mark>${match}</mark>`);
}

function renderCards(items, query = "") {
  if (!wrapper) return;
  if (!items.length) {
    renderEmpty(t("SavedEmpty", "Hozircha saqlangan testlar yo'q."));
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  wrapper.innerHTML = items
    .map(
      (item) => `
      <div class="test-card" data-subject="${item.subject}" data-topic="${item.topic}" data-count="${item.count || 0}" data-display-subject="${item.displaySubject || item.subject}">
        <div class="test-card-top-wrapper">
          <div class="test-card-top">
            <div class="test-card-subject">${highlight(item.displaySubject || item.subject, query)}</div>
            <button class="test-bookmark-btn saved" type="button" aria-label="${t("SavedRemoveAria", "Saqlash")}">
              <svg class="test-bookmark-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.70898 7.5415C9.19232 8.08316 10.809 8.08316 12.2923 7.5415" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14.0176 1.6665H5.98424C4.20924 1.6665 2.76758 3.1165 2.76758 4.88316V16.6249C2.76758 18.1249 3.84258 18.7582 5.15924 18.0332L9.22591 15.7749C9.65924 15.5332 10.3592 15.5332 10.7842 15.7749L14.8509 18.0332C16.1676 18.7665 17.2426 18.1332 17.2426 16.6249V4.88316C17.2342 3.1165 15.7926 1.6665 14.0176 1.6665Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14.0176 1.6665H5.98424C4.20924 1.6665 2.76758 3.1165 2.76758 4.88316V16.6249C2.76758 18.1249 3.84258 18.7582 5.15924 18.0332L9.22591 15.7749C9.65924 15.5332 10.3592 15.5332 10.7842 15.7749L14.8509 18.0332C16.1676 18.7665 17.2426 18.1332 17.2426 16.6249V4.88316C17.2342 3.1165 15.7926 1.6665 14.0176 1.6665Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="test-card-title">${highlight(item.topic, query)}</div>
        </div>
        <div class="test-card-footer">
          <div class="test-card-stat">
            <img src="${basePath}/images/icons/quantityicon.svg" alt="${t("TestCountAlt", "Test soni")}" class="test-icon">
            <span>${item.count || 0} ${t("SavedTestsCount", "test")}</span>
          </div>
        </div>
      </div>
    `,
    )
    .join("");
}

function applySavedFilter() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  if (!query) {
    renderCards(allSavedItems, "");
    return;
  }

  const filtered = allSavedItems.filter((item) => {
    const subject = String(
      item.displaySubject || item.subject || "",
    ).toLowerCase();
    const topic = String(item.topic || "").toLowerCase();
    return subject.includes(query) || topic.includes(query);
  });

  renderCards(filtered, query);
}

async function loadSaved() {
  if (!currentUser) return;
  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "savedTests"),
  );
  const items = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data?.subject && data?.topic) items.push(data);
  });
  allSavedItems = items;
  applySavedFilter();
}

function bindEvents() {
  if (!wrapper) return;

  wrapper.addEventListener("click", (e) => {
    const btn = e.target.closest(".test-bookmark-btn");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();

      if (!currentUser) {
        showLoginRequired();
        return;
      }

      const card = btn.closest(".test-card");
      if (!card) return;

      const subject = card.getAttribute("data-subject") || "";
      const topic = card.getAttribute("data-topic") || "";
      const key = getKey(subject, topic);
      const ref = doc(
        db,
        "users",
        currentUser.uid,
        "savedTests",
        getDocId(key),
      );

      deleteDoc(ref)
        .then(() => loadSaved())
        .catch((err) => console.error("Remove saved error:", err));
      return;
    }

    const card = e.target.closest(".test-card");
    if (!card) return;
    const subject = card.getAttribute("data-subject");
    const topic = card.getAttribute("data-topic");
    const displaySubject = card.getAttribute("data-display-subject") || subject;
    if (!subject || !topic) return;

    const selection = { subject, topic, displaySubject, startedAt: Date.now() };
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
    const params = new URLSearchParams({ subject, topic });
    window.location.href = `./test.html?${params.toString()}`;
  });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user && user.emailVerified ? user : null;
  if (!currentUser) {
    renderEmpty(
      t("SavedNeedLogin", "Saqlanganlarni ko'rish uchun tizimga kiring."),
    );
    return;
  }
  await loadSaved();
});

document.querySelectorAll(".settings-select").forEach((el) => {
  el.addEventListener("lang-update", () => {
    if (!currentUser) {
      renderEmpty(
        t("SavedNeedLogin", "Saqlanganlarni ko'rish uchun tizimga kiring."),
      );
      return;
    }
    loadSaved();
  });
});

bindEvents();
searchInput?.addEventListener("input", applySavedFilter);
