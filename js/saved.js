import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, deleteDoc, doc, getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const SELECTION_KEY = "quizSelection";
const wrapper    = document.getElementById("savedCards");
const emptyState = document.getElementById("savedEmpty");
const openAuthBtn = document.getElementById("openAuth");
const searchInput = document.getElementById("savedSearch");

let currentUser = null;
let allSavedItems = [];

function t(key, fallback) {
  const lang = localStorage.getItem("siteLang") || "uz";
  return window.langData?.[lang]?.[key] || fallback;
}

function getKey(subject, topic) { return `${subject}|||${topic}`; }
function getDocId(key) { return encodeURIComponent(key); }

function escapeHtml(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  const q = String(query || "").trim();
  if (!q) return safe;
  const regex = new RegExp(escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return safe.replace(regex, (m) => `<mark>${m}</mark>`);
}

function injectStyles() {
  if (document.getElementById("saved-style")) return;
  const style = document.createElement("style");
  style.id = "saved-style";
  style.textContent = `
    .test-bookmark-btn {
      position:relative; background:none; border:none; cursor:pointer;
      padding:4px; display:flex; align-items:center; justify-content:center;
      flex-shrink:0; outline:none;
    }
    .test-bookmark-icon path {
      stroke:var(--icon-color,#888); fill:none; transition:stroke 0.25s,fill 0.25s;
    }
    .test-bookmark-btn.is-saved .test-bookmark-icon path { stroke:#22c55e; fill:#22c55e; }
    @keyframes bm-pop {
      0%{transform:scale(1);} 40%{transform:scale(1.45);} 70%{transform:scale(0.88);} 100%{transform:scale(1);}
    }
    .test-bookmark-btn.bm-animate .test-bookmark-icon { animation:bm-pop 0.45s cubic-bezier(.36,.07,.19,.97) forwards; }
    .bm-particle { position:absolute; width:5px; height:5px; border-radius:50%; background:#22c55e; opacity:0; pointer-events:none; }
    @keyframes bm-fly1{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(-14px,-14px) scale(0.4);}}
    @keyframes bm-fly2{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(14px,-14px) scale(0.4);}}
    @keyframes bm-fly3{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(-16px,10px) scale(0.4);}}
    @keyframes bm-fly4{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(16px,10px) scale(0.4);}}
    .test-bookmark-btn.bm-animate .p1{animation:bm-fly1 0.5s ease-out 0.05s forwards;}
    .test-bookmark-btn.bm-animate .p2{animation:bm-fly2 0.5s ease-out 0.05s forwards;}
    .test-bookmark-btn.bm-animate .p3{animation:bm-fly3 0.5s ease-out 0.05s forwards;}
    .test-bookmark-btn.bm-animate .p4{animation:bm-fly4 0.5s ease-out 0.05s forwards;}
    @keyframes bm-unsave{0%{transform:scale(1);}35%{transform:scale(0.75);}100%{transform:scale(1);}}
    .test-bookmark-btn.bm-unsave-animate .test-bookmark-icon { animation:bm-unsave 0.3s ease forwards; }
    .test-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
    .test-card-subject-badge{
      font-size:0.72rem;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;
      padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.08);
      color:var(--icon-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;
    }
    .test-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;}
    .test-card-count{font-size:0.8rem;color:rgba(255,255,255,0.45);font-weight:500;}
    .test-card-arrow{color:rgba(255,255,255,0.3);transition:color 0.2s,transform 0.2s;display:flex;}
    .test-card:hover .test-card-arrow{color:#22c55e;transform:translateX(3px);}
  `;
  document.head.appendChild(style);
}

function renderEmpty(text) {
  if (emptyState) { emptyState.textContent = text; emptyState.style.display = "block"; }
  if (wrapper) wrapper.innerHTML = "";
}

function renderCards(items, query = "") {
  if (!wrapper) return;
  if (!items.length) { renderEmpty(t("SavedEmpty", "Hozircha saqlangan testlar yo'q.")); return; }
  if (emptyState) emptyState.style.display = "none";

  wrapper.innerHTML = items.map((item) => `
    <div class="test-card"
      data-subject="${escapeHtml(item.subject)}"
      data-topic="${escapeHtml(item.topic)}"
      data-count="${item.count || 0}"
      data-display-subject="${escapeHtml(item.displaySubject || item.subject)}">
      <div class="test-card-header">
        <span class="test-card-subject-badge">${highlight(item.displaySubject || item.subject, query)}</span>
        <button class="test-bookmark-btn is-saved" type="button" aria-label="${t("SavedRemoveAria", "O'chirish")}">
          <svg class="test-bookmark-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14.0176 1.6665H5.98424C4.20924 1.6665 2.76758 3.1165 2.76758 4.88316V16.6249C2.76758 18.1249 3.84258 18.7582 5.15924 18.0332L9.22591 15.7749C9.65924 15.5332 10.3592 15.5332 10.7842 15.7749L14.8509 18.0332C16.1676 18.7665 17.2426 18.1332 17.2426 16.6249V4.88316C17.2342 3.1165 15.7926 1.6665 14.0176 1.6665Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="bm-particle p1"></span>
          <span class="bm-particle p2"></span>
          <span class="bm-particle p3"></span>
          <span class="bm-particle p4"></span>
        </button>
      </div>
      <div class="test-card-title">${highlight(item.topic, query)}</div>
      <div class="test-card-footer">
        <span class="test-card-count">${item.count || 0} ${t("SavedTestsCount", "test")}</span>
        <span class="test-card-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    </div>
  `).join("");
}

function applySavedFilter() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  if (!q) { renderCards(allSavedItems, ""); return; }
  const filtered = allSavedItems.filter((item) =>
    String(item.displaySubject || item.subject || "").toLowerCase().includes(q) ||
    String(item.topic || "").toLowerCase().includes(q)
  );
  renderCards(filtered, q);
}

async function loadSaved() {
  if (!currentUser) return;
  const snap = await getDocs(collection(db, "users", currentUser.uid, "savedTests"));
  const items = [];
  snap.forEach((d) => { const data = d.data(); if (data?.subject && data?.topic) items.push(data); });
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
      if (!currentUser) { openAuthBtn?.click(); return; }
      const card = btn.closest(".test-card");
      if (!card) return;
      const key = getKey(card.getAttribute("data-subject") || "", card.getAttribute("data-topic") || "");
      const ref = doc(db, "users", currentUser.uid, "savedTests", getDocId(key));

      btn.classList.remove("is-saved");
      btn.classList.add("bm-unsave-animate");
      btn.addEventListener("animationend", () => {
        deleteDoc(ref).then(() => loadSaved()).catch(console.error);
      }, { once: true });
      return;
    }

    const card = e.target.closest(".test-card");
    if (!card) return;
    const subject = card.getAttribute("data-subject");
    const topic   = card.getAttribute("data-topic");
    const displaySubject = card.getAttribute("data-display-subject") || subject;
    if (!subject || !topic) return;
    localStorage.setItem(SELECTION_KEY, JSON.stringify({ subject, topic, displaySubject, startedAt: Date.now() }));
    window.location.href = `./test.html?${new URLSearchParams({ subject, topic })}`;
  });
}

injectStyles();

onAuthStateChanged(auth, async (user) => {
  currentUser = user?.emailVerified ? user : null;
  if (!currentUser) { renderEmpty(t("SavedNeedLogin", "Saqlanganlarni ko'rish uchun tizimga kiring.")); return; }
  await loadSaved();
});

document.querySelectorAll(".settings-select").forEach((el) => {
  el.addEventListener("lang-update", () => {
    if (!currentUser) { renderEmpty(t("SavedNeedLogin", "Saqlanganlarni ko'rish uchun tizimga kiring.")); return; }
    loadSaved();
  });
});

bindEvents();
searchInput?.addEventListener("input", applySavedFilter);