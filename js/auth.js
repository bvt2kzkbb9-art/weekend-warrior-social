/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — auth.js (PRODUCTION)
 * Complete Firebase Authentication System
 * ============================================================
 */

import { auth, db, COL, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ════════════════════════════════════════════════════════════
// ERROR MESSAGES & VALIDATION
// ════════════════════════════════════════════════════════════

const AUTH_ERRORS = {
  "auth/email-already-in-use": "Email już jest zarejestrowany",
  "auth/weak-password": "Hasło musi mieć min. 8 znaków",
  "auth/invalid-email": "Niepoprawny adres email",
  "auth/user-not-found": "Użytkownik nie istnieje",
  "auth/wrong-password": "Niepoprawne hasło",
  "auth/invalid-password": "Niepoprawne hasło",
  "auth/invalid-credential": "Niepoprawny email lub hasło",
  "auth/too-many-requests": "Za dużo nieudanych prób. Spróbuj za 15 minut",
  "auth/operation-not-allowed": "Logowanie email/hasło jest wyłączone",
  "auth/popup-closed-by-user": "Okno logowania zostało zamknięte",
  "auth/cancelled-popup-request": "Logowanie zostało anulowane",
  "auth/unauthorized-domain": "Domena nie jest zautoryzowana",
  "auth/network-request-failed": "Brak połączenia z siecią. Sprawdź internet",
  "auth/internal-error": "Błąd wewnętrzny. Spróbuj ponownie",
};

// ════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ════════════════════════════════════════════════════════════

export function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("wws-toasts");
  if (!container) {
    container = document.createElement("div");
    container.id = "wws-toasts";
    container.className = "toast-container";
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px;
    `;
    document.body.appendChild(container);
  }

  const ICON = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16C784" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F8CFF" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.style.cssText = `
    padding: 12px 16px; border-radius: 8px; display: flex; gap: 10px;
    align-items: center; background: #1a1a1a; border: 1px solid #333;
    color: #eee; font-size: 14px; animation: slideInRight 0.3s ease;
  `;
  el.innerHTML = `${ICON[type] || ICON.info}<span>${message}</span>`;
  container.appendChild(el);

  const dismiss = () => {
    el.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => el.remove(), 300);
  };

  const timeoutId = setTimeout(dismiss, duration);
  el.addEventListener("click", () => {
    clearTimeout(timeoutId);
    dismiss();
  });
}

// ════════════════════════════════════════════════════════════
// FORM HELPERS
// ════════════════════════════════════════════════════════════

function setLoading(btn, state) {
  if (!btn) return;
  btn.disabled = state;
  btn.classList.toggle("loading", state);
  btn.style.opacity = state ? "0.6" : "1";
}

function setFieldError(input, msg) {
  if (!input) return;
  input.classList.add("error");
  input.setAttribute("aria-invalid", "true");
  const group = input.closest(".form-group");
  if (!group) return;
  let el = group.querySelector(".form-error");
  if (!el) {
    el = document.createElement("span");
    el.className = "form-error";
    el.setAttribute("role", "alert");
    group.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("error");
  input.removeAttribute("aria-invalid");
  const group = input.closest(".form-group");
  if (!group) return;
  const el = group.querySelector(".form-error");
  if (el) el.style.display = "none";
}

function clearAllFieldErrors(fields) {
  fields.forEach(clearFieldError);
}

// ════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function getErrorMessage(code) {
  return AUTH_ERRORS[code] || "Błąd: " + (code || "nieznany");
}

// ════════════════════════════════════════════════════════════
// FIRESTORE USER MANAGEMENT
// ════════════════════════════════════════════════════════════

export async function ensureUserDoc(user) {
  if (!user) return null;
  const ref = doc(db, COL.USERS, user.uid);
  const snap = await getDoc(ref).catch(() => null);

  if (!snap || !snap.exists()) {
    const userData = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "Wojownik",
      photoURL: user.photoURL || "",
      bannerURL: "",
      username: (user.displayName || "warrior").toLowerCase().replace(/\s+/g, "_"),
      bio: "",
      points: 0,
      level: 1,
      rank: "Rookie",
      streak: 0,
      postsCount: 0,
      commentsCount: 0,
      likesReceived: 0,
      quizzesCompleted: 0,
      challengesCompleted: 0,
      challengesSent: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      lastDailyLogin: null,
      achievements: [],
      badges: [],
    };
    await setDoc(ref, userData);
    return userData;
  }
  return snap.data();
}

export async function getCurrentUserData(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, COL.USERS, uid));
    return snap && snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("[getCurrentUserData] Error:", err.code);
    return null;
  }
}

export async function updateLastActive(uid) {
  if (!uid) return;
  try {
    await updateDoc(doc(db, COL.USERS, uid), {
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    console.error("[updateLastActive] Error:", err.code);
  }
}

// ════════════════════════════════════════════════════════════
// AUTHENTICATION FUNCTIONS
// ════════════════════════════════════════════════════════════

export async function registerWithEmail(email, password, displayName) {
  if (!validateEmail(email)) throw new Error("auth/invalid-email");
  if (!validatePassword(password)) throw new Error("auth/weak-password");
  if (!displayName || displayName.trim().length === 0) throw new Error("auth/invalid-display-name");

  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await updateProfile(user, { displayName: displayName.trim() });
  } catch (err) {
    console.error("[registerWithEmail] updateProfile error:", err.code);
  }

  const userData = await ensureUserDoc(user);
  showToast("✅ Konto utworzone pomyślnie!", "success");
  return { user, userData };
}

export async function loginWithEmail(email, password) {
  if (!validateEmail(email)) throw new Error("auth/invalid-email");
  if (!password) throw new Error("auth/invalid-password");

  const { user } = await signInWithEmailAndPassword(auth, email, password);

  try {
    await updateDoc(doc(db, COL.USERS, user.uid), {
      lastLoginAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    console.error("[loginWithEmail] updateDoc error:", err.code);
  }

  const userData = await getCurrentUserData(user.uid);
  showToast("✅ Zalogowano pomyślnie!", "success");
  return { user, userData };
}

export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);

  const userData = await ensureUserDoc(user);

  try {
    await updateDoc(doc(db, COL.USERS, user.uid), {
      lastLoginAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    console.error("[loginWithGoogle] updateDoc error:", err.code);
  }

  showToast("✅ Zalogowano przez Google!", "success");
  return { user, userData };
}

export async function resetPassword(email) {
  if (!validateEmail(email)) throw new Error("auth/invalid-email");
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/login.html`,
  });
  showToast("✅ Link resetowania wysłany na email!", "success");
}

export async function logout() {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateLastActive(user.uid);
    }
  } catch (err) {
    console.error("[logout] updateLastActive error:", err.code);
  }

  await signOut(auth);
  window.location.href = "login.html";
}

// ════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ════════════════════════════════════════════════════════════

export function enableSessionPersistence() {
  return setPersistence(auth, browserLocalPersistence);
}

export function checkAuth(callback) {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {
        try {
          await updateLastActive(user.uid);
          const userData = await getCurrentUserData(user.uid);
          callback(user, userData || {});
        } catch (err) {
          console.error("[checkAuth] Error:", err.code);
          callback(user, {});
        }
      } else {
        callback(null, null);
      }
    },
    (err) => {
      console.error("[checkAuth] Auth state error:", err.code);
      window.location.href = "/login.html";
    }
  );
  return unsubscribe;
}

export function redirectIfLogged() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "index.html";
      }
      resolve(unsubscribe);
    });
  });
}

// ════════════════════════════════════════════════════════════
// LOGIN FORM INITIALIZATION
// ════════════════════════════════════════════════════════════

export function initLoginForm() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const googleBtn = document.getElementById("google-btn");
  const errorMsg = document.getElementById("error-msg");

  if (!form || !emailInput || !passwordInput || !loginBtn) {
    console.warn("[initLoginForm] Missing form elements");
    return;
  }

  // Email/password login
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate
    clearAllFieldErrors([emailInput, passwordInput]);
    let valid = true;

    if (!email) {
      setFieldError(emailInput, "Podaj email");
      valid = false;
    } else if (!validateEmail(email)) {
      setFieldError(emailInput, "Niepoprawny email");
      valid = false;
    }

    if (!password) {
      setFieldError(passwordInput, "Podaj hasło");
      valid = false;
    }

    if (!valid) return;

    setLoading(loginBtn, true);
    if (errorMsg) errorMsg.textContent = "";

    try {
      await loginWithEmail(email, password);
      window.location.href = "index.html";
    } catch (err) {
      const msg = getErrorMessage(err.code);
      if (errorMsg) errorMsg.textContent = msg;
      else showToast(`❌ ${msg}`, "error");
      console.error("[loginForm] Error:", err.code, err.message);
    } finally {
      setLoading(loginBtn, false);
    }
  });

  // Google login
  if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      setLoading(googleBtn, true);
      if (errorMsg) errorMsg.textContent = "";

      try {
        await loginWithGoogle();
        window.location.href = "index.html";
      } catch (err) {
        if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(err.code)) {
          const msg = getErrorMessage(err.code);
          if (errorMsg) errorMsg.textContent = msg;
          else showToast(`❌ ${msg}`, "error");
        }
        console.error("[loginForm] Google error:", err.code);
      } finally {
        setLoading(googleBtn, false);
      }
    });
  }

  // Password reset
  const forgotLink = document.getElementById("forgot-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim() || prompt("Podaj adres email:");
      if (!email) return;

      try {
        await resetPassword(email);
      } catch (err) {
        const msg = getErrorMessage(err.code);
        showToast(`❌ ${msg}`, "error");
        console.error("[resetPassword] Error:", err.code);
      }
    });
  }
}

// ════════════════════════════════════════════════════════════
// REGISTER FORM INITIALIZATION
// ════════════════════════════════════════════════════════════

export function initRegisterForm() {
  const form = document.getElementById("register-form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("password-confirm");
  const termsInput = document.getElementById("terms");
  const registerBtn = document.getElementById("register-btn");
  const googleBtn = document.getElementById("google-btn");
  const strengthIndicator = document.getElementById("strength-indicator");
  const strengthLabel = document.getElementById("strength-label");

  if (!form || !emailInput || !passwordInput || !registerBtn) {
    console.warn("[initRegisterForm] Missing form elements");
    return;
  }

  // Password visibility toggles
  const toggleButtons = document.querySelectorAll(".toggle-pw-btn");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        btn.textContent = input.type === "password" ? "👁" : "👁‍🗨";
      }
    });
  });

  // Password strength indicator
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const pwd = passwordInput.value;
      let strength = 0;

      if (pwd.length >= 8) strength++;
      if (pwd.length >= 12) strength++;
      if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength++;
      if (/[0-9]/.test(pwd)) strength++;
      if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

      strength = Math.min(3, Math.ceil(strength / 2));

      if (strengthIndicator) {
        strengthIndicator.className = "strength-fill";
        if (strength === 0) {
          strengthIndicator.classList.add("weak");
        } else if (strength <= 1) {
          strengthIndicator.classList.add("weak");
        } else if (strength === 2) {
          strengthIndicator.classList.add("medium");
        } else {
          strengthIndicator.classList.add("strong");
        }
      }

      if (strengthLabel) {
        if (pwd.length === 0) {
          strengthLabel.textContent = "";
        } else if (strength <= 1) {
          strengthLabel.textContent = "Słabe hasło";
        } else if (strength === 2) {
          strengthLabel.textContent = "Dobre hasło";
        } else {
          strengthLabel.textContent = "Silne hasło ⚔️";
        }
      }

      clearFieldError(passwordInput);
    });
  }

  // Confirm password validation
  if (confirmInput) {
    confirmInput.addEventListener("input", () => {
      clearFieldError(confirmInput);
      if (confirmInput.value && passwordInput.value !== confirmInput.value) {
        setFieldError(confirmInput, "Hasła nie są zgodne");
      }
    });
  }

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput?.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput?.value;

    // Validate
    clearAllFieldErrors([usernameInput, emailInput, passwordInput, confirmInput]);
    let valid = true;

    if (!username || username.length < 3) {
      if (usernameInput) setFieldError(usernameInput, "Min. 3 znaki");
      valid = false;
    }

    if (!email) {
      setFieldError(emailInput, "Podaj email");
      valid = false;
    } else if (!validateEmail(email)) {
      setFieldError(emailInput, "Niepoprawny email");
      valid = false;
    }

    if (!password) {
      setFieldError(passwordInput, "Podaj hasło");
      valid = false;
    } else if (!validatePassword(password)) {
      setFieldError(passwordInput, "Min. 8 znaków");
      valid = false;
    }

    if (!confirm) {
      setFieldError(confirmInput, "Potwierdź hasło");
      valid = false;
    } else if (password !== confirm) {
      setFieldError(confirmInput, "Hasła nie są zgodne");
      valid = false;
    }

    if (termsInput && !termsInput.checked) {
      showToast("⚠️ Musisz zaakceptować Regulamin", "warning");
      valid = false;
    }

    if (!valid) return;

    setLoading(registerBtn, true);

    try {
      const { user } = await registerWithEmail(email, password, username);
      // Auto-login after successful registration
      window.location.href = "index.html";
    } catch (err) {
      const msg = getErrorMessage(err.code);
      showToast(`❌ ${msg}`, "error");

      // Set field-specific errors
      if (err.code === "auth/email-already-in-use") {
        setFieldError(emailInput, "Email już w użyciu");
      } else if (err.code === "auth/invalid-email") {
        setFieldError(emailInput, "Niepoprawny email");
      } else if (err.code === "auth/weak-password") {
        setFieldError(passwordInput, "Hasło za słabe");
      }

      console.error("[registerForm] Error:", err.code, err.message);
    } finally {
      setLoading(registerBtn, false);
    }
  });

  // Google login
  if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      setLoading(googleBtn, true);

      try {
        await loginWithGoogle();
        window.location.href = "index.html";
      } catch (err) {
        if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(err.code)) {
          const msg = getErrorMessage(err.code);
          showToast(`❌ ${msg}`, "error");
        }
        console.error("[registerForm] Google error:", err.code);
      } finally {
        setLoading(googleBtn, false);
      }
    });
  }
}

// ════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════

// Enable session persistence on app load
enableSessionPersistence().catch((err) => {
  console.error("[enableSessionPersistence] Error:", err.code);
});
