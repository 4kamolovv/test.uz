// /js/auth-modal.js
import {
  loginWithEmail,
  registerWithEmail,
  logout,
  watchUser,
} from "./auth.js";

/* ------------------ Toast helper ------------------ */
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

  // fallback
  console.log("Toast:", type, titleKey, descKey, vars);
  alert(titleKey);
}

/* ------------------ Error mapping ------------------ */
function mapRegisterError(err) {
  const code = err?.code || "";

  // Nickname unique error (biz auth.js da code berib yuboramiz)
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

  if (
    code.includes("auth/user-not-found") ||
    code.includes("auth/wrong-password")
  )
    return ["error", "AuthLoginErrorTitle", "AuthLoginErrorDesc"];

  return ["error", "AuthLoginErrorTitle", "AuthLoginErrorDesc"];
}

/* ------------------ Modal HTML inject ------------------ */
function injectModal() {
  if (document.getElementById("authOverlay")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="auth-overlay" id="authOverlay">
      <div class="auth-modal" role="dialog" aria-modal="true">
        <button class="auth-close" id="authClose" aria-label="Yopish">✕</button>
        
        <div class="auth-tabs">
          <button class="auth-tab active" id="tabLogin" type="button">Kirish</button>
          <button class="auth-tab" id="tabRegister" type="button">Ro‘yxatdan o‘tish</button>
        </div>
        
        <!-- LOGIN -->
        <div class="auth-pane active" id="paneLogin">
          <h3 class="auth-title">Kirish</h3>
          <p class="auth-sub">Email tasdiqlangan bo‘lishi kerak.</p>
        
          <form id="loginForm" class="auth-form">
            <input id="loginEmail" class="auth-input" type="email" placeholder="Email" required />
            <input id="loginPassword" class="auth-input" type="password" placeholder="Parol" required />
            <button class="auth-btn primary" type="submit">Kirish</button>
          </form>
        </div>
        
        <!-- REGISTER -->
        <div class="auth-pane" id="paneRegister">
          <h3 class="auth-title">Ro‘yxatdan o‘tish</h3>
          <p class="auth-sub">Emailingizga tasdiqlash havolasi yuboriladi.</p>
        
          <form id="registerForm" class="auth-form">
            <input id="regNickname" class="auth-input" type="text" placeholder="Nickname" required />
            <input id="regEmail" class="auth-input" type="email" placeholder="Email" required />
            <input id="regPassword" class="auth-input" type="password" placeholder="Parol (min 6)" minlength="6" required />
            <button class="auth-btn primary" type="submit">Ro‘yxatdan o‘tish</button>
          </form>
        </div>
      </div>
    </div>
    `
  );
}

/* ------------------ CSS inject ------------------ */
function injectCSS() {
  if (document.getElementById("authModalCSS")) return;

  const style = document.createElement("style");
  style.id = "authModalCSS";
  style.textContent = `
    .auth-overlay{
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.45); z-index:2000; padding:16px;
    }
    .auth-overlay.active{ display:flex; }
    
    /* top padding: X tugma tab ustiga chiqmasin */
    .auth-modal{
      width:100%; max-width:460px;
      background:var(--bg-white); color:var(--text-main);
      border:1px solid var(--bg-gray); border-radius:18px;
      box-shadow:var(--shadow-modal);
      padding:56px 16px 16px;
      position:relative;
      animation:authPop .18s ease-out forwards;
    }
    @keyframes authPop{
      from{transform:scale(.96); opacity:0;}
      to{transform:scale(1); opacity:1;}
    }
    
    .auth-close{
      position:absolute; top:10px; right:10px;
      width:36px; height:36px; border-radius:12px;
      border:none; background:var(--bg-gray);
      color:var(--text-main); cursor:pointer; font-size:16px;
      display:grid; place-items:center;
      z-index:10;
    }
    
    .auth-tabs{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
    .auth-tab{
      height:42px; border-radius:12px; border:2px solid var(--bg-gray);
      background:var(--bg-white); color:var(--text-main);
      cursor:pointer; font-weight:800;
    }
    .auth-tab.active{ border-color:var(--green-dark); background:var(--bg-gray); }
    
    .auth-pane{ display:none; }
    .auth-pane.active{ display:block; }
    
    .auth-title{ margin:8px 0 4px; font-size:18px; font-weight:900; }
    .auth-sub{ margin:0 0 12px; color:var(--text-gray); font-size:14px; line-height:1.55; }
    
    .auth-form{ display:flex; flex-direction:column; gap:10px; }
    .auth-input{
      height:44px; border-radius:12px; border:2px solid var(--bg-gray);
      background:var(--bg-white); padding:0 12px;
      outline:none; color:var(--text-main); font-weight:650;
    }
    .auth-input:focus{
      border-color:var(--color-blue);
      box-shadow:0 0 0 .13rem var(--color-blue);
    }
    .auth-btn{
      height:44px; border-radius:12px; border:none;
      cursor:pointer; font-weight:900;
    }
    .auth-btn.primary{ background:var(--green-dark); color:#fff; }
  `;
  document.head.appendChild(style);
}

/* ------------------ Init ------------------ */
function initAuthModal() {
  const openBtn = document.getElementById("openAuth");
  if (!openBtn) return;

  injectCSS();
  injectModal();

  const overlay = document.getElementById("authOverlay");
  const closeBtn = document.getElementById("authClose");

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const paneLogin = document.getElementById("paneLogin");
  const paneRegister = document.getElementById("paneRegister");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  const open = () => overlay.classList.add("active");
  const close = () => overlay.classList.remove("active");

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  function setTab(which) {
    const isLogin = which === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
    paneLogin.classList.toggle("active", isLogin);
    paneRegister.classList.toggle("active", !isLogin);
  }

  tabLogin.addEventListener("click", () => setTab("login"));
  tabRegister.addEventListener("click", () => setTab("register"));

  // REGISTER
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nickname = document.getElementById("regNickname").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

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

  // LOGIN
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const cred = await loginWithEmail({ email, password });

      if (!cred.user.emailVerified) {
        await logout();

        const lang = localStorage.getItem("siteLang") || "uz";

        showToast(
          "warning",
          langData[lang].AuthLoginNotVerifiedTitle,
          langData[lang].AuthLoginNotVerifiedDesc
        );
        return;
      }

      // 🔥 nickname
      const nickname = cred.user.displayName || "Foydalanuvchi";

      const lang = localStorage.getItem("siteLang") || "uz";

      // 🔥 JSON + JS
      showToast(
        "success",
        langData[lang].AuthLoginSuccessTitle,
        `${langData[lang].AuthLoginSuccessDesc} ${nickname}`
      );

      loginForm.reset();
      setTimeout(close, 300);
    } catch (err) {
      const lang = localStorage.getItem("siteLang") || "uz";

      showToast(
        "error",
        langData[lang].AuthLoginErrorTitle,
        langData[lang].AuthLoginErrorDesc
      );
    }
  });

  // Header button text
  watchUser((user) => {
    if (user && user.emailVerified) {
      openBtn.textContent = user.displayName || "Profil";
    } else {
      openBtn.textContent = "Kirish";
    }
  });
}

document.addEventListener("DOMContentLoaded", initAuthModal);
