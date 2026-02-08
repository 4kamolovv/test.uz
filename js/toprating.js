import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const topItems = Array.from({ length: 10 }, (_, i) => ({
  nick: document.getElementById(`topNick${i + 1}`),
  meta: document.getElementById(`topMeta${i + 1}`),
  score: document.getElementById(`topScore${i + 1}`),
}));

function t(key, fallback) {
  const lang = localStorage.getItem("siteLang") || "uz";
  return window.langData?.[lang]?.[key] || fallback;
}

function setTopRow(index, data) {
  const row = topItems[index];
  if (!row) return;

  if (!data) {
    row.nick.textContent = "-";
    row.meta.textContent = "-";
    row.score.textContent = "0";
    return;
  }

  row.nick.textContent = data.displayName || "User";
  row.meta.textContent = `${t("RatingSolvedPrefix", "Yechilgan")}: ${data.solved || 0}`;
  row.score.textContent = String(data.totalScore || 0);
}

async function loadTopTen() {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("totalScore", "desc"),
    limit(10)
  );

  const snap = await getDocs(q);
  const list = [];
  snap.forEach((docSnap) => list.push(docSnap.data()));

  for (let i = 0; i < 10; i += 1) {
    setTopRow(i, list[i]);
  }
}

async function initRating() {
  try {
    await loadTopTen();
  } catch (err) {
    console.error("Rating load error:", err);
  }
}

initRating();
