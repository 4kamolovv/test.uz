(() => {
  const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
  const DATA_URL = `${basePath}/data/data.json`;

  const SELECTION_KEY = "quizSelection";

  const topicItems = Array.from(document.querySelectorAll(".topic-item"));
  const cardWrapper = document.querySelector(".test-card-wrapper");
  const contentTitle = document.querySelector(".content-title");
  const searchInput = document.querySelector(".search-input");

  let allTests = [];

  function t(key, fallback) {
    const lang = localStorage.getItem("siteLang") || "uz";
    return window.langData?.[lang]?.[key] || fallback;
  }

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function setActiveTopic(topicKey) {
    const key = normalizeKey(topicKey);
    topicItems.forEach((item) => {
      const itemKey = normalizeKey(item.dataset.topic);
      item.classList.toggle("active", itemKey === key);
    });
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
    const q = query.trim();
    if (!q) return safeText;
    const safeQuery = escapeHtml(q);
    const regex = new RegExp(safeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return safeText.replace(regex, (match) => `<mark>${match}</mark>`);
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function toCardHtml({ subject, topic, count, displaySubject }, query) {
    return `
    <div class="test-card" data-subject="${subject}" data-topic="${topic}" data-count="${count}" data-display-subject="${escapeHtml(displaySubject)}">
      <div class="test-card-top-wrapper">
        <div class="test-card-top">
          <div class="test-card-subject">${highlight(displaySubject, query)}</div>
          <button class="test-bookmark-btn" type="button" aria-label="${t("ThemeBookmarkAria", "Saqlash")}">
            <svg class="test-bookmark-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.70898 7.5415C9.19232 8.08316 10.809 8.08316 12.2923 7.5415" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14.0176 1.6665H5.98424C4.20924 1.6665 2.76758 3.1165 2.76758 4.88316V16.6249C2.76758 18.1249 3.84258 18.7582 5.15924 18.0332L9.22591 15.7749C9.65924 15.5332 10.3592 15.5332 10.7842 15.7749L14.8509 18.0332C16.1676 18.7665 17.2426 18.1332 17.2426 16.6249V4.88316C17.2342 3.1165 15.7926 1.6665 14.0176 1.6665Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14.0176 1.6665H5.98424C4.20924 1.6665 2.76758 3.1165 2.76758 4.88316V16.6249C2.76758 18.1249 3.84258 18.7582 5.15924 18.0332L9.22591 15.7749C9.65924 15.5332 10.3592 15.5332 10.7842 15.7749L14.8509 18.0332C16.1676 18.7665 17.2426 18.1332 17.2426 16.6249V4.88316C17.2342 3.1165 15.7926 1.6665 14.0176 1.6665Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="test-card-title">${highlight(topic, query)}</div>
      </div>
      <div class="test-card-footer">
        <div class="test-card-stat">
          <img src="${basePath}/images/icons/staricon.svg" alt="${t("RatingAlt", "Reyting")}" class="test-icon">
          <span>4.5</span>
        </div>
        <div class="test-card-stat">
          <img src="${basePath}/images/icons/quantityicon.svg" alt="${t("TestCountAlt", "Test soni")}" class="test-icon">
          <span>${count} ${t("SavedTestsCount", "test")}</span>
        </div>
        <div class="test-card-stat">
          <img src="${basePath}/images/icons/viewsicon.svg" alt="${t("ViewsAlt", "Ko'rilgan")}" class="test-icon">
          <span>${count * 10}</span>
        </div>
      </div>
    </div>
  `;
  }

  function buildCards(topicKey, query = "") {
    if (!cardWrapper) return;

    const normalizedTopic = normalizeKey(topicKey);
    const filtered =
      normalizedTopic === "barchasi"
        ? allTests.slice()
        : allTests.filter(
            (t) => normalizeKey(t.subject) === normalizedTopic
          );

  const subjectLabelMap = new Map(
    topicItems.map((item) => [
      normalizeKey(item.dataset.topic),
      item.querySelector("span")?.textContent || item.dataset.topic,
    ])
  );

  const topicMap = new Map();
  for (const test of filtered) {
    const key = `${test.subject}|||${test.topic}`;
    if (!topicMap.has(key)) {
      const displaySubject =
        subjectLabelMap.get(normalizeKey(test.subject)) || test.subject;
      topicMap.set(key, {
        subject: test.subject,
        displaySubject,
        topic: test.topic,
        count: 0,
      });
    }
    topicMap.get(key).count += 1;
  }

  let cards = Array.from(topicMap.values()).sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.topic.localeCompare(b.topic);
  });

  const q = query.trim().toLowerCase();
  if (q) {
    cards = cards.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q)
    );
  }

  if (contentTitle) {
    const activeItem =
      topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
    const label = activeItem?.querySelector("span")?.textContent || t("ThemeAllTitle", "Barchasi");
    contentTitle.textContent = label;
  }

  if (cards.length === 0) {
    cardWrapper.innerHTML = `<div class="empty-state">${t("ThemeEmpty", "Hozircha testlar yo'q.")}</div>`;
    return;
  }

  cards = shuffle(cards);
  cardWrapper.innerHTML = cards.map((card) => toCardHtml(card, q)).join("");
  document.dispatchEvent(
    new CustomEvent("cards-rendered", { detail: { cards } })
  );

  cardWrapper.querySelectorAll(".test-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".test-bookmark-btn")) return;
      const subject = card.getAttribute("data-subject");
      const topic = card.getAttribute("data-topic");
      const displaySubject =
        card.querySelector(".test-card-subject")?.textContent || subject;
      if (!subject || !topic) return;

      const selection = { subject, topic, displaySubject, startedAt: Date.now() };
      localStorage.setItem(SELECTION_KEY, JSON.stringify(selection));

      const params = new URLSearchParams({
        subject,
        topic,
      });
      window.location.href = `./test.html?${params.toString()}`;
    });
  });
}

async function initThemeTest() {
  try {
    const res = await fetch(DATA_URL);
    allTests = await res.json();
  } catch (err) {
    console.error("Failed to load data.json:", err);
    if (cardWrapper) {
      cardWrapper.innerHTML = `<div class="empty-state">${t("ThemeLoadError", "Ma'lumot yuklanmadi.")}</div>`;
    }
    return;
  }

  const activeItem =
    topicItems.find((item) => item.classList.contains("active")) || topicItems[0];

  const activeKey = activeItem?.dataset?.topic || "barchasi";
  setActiveTopic(activeKey);
  buildCards(activeKey, searchInput?.value || "");

  topicItems.forEach((item) => {
    item.addEventListener("click", () => {
      const topicKey = item.dataset.topic || "barchasi";
      setActiveTopic(topicKey);
      buildCards(topicKey, searchInput?.value || "");
    });
  });

  searchInput?.addEventListener("input", () => {
    const currentActive =
      topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
    const topicKey = currentActive?.dataset?.topic || "barchasi";
    buildCards(topicKey, searchInput.value || "");
  });

  document.querySelectorAll(".settings-select").forEach((el) => {
    el.addEventListener("lang-update", () => {
      const currentActive =
        topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
      const topicKey = currentActive?.dataset?.topic || "barchasi";
      buildCards(topicKey, searchInput?.value || "");
    });
  });
}

  document.addEventListener("DOMContentLoaded", initThemeTest);
})();

