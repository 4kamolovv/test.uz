import { db } from "./firebase.js";
import {
  collection,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const statTests = document.getElementById("statTests");
const statUsers = document.getElementById("statUsers");
const statTopics = document.getElementById("statTopics");

const DATA_URL = "https://4kamolov.github.io/docs/data/data.json";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function setStat(el, value) {
  if (!el) return;
  if (value === null || value === undefined || Number.isNaN(value)) {
    el.textContent = "-";
    return;
  }
  el.textContent = formatNumber(value);
}

async function loadDataStats() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  if (!Array.isArray(data)) return { tests: 0, topics: 0 };

  const tests = data.length;
  const topics = new Set(
    data.map((item) => `${item.subject || ""}|||${item.topic || ""}`),
  ).size;

  return { tests, topics };
}

async function loadRegisteredUsersCount() {
  const snap = await getCountFromServer(collection(db, "nicknames"));
  return snap.data().count;
}

async function loadStats() {
  try {
    const [{ tests, topics }, users] = await Promise.all([
      loadDataStats(),
      loadRegisteredUsersCount(),
    ]);
    setStat(statTests, tests);
    setStat(statUsers, users);
    setStat(statTopics, topics);
  } catch (err) {
    console.error("Failed to load homepage stats:", err);
    try {
      const { tests, topics } = await loadDataStats();
      setStat(statTests, tests);
      setStat(statUsers, null);
      setStat(statTopics, topics);
    } catch (dataErr) {
      console.error("Failed to load test/topic stats:", dataErr);
      setStat(statTests, null);
      setStat(statUsers, null);
      setStat(statTopics, null);
    }
  }
}

document.addEventListener("DOMContentLoaded", loadStats);
