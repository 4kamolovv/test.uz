(() => {
  const newsData = [
    {
      id: 1,
      title: "Yangi blok testlar to‘plami qo‘shildi",
      text: "Matematika va Ona tili bo‘yicha yangi blok testlar platformaga yuklandi.",
      tag: "Yangilanish",
      date: "2026-02-05",
    },
    {
      id: 2,
      title: "Reyting tizimi yangilandi",
      text: "Reyting hisoblash algoritmi soddalashtirildi va natijalar tezroq yangilanadi.",
      tag: "Reyting",
      date: "2026-02-02",
    },
    {
      id: 3,
      title: "Profil sahifasi yangilandi",
      text: "Profil oynasiga statistikalar va faoliyat tarixi qo‘shildi.",
      tag: "Profil",
      date: "2026-01-29",
    },
    {
      id: 4,
      title: "Qidiruv funksiyasi yaxshilandi",
      text: "Mavzular va testlar bo‘yicha qidiruv yanada tez ishlaydi.",
      tag: "Qidiruv",
      date: "2026-01-25",
    },
    {
      id: 5,
      title: "Testlarda timer ko‘rsatildi",
      text: "Har bir testda sarflangan vaqt avtomatik hisoblanadi.",
      tag: "Testlar",
      date: "2026-01-20",
    },
    {
      id: 6,
      title: "Yangi fanlar qo‘shilishi rejalashtirilmoqda",
      text: "Kimyo va Fizika bo‘yicha qo‘shimcha savollar ustida ishlayapmiz.",
      tag: "E’lon",
      date: "2026-01-15",
    },
  ];

  const filtersEl = document.getElementById("newsFilters");
  const gridEl = document.getElementById("newsGrid");
  const searchInput = document.getElementById("newsSearch");

  let activeTag = "Barchasi";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderFilters(tags) {
    if (!filtersEl) return;
    const all = ["Barchasi", ...tags];
    filtersEl.innerHTML = all
      .map(
        (t) =>
          `<button class="news-filter${t === activeTag ? " active" : ""}" data-tag="${escapeHtml(
            t
          )}" type="button">${escapeHtml(t)}</button>`
      )
      .join("");

    filtersEl.querySelectorAll(".news-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.getAttribute("data-tag") || "Barchasi";
        render();
      });
    });
  }

  function cardHtml(item) {
    return `
      <article class="news-card">
        <span class="news-tag">${escapeHtml(item.tag)}</span>
        <h3 class="news-card-title">${escapeHtml(item.title)}</h3>
        <p class="news-card-text">${escapeHtml(item.text)}</p>
        <div class="news-card-footer">
          <span class="news-date">${escapeHtml(item.date)}</span>
          <a class="news-link" href="#">Batafsil</a>
        </div>
      </article>
    `;
  }

  function render() {
    if (!gridEl) return;
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = newsData.filter((item) => {
      const tagMatch = activeTag === "Barchasi" || item.tag === activeTag;
      if (!tagMatch) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `<div class="news-empty">Yangilik topilmadi.</div>`;
      return;
    }
    gridEl.innerHTML = filtered.map(cardHtml).join("");
  }

  function init() {
    const tags = Array.from(new Set(newsData.map((n) => n.tag))).sort(
      (a, b) => a.localeCompare(b)
    );
    renderFilters(tags);
    render();
  }

  searchInput?.addEventListener("input", render);
  document.addEventListener("DOMContentLoaded", init);
})();