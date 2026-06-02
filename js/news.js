(() => {
  const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
  const NEWS_URL = `${basePath}https://4kamolovv.github.io/test.uz/data/news.json`;

  const filtersEl = document.getElementById("newsFilters");
  const gridEl = document.getElementById("newsGrid");
  const searchInput = document.getElementById("newsSearch");
  const DEMO_NEWS = [
    {
      id: 1,
      title: { uz: "Yangi mavzuli testlar qo'shildi" },
      text: {
        uz: "Matematika, fizika va ona tili bo'yicha yangi savollar yuklandi.",
      },
      tag: { uz: "Yangilanish" },
      date: "2026-02-10",
    },
    {
      id: 2,
      title: { uz: "Reyting hisoblash tezlashdi" },
      text: { uz: "Natijalar endi avvalgidan tezroq yangilanadi." },
      tag: { uz: "Reyting" },
      date: "2026-02-08",
    },
    {
      id: 3,
      title: { uz: "Mobil ko'rinish yaxshilandi" },
      text: { uz: "Navbar va kartalar kichik ekranlarda qulayroq bo'ldi." },
      tag: { uz: "Interfeys" },
      date: "2026-02-06",
    },
    {
      id: 4,
      title: { uz: "Saqlanganlar bo'limi yangilandi" },
      text: { uz: "Saqlangan testlarda qidiruv va tez ochish qo'shildi." },
      tag: { uz: "Funksiya" },
      date: "2026-02-04",
    },
    {
      id: 5,
      title: { uz: "Blok testlar soni kengaytirildi" },
      text: {
        uz: "Bir nechta fanlar bo'yicha yangi blok test kartochkalari qo'shildi.",
      },
      tag: { uz: "Testlar" },
      date: "2026-02-02",
    },
    {
      id: 6,
      title: { uz: "Demo test sahifasi boyitildi" },
      text: {
        uz: "Savol, variantlar va progress ko'rinishi aniqroq ko'rsatila boshladi.",
      },
      tag: { uz: "Interfeys" },
      date: "2026-02-01",
    },
  ];

  let newsData = [];
  let activeTag = "__all__";

  function lang() {
    return localStorage.getItem("siteLang") || "uz";
  }

  function t(key, fallback) {
    return window.langData?.[lang()]?.[key] || fallback;
  }

  function tr(value) {
    if (value && typeof value === "object") {
      return value[lang()] || value.uz || "";
    }
    return String(value || "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeTag(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/['’`"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isHiddenFilterTag(tagLabel) {
    const tag = normalizeTag(tagLabel);
    return tag === "qidiruv" || tag === "поиск";
  }

  function renderFilters() {
    if (!filtersEl) return;
    const tags = Array.from(new Set(newsData.map((item) => tr(item.tag))))
      .filter((tag) => !isHiddenFilterTag(tag))
      .sort((a, b) => a.localeCompare(b));
    const all = [
      { value: "__all__", label: t("NewsFilterAll", "Barchasi") },
      ...tags.map((x) => ({ value: x, label: x })),
    ];
    filtersEl.innerHTML = all
      .map(
        (tag) =>
          `<button class="news-filter${tag.value === activeTag ? " active" : ""}" data-tag="${escapeHtml(
            tag.value,
          )}" type="button">${escapeHtml(tag.label)}</button>`,
      )
      .join("");

    filtersEl.querySelectorAll(".news-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.getAttribute("data-tag") || "__all__";
        render();
      });
    });
  }

  function cardHtml(item) {
    return `
      <article class="news-card">
        <span class="news-tag">${escapeHtml(tr(item.tag))}</span>
        <h3 class="news-card-title">${escapeHtml(tr(item.title))}</h3>
        <p class="news-card-text">${escapeHtml(tr(item.text))}</p>
        <div class="news-card-footer">
          <span class="news-date">${escapeHtml(item.date)}</span>
          <a class="news-link" href="#">${escapeHtml(t("NewsReadMore", "Batafsil"))}</a>
        </div>
      </article>
    `;
  }

  function render() {
    if (!gridEl) return;
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = newsData.filter((item) => {
      const itemTag = tr(item.tag);
      const tagMatch = activeTag === "__all__" || itemTag === activeTag;
      if (!tagMatch) return false;
      if (!query) return true;
      return (
        tr(item.title).toLowerCase().includes(query) ||
        tr(item.text).toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `<div class="news-empty">${t("NewsNotFound", "Yangilik topilmadi.")}</div>`;
      return;
    }
    gridEl.innerHTML = filtered.map(cardHtml).join("");
  }

  async function loadNewsData() {
    try {
      const res = await fetch(NEWS_URL);
      newsData = await res.json();
      if (!Array.isArray(newsData) || newsData.length < 6) {
        newsData = DEMO_NEWS.slice();
      }
    } catch (err) {
      console.error("Failed to load news.json:", err);
      newsData = DEMO_NEWS.slice();
    }
  }

  async function init() {
    await loadNewsData();
    renderFilters();
    render();
  }

  searchInput?.addEventListener("input", render);
  document.querySelectorAll(".settings-select").forEach((el) => {
    el.addEventListener("lang-update", init);
  });
  document.addEventListener("DOMContentLoaded", init);
})();
