import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

(() => {
  const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
  const DATA_URL = `${basePath}/data/data.json`;

  const SESSION_KEY = "quizSession";
  const SELECTION_KEY = "quizSelection";

  const elements = {
    quizSubjectEls: Array.from(document.querySelectorAll(".quiz-subject")),
    quizInfoTitle: document.querySelector(".quiz-info-title"),
    quizQuestionText: document.querySelector(".quiz-question-text"),
    quizQuestionProgress: document.querySelector(".quiz-question-progress"),
    progressText: document.getElementById("progress-text"),
    progressFill: document.getElementById("progress-fill"),
    optionsPic: document.querySelector(".quiz-options-pic"),
    optionButtons: Array.from(document.querySelectorAll(".quiz-option")),
    btnCheck: document.querySelector(".btn-check"),
    btnComplete: document.querySelector(".btn-complete"),
    answerStatus: document.querySelector(".answer-status"),
    quizTime: document.getElementById("quizTime"),
    endModal: document.getElementById("endModal"),
    cancelEnd: document.getElementById("cancelEnd"),
    confirmEnd: document.getElementById("confirmEnd"),
    resultModal: document.getElementById("resultModal"),
    resultUsername: document.getElementById("username"),
    resultTotal: document.getElementById("totalCount"),
    resultCorrect: document.getElementById("correctCount"),
    resultWrong: document.getElementById("wrongCount"),
    resultTopic: document.getElementById("resultTopic"),
    resultTime: document.getElementById("resultTime"),
    backToMain: document.querySelector(".back-tomain-page"),
    backPointer: document.querySelector(".bck-pointer"),
  };

  let allTests = [];
  let session = null;
  let currentSelectedIndex = null;
  let timerId = null;
  let currentUser = null;
  const SCORE_CORRECT = 5;
  const SCORE_WRONG = 2;

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

  function getSelection() {
    const params = new URLSearchParams(window.location.search);
    const subject = params.get("subject");
    const topic = params.get("topic");
    if (subject && topic) {
      try {
        const stored = JSON.parse(localStorage.getItem(SELECTION_KEY) || "null");
        if (stored?.subject === subject && stored?.topic === topic) {
          return stored;
        }
      } catch {
        return { subject, topic };
      }
      return { subject, topic };
    }

    try {
      const stored = JSON.parse(localStorage.getItem(SELECTION_KEY) || "null");
      if (stored?.subject && stored?.topic) return stored;
    } catch {
      return null;
    }
    return null;
  }

function createOptions(question, pool) {
  const wrongAnswers = pool
    .filter((q) => q.id !== question.id)
    .map((q) => q.answer)
    .filter((a) => a && a !== question.answer);

  const uniqueWrong = Array.from(new Set(wrongAnswers));
  const pickedWrong = shuffle(uniqueWrong).slice(0, 3);

  while (pickedWrong.length < 3) {
    pickedWrong.push(question.answer);
  }

  const options = shuffle([question.answer, ...pickedWrong]);
  const correctIndex = options.indexOf(question.answer);

  return { options, correctIndex };
}

  function createSession(selection, tests) {
    const filtered = tests.filter(
      (t) => t.subject === selection.subject && t.topic === selection.topic
    );

  const shuffledQuestions = shuffle(filtered);
  const items = shuffledQuestions.map((q) => {
    const { options, correctIndex } = createOptions(q, filtered);
    return {
      id: q.id,
      options,
      correctIndex,
      answered: false,
      wasCorrect: null,
    };
  });

    return {
      subject: selection.subject,
      displaySubject: selection.displaySubject || selection.subject,
      topic: selection.topic,
      items,
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      score: 0,
      startedAt: Date.now(),
      elapsedMs: 0,
      finished: false,
      resultSaved: false,
    };
}

function saveSession() {
  if (!session) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

  function loadSession(selection) {
    try {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (
        stored &&
        stored.subject === selection.subject &&
        stored.topic === selection.topic &&
        Array.isArray(stored.items) &&
        stored.items.length > 0
      ) {
        if (!stored.displaySubject) {
          stored.displaySubject = selection.displaySubject || stored.subject;
        }
        if (typeof stored.score !== "number") {
          stored.score = recomputeScore(stored);
        }
        if (typeof stored.resultSaved !== "boolean") {
          stored.resultSaved = false;
        }
        return stored;
      }
    } catch {
      return null;
    }
    return null;
}

function getQuestionById(id) {
  return allTests.find((t) => t.id === id);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function recomputeScore(sess) {
  if (!sess?.items) return 0;
  let correct = 0;
  let wrong = 0;
  sess.items.forEach((item) => {
    if (item.answered) {
      if (item.wasCorrect) correct += 1;
      else wrong += 1;
    }
  });
    return correct * SCORE_CORRECT - wrong * SCORE_WRONG;
}

function updateTimer() {
  if (!session || session.finished) return;
  const now = Date.now();
  const elapsed = session.elapsedMs + (session.startedAt ? now - session.startedAt : 0);
  if (elements.quizTime) elements.quizTime.textContent = formatTime(elapsed);
}

function startTimer() {
  if (!session || session.finished) return;
  if (!session.startedAt) session.startedAt = Date.now();
  if (timerId) clearInterval(timerId);
  timerId = setInterval(updateTimer, 500);
  updateTimer();
}

function stopTimer() {
  if (!session) return;
  if (session.startedAt) {
    session.elapsedMs += Date.now() - session.startedAt;
    session.startedAt = null;
  }
  if (timerId) clearInterval(timerId);
  timerId = null;
  saveSession();
}

function setAnswerStatus(isCorrect, playSound = true) {
  if (!elements.answerStatus) return;
  const icon = isCorrect
    ? `${basePath}/images/icons/correct-success.svg`
    : `${basePath}/images/icons/incorrec.gif`;
  const text = isCorrect ? "To'g'ri javob" : "Notog'ri javob";

  elements.answerStatus.classList.toggle("is-correct", isCorrect);
  elements.answerStatus.classList.toggle("is-wrong", !isCorrect);
  elements.answerStatus.innerHTML = `
    <img src="${icon}" alt="${text}" />
    <span>${text}</span>
  `;

  if (playSound) {
    const soundSrc = isCorrect
      ? `${basePath}/sounds/correct-answer.mp3`
      : `${basePath}/sounds/wrong-answer.mp3`;
    const sound = new Audio(soundSrc);
    sound.volume = 1;
    sound.play().catch(() => {});
  }
}

function clearAnswerStatus() {
  if (!elements.answerStatus) return;
  elements.answerStatus.innerHTML = "";
  elements.answerStatus.classList.remove("is-correct", "is-wrong");
}

function setCheckButtonState(text, active) {
  if (!elements.btnCheck) return;
  elements.btnCheck.textContent = text;
  elements.btnCheck.classList.toggle("active", active);
  elements.btnCheck.disabled = !active;
}

function setOptionsDisabled(disabled) {
  elements.optionButtons.forEach((btn) => {
    btn.disabled = disabled;
  });
}

  function renderQuestion() {
  if (!session || session.items.length === 0) return;

  const item = session.items[session.currentIndex];
  const question = getQuestionById(item.id);
  if (!question) return;

  const total = session.items.length;
  const currentNumber = session.currentIndex + 1;

  const progressText = `${total}/${currentNumber}`;
  if (elements.quizQuestionProgress)
    elements.quizQuestionProgress.textContent = progressText;
  if (elements.progressText) elements.progressText.textContent = progressText;

  if (elements.progressFill) {
    const percent = Math.round((currentNumber / total) * 100);
    elements.progressFill.style.width = `${percent}%`;
  }

  elements.quizSubjectEls.forEach((el) => {
    el.textContent = session.displaySubject || session.subject;
  });
  if (elements.quizInfoTitle) elements.quizInfoTitle.textContent = session.topic;
  if (elements.quizQuestionText) elements.quizQuestionText.textContent = question.question;

  if (elements.optionsPic) {
    if (question.questionpic) {
      elements.optionsPic.src = question.questionpic;
      elements.optionsPic.style.display = "block";
    } else {
      elements.optionsPic.style.display = "none";
      elements.optionsPic.removeAttribute("src");
    }
  }

  currentSelectedIndex = null;
  clearAnswerStatus();
  setOptionsDisabled(item.answered);

  elements.optionButtons.forEach((btn, index) => {
    btn.classList.toggle("selected", false);
    btn.classList.toggle("is-correct", false);
    btn.classList.toggle("is-wrong", false);
    btn.querySelector(".quiz-variant").textContent = item.options[index];
  });

  if (item.answered) {
    setAnswerStatus(item.wasCorrect, false);
    elements.optionButtons.forEach((btn, index) => {
      if (index === item.correctIndex) {
        btn.classList.add("is-correct");
      }
      if (item.selectedIndex === index && !item.wasCorrect) {
        btn.classList.add("is-wrong");
      }
    });
    if (session.currentIndex === session.items.length - 1) {
      setCheckButtonState("Natijalar", true);
    } else {
      setCheckButtonState("Keyingisi", true);
    }
  } else {
    setCheckButtonState("Tekshirish", false);
  }
}

function showResultModal() {
  if (!session) return;
  stopTimer();
  session.finished = true;
  session.score = session.correctCount * SCORE_CORRECT - session.wrongCount * SCORE_WRONG;
  saveSession();

  if (elements.resultUsername) {
    const name = localStorage.getItem("authUserName") || "Foydalanuvchi";
    elements.resultUsername.textContent = name;
  }
  if (elements.resultTotal) elements.resultTotal.textContent = String(session.items.length);
  if (elements.resultCorrect) elements.resultCorrect.textContent = String(session.correctCount);
  if (elements.resultWrong) elements.resultWrong.textContent = String(session.wrongCount);
  if (elements.resultTopic)
    elements.resultTopic.textContent = `${session.displaySubject || session.subject} — ${session.topic}`;
  if (elements.resultTime) {
    const time = formatTime(session.elapsedMs);
    elements.resultTime.textContent = time;
  }

  elements.resultModal?.classList.add("active");
  saveResultToAccount().catch((err) =>
    console.error("Save result error:", err)
  );
}

  function hideResultModal() {
    elements.resultModal?.classList.remove("active");
  }

  function openEndModal() {
    elements.endModal?.classList.add("active");
  }

  function closeEndModal() {
    elements.endModal?.classList.remove("active");
  }

function handleCheckClick() {
  if (!session) return;
  const item = session.items[session.currentIndex];

  if (item.answered) {
    if (session.currentIndex === session.items.length - 1) {
      showResultModal();
      return;
    }
    session.currentIndex += 1;
    saveSession();
    renderQuestion();
    return;
  }

  if (currentSelectedIndex === null) return;

  const isCorrect = currentSelectedIndex === item.correctIndex;
  item.answered = true;
  item.wasCorrect = isCorrect;
  item.selectedIndex = currentSelectedIndex;
  if (isCorrect) session.correctCount += 1;
  else session.wrongCount += 1;
  session.score = session.correctCount * SCORE_CORRECT - session.wrongCount * SCORE_WRONG;

  saveSession();
  setAnswerStatus(isCorrect);
  setOptionsDisabled(true);
  elements.optionButtons.forEach((btn, index) => {
    btn.classList.toggle("is-correct", index === item.correctIndex);
    btn.classList.toggle("is-wrong", index === item.selectedIndex && !isCorrect);
  });

  if (session.currentIndex === session.items.length - 1) {
    setCheckButtonState("Natijalar", true);
  } else {
    setCheckButtonState("Keyingisi", true);
  }
}

  function bindEvents() {
  elements.optionButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      const item = session?.items[session.currentIndex];
      if (!item || item.answered) return;

      currentSelectedIndex = index;
      elements.optionButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      setCheckButtonState("Tekshirish", true);
    });
  });

    elements.btnCheck?.addEventListener("click", handleCheckClick);

    const endTitle = elements.endModal?.querySelector(".modal-title");
    const endDesc = elements.endModal?.querySelector(".modal-desc");
    const endConfirm = elements.confirmEnd;
    const defaultEndTitle = endTitle?.textContent || "Testni yakunlashni xohlaysizmi?";
    const defaultEndDesc =
      endDesc?.textContent ||
      "Yakunlaganingizdan so'ng javoblaringizni o'zgartira olmaysiz. Davom etishni istaysizmi?";
    const defaultEndConfirm = endConfirm?.textContent || "Yakunlash";

    function setEndModalText(title, desc, confirmText) {
      if (endTitle) endTitle.textContent = title;
      if (endDesc) endDesc.textContent = desc;
      if (endConfirm) endConfirm.textContent = confirmText;
    }

    elements.btnComplete?.addEventListener("click", () => {
      setEndModalText(defaultEndTitle, defaultEndDesc, defaultEndConfirm);
      openEndModal();
    });

    elements.cancelEnd?.addEventListener("click", closeEndModal);
    elements.endModal?.addEventListener("click", (e) => {
      if (e.target === elements.endModal) closeEndModal();
    });
    elements.confirmEnd?.addEventListener("click", () => {
      closeEndModal();
      stopTimer();
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "./themetest.html";
    });

    elements.backToMain?.addEventListener("click", () => {
      hideResultModal();
      stopTimer();
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "./themetest.html";
    });

    elements.backPointer?.addEventListener("click", () => {
      setEndModalText(
        "Orqaga qaytishni xohlaysizmi?",
        "Asosiy sahifaga qaytsangiz test yakunlanadi.",
        "Ha, qaytish"
      );
      openEndModal();
    });

    const restartBtn = document.getElementById("restartBtn");
    restartBtn?.addEventListener("click", () => {
      if (!session) return;
    session = createSession(
      {
        subject: session.subject,
        topic: session.topic,
        displaySubject: session.displaySubject,
      },
      allTests
    );
      saveSession();
      hideResultModal();
      renderQuestion();
      startTimer();
    });

  elements.resultModal?.addEventListener("click", (e) => {
    if (e.target === elements.resultModal) hideResultModal();
  });
}

async function saveResultToAccount() {
  if (!session || session.resultSaved) return;
  if (!currentUser) {
    if (typeof window.showToast === "function") {
      window.showToast("warning", "Natijani saqlash uchun tizimga kiring");
    }
    return;
  }

  const payload = {
    subject: session.subject,
    displaySubject: session.displaySubject || session.subject,
    topic: session.topic,
    total: session.items.length,
    correct: session.correctCount,
    wrong: session.wrongCount,
    score: session.score,
    durationMs: session.elapsedMs,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "users", currentUser.uid, "results"), payload);
  await updateUserStats();
  session.resultSaved = true;
  saveSession();
}

async function updateUserStats() {
  if (!currentUser || !session) return;

  const uid = currentUser.uid;
  const displayName =
    currentUser.displayName ||
    localStorage.getItem("authUserName") ||
    "Foydalanuvchi";

  const dayKey = new Date().toISOString().slice(0, 10);

  const statsRef = doc(db, "users", uid, "stats", "summary");
  const leaderboardRef = doc(db, "leaderboard", uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(statsRef);
    const prev = snap.exists() ? snap.data() : {};

    const lastDay = prev.lastDay || dayKey;
    const todayScore =
      lastDay === dayKey
        ? (prev.todayScore || 0) + session.score
        : session.score;

    const totalScore = (prev.totalScore || 0) + session.score;
    const solved = (prev.solved || 0) + 1;
    const correct = (prev.correct || 0) + session.correctCount;
    const wrong = (prev.wrong || 0) + session.wrongCount;

    const summary = {
      uid,
      displayName,
      totalScore,
      todayScore,
      solved,
      correct,
      wrong,
      lastDay: dayKey,
      updatedAt: serverTimestamp(),
    };

    tx.set(statsRef, summary, { merge: true });
    tx.set(leaderboardRef, summary, { merge: true });
  });
}

async function initQuiz() {
  const selection = getSelection();
  if (!selection) {
    if (elements.quizQuestionText) {
      elements.quizQuestionText.textContent = "Mavzu tanlanmagan.";
    }
    setCheckButtonState("Tekshirish", false);
    return;
  }

  try {
    const res = await fetch(DATA_URL);
    allTests = await res.json();
  } catch (err) {
    console.error("Failed to load data.json:", err);
    if (elements.quizQuestionText)
      elements.quizQuestionText.textContent = "Ma'lumot yuklanmadi.";
    return;
  }

  const existing = loadSession(selection);
  if (existing) {
    session = existing;
  } else {
    session = createSession(selection, allTests);
    saveSession();
  }

  if (!session.items || session.items.length === 0) {
    if (elements.quizQuestionText) {
      elements.quizQuestionText.textContent = "Bu mavzuda testlar yo'q.";
    }
    setCheckButtonState("Tekshirish", false);
    return;
  }

  bindEvents();
  renderQuestion();
  if (session.finished) {
    showResultModal();
    return;
  }
  startTimer();
}

  onAuthStateChanged(auth, (user) => {
    currentUser = user && user.emailVerified ? user : null;
  });

  document.addEventListener("DOMContentLoaded", initQuiz);
})();
