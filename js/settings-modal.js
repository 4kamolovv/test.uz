document.addEventListener("DOMContentLoaded", () => {
  const openBtns = Array.from(document.querySelectorAll("[data-open-settings]"));
  const overlay = document.getElementById("settingsOverlay");
  const closeBtn = document.getElementById("settingsClose");
  const nav = document.getElementById("settingsNav");
  const themeSelect = document.getElementById("setTheme");
  const langSelect = document.getElementById("setLang");

  if (!openBtns.length || !overlay || !closeBtn) return;

  const open = () => overlay.classList.add("active");
  const close = () => overlay.classList.remove("active");

  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });
  closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  function enhanceSelect(select) {
    if (!select || select.dataset.enhanced === "true") return;

    select.dataset.enhanced = "true";
    select.classList.add("is-hidden");

    const wrap = document.createElement("div");
    wrap.className = "settings-select-wrap";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "settings-select-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");

    const list = document.createElement("div");
    list.className = "settings-select-list";
    list.setAttribute("role", "listbox");

    const optionButtons = [];

    function setValue(value, trigger = true) {
      select.value = value;
      const opt = select.options[select.selectedIndex];
      btn.textContent = opt ? opt.textContent : "";
      optionButtons.forEach((b) => b.classList.toggle("active", b.dataset.value === value));
      if (trigger) select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    Array.from(select.options).forEach((opt) => {
      const optBtn = document.createElement("button");
      optBtn.type = "button";
      optBtn.className = "settings-select-option";
      optBtn.textContent = opt.textContent;
      optBtn.dataset.value = opt.value;
      optBtn.setAttribute("role", "option");
      optBtn.addEventListener("click", () => {
        setValue(opt.value);
        wrap.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
      optionButtons.push(optBtn);
      list.appendChild(optBtn);
    });

    btn.addEventListener("click", () => {
      const isOpen = wrap.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });

    select.addEventListener("change", () => {
      setValue(select.value, false);
    });

    select.addEventListener("lang-update", () => {
      Array.from(select.options).forEach((opt, idx) => {
        const btnOpt = optionButtons[idx];
        if (btnOpt) btnOpt.textContent = opt.textContent;
      });
      setValue(select.value, false);
    });

    wrap.appendChild(btn);
    wrap.appendChild(list);
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    setValue(select.value || select.options[0]?.value, false);
  }

  enhanceSelect(themeSelect);
  enhanceSelect(langSelect);

  if (themeSelect) {
    const storedTheme = localStorage.getItem("theme") || "light";
    const savedTheme = storedTheme === "dark" ? "dark" : "light";
    themeSelect.value = savedTheme;
    if (storedTheme !== savedTheme) localStorage.setItem("theme", savedTheme);
    themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    themeSelect.addEventListener("change", () => {
      const theme = themeSelect.value === "dark" ? "dark" : "light";
      localStorage.setItem("theme", theme);
      if (typeof window.applyTheme === "function") window.applyTheme(theme);
    });
  }

  if (langSelect) {
    const savedLang = localStorage.getItem("siteLang") || "uz";
    langSelect.value = savedLang;
    langSelect.dispatchEvent(new Event("change", { bubbles: true }));
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
