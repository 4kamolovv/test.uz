(() => {
  const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
  const DATA_URL = "https://4kamolov.github.io/docs/data/data.json";

  const chipsEl = document.getElementById("blockChips");
  const gridEl = document.getElementById("blockGrid");
  const searchInput = document.getElementById("blockSearch");

  let blocks = [];
  let activeSubject = "__all__";

  function t(key, fallback) {
    const lang = localStorage.getItem("siteLang") || "uz";
    return window.langData?.[lang]?.[key] || fallback;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function groupBlocks(data) {
    const map = new Map();

    data.forEach((item) => {
      const subject = item.subject || "Boshqa";
      if (!map.has(subject)) {
        map.set(subject, { subject, total: 0, topics: new Map() });
      }
      const entry = map.get(subject);
      entry.total += 1;
      const topic = item.topic || "Mavzu";
      entry.topics.set(topic, (entry.topics.get(topic) || 0) + 1);
    });

    return Array.from(map.values()).map((entry) => {
      const topicsSorted = Array.from(entry.topics.entries()).sort((a, b) => b[1] - a[1]);
      const primaryTopic = topicsSorted[0]?.[0] || "Mavzu";
      return {
        subject: entry.subject,
        total: entry.total,
        topicCount: entry.topics.size,
        topTopics: topicsSorted.slice(0, 3).map((t2) => t2[0]),
        primaryTopic,
      };
    });
  }

  function renderChips(subjects) {
    if (!chipsEl) return;
    const all = [
      { value: "__all__", label: t("BlockAll", "Barchasi") },
      ...subjects.map((subject) => ({ value: subject, label: subject })),
    ];
    chipsEl.innerHTML = all
      .map(
        (s) =>
          `<button class="block-chip${s.value === activeSubject ? " active" : ""}" data-subject="${escapeHtml(
            s.value
          )}" type="button">${escapeHtml(s.label)}</button>`
      )
      .join("");

    chipsEl.querySelectorAll(".block-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeSubject = btn.getAttribute("data-subject") || "__all__";
        render();
      });
    });
  }

  function cardHtml(block) {
    const topics = block.topTopics
      .map((topic) => `<span class="block-topic">${escapeHtml(topic)}</span>`)
      .join("");
    const startUrl = `./test.html?subject=${encodeURIComponent(
      block.subject
    )}&topic=${encodeURIComponent(block.primaryTopic)}`;

    return `
      <div class="block-card">
        <div class="block-card-head">
          <h3 class="block-card-title">${escapeHtml(block.subject)}</h3>
          <span class="block-card-badge">${block.topicCount} ${t("BlockTopicCount", "mavzu")}</span>
        </div>
        <div class="block-card-stats">
          <div class="block-stat">
            <b>${block.total}</b>
            <span>${t("BlockTotalTests", "Jami test")}</span>
          </div>
          <div class="block-stat">
            <b>${block.topicCount}</b>
            <span>${t("BlockTopics", "Mavzular")}</span>
          </div>
        </div>
        <div class="block-topics">${topics}</div>
        <div class="block-card-actions">
          <a class="block-card-link" href="./themetest.html">${t("BlockThemeTestLink", "Mavzuli test")}</a>
          <a class="block-btn" href="${startUrl}">${t("BlockStartBtn", "Boshlash")}</a>
        </div>
      </div>
    `;
  }

  function render() {
    if (!gridEl) return;
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = blocks.filter((block) => {
      const subjectMatch = activeSubject === "__all__" || block.subject === activeSubject;
      if (!subjectMatch) return false;
      if (!query) return true;
      const topicMatch = block.topTopics.some((topic) => topic.toLowerCase().includes(query));
      return block.subject.toLowerCase().includes(query) || topicMatch;
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `<div class="block-empty">${t("BlockNotFound", "Mos blok test topilmadi.")}</div>`;
      return;
    }
    gridEl.innerHTML = filtered.map(cardHtml).join("");

    chipsEl?.querySelectorAll(".block-chip").forEach((btn) => {
      const subject = btn.getAttribute("data-subject");
      btn.classList.toggle("active", subject === activeSubject);
    });
  }

  async function init() {
    if (!gridEl || !chipsEl) return;
    try {
      const res = await fetch(DATA_URL);
      const data = await res.json();
      blocks = groupBlocks(data);
      const subjects = blocks.map((b) => b.subject).sort((a, b) => a.localeCompare(b));
      renderChips(subjects);
      render();
    } catch (err) {
      console.error("Failed to load data.json:", err);
      gridEl.innerHTML = `<div class="block-empty">${t("BlockLoadError", "Ma'lumot yuklanmadi.")}</div>`;
    }
  }

  searchInput?.addEventListener("input", render);
  document.querySelectorAll(".settings-select").forEach((el) => {
    el.addEventListener("lang-update", () => {
      const subjects = blocks.map((b) => b.subject).sort((a, b) => a.localeCompare(b));
      renderChips(subjects);
      render();
    });
  });
  document.addEventListener("DOMContentLoaded", init);
})();
