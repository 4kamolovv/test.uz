// /js/auth-modal.js
import { loginWithEmail, registerWithEmail, logout, watchUser } from "./auth.js";

/* ------------------ helpers ------------------ */
function ensureToastContainer() {
  if (!document.getElementById("toast-container")) {
    const div = document.createElement("div");
    div.id = "toast-container";
    div.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:9999;width:300px;";
    document.body.appendChild(div);
  }
}

function toast(type, titleKey, descKey = null, vars = null) {
  ensureToastContainer();
  if (typeof window.showToast === "function") {
    window.showToast(type, titleKey, descKey, vars);
    return;
  }
  console.log("Toast:", type, titleKey, descKey, vars);
  alert(titleKey);
}

function mapRegisterError(err) {
  const code = err?.code || "";

  if (code === "nick/taken")
    return ["warning", "AuthNickTakenTitle", "AuthNickTakenDesc"];
  if (code === "nick/empty")
    return ["warning", "AuthNickEmptyTitle", "AuthNickEmptyDesc"];

  if (code.includes("auth/email-already-in-use"))
    return ["error", "AuthEmailInUseTitle", "AuthEmailInUseDesc"];

  if (code.includes("auth/weak-password"))
    return ["warning", "AuthWeakPasswordTitle", "AuthWeakPasswordDesc"];

  if (code.includes("auth/invalid-email"))
    return ["warning", "AuthInvalidEmailTitle", "AuthInvalidEmailDesc"];

  return ["error", "AuthRegErrorTitle", "AuthRegErrorDesc"];
}

function mapLoginError(err) {
  const code = err?.code || "";

  if (code.includes("auth/invalid-email"))
    return ["warning", "AuthInvalidEmailTitle", "AuthInvalidEmailDesc"];

  if (code.includes("auth/user-not-found") || code.includes("auth/wrong-password"))
    return ["error", "AuthLoginErrorTitle", "AuthLoginErrorDesc"];

  return ["error", "AuthLoginErrorTitle", "AuthLoginErrorDesc"];
}

function getInitial(nameOrEmail = "") {
  const s = (nameOrEmail || "").trim();
  return s ? s[0].toUpperCase() : "U";
}

/* ------------------ CSS inject (ixtiyoriy) ------------------ */
function injectCSS() {
  if (document.getElementById("authModalCSS")) return;

  const style = document.createElement("style");
  style.id = "authModalCSS";
  style.textContent = `
    .auth-overlay{position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.45); z-index:2000; padding:16px;}
    .auth-overlay.active{display:flex;}

    .auth-modal{width:100%; max-width:460px;
      background:var(--bg-white); color:var(--text-main);
      border:1px solid var(--bg-gray); border-radius:18px;
      box-shadow:var(--shadow-modal);
      padding:56px 16px 16px; position:relative;
      animation:authPop .18s ease-out forwards;}
    @keyframes authPop{from{transform:scale(.96); opacity:0;} to{transform:scale(1); opacity:1;}}

    .auth-close{position:absolute; top:10px; right:10px;
      width:36px; height:36px; border-radius:12px;
      border:none; background:var(--bg-gray); color:var(--text-main);
      cursor:pointer; font-size:16px; display:grid; place-items:center; z-index:10;}

    .auth-tabs{display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;}
    .auth-tab{height:42px; border-radius:12px; border:2px solid var(--bg-gray);
      background:var(--bg-white); color:var(--text-main); cursor:pointer; font-weight:800;}
    .auth-tab.active{border-color:var(--green-dark); background:var(--bg-gray);}

    .auth-pane{display:none;}
    .auth-pane.active{display:block;}

    .auth-title{margin:8px 0 4px; font-size:18px; font-weight:900;}
    .auth-sub{margin:0 0 12px; color:var(--text-gray); font-size:14px; line-height:1.55;}

    .auth-form{display:flex; flex-direction:column; gap:10px;}
    .auth-input{height:44px; border-radius:12px; border:2px solid var(--bg-gray);
      background:var(--bg-white); padding:0 12px; outline:none; color:var(--text-main); font-weight:650;}
    .auth-input:focus{border-color:var(--color-blue); box-shadow:0 0 0 .13rem var(--color-blue);}

    .auth-btn{height:44px; border-radius:12px; border:none; cursor:pointer; font-weight:900;}
    .auth-btn.primary{background:var(--green-dark); color:#fff;}

    /* user dropdown minimal safety */
    .user-dropdown{display:none;}
    .user-dropdown.open{display:block;}
  `;
  document.head.appendChild(style);
}

/* ------------------ Init ------------------ */
function initAuthModal() {
  const openBtn = document.getElementById("openAuth");
  if (!openBtn) return;

  injectCSS();

  // Auth modal elements (HTML'da bor)
  const overlay = document.getElementById("authOverlay");
  const closeBtn = document.getElementById("authClose");

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const paneLogin = document.getElementById("paneLogin");
  const paneRegister = document.getElementById("paneRegister");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // User menu elements (HTML'da bor)
  const userMenu = document.getElementById("userMenu");
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const userNameEl = document.getElementById("userName");
  const userAvatarEl = document.getElementById("userAvatar");
  const btnLogout = document.getElementById("btnLogout");

  // Logout confirm modal (HTML'da bor)
  const logoutOverlay = document.getElementById("logoutOverlay");
  const logoutX = document.getElementById("logoutX");
  const logoutCancel = document.getElementById("logoutCancel");
  const logoutYes = document.getElementById("logoutYes");

  let currentUser = null;

  /* --------- modal open/close --------- */
  const openAuthModal = () => overlay?.classList.add("active");
  const closeAuthModal = () => overlay?.classList.remove("active");

  openBtn.addEventListener("click", () => {
    // faqat kirmagan bo‘lsa modal ochiladi
    if (!currentUser) openAuthModal();
  });

  closeBtn?.addEventListener("click", closeAuthModal);

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeAuthModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAuthModal();
      closeUserDropdown();
      closeLogoutConfirm();
    }
  });

  /* --------- tabs --------- */
  function setTab(which) {
    const isLogin = which === "login";
    tabLogin?.classList.toggle("active", isLogin);
    tabRegister?.classList.toggle("active", !isLogin);
    paneLogin?.classList.toggle("active", isLogin);
    paneRegister?.classList.toggle("active", !isLogin);
  }

  tabLogin?.addEventListener("click", () => setTab("login"));
  tabRegister?.addEventListener("click", () => setTab("register"));

  /* --------- register --------- */
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nickname = document.getElementById("regNickname")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;

    try {
      await registerWithEmail({ nickname, email, password });
      toast("success", "AuthRegSuccessTitle", "AuthRegSuccessDesc");
      registerForm.reset();
      setTab("login");
    } catch (err) {
      const [t, titleKey, descKey] = mapRegisterError(err);
      toast(t, titleKey, descKey);
    }
  });

  /* --------- login --------- */
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    try {
      const cred = await loginWithEmail({ email, password });

      if (!cred.user.emailVerified) {
        await logout();
        const lang = localStorage.getItem("siteLang") || "uz";
        window.showToast?.(
          "warning",
          window.langData?.[lang]?.AuthLoginNotVerifiedTitle || "Email tasdiqlanmagan",
          window.langData?.[lang]?.AuthLoginNotVerifiedDesc || "Emailni tasdiqlang va qayta kiring"
        );
        return;
      }

      const nickname = cred.user.displayName || "Foydalanuvchi";
      const lang = localStorage.getItem("siteLang") || "uz";

      window.showToast?.(
        "success",
        window.langData?.[lang]?.AuthLoginSuccessTitle || "Muvaffaqiyatli",
        `${window.langData?.[lang]?.AuthLoginSuccessDesc || "Xush kelibsiz,"} ${nickname}`
      );

      loginForm.reset();
      setTimeout(closeAuthModal, 200);
    } catch (err) {
      const [t, titleKey, descKey] = mapLoginError(err);
      toast(t, titleKey, descKey);
    }
  });

  /* --------- user dropdown --------- */
  function openUserDropdown() {
    if (!userDropdown) return;
    userDropdown.classList.add("open");
    userMenuBtn?.setAttribute("aria-expanded", "true");
  }
  function closeUserDropdown() {
    if (!userDropdown) return;
    userDropdown.classList.remove("open");
    userMenuBtn?.setAttribute("aria-expanded", "false");
  }
  function toggleUserDropdown() {
    if (!userDropdown) return;
    const isOpen = userDropdown.classList.contains("open");
    if (isOpen) closeUserDropdown();
    else openUserDropdown();
  }

  userMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleUserDropdown();
  });

  // outside click closes dropdown
  document.addEventListener("click", (e) => {
    if (!userDropdown || !userMenu) return;
    if (!userMenu.contains(e.target)) closeUserDropdown();
  });

  /* --------- logout confirm --------- */
  function openLogoutConfirm() {
    if (!logoutOverlay) return;
    logoutOverlay.classList.add("active");
    logoutOverlay.setAttribute("aria-hidden", "false");
  }
  function closeLogoutConfirm() {
    if (!logoutOverlay) return;
    logoutOverlay.classList.remove("active");
    logoutOverlay.setAttribute("aria-hidden", "true");
  }

  btnLogout?.addEventListener("click", () => {
    closeUserDropdown();
    openLogoutConfirm();
  });

  logoutX?.addEventListener("click", closeLogoutConfirm);
  logoutCancel?.addEventListener("click", closeLogoutConfirm);

  logoutOverlay?.addEventListener("click", (e) => {
    if (e.target === logoutOverlay) closeLogoutConfirm();
  });

  logoutYes?.addEventListener("click", async () => {
    try {
      await logout();
      closeLogoutConfirm();
      toast("success", "AuthLogoutTitle", "AuthLogoutDesc");
    } catch (e) {
      toast("error", "AuthLogoutErrorTitle", "AuthLogoutErrorDesc");
    }
  });

  /* --------- auth state -> header UI --------- */
  function setAuthUI(user) {
    currentUser = user && user.emailVerified ? user : null;

    if (currentUser) {
      // kirgan: user menu ko‘rsat, login tugma yashir
      openBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "inline-block";

      const displayName =
        currentUser.displayName ||
        (currentUser.email ? currentUser.email.split("@")[0] : "User");

      if (userNameEl) userNameEl.textContent = displayName;
      if (userAvatarEl) userAvatarEl.textContent = getInitial(displayName);
    } else {
      // kirmagan: login tugma ko‘rsat, user menu yashir
      openBtn.style.display = "inline-block";
      openBtn.textContent = "Kirish";
      if (userMenu) userMenu.style.display = "none";
      closeUserDropdown();
    }
  }

  watchUser(setAuthUI);
}

document.addEventListener("DOMContentLoaded", initAuthModal);
