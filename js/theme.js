(() => {
  const DATA_URL = "https://4kamolovv.github.io/test.uz/data/qutests.json";
  const SELECTION_KEY = "quizSelection";

  const topicItems = Array.from(document.querySelectorAll(".topic-item"));
  const cardWrapper = document.querySelector(".test-card-wrapper");
  const contentTitle = document.querySelector(".content-title");
  const searchInput = document.querySelector(".search-input");
  const topicToggle = document.getElementById("topicToggle");
  const topicsPanel = document.getElementById("topicsPanel");

  let allTests = [];

  function t(key, fallback) {
    const lang = localStorage.getItem("siteLang") || "uz";
    return window.langData?.[lang]?.[key] || fallback;
  }

  function normalizeKey(value) {
    return String(value || "").toLowerCase().trim()
      .replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function setActiveTopic(topicKey) {
    const key = normalizeKey(topicKey);
    topicItems.forEach((item) => {
      item.classList.toggle("active", normalizeKey(item.dataset.topic) === key);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function highlight(text, query) {
    const safeText = escapeHtml(text);
    const q = query.trim();
    if (!q) return safeText;
    const regex = new RegExp(escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return safeText.replace(regex, (match) => `<mark>${match}</mark>`);
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function toCardHtml({ subject, topic, count, displaySubject }, query) {
    return `
    <div class="test-card" data-subject="${escapeHtml(subject)}" data-topic="${escapeHtml(topic)}" data-count="${count}" data-display-subject="${escapeHtml(displaySubject)}">
      <div class="test-card-header">
        <span class="test-card-subject-badge">${highlight(displaySubject, query)}</span>
        <button class="test-bookmark-btn" type="button" aria-label="${t("ThemeBookmarkAria", "Saqlash")}">
          <svg class="test-bookmark-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14.0176 1.6665H5.98424C4.20924 1.6665 2.76758 3.1165 2.76758 4.88316V16.6249C2.76758 18.1249 3.84258 18.7582 5.15924 18.0332L9.22591 15.7749C9.65924 15.5332 10.3592 15.5332 10.7842 15.7749L14.8509 18.0332C16.1676 18.7665 17.2426 18.1332 17.2426 16.6249V4.88316C17.2342 3.1165 15.7926 1.6665 14.0176 1.6665Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="bm-particle p1"></span>
          <span class="bm-particle p2"></span>
          <span class="bm-particle p3"></span>
          <span class="bm-particle p4"></span>
        </button>
      </div>
      <div class="test-card-title">${highlight(topic, query)}</div>
      <div class="test-card-footer">
        <span class="test-card-count">${count} ${t("SavedTestsCount", "test")}</span>
        <span class="test-card-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>
    </div>`;
  }

  function injectStyles() {
    if (document.getElementById("bm-anim-style")) return;
    const style = document.createElement("style");
    style.id = "bm-anim-style";
    style.textContent = `
      .test-bookmark-btn {
        position: relative; background: none; border: none; cursor: pointer;
        padding: 4px; display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; outline: none;
      }
      .test-bookmark-icon path {
        stroke: var(--icon-color, #888); fill: none;
        transition: stroke 0.25s, fill 0.25s;
      }
      .test-bookmark-btn.is-saved .test-bookmark-icon path {
        stroke: #22c55e; fill: #22c55e;
      }
      @keyframes bm-pop {
        0% { transform: scale(1); } 40% { transform: scale(1.45); }
        70% { transform: scale(0.88); } 100% { transform: scale(1); }
      }
      .test-bookmark-btn.bm-animate .test-bookmark-icon {
        animation: bm-pop 0.45s cubic-bezier(.36,.07,.19,.97) forwards;
      }
      .bm-particle {
        position: absolute; width: 5px; height: 5px; border-radius: 50%;
        background: #22c55e; opacity: 0; pointer-events: none;
      }
      @keyframes bm-fly1 { 0% { opacity:1; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(-14px,-14px) scale(0.4); } }
      @keyframes bm-fly2 { 0% { opacity:1; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(14px,-14px) scale(0.4); } }
      @keyframes bm-fly3 { 0% { opacity:1; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(-16px,10px) scale(0.4); } }
      @keyframes bm-fly4 { 0% { opacity:1; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(16px,10px) scale(0.4); } }
      .test-bookmark-btn.bm-animate .p1 { animation: bm-fly1 0.5s ease-out 0.05s forwards; }
      .test-bookmark-btn.bm-animate .p2 { animation: bm-fly2 0.5s ease-out 0.05s forwards; }
      .test-bookmark-btn.bm-animate .p3 { animation: bm-fly3 0.5s ease-out 0.05s forwards; }
      .test-bookmark-btn.bm-animate .p4 { animation: bm-fly4 0.5s ease-out 0.05s forwards; }
      @keyframes bm-unsave {
        0% { transform: scale(1); } 35% { transform: scale(0.75); } 100% { transform: scale(1); }
      }
      .test-bookmark-btn.bm-unsave-animate .test-bookmark-icon {
        animation: bm-unsave 0.3s ease forwards;
      }
      .test-card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
      .test-card-subject-badge {
        font-size:0.72rem; font-weight:600; letter-spacing:0.04em; text-transform:uppercase;
        padding:3px 8px; border-radius:4px; background:rgba(255,255,255,0.08);
        color:var(--icon-color); white-space:nowrap; overflow:hidden;
        text-overflow:ellipsis; max-width:160px;
      }
      .test-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; }
      .test-card-count { font-size:0.8rem; color:rgba(255,255,255,0.45); font-weight:500; }
      .test-card-arrow { color:rgba(255,255,255,0.3); transition:color 0.2s,transform 0.2s; display:flex; }
      .test-card:hover .test-card-arrow { color:#22c55e; transform:translateX(3px); }
    `;
    document.head.appendChild(style);
  }

  function buildCards(topicKey, query = "") {
    if (!cardWrapper) return;

    const normalizedTopic = normalizeKey(topicKey);
    const filtered = normalizedTopic === "barchasi"
      ? allTests.slice()
      : allTests.filter((t) => normalizeKey(t.subject) === normalizedTopic);

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
        const displaySubject = subjectLabelMap.get(normalizeKey(test.subject)) || test.subject;
        topicMap.set(key, { subject: test.subject, displaySubject, topic: test.topic, count: 0 });
      }
      topicMap.get(key).count += 1;
    }

    let cards = Array.from(topicMap.values()).sort((a, b) => {
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return a.topic.localeCompare(b.topic);
    });

    const q = query.trim().toLowerCase();
    if (q) cards = cards.filter((c) =>
      c.subject.toLowerCase().includes(q) || c.topic.toLowerCase().includes(q)
    );

    if (contentTitle) {
      const activeItem = topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
      contentTitle.textContent = activeItem?.querySelector("span")?.textContent || t("ThemeAllTitle", "Barchasi");
    }

    if (cards.length === 0) {
      cardWrapper.innerHTML = `<div class="empty-state">${t("ThemeEmpty", "Hozircha testlar yo'q.")}</div>`;
      return;
    }

    cards = shuffle(cards);
    if (!q) cards = cards.slice(0, 18);
    cardWrapper.innerHTML = cards.map((card) => toCardHtml(card, q)).join("");

    // Card click → test sahifasi
    cardWrapper.querySelectorAll(".test-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".test-bookmark-btn")) return;
        const subject = card.getAttribute("data-subject");
        const topic = card.getAttribute("data-topic");
        const displaySubject = card.querySelector(".test-card-subject-badge")?.textContent || subject;
        if (!subject || !topic) return;
        localStorage.setItem(SELECTION_KEY, JSON.stringify({ subject, topic, displaySubject, startedAt: Date.now() }));
        window.location.href = `./test.html?${new URLSearchParams({ subject, topic })}`;
      });
    });

    document.dispatchEvent(new CustomEvent("cards-rendered", { detail: { cards } }));
  }

  async function initThemeTest() {
    injectStyles();
    try {
      const res = await fetch(DATA_URL);
      allTests = await res.json();
    } catch (err) {
      console.error("Failed to load data.json:", err);
      if (cardWrapper) cardWrapper.innerHTML = `<div class="empty-state">${t("ThemeLoadError", "Ma'lumot yuklanmadi.")}</div>`;
      return;
    }

    const activeItem = topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
    const activeKey = activeItem?.dataset?.topic || "barchasi";
    setActiveTopic(activeKey);
    buildCards(activeKey, searchInput?.value || "");

    topicItems.forEach((item) => {
      item.addEventListener("click", () => {
        const topicKey = item.dataset.topic || "barchasi";
        setActiveTopic(topicKey);
        buildCards(topicKey, searchInput?.value || "");
        if (topicsPanel && topicToggle) {
          topicsPanel.classList.remove("is-open");
          topicToggle.setAttribute("aria-expanded", "false");
        }
      });
    });

    searchInput?.addEventListener("input", () => {
      const currentActive = topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
      buildCards(currentActive?.dataset?.topic || "barchasi", searchInput.value || "");
    });

    document.querySelectorAll(".settings-select").forEach((el) => {
      el.addEventListener("lang-update", () => {
        const currentActive = topicItems.find((item) => item.classList.contains("active")) || topicItems[0];
        buildCards(currentActive?.dataset?.topic || "barchasi", searchInput?.value || "");
      });
    });

    if (topicToggle && topicsPanel) {
      topicToggle.addEventListener("click", () => {
        const isOpen = topicsPanel.classList.toggle("is-open");
        topicToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initThemeTest);
})();