import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
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

const myUserName = document.getElementById("myUserName");
const myTodayScore = document.getElementById("myTodayScore");
const myTotalScore = document.getElementById("myTotalScore");
const mySolved = document.getElementById("mySolved");
const myCorrect = document.getElementById("myCorrect");
const myProgressPercent = document.getElementById("myProgressPercent");
const myRankPill = document.querySelector(".my-rank-pill");
const myAvatar = document.querySelector(".my-avatar");
const myScoreBox = document.getElementById("myScoreBox");
const ratingCtaTitle = document.getElementById("ratingCtaTitle");
const ratingCtaDesc = document.getElementById("ratingCtaDesc");
const ratingCtaBtn = document.getElementById("ratingCtaBtn");

let currentUser = null;

function setTopRow(index, data) {
  const row = topItems[index];
  if (!row) return;

  if (!data) {
    row.nick.textContent = "—";
    row.meta.textContent = "—";
    row.score.textContent = "0";
    return;
  }

  row.nick.textContent = data.displayName || "User";
  row.meta.textContent = `Yechilgan: ${data.solved || 0}`;
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

  return list;
}

function setMyStats(stats, topScore) {
  const displayName =
    stats?.displayName ||
    currentUser?.displayName ||
    localStorage.getItem("authUserName") ||
    "Foydalanuvchi";

  if (myUserName) myUserName.textContent = displayName;
  if (myAvatar) myAvatar.textContent = displayName[0]?.toUpperCase() || "U";

  if (myTodayScore) myTodayScore.textContent = String(stats?.todayScore || 0);
  if (myTotalScore) myTotalScore.textContent = String(stats?.totalScore || 0);
  if (mySolved) mySolved.textContent = String(stats?.solved || 0);
  if (myCorrect) myCorrect.textContent = String(stats?.correct || 0);

  const percent =
    topScore > 0 ? Math.min(100, Math.round((stats?.totalScore || 0) / topScore * 100)) : 0;
  if (myProgressPercent) myProgressPercent.textContent = `${percent}%`;
  const fill = document.querySelector(".my-progress-fill");
  if (fill) fill.style.width = `${percent}%`;
}

async function loadMyStats(topTen) {
  if (!currentUser) return;

  const statsRef = doc(db, "users", currentUser.uid, "stats", "summary");
  const snap = await getDoc(statsRef);
  const stats = snap.exists() ? snap.data() : null;

  const topScore = topTen?.[0]?.totalScore || 0;
  setMyStats(stats, topScore);

  if (myRankPill) {
    const inTop = topTen?.findIndex((x) => x.uid === currentUser.uid);
    myRankPill.textContent = inTop >= 0 ? `#${inTop + 1}` : "#—";
  }
}

function setLoggedOutCTA() {
  if (myScoreBox) myScoreBox.style.display = "none";
  if (ratingCtaTitle) ratingCtaTitle.textContent = "Kirish qilib ro‘yxatdan o‘ting";
  if (ratingCtaDesc)
    ratingCtaDesc.textContent =
      "Kirish qilsangiz natijalar saqlanadi va Top reytinglarga chiqish imkoniyati bo‘ladi.";
  if (ratingCtaBtn) {
    ratingCtaBtn.textContent = "Kirish / Ro‘yxatdan o‘tish";
    ratingCtaBtn.setAttribute("href", "#");
    ratingCtaBtn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        document.getElementById("openAuth")?.click();
      },
      { once: true }
    );
  }
}

function setLoggedInCTA() {
  if (myScoreBox) myScoreBox.style.display = "";
  if (ratingCtaTitle) ratingCtaTitle.textContent = "Reytingga chiqishni xohlaysizmi?";
  if (ratingCtaDesc)
    ratingCtaDesc.innerHTML =
      "Ko‘proq test yeching, xatolarni tahlil qiling — ballingiz oshib, <b>Top reytinglarda</b> yuqorilaysiz.";
  if (ratingCtaBtn) {
    ratingCtaBtn.textContent = "Testlarni boshlash";
    ratingCtaBtn.setAttribute("href", "../html/themetest.html");
  }
}

async function initRating() {
  try {
    const topTen = await loadTopTen();
    await loadMyStats(topTen);
  } catch (err) {
    console.error("Rating load error:", err);
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user && user.emailVerified ? user : null;
  if (!currentUser) {
    setLoggedOutCTA();
  } else {
    setLoggedInCTA();
  }
  initRating();
});
