document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openSettings");
  const overlay = document.getElementById("settingsOverlay");
  const closeBtn = document.getElementById("settingsClose");
  const nav = document.getElementById("settingsNav");
  const themeSelect = document.getElementById("setTheme");
  const langSelect = document.getElementById("setLang");

  if (!openBtn || !overlay || !closeBtn) return;

  const open = () => overlay.classList.add("active");
  const close = () => overlay.classList.remove("active");

  openBtn.addEventListener("click", (e) => { e.preventDefault(); open(); });
  closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  if (themeSelect) {
    const storedTheme = localStorage.getItem("theme") || "light";
    const savedTheme = storedTheme === "dark" ? "dark" : "light";
    themeSelect.value = savedTheme;
    if (storedTheme !== savedTheme) localStorage.setItem("theme", savedTheme);
    themeSelect.addEventListener("change", () => {
      const theme = themeSelect.value === "dark" ? "dark" : "light";
      localStorage.setItem("theme", theme);
      if (typeof window.applyTheme === "function") window.applyTheme(theme);
    });
  }

  if (langSelect) {
    const savedLang = localStorage.getItem("siteLang") || "uz";
    langSelect.value = savedLang;
    langSelect.addEventListener("change", () => {
      const lang = langSelect.value === "ru" ? "ru" : "uz";
      if (typeof window.setLanguage === "function") window.setLanguage(lang);
    });
  }
});

const sw = document.getElementById("setNotifySwitch");
const saved = (localStorage.getItem("notify") || "on") === "on";
if (sw) {
  sw.classList.toggle("is-on", saved);
  sw.setAttribute("aria-checked", saved ? "true" : "false");
  const toggle = () => {
    const on = !sw.classList.contains("is-on");
    sw.classList.toggle("is-on", on);
    sw.setAttribute("aria-checked", on ? "true" : "false");
    localStorage.setItem("notify", on ? "on" : "off");
  };
  sw.addEventListener("click", toggle);
  sw.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  });
}
