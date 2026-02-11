import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
const wrapper = document.getElementById("resultsCards");
const emptyState = document.getElementById("resultsEmpty");
const openAuthBtn = document.getElementById("openAuth");
const searchInput = document.getElementById("resultsSearch");

let currentUser = null;
let allResults = [];

function t(key, fallback) {
  const lang = localStorage.getItem("siteLang") || "uz";
  return window.langData?.[lang]?.[key] || fallback;
}

function formatTime(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function showLoginRequired() {
  openAuthBtn?.click();
  const msg = t(
    "ResultsNeedLoginToast",
    "Natijalarni ko'rish uchun tizimga kiring",
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
    renderEmpty(t("ResultsEmpty", "Hozircha natijalar yo'q."));
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  wrapper.innerHTML = items
    .map((item) => {
      const subject = item.displaySubject || item.subject;
      const topic = item.topic || "";
      const total = item.total ?? 0;
      const correct = item.correct ?? 0;
      const wrong = item.wrong ?? 0;
      const score = item.score ?? 0;
      const time = formatTime(item.durationMs || 0);

      return `
        <div class="test-card result-card">
          <div class="test-card-top-wrapper">
            <div class="test-card-top">
              <div class="test-card-subject">${highlight(subject, query)}</div>
            </div>
            <div class="result-header">
              <div class="result-title-row">
                <div class="test-card-title">${highlight(topic, query)}</div>
              </div>
              <div class="result-meta-row">
                <div class="result-row">
                  <span class="result-chip">
                    <img src="${basePath}/images/icons/alltests.png" alt="${t("ResultsLabelTotal", "Jami")}" />
                    ${t("ResultsLabelTotal", "Jami")}: ${total}
                  </span>
                  <span class="result-chip">
                    <img src="${basePath}/images/icons/correct.webp" alt="${t("ResultsLabelCorrect", "To'g'ri")}" />
                    ${t("ResultsLabelCorrect", "To'g'ri")}: ${correct}
                  </span>
                  <span class="result-chip">
                    <img src="${basePath}/images/icons/incorrect.png" alt="${t("ResultsLabelWrong", "Noto'g'ri")}" />
                    ${t("ResultsLabelWrong", "Noto'g'ri")}: ${wrong}
                  </span>
                  <span class="result-chip">
                    <img src="${basePath}/images/icons/timer.png" alt="${t("ResultsLabelTime", "Vaqt")}" />
                    ${t("ResultsLabelTime", "Vaqt")}: ${time}
                  </span>
                </div>
                <div class="result-score">
                  <img src="${basePath}/images/icons/xpicon.svg" alt="${t("ResultsLabelScore", "Ball")}" />
                  ${t("ResultsLabelScore", "Ball")}: ${score}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function applyResultsFilter() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  if (!query) {
    renderCards(allResults, "");
    return;
  }

  const filtered = allResults.filter((item) => {
    const subject = String(
      item.displaySubject || item.subject || "",
    ).toLowerCase();
    const topic = String(item.topic || "").toLowerCase();
    return subject.includes(query) || topic.includes(query);
  });

  renderCards(filtered, query);
}

async function loadResults() {
  if (!currentUser) return;
  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "results"),
  );
  const items = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data?.subject && data?.topic) items.push(data);
  });

  items.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  allResults = items;
  applyResultsFilter();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user && user.emailVerified ? user : null;
  if (!currentUser) {
    renderEmpty(
      t("ResultsNeedLogin", "Natijalarni ko'rish uchun tizimga kiring."),
    );
    showLoginRequired();
    return;
  }
  await loadResults();
});

document.querySelectorAll(".settings-select").forEach((el) => {
  el.addEventListener("lang-update", () => {
    if (!currentUser) {
      renderEmpty(
        t("ResultsNeedLogin", "Natijalarni ko'rish uchun tizimga kiring."),
      );
      return;
    }
    loadResults();
  });
});

searchInput?.addEventListener("input", applyResultsFilter);
