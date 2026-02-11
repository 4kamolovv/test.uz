document.addEventListener("DOMContentLoaded", () => {
  const openBtns = Array.from(
    document.querySelectorAll("[data-open-settings]"),
  );
  const overlay = document.getElementById("settingsOverlay");
  const closeBtn = document.getElementById("settingsClose");
  const nav = document.getElementById("settingsNav");
  const themeSelect = document.getElementById("setTheme");
  const langSelect = document.getElementById("setLang");
  const settingsFooter = document.querySelector(".settings-footer");
  const THEME_MODE_KEY = "themeMode";
  const LANG_MODE_KEY = "siteLangMode";

  function t(key, fallback) {
    const lang = localStorage.getItem("siteLang") || "uz";
    return window.langData?.[lang]?.[key] || fallback;
  }

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

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

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
      optionButtons.forEach((b) =>
        b.classList.toggle("active", b.dataset.value === value),
      );
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
      ensureAutoOption(select);
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

  function getAutoOptionLabel() {
    return t("SettingsAutoDetect", "Avtomatik aniqlash");
  }

  function ensureAutoOption(select) {
    if (!select) return;
    let autoOpt = Array.from(select.options).find((o) => o.value === "auto");
    if (!autoOpt) {
      autoOpt = document.createElement("option");
      autoOpt.value = "auto";
      select.insertBefore(autoOpt, select.firstChild);
    }
    autoOpt.textContent = getAutoOptionLabel();
  }

  function resolveThemeFromMode(mode) {
    if (mode === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return mode === "dark" ? "dark" : "light";
  }

  ensureAutoOption(themeSelect);
  ensureAutoOption(langSelect);
  enhanceSelect(themeSelect);
  enhanceSelect(langSelect);

  function getResetLabel() {
    return t("SettingsReset", "Sozlamalarni tiklash");
  }

  function addResetSettingsButton() {
    if (!settingsFooter || document.getElementById("setResetSettings")) return;
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.id = "setResetSettings";
    resetBtn.className = "settings-reset-btn";
    resetBtn.textContent = getResetLabel();
    settingsFooter.prepend(resetBtn);

    resetBtn.addEventListener("click", () => {
      localStorage.setItem(THEME_MODE_KEY, "auto");
      localStorage.setItem("theme", resolveThemeFromMode("auto"));
      localStorage.setItem(LANG_MODE_KEY, "auto");
      localStorage.setItem("notify", "on");

      if (themeSelect) {
        themeSelect.value = "auto";
        themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (langSelect) {
        langSelect.value = "auto";
        langSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const notifySwitch = document.getElementById("setNotifySwitch");
      if (notifySwitch) {
        notifySwitch.classList.add("is-on");
        notifySwitch.setAttribute("aria-checked", "true");
      }

      resetBtn.textContent = getResetLabel();
      if (typeof window.showToast === "function") {
        window.showToast("success", t("SettingsResetDone", "Sozlamalar tiklandi"));
      }
    });
  }

  addResetSettingsButton();

  if (themeSelect) {
    const forcedTheme =
      document.documentElement.getAttribute("data-force-theme");
    const storedThemeMode = localStorage.getItem(THEME_MODE_KEY) || "auto";
    const savedThemeMode =
      storedThemeMode === "auto" ||
      storedThemeMode === "dark" ||
      storedThemeMode === "light"
        ? storedThemeMode
        : "auto";
    const pageThemeValue =
      forcedTheme === "dark" || forcedTheme === "light"
        ? forcedTheme
        : savedThemeMode;
    themeSelect.value = pageThemeValue;
    localStorage.setItem(THEME_MODE_KEY, savedThemeMode);
    localStorage.setItem("theme", resolveThemeFromMode(savedThemeMode));
    themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    if (forcedTheme === "dark" || forcedTheme === "light") {
      themeSelect.disabled = true;
    }
    themeSelect.addEventListener("change", () => {
      if (forcedTheme === "dark" || forcedTheme === "light") {
        themeSelect.value = forcedTheme;
        if (typeof window.applyTheme === "function")
          window.applyTheme(forcedTheme);
        return;
      }
      const mode =
        themeSelect.value === "auto"
          ? "auto"
          : themeSelect.value === "dark"
            ? "dark"
            : "light";
      const resolvedTheme = resolveThemeFromMode(mode);
      localStorage.setItem(THEME_MODE_KEY, mode);
      localStorage.setItem("theme", resolvedTheme);
      if (typeof window.applyTheme === "function")
        window.applyTheme(resolvedTheme);
    });
  }

  if (langSelect) {
    const langMode = localStorage.getItem(LANG_MODE_KEY) || "auto";
    const savedLang = localStorage.getItem("siteLang") === "ru" ? "ru" : "uz";
    langSelect.value = langMode === "auto" ? "auto" : savedLang;
    langSelect.dispatchEvent(new Event("change", { bubbles: true }));
    langSelect.addEventListener("change", () => {
      const lang =
        langSelect.value === "auto"
          ? "auto"
          : langSelect.value === "ru"
            ? "ru"
            : "uz";
      ensureAutoOption(langSelect);
      ensureAutoOption(themeSelect);
      if (typeof window.setLanguage === "function") window.setLanguage(lang);
      const resetBtn = document.getElementById("setResetSettings");
      if (resetBtn) resetBtn.textContent = getResetLabel();
    });
  }
});

const sw = document.getElementById("setNotifySwitch");
localStorage.setItem("notify", "on");
if (sw) {
  sw.classList.add("is-on");
  sw.setAttribute("aria-checked", "true");
  sw.setAttribute("aria-disabled", "true");
}
