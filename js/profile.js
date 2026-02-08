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

const refs = {
  avatar: document.getElementById("profileAvatar"),
  avatarBtn: document.getElementById("profileAvatarBtn"),
  avatarInput: document.getElementById("profileAvatarInput"),
  name: document.getElementById("profileName"),
  email: document.getElementById("profileEmail"),
  status: document.getElementById("profileStatus"),
  
  statTotalScore: document.getElementById("statTotalScore"),
  statTodayScore: document.getElementById("statTodayScore"),
  statSolved: document.getElementById("statSolved"),
  statAccuracy: document.getElementById("statAccuracy"),
  
  levelText: document.getElementById("profileLevelText"),
  levelBar: document.getElementById("profileLevelBar"),
  
  goalDailyLabel: document.getElementById("goalDailyLabel"),
  goalDailyBar: document.getElementById("goalDailyBar"),
  goalAccuracyLabel: document.getElementById("goalAccuracyLabel"),
  goalAccuracyBar: document.getElementById("goalAccuracyBar"),
  goalSolvedLabel: document.getElementById("goalSolvedLabel"),
  goalSolvedBar: document.getElementById("goalSolvedBar"),
  
  recentResults: document.getElementById("profileRecentResults"),
  openAuthBtn: document.getElementById("openAuth"),
};

function t(key, fallback) {
  const lang = localStorage.getItem("siteLang") || "uz";
  return window.langData?.[lang]?.[key] || fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setBar(el, value) {
  if (!el) return;
  el.style.width = `${clamp(Math.round(value), 0, 100)}%`;
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatDate(ts) {
  if (!ts?.seconds) return "-";
  const d = new Date(ts.seconds * 1000);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function setGuestState() {
  refs.name.textContent = localStorage.getItem("authUserName") || t("ProfileGuestName", "Mehmon");
  refs.email.textContent = t("ProfileEmailPrompt", "Email: tizimga kiring");
  refs.status.textContent = t("ProfileStatusGuest", "Profil holati: Mehmon rejimida");
  refs.avatar.textContent = "M";
  refs.avatar.style.backgroundImage = "";
  refs.avatar.classList.remove("has-photo");
  if (refs.avatarBtn) refs.avatarBtn.disabled = true;
  
  refs.statTotalScore.textContent = "0";
  refs.statTodayScore.textContent = "0";
  refs.statSolved.textContent = "0";
  refs.statAccuracy.textContent = "0%";
  
  refs.levelText.textContent = "Level 1 - 0%";
  setBar(refs.levelBar, 0);
  
  refs.goalDailyLabel.textContent = "0%";
  refs.goalAccuracyLabel.textContent = "0%";
  refs.goalSolvedLabel.textContent = "0%";
  
  setBar(refs.goalDailyBar, 0);
  setBar(refs.goalAccuracyBar, 0);
  setBar(refs.goalSolvedBar, 0);
  
  refs.recentResults.innerHTML = `<li class="recent-empty">${t("ProfileNeedLogin", "Natijalarni korish uchun tizimga kiring.")}</li>`;
}

function setAvatar(url, fallbackLetter) {
  if (!refs.avatar) return;
  if (url) {
    refs.avatar.style.backgroundImage = `url("${url}")`;
    refs.avatar.classList.add("has-photo");
    refs.avatar.textContent = "";
  } else {
    refs.avatar.style.backgroundImage = "";
    refs.avatar.classList.remove("has-photo");
    refs.avatar.textContent = fallbackLetter || "U";
  }
}

function getLocalAvatarKey(uid) {
  return `profileAvatar:${uid}`;
}

function renderStats(stats) {
  const totalScore = safeNumber(stats.totalScore);
  const todayScore = safeNumber(stats.todayScore);
  const solved = safeNumber(stats.solved);
  const correct = safeNumber(stats.correct);
  const wrong = safeNumber(stats.wrong);
  
  const totalAnswered = correct + wrong;
  const accuracy = totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;
  
  refs.statTotalScore.textContent = String(totalScore);
  refs.statTodayScore.textContent = String(todayScore);
  refs.statSolved.textContent = String(solved);
  refs.statAccuracy.textContent = `${Math.round(accuracy)}%`;
  
  const level = Math.floor(totalScore / 100) + 1;
  const progressInLevel = totalScore % 100;
  
  refs.levelText.textContent = `Level ${level} - ${progressInLevel}%`;
  setBar(refs.levelBar, progressInLevel);
  
  const dailyPct = clamp((todayScore / 100) * 100, 0, 100);
  const accuracyGoalPct = clamp((accuracy / 80) * 100, 0, 100);
  const solvedPct = clamp((solved / 20) * 100, 0, 100);
  
  refs.goalDailyLabel.textContent = `${Math.round(dailyPct)}%`;
  refs.goalAccuracyLabel.textContent = `${Math.round(accuracyGoalPct)}%`;
  refs.goalSolvedLabel.textContent = `${Math.round(solvedPct)}%`;
  
  setBar(refs.goalDailyBar, dailyPct);
  setBar(refs.goalAccuracyBar, accuracyGoalPct);
  setBar(refs.goalSolvedBar, solvedPct);
}

function renderRecent(items) {
  if (!items.length) {
    refs.recentResults.innerHTML = `<li class="recent-empty">${t("ProfileNoResults", "Hozircha natijalar yoq.")}</li>`;
    return;
  }
  
  refs.recentResults.innerHTML = items
  .map((item) => {
    const subject = item.displaySubject || item.subject || "-";
    const topic = item.topic || t("ProfileUntitledTest", "Nomsiz test");
    const score = safeNumber(item.score);
    const date = formatDate(item.createdAt);
    
    return `
        <li class="recent-item">
          <div class="recent-left">
            <p class="recent-topic">${topic}</p>
            <p class="recent-subject">${subject}</p>
          </div>
          <div class="recent-right">
            <span class="recent-score">${score} ${t("ProfileScoreUnit", "ball")}</span>
            <span class="recent-time">${date}</span>
          </div>
        </li>
      `;
  })
  .join("");
}

async function loadProfileData(user) {
  const statsRef = doc(db, "users", user.uid, "stats", "summary");
  const statsSnap = await getDoc(statsRef);
  const stats = statsSnap.exists() ? statsSnap.data() : {};
  renderStats(stats);

  const localAvatar = localStorage.getItem(getLocalAvatarKey(user.uid));
  if (localAvatar) {
    setAvatar(localAvatar);
  }

  const recentQuery = query(
    collection(db, "users", user.uid, "results"),
    orderBy("createdAt", "desc"),
    limit(5),
  );
  const recentSnap = await getDocs(recentQuery);
  const items = [];
  recentSnap.forEach((docSnap) => items.push(docSnap.data()));
  renderRecent(items);
}

onAuthStateChanged(auth, async (user) => {
  const currentUser = user && user.emailVerified ? user : null;
  
  if (!currentUser) {
    setGuestState();
    refs.openAuthBtn?.click();
    return;
  }
  
  const displayName =
  currentUser.displayName ||
  localStorage.getItem("authUserName") ||
  (currentUser.email ? currentUser.email.split("@")[0] : "Foydalanuvchi");
  
  refs.name.textContent = displayName;
  refs.email.textContent = `Email: ${currentUser.email || "-"}`;
  refs.status.textContent = t("ProfileStatusActive", "Profil holati: Aktiv");
  setAvatar("", displayName.trim()[0]?.toUpperCase() || "U");
  if (refs.avatarBtn) refs.avatarBtn.disabled = false;
  const localAvatar = localStorage.getItem(getLocalAvatarKey(currentUser.uid));
  if (localAvatar) setAvatar(localAvatar);

  try {
    await loadProfileData(currentUser);
  } catch (err) {
    console.error("Profile load error:", err);
    refs.recentResults.innerHTML = `<li class="recent-empty">${t("ProfileLoadError", "Malumotlarni yuklashda xatolik yuz berdi.")}</li>`;
    if (typeof window.showToast === "function") {
      window.showToast("error", t("ProfileToastErrorTitle", "Xatolik"), t("ProfileToastErrorDesc", "Profil malumotlari yuklanmadi"));
    }
  }
});

if (refs.avatarBtn && refs.avatarInput) {
  refs.avatarBtn.addEventListener("click", () => refs.avatarInput.click());
  refs.avatarInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("File read error"));
        reader.readAsDataURL(file);
      });

      localStorage.setItem(getLocalAvatarKey(auth.currentUser.uid), dataUrl);
      setAvatar(dataUrl);
      if (typeof window.showToast === "function") {
        window.showToast(
          "success",
          t("ProfileAvatarSavedTitle", "Saqlandi"),
          t("ProfileAvatarSavedDesc", "Rasm yangilandi"),
        );
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      if (typeof window.showToast === "function") {
        window.showToast(
          "error",
          t("ProfileAvatarErrorTitle", "Xatolik"),
          t("ProfileAvatarErrorDesc", "Rasm yuklanmadi"),
        );
      }
    } finally {
      refs.avatarInput.value = "";
    }
  });
}





