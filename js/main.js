const bar = document.getElementById("progress-bar");

bar.style.width = "5%";

setTimeout(() => {
  bar.style.transition = "width 0.8s ease";
  bar.style.width = "55%";
}, 800);
window.onload = function () {
  bar.style.transition = "width 1.2s ease-out";
  setTimeout(() => {
    bar.style.transition = "width 0.4s ease-in";
    bar.style.width = "100%";
  }, 1200);
  setTimeout(() => {
    bar.style.transition = "opacity 0.3s ease-out";
    bar.style.opacity = "0";
    setTimeout(() => {
      bar.remove();
      document.getElementById("progress-bg")?.remove();
    }, 300);
  }, 1800);
};
//LoadingProgressBar>
const toggleBtn = document.getElementById("theme-toggle");
const logoImg = document.getElementById("logo-img");
const root = document.documentElement;
const forcedTheme = root.getAttribute("data-force-theme");
const basePath = window.location.pathname.includes("/html/") ? ".." : ".";
const navToggle = document.getElementById("navToggle");
const THEME_MODE_KEY = "themeMode";
const LANG_MODE_KEY = "siteLangMode";

if (!localStorage.getItem(THEME_MODE_KEY)) {
  localStorage.setItem(THEME_MODE_KEY, "auto");
}
if (!localStorage.getItem(LANG_MODE_KEY)) {
  localStorage.setItem(LANG_MODE_KEY, "auto");
}

function detectSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveThemeFromMode(mode) {
  if (mode === "auto") return detectSystemTheme();
  return mode === "dark" ? "dark" : "light";
}

function detectSystemLanguage() {
  const langs = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ]
    .filter(Boolean)
    .map((lang) => String(lang).toLowerCase());

  if (langs.some((lang) => lang.startsWith("ru"))) return "ru";
  return "uz";
}

function resolveLanguage(modeOrLang) {
  if (modeOrLang === "auto") return detectSystemLanguage();
  return modeOrLang === "ru" ? "ru" : "uz";
}

function applyTheme(theme) {
  const resolvedTheme =
    forcedTheme === "dark" || forcedTheme === "light"
      ? forcedTheme
      : theme === "light"
        ? "dark"
        : "light";

  root.setAttribute("data-theme", resolvedTheme);

  if (toggleBtn) {
    toggleBtn.textContent = resolvedTheme === "dark" ? "LIGHT" : "DARK";
  }

  if (logoImg) {
    logoImg.src =
      resolvedTheme === "dark"
        ? `${basePath}/images/image/logo_dark.png`
        : `${basePath}/images/image/logo_light.png`;
  }
}

const savedThemeMode = localStorage.getItem(THEME_MODE_KEY) || "auto";
const initialTheme = resolveThemeFromMode(savedThemeMode);
localStorage.setItem("theme", initialTheme);
applyTheme(initialTheme);

const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const handleSystemThemeChange = () => {
  const mode = localStorage.getItem(THEME_MODE_KEY) || "auto";
  if (mode !== "auto") return;
  const nextTheme = resolveThemeFromMode("auto");
  localStorage.setItem("theme", nextTheme);
  applyTheme(nextTheme);
};
if (typeof themeMedia.addEventListener === "function") {
  themeMedia.addEventListener("change", handleSystemThemeChange);
} else if (typeof themeMedia.addListener === "function") {
  themeMedia.addListener(handleSystemThemeChange);
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (forcedTheme === "dark" || forcedTheme === "light") {
      applyTheme(forcedTheme);
      return;
    }
    const isDark = root.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    localStorage.setItem(THEME_MODE_KEY, next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}
//ThemeSwitcher>
let langData = {};
fetch(`${basePath}/data/lang.json`)
  .then((res) => res.text())
  .then((raw) => {
    const sanitized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    return JSON.parse(sanitized);
  })
  .then((data) => {
    langData = data;
    window.langData = data;

    const langMode = localStorage.getItem(LANG_MODE_KEY) || "auto";
    const savedLang =
      langMode === "auto"
        ? "auto"
        : localStorage.getItem("siteLang") === "ru"
          ? "ru"
          : "uz";
    setLanguage(savedLang);

    document
      .getElementById("selectLang-uz")
      ?.addEventListener("click", () => setLanguage("uz"));
    document
      .getElementById("selectLang-ru")
      ?.addEventListener("click", () => setLanguage("ru"));
  })
  .catch((err) => console.error("Failed to load lang.json:", err));

function setLanguage(lang) {
  const isAuto = lang === "auto";
  const resolvedLang = resolveLanguage(lang);
  localStorage.setItem(LANG_MODE_KEY, isAuto ? "auto" : "manual");
  localStorage.setItem("siteLang", resolvedLang);

  document.querySelectorAll("[langIn]").forEach((el) => {
    if (el.hasAttribute("data-lang-skip")) return;
    const key = el.getAttribute("langIn");
    if (langData[resolvedLang] && langData[resolvedLang][key]) {
      el.textContent = langData[resolvedLang][key];
    }
  });

  document.querySelectorAll("[langHtml]").forEach((el) => {
    if (el.hasAttribute("data-lang-skip")) return;
    const key = el.getAttribute("langHtml");
    if (langData[resolvedLang] && langData[resolvedLang][key]) {
      el.innerHTML = langData[resolvedLang][key];
    }
  });

  document.querySelectorAll("[langPlaceholder]").forEach((el) => {
    const key = el.getAttribute("langPlaceholder");
    if (langData[resolvedLang] && langData[resolvedLang][key]) {
      el.setAttribute("placeholder", langData[resolvedLang][key]);
    }
  });

  document.querySelectorAll("[langAlt]").forEach((el) => {
    const key = el.getAttribute("langAlt");
    if (langData[resolvedLang] && langData[resolvedLang][key]) {
      el.setAttribute("alt", langData[resolvedLang][key]);
    }
  });

  document.querySelectorAll("[langTitle]").forEach((el) => {
    const key = el.getAttribute("langTitle");
    if (langData[resolvedLang] && langData[resolvedLang][key]) {
      el.setAttribute("title", langData[resolvedLang][key]);
    }
  });

  document.querySelectorAll(".settings-select").forEach((el) => {
    el.dispatchEvent(new Event("lang-update"));
  });

  window.dispatchEvent(
    new CustomEvent("site-language-change", {
      detail: { lang: resolvedLang },
    }),
  );
}

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (!document.body.classList.contains("nav-open")) return;
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}
//LanguageSwitcher>
let toastSound = null;
function getToastSound() {
  if (!toastSound) {
    toastSound = new Audio(`${basePath}/sounds/inter.wav`);
    toastSound.volume = 1;
  }
  return toastSound;
}
function showToast(type, titleKey, descKey = null) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const lang = localStorage.getItem("siteLang") || "uz";

  const title = langData?.[lang]?.[titleKey] || titleKey;
  const desc = descKey ? langData?.[lang]?.[descKey] || descKey : "";

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  let icon = "";
  if (type === "success")
    icon = `<svg class="toast-icon" viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" stroke-width="2"
      d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  if (type === "error")
    icon = `<svg class="toast-icon" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
`;
  if (type === "warning")
    icon = `<svg class="toast-icon" viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" stroke-width="2"
      d="M12 9v4M12 17h.01M1 21h22L12 2 1 21z"
      stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  toast.innerHTML = `
    ${icon}
    <div class="message">
      <strong>${title}</strong>
      ${desc ? `<p class="message-desc">${desc}</p>` : ""}
    </div>
    <button class="close-btn">
      <svg class="toast-icon" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" stroke-width="2"
        d="M6 6l12 12M6 18L18 6"
        stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
  container.appendChild(toast);
  if (type === "warning" || type === "error") {
    const sound = getToastSound();
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
  toast.querySelector(".close-btn").addEventListener("click", () => {
    removeToast(toast);
  });
  setTimeout(() => removeToast(toast), 10000);
}
function removeToast(toast) {
  if (!toast) return;
  toast.style.animation = "slideOut 0.4s ease forwards";
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}
document.querySelectorAll("[successToast]").forEach((btn) => {
  btn.addEventListener("click", () =>
    showToast("success", btn.getAttribute("successToast")),
  );
});
document.querySelectorAll("[errorToast]").forEach((btn) => {
  btn.addEventListener("click", () =>
    showToast("error", btn.getAttribute("errorToast")),
  );
});
document.querySelectorAll("[warningToast]").forEach((btn) => {
  btn.addEventListener("click", () =>
    showToast(
      "warning",
      btn.getAttribute("warningToast"),
      btn.getAttribute("descToast"),
    ),
  );
});
//Toast>

window.applyTheme = applyTheme;
window.setLanguage = setLanguage;
window.showToastRaw = showToast;
window.langData = langData;
window.showToast = function (type, titleKey, descKey = null) {
  return window.showToastRaw(type, titleKey, descKey);
};
