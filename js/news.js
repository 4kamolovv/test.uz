(() => {
  const newsData = [
    {
      id: 1,
      title: {
        uz: "Yangi blok testlar to'plami qo'shildi",
        ru: "Добавлен новый набор блочных тестов",
      },
      text: {
        uz: "Matematika va Ona tili bo'yicha yangi blok testlar platformaga yuklandi.",
        ru: "На платформу загружены новые блочные тесты по математике и родному языку.",
      },
      tag: { uz: "Yangilanish", ru: "Обновление" },
      date: "2026-02-05",
    },
    {
      id: 2,
      title: {
        uz: "Reyting tizimi yangilandi",
        ru: "Система рейтинга обновлена",
      },
      text: {
        uz: "Reyting hisoblash algoritmi soddalashtirildi va natijalar tezroq yangilanadi.",
        ru: "Алгоритм подсчета рейтинга упрощен, результаты обновляются быстрее.",
      },
      tag: { uz: "Reyting", ru: "Рейтинг" },
      date: "2026-02-02",
    },
    {
      id: 3,
      title: {
        uz: "Profil sahifasi yangilandi",
        ru: "Страница профиля обновлена",
      },
      text: {
        uz: "Profil oynasiga statistikalar va faoliyat tarixi qo'shildi.",
        ru: "В профиль добавлены статистика и история активности.",
      },
      tag: { uz: "Profil", ru: "Профиль" },
      date: "2026-01-29",
    },
    {
      id: 4,
      title: { uz: "Qidiruv funksiyasi yaxshilandi", ru: "Улучшен поиск" },
      text: {
        uz: "Mavzular va testlar bo'yicha qidiruv yanada tez ishlaydi.",
        ru: "Поиск по темам и тестам работает быстрее.",
      },
      tag: { uz: "Qidiruv", ru: "Поиск" },
      date: "2026-01-25",
    },
    {
      id: 5,
      title: {
        uz: "Testlarda timer ko'rsatildi",
        ru: "В тестах добавлен таймер",
      },
      text: {
        uz: "Har bir testda sarflangan vaqt avtomatik hisoblanadi.",
        ru: "В каждом тесте потраченное время считается автоматически.",
      },
      tag: { uz: "Testlar", ru: "Тесты" },
      date: "2026-01-20",
    },
    {
      id: 6,
      title: {
        uz: "Yangi fanlar qo'shilishi rejalashtirilmoqda",
        ru: "Планируется добавление новых предметов",
      },
      text: {
        uz: "Kimyo va Fizika bo'yicha qo'shimcha savollar ustida ishlayapmiz.",
        ru: "Мы готовим дополнительные вопросы по химии и физике.",
      },
      tag: { uz: "E'lon", ru: "Объявление" },
      date: "2026-01-15",
    },
  ];

  const filtersEl = document.getElementById("newsFilters");
  const gridEl = document.getElementById("newsGrid");
  const searchInput = document.getElementById("newsSearch");

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

  function renderFilters() {
    if (!filtersEl) return;
    const tags = Array.from(new Set(newsData.map((item) => tr(item.tag)))).sort(
      (a, b) => a.localeCompare(b),
    );
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

  function init() {
    renderFilters();
    render();
  }

  searchInput?.addEventListener("input", render);
  document.querySelectorAll(".settings-select").forEach((el) => {
    el.addEventListener("lang-update", init);
  });
  document.addEventListener("DOMContentLoaded", init);
})();
