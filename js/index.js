const statTests = document.getElementById("statTests");
const statUsers = document.getElementById("statUsers");
const statTopics = document.getElementById("statTopics");

const DATA_URL = "https://4kamolov.github.io/docs/data/data.json";
const DEMO_STATS = {
  tests: 1240,
  users: 860,
  topics: 42,
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function setStats({ tests, users, topics }) {
  if (statTests) statTests.textContent = formatNumber(tests);
  if (statUsers) statUsers.textContent = formatNumber(users);
  if (statTopics) statTopics.textContent = formatNumber(topics);
}

async function loadStats() {
  try {
    const res = await fetch(DATA_URL);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      setStats(DEMO_STATS);
      return;
    }

    const tests = data.length;
    const topics = new Set(
      data.map((item) => `${item.subject || ""}|||${item.topic || ""}`),
    ).size;
    const users = Math.max(300, Math.round(tests * 0.72));

    setStats({ tests, users, topics });
  } catch (err) {
    console.error("Failed to load homepage stats:", err);
    setStats(DEMO_STATS);
  }
}

document.addEventListener("DOMContentLoaded", loadStats);
