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
  const userWrap = row.nick?.parentElement;
  let avatar = userWrap?.querySelector(".rating-avatar");
  if (userWrap && !avatar) {
    avatar = document.createElement("span");
    avatar.className = "rating-avatar";
    userWrap.insertBefore(avatar, row.nick);
  }

  if (!data) {
    row.nick.textContent = "-";
    row.meta.textContent = "-";
    row.score.textContent = "-";
    if (avatar) {
      avatar.textContent = "-";
      avatar.style.backgroundImage = "";
    }
    return;
  }

  const totalScore = Number(data.totalScore) || 0;
  const solved = Number(data.solved) || 0;
  const correct = Number(data.correct) || 0;
  const wrong = Number(data.wrong) || 0;

  const totalAnswers = correct + wrong;
  const accuracy =
    totalAnswers > 0 ? Math.round((correct / totalAnswers) * 100) : 0;
  const level = Math.floor(totalScore / 100) + 1;

  const displayName =
    (data.displayName || "").trim() || t("GuestUser", "Mehmon (Guest)");
  row.nick.textContent = displayName;
  row.meta.innerHTML = `
    <span class="rating-chip">
      <img src="../images/icons/alltests.png" alt="${t("RatingSolvedPrefix", "Yechilgan")}" />
      ${t("RatingSolvedPrefix", "Yechilgan")}: ${solved}
    </span>
    <span class="rating-chip">
      <img src="../images/icons/xpicon.svg" alt="${t("RatingLevel", "Daraja")}" />
      ${t("RatingLevel", "Daraja")}: ${level}
    </span>
    <span class="rating-chip">
      <img src="../images/icons/correct.webp" alt="${t("RatingAccuracy", "Aniqlik")}" />
      ${t("RatingAccuracy", "Aniqlik")}: ${accuracy}%
    </span>
  `;
  row.score.textContent = String(totalScore);

  if (avatar) {
    const letter = row.nick.textContent.trim()[0]?.toUpperCase() || "G";
    if (data.avatarUrl) {
      avatar.textContent = "";
      avatar.style.backgroundImage = `url("${data.avatarUrl}")`;
      avatar.classList.add("has-photo");
    } else {
      avatar.textContent = letter;
      avatar.style.backgroundImage = "";
      avatar.classList.remove("has-photo");
    }
  }
}

function renderEmptyBoard() {
  for (let i = 0; i < topItems.length; i += 1) {
    setTopRow(i, null);
  }
  const first = topItems[0];
  if (!first) return;
  first.nick.textContent = t("RatingEmpty", "Hali reyting yo'q.");
  first.meta.textContent = t(
    "RatingEmptySub",
    "Birinchi natijani siz yarating.",
  );
  first.score.textContent = "-";
}

async function loadTopTen() {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("totalScore", "desc"),
    limit(10),
  );

  const snap = await getDocs(q);
  const list = [];
  snap.forEach((docSnap) => list.push(docSnap.data()));

  if (list.length === 0) {
    renderEmptyBoard();
    return;
  }

  for (let i = 0; i < 10; i += 1) {
    setTopRow(i, list[i]);
  }
}

async function initRating() {
  try {
    await loadTopTen();
  } catch (err) {
    console.error("Rating load error:", err);
    renderEmptyBoard();
  }
}

initRating();
