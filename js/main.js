// ------------------------------------
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
// Loading progress bar>
// ------------------------------------
const toggleBtn = document.getElementById("theme-toggle");
const logoImg = document.getElementById("logo-img");
const root = document.documentElement;
const basePath = window.location.pathname.includes("/html/") ? ".." : ".";

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);

  if (toggleBtn) toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";

  if (logoImg) {
    logoImg.src =
      theme === "dark"
        ? `${basePath}/images/image/logo_dark.png`
        : `${basePath}/images/image/logo_light.png`;
  }
}

applyTheme(localStorage.getItem("theme") || "light");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

// Theme switcher>
// ------------------------------------------------------------------------
let langData = {};
fetch(`${basePath}/data/lang.json`)
  .then((res) => res.json())
  .then((data) => {
    langData = data;
    window.langData = data;

    const savedLang = localStorage.getItem("siteLang") || "uz";
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
  localStorage.setItem("siteLang", lang);

  document.querySelectorAll("[langIn]").forEach((el) => {
    if (el.hasAttribute("data-lang-skip")) return;
    const key = el.getAttribute("langIn");
    if (langData[lang] && langData[lang][key]) {
      el.textContent = langData[lang][key];
    }
  });

  document.querySelectorAll("[langHtml]").forEach((el) => {
    if (el.hasAttribute("data-lang-skip")) return;
    const key = el.getAttribute("langHtml");
    if (langData[lang] && langData[lang][key]) {
      el.innerHTML = langData[lang][key];
    }
  });

  document.querySelectorAll("[langPlaceholder]").forEach((el) => {
    const key = el.getAttribute("langPlaceholder");
    if (langData[lang] && langData[lang][key]) {
      el.setAttribute("placeholder", langData[lang][key]);
    }
  });

  document.querySelectorAll("[langAlt]").forEach((el) => {
    const key = el.getAttribute("langAlt");
    if (langData[lang] && langData[lang][key]) {
      el.setAttribute("alt", langData[lang][key]);
    }
  });

  document.querySelectorAll("[langTitle]").forEach((el) => {
    const key = el.getAttribute("langTitle");
    if (langData[lang] && langData[lang][key]) {
      el.setAttribute("title", langData[lang][key]);
    }
  });

  document.querySelectorAll(".settings-select").forEach((el) => {
    el.dispatchEvent(new Event("lang-update"));
  });
}
// Language switcher>
// ------------------------------------------------------------------------
let toastSound = null;
function getToastSound() {
  if (!toastSound) {
    toastSound = new Audio(`${basePath}/sounds/inter.wav`);
    toastSound.volume = 1;
  }
  return toastSound;
}
// Toast sound>
function showToast(type, titleKey, descKey = null) {
  const container = document.getElementById("toast-container");

  const lang = localStorage.getItem("siteLang") || "uz";

  const title = langData?.[lang]?.[titleKey] || titleKey;
  const desc = descKey ? langData?.[lang]?.[descKey] || descKey : "";

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // Icon SVGs
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

  // Sound play (1 sound, only warning & error)
  if (type === "warning" || type === "error") {
    const sound = getToastSound();
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  // toastSound.currentTime = 0;
  // toastSound.play().catch(() => {});
  // (toast sound success,warning,error daxam chiqishi)

  // Close button → slide out
  toast.querySelector(".close-btn").addEventListener("click", () => {
    removeToast(toast);
  });

  // Auto close
  setTimeout(() => removeToast(toast), 10000);
}
// Toast main function>
// Slide-out remove
function removeToast(toast) {
  if (!toast) return;
  toast.style.animation = "slideOut 0.4s ease forwards";
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}
// Attach buttons
document.querySelectorAll("[successToast]").forEach((btn) => {
  btn.addEventListener("click", () =>
    showToast("success", btn.getAttribute("successToast"))
  );
});
document.querySelectorAll("[errorToast]").forEach((btn) => {
  btn.addEventListener("click", () =>
    showToast("error", btn.getAttribute("errorToast"))
  );
});
document.querySelectorAll("[warningToast]").forEach((btn) => {
  btn.addEventListener("click", () =>
    showToast(
      "warning",
      btn.getAttribute("warningToast"),
      btn.getAttribute("descToast")
    )
  );
});
// Toast>
// ------------------------------------

// ================= FIX: main.js -> globals for module scripts =================
// Nega: auth-modal.js (type="module") main.js ichidagi funksiyalarni ko‘rmaydi.
// Shuning uchun ularni window ga chiqaramiz.

window.applyTheme = applyTheme;
window.setLanguage = setLanguage;
window.showToastRaw = showToast; // asl showToast
window.langData = langData;      // hozircha bo‘sh, fetchdan keyin to‘ladi

// notify OFF bo‘lsa toast umuman chiqmasin
window.showToast = function (type, titleKey, descKey = null) {
  if (localStorage.getItem("notify") === "off") return;
  return window.showToastRaw(type, titleKey, descKey);
};
