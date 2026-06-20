import { auth, db, COL } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function showToast(message, type = "info") {
  alert(message);
}

function setLoading(btn, state) {
  if (!btn) return;
  btn.disabled = state;
  btn.classList.toggle("loading", state);
}

function setFieldError(input, msg) {
  if (!input) return;
  input.classList.add("error");
  input.setAttribute("aria-invalid", "true");
  const group = input.closest(".form-group");
  if (!group) return;
  let el = group.querySelector(".form-error-msg");
  if (!el) {
    el = document.createElement("p");
    el.className = "form-error-msg";
    el.setAttribute("role", "alert");
    group.appendChild(el);
  }
  el.textContent = msg;
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("error", "valid");
  input.removeAttribute("aria-invalid");
  const group = input.closest(".form-group");
  if (!group) return;
  const el = group.querySelector(".form-error-msg");
  if (el) el.textContent = "";
}

export async function ensureUserDoc(user) {
  if (!user) {
    console.error('[ensureUserDoc] User is null or undefined');
    return null;
  }

  console.log('[ensureUserDoc] START:', { uid: user.uid, email: user.email });

  const ref = doc(db, COL.USERS, user.uid);
  console.log('[ensureUserDoc] Firestore ref created:', { collection: COL.USERS, docId: user.uid });

  let snap = null;
  try {
    snap = await getDoc(ref);
    console.log('[ensureUserDoc] User doc found:', { exists: snap.exists() });
  } catch (err) {
    console.error('[ensureUserDoc] Error reading user doc:', err);
    snap = null;
  }

  if (!snap || !snap.exists()) {
    console.log('[ensureUserDoc] Creating new user doc...');
    const username = user.displayName || user.email.split("@")[0];
    const userData = {
      uid: user.uid,
      email: user.email,
      username: username,
      xp: 0,
      level: 1,
      rank: "Nowicjusz",
      streak: 0,
      online: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    };

    console.log('[ensureUserDoc] User data prepared:', {
      uid: userData.uid,
      email: userData.email,
      username: userData.username,
      xp: userData.xp
    });

    try {
      await setDoc(ref, userData);
      console.log('[ensureUserDoc] User doc created successfully in Firestore');
      return userData;
    } catch (err) {
      console.error('[ensureUserDoc] Error creating user doc:', err);
      console.error('[ensureUserDoc] Error Code:', err.code);
      console.error('[ensureUserDoc] Error Message:', err.message);
      throw err;
    }
  }

  console.log('[ensureUserDoc] User doc already exists, returning existing data');
  return snap.data();
}

export async function migrateUserDoc(user) {
  if (!user) return null;
  const ref = doc(db, COL.USERS, user.uid);
  const snap = await getDoc(ref).catch(() => null);

  if (!snap || !snap.exists()) {
    return ensureUserDoc(user);
  }

  const data = snap.data();
  const needsMigration = data.photoURL !== undefined || data.points !== undefined || !data.avatar || !data.xp;

  if (needsMigration) {
    const migratedData = {
      ...data,
      xp: data.xp !== undefined ? data.xp : (data.points || 0),
      rank: data.rank || "Nowicjusz",
      streak: data.streak !== undefined ? data.streak : 0,
      online: data.online !== undefined ? data.online : true,
      updatedAt: data.updatedAt ? data.updatedAt : serverTimestamp(),
      lastSeen: data.lastSeen ? data.lastSeen : serverTimestamp(),
    };

    delete migratedData.photoURL;
    delete migratedData.points;
    delete migratedData.displayName;
    delete migratedData.bannerURL;
    delete migratedData.bio;
    delete migratedData.lastLoginAt;
    delete migratedData.avatar;

    await updateDoc(ref, migratedData);
    return migratedData;
  }

  return data;
}

export async function updateLastSeen(uid) {
  if (!uid) return;
  try {
    await updateDoc(doc(db, COL.USERS, uid), {
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
      online: true,
    });
  } catch (err) {
    console.error('[updateLastSeen] error:', err);
  }
}

export async function getCurrentUserData(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COL.USERS, uid)).catch(() => null);
  return snap && snap.exists() ? snap.data() : null;
}

export function checkAuth(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userData = await migrateUserDoc(user);
        await updateLastSeen(user.uid);
        callback(user, userData || {});
      } catch (err) {
        console.error('[checkAuth] data load error:', err.code);
        callback(user, {});
      }
    } else {
      callback(null, null);
    }
  }, (err) => {
    console.error('[checkAuth] auth state error:', err.code);
    window.location.href = '/login.html';
  });
  return unsubscribe;
}

export function redirectIfNotLogged(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }

    migrateUserDoc(user)
      .then(userData => updateLastSeen(user.uid).then(() => userData))
      .then(userData => callback(user, userData || {}))
      .catch(err => {
        console.error('[redirectIfNotLogged] error:', err.code);
        window.location.href = '/login.html';
      });
  });
}

export async function registerWithEmail(email, password, displayName) {
  try {
    console.log('[registerWithEmail] START:', { email, displayName });
    console.log('[registerWithEmail] Firebase Auth instance:', { authDomain: auth.config.authDomain, projectId: auth.config.projectId });

    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    console.log('[registerWithEmail] User created:', { uid: user.uid, email: user.email });

    await updateProfile(user, { displayName });
    console.log('[registerWithEmail] Profile updated:', { uid: user.uid, displayName });

    await ensureUserDoc(user);
    console.log('[registerWithEmail] User doc created in Firestore:', { uid: user.uid });

    showToast("✅ Konto utworzone!", "success");
    return user;
  } catch (err) {
    console.error('[registerWithEmail] FULL ERROR:', err);
    console.error('[registerWithEmail] Error Code:', err.code);
    console.error('[registerWithEmail] Error Message:', err.message);
    console.error('[registerWithEmail] Error Stack:', err.stack);

    let msg = "Błąd rejestracji";
    if (err.code === "auth/email-already-in-use") msg = "Email już w użyciu";
    else if (err.code === "auth/weak-password") msg = "Hasło za słabe (min. 6 znaków)";
    else if (err.code === "auth/invalid-email") msg = "Niepoprawny email";
    else if (err.code === "auth/network-request-failed") msg = "Brak połączenia z siecią";
    else if (err.code === "auth/operation-not-allowed") msg = "Rejestracja wyłączona w Firebase";
    else if (err.code === "auth/operation-not-supported-in-this-environment") msg = "Operacja nie wspierana w tym środowisku";
    else if (err.code === "auth/requests-from-referer-blocked") msg = "Domena nie autoryzowana — patrz dokumentacja FIX_AUTH_BLOCKED.md";

    console.error('[registerWithEmail] Mapped error message:', msg);
    showToast(`❌ ${msg}`, "error");
    throw err;
  }
}

export async function loginWithEmail(email, password) {
  try {
    console.log('[loginWithEmail] START:', { email });
    console.log('[loginWithEmail] Firebase Auth instance:', { authDomain: auth.config.authDomain, projectId: auth.config.projectId });

    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('[loginWithEmail] User signed in:', { uid: user.uid, email: user.email });

    await migrateUserDoc(user);
    console.log('[loginWithEmail] User doc migrated:', { uid: user.uid });

    await updateLastSeen(user.uid);
    console.log('[loginWithEmail] Last seen updated:', { uid: user.uid });

    showToast("✅ Zalogowano!", "success");
    return user;
  } catch (err) {
    console.error('[loginWithEmail] FULL ERROR:', err);
    console.error('[loginWithEmail] Error Code:', err.code);
    console.error('[loginWithEmail] Error Message:', err.message);
    console.error('[loginWithEmail] Error Stack:', err.stack);

    let msg = "Błąd logowania";
    if (err.code === "auth/user-not-found") msg = "Użytkownik nie istnieje";
    else if (err.code === "auth/wrong-password") msg = "Niepoprawne hasło";
    else if (err.code === "auth/invalid-email") msg = "Niepoprawny email";
    else if (err.code === "auth/network-request-failed") msg = "Brak połączenia z siecią";
    else if (err.code === "auth/too-many-requests") msg = "Za dużo prób logowania. Spróbuj później.";
    else if (err.code === "auth/invalid-credential") msg = "Niepoprawny email lub hasło";
    else if (err.code === "auth/operation-not-allowed") msg = "Logowanie wyłączone w Firebase";
    else if (err.code === "auth/requests-from-referer-blocked") msg = "Domena nie autoryzowana — patrz dokumentacja FIX_AUTH_BLOCKED.md";

    console.error('[loginWithEmail] Mapped error message:', msg);
    showToast(`❌ ${msg}`, "error");
    throw err;
  }
}


export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    showToast("✅ Link resetowania wysłany na email!", "success");
  } catch (err) {
    let msg = "Błąd resetowania";
    if (err.code === "auth/user-not-found") msg = "Użytkownik nie istnieje";
    showToast(`❌ ${msg}`, "error");
    throw err;
  }
}

export async function logout() {
  try {
    await signOut(auth);
    window.location.href = "/login.html";
  } catch (err) {
    showToast("❌ Błąd wylogowania", "error");
    throw err;
  }
}

export function handleAuthUI(user, userData) {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const userNameEl = document.getElementById("user-name");
  const userAvatarEl = document.getElementById("user-avatar");
  const userLevelEl = document.getElementById("user-level");
  const userRankEl = document.getElementById("user-rank");
  const userXpEl = document.getElementById("user-xp");

  if (userNameEl) userNameEl.textContent = userData.username || "Wojownik";
  if (userAvatarEl) userAvatarEl.textContent = (userData.username || "W").charAt(0).toUpperCase();
  if (userLevelEl) userLevelEl.textContent = userData.level || 1;
  if (userRankEl) userRankEl.textContent = userData.rank || "Nowicjusz";
  if (userXpEl) userXpEl.textContent = userData.xp || 0;
}

// ════════════════════════════════════════════════════════════
// PRZEKIEROWANIE ZALOGOWANYCH (login.html / register.html)
// ════════════════════════════════════════════════════════════

export function redirectIfLogged() {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "/";
  });
}

// ════════════════════════════════════════════════════════════
// FORMULARZ LOGOWANIA — login.html
// ════════════════════════════════════════════════════════════

export function initLoginForm() {
  console.log('[initLoginForm] Initializing login form...');

  const form = document.getElementById("login-form");
  const emailIn = document.getElementById("email");
  const passIn = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const googleBtn = document.getElementById("google-btn");
  const forgotLink = document.getElementById("forgot-link");
  const errEl = document.getElementById("error-msg");

  console.log('[initLoginForm] Form elements found:', {
    form: !!form,
    emailInput: !!emailIn,
    passwordInput: !!passIn,
    loginButton: !!loginBtn,
    errorElement: !!errEl
  });

  const showErr = (msg) => {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = msg ? "block" : "none";
    console.log('[initLoginForm] Error displayed:', msg);
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log('[initLoginForm] Form submitted');

      showErr("");
      const email = emailIn?.value.trim();
      const password = passIn?.value;

      console.log('[initLoginForm] Input values:', { email: !!email, password: !!password });

      if (!email || !password) {
        showErr("Podaj email i hasło.");
        console.log('[initLoginForm] Validation failed: missing email or password');
        return;
      }

      setLoading(loginBtn, true);
      try {
        console.log('[initLoginForm] Calling loginWithEmail...');
        await loginWithEmail(email, password);
        console.log('[initLoginForm] Login successful, redirecting to home...');
        window.location.href = "/";
      } catch (err) {
        console.error('[initLoginForm] Caught error in form submit:', err);
        const map = {
          "auth/user-not-found": "Nie znaleziono wojownika o tym adresie.",
          "auth/wrong-password": "Niepoprawne słowo mocy.",
          "auth/invalid-credential": "Niepoprawny email lub hasło.",
          "auth/invalid-email": "Niepoprawny adres email.",
          "auth/too-many-requests": "Za dużo prób. Odczekaj chwilę.",
          "auth/network-request-failed": "Brak połączenia z siecią.",
          "auth/requests-from-referer-blocked": "Domena nie autoryzowana. Patrz: FIX_AUTH_BLOCKED.md",
        };
        const displayMsg = map[err.code] || "Błąd logowania: " + (err.code || err.message);
        showErr(displayMsg);
      } finally {
        setLoading(loginBtn, false);
      }
    });
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = emailIn?.value.trim() || prompt("Podaj adres email do resetu słowa mocy:");
      if (!email) return;
      try {
        console.log('[initLoginForm] Resetting password for:', email);
        await resetPassword(email);
      } catch (err) {
        console.error('[initLoginForm] Password reset error:', err);
      }
    });
  }
}

// ════════════════════════════════════════════════════════════
// FORMULARZ REJESTRACJI — register.html
// ════════════════════════════════════════════════════════════

export function initRegisterForm() {
  console.log('[initRegisterForm] Initializing register form...');

  const form = document.getElementById("register-form");
  const nameIn = document.getElementById("display-name");
  const emailIn = document.getElementById("email");
  const passIn = document.getElementById("password");
  const confirmIn = document.getElementById("confirm-password");
  const termsIn = document.getElementById("terms");
  const registerBtn = document.getElementById("register-btn");
  const googleBtn = document.getElementById("google-btn");
  const strengthLabel = document.getElementById("strength-label");
  const bars = Array.from(document.querySelectorAll(".strength-bar"));

  console.log('[initRegisterForm] Form elements found:', {
    form: !!form,
    nameInput: !!nameIn,
    emailInput: !!emailIn,
    passwordInput: !!passIn,
    confirmInput: !!confirmIn,
    termsCheckbox: !!termsIn,
    registerButton: !!registerBtn
  });

  // ── Pokaż/ukryj hasło ──────────────────────────────────────
  const wireToggle = (btnId, input) => {
    const btn = document.getElementById(btnId);
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
    });
  };
  wireToggle("toggle-password", passIn);
  wireToggle("toggle-confirm", confirmIn);

  // ── Siła hasła ─────────────────────────────────────────────
  const scorePassword = (pw) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-ZĄĆĘŁŃÓŚŹŻ]/.test(pw) && /[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s = Math.min(3, s + 1);
    return Math.min(3, s); // 0–3
  };

  if (passIn) {
    passIn.addEventListener("input", () => {
      const pw = passIn.value;
      const score = pw ? scorePassword(pw) : 0;
      const cls = ["", "weak", "medium", "strong"][score] || "";
      bars.forEach((b, i) => {
        b.classList.remove("weak", "medium", "strong");
        if (pw && i < score) b.classList.add(cls || "weak");
      });
      if (strengthLabel) {
        strengthLabel.textContent = !pw ? "" :
          score <= 1 ? "Słabe słowo mocy" :
          score === 2 ? "Przyzwoite słowo mocy" : "Potężne słowo mocy ⚔️";
        strengthLabel.style.color = score <= 1 ? "#EF4444" : score === 2 ? "#F59E0B" : "#16C784";
      }
    });
  }

  // ── Walidacja na żywo potwierdzenia ────────────────────────
  if (confirmIn) {
    confirmIn.addEventListener("input", () => {
      clearFieldError(confirmIn);
      if (confirmIn.value && passIn?.value !== confirmIn.value) {
        setFieldError(confirmIn, "Słowa mocy nie są zgodne.");
      }
    });
  }

  // ── Submit ─────────────────────────────────────────────────
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log('[initRegisterForm] Form submitted');

      [nameIn, emailIn, passIn, confirmIn].forEach(clearFieldError);

      const name = nameIn?.value.trim();
      const email = emailIn?.value.trim();
      const pass = passIn?.value;
      const confirm = confirmIn?.value;

      console.log('[initRegisterForm] Input values:', {
        name: !!name,
        email: !!email,
        password: !!pass,
        passwordLength: pass?.length || 0,
        confirm: !!confirm,
        termsChecked: termsIn?.checked
      });

      let ok = true;
      if (!name) { setFieldError(nameIn, "Podaj imię wojownika."); ok = false; }
      if (!email) { setFieldError(emailIn, "Podaj adres email."); ok = false; }
      if (!pass || pass.length < 6) { setFieldError(passIn, "Min. 6 znaków."); ok = false; }
      if (pass !== confirm) { setFieldError(confirmIn, "Słowa mocy nie są zgodne."); ok = false; }
      if (termsIn && !termsIn.checked) {
        showToast("⚠️ Musisz zaakceptować Regulamin Areny.", "error");
        ok = false;
      }

      if (!ok) {
        console.log('[initRegisterForm] Validation failed');
        return;
      }

      setLoading(registerBtn, true);
      try {
        console.log('[initRegisterForm] Calling registerWithEmail...', { email, name });
        await registerWithEmail(email, pass, name);
        console.log('[initRegisterForm] Registration successful, redirecting to home...');
        window.location.href = "/";
      } catch (err) {
        console.error('[initRegisterForm] Caught error in form submit:', err);
        console.error('[initRegisterForm] Error Code:', err.code);
        console.error('[initRegisterForm] Error Message:', err.message);

        if (err.code === "auth/email-already-in-use") {
          setFieldError(emailIn, "Email już w użyciu.");
        } else if (err.code === "auth/invalid-email") {
          setFieldError(emailIn, "Niepoprawny email.");
        } else if (err.code === "auth/weak-password") {
          setFieldError(passIn, "Hasło za słabe.");
        } else if (err.code === "auth/requests-from-referer-blocked") {
          showToast("⚠️ Domena nie autoryzowana w Firebase. Patrz: FIX_AUTH_BLOCKED.md", "error");
        } else {
          console.error('[initRegisterForm] Unhandled error code:', err.code);
          showToast(`⚠️ Błąd: ${err.code || err.message}`, "error");
        }
      } finally {
        setLoading(registerBtn, false);
      }
    });
  }
}

export function initResetPasswordForm() {
  const form = document.getElementById("reset-form");
  const emailIn = document.getElementById("email");
  const resetBtn = document.getElementById("reset-btn");
  const errEl = document.getElementById("error-msg");

  const showErr = (msg) => {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = msg ? "block" : "none";
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showErr("");
      const email = emailIn?.value.trim();
      if (!email) {
        showErr("Podaj adres email.");
        return;
      }
      setLoading(resetBtn, true);
      try {
        await resetPassword(email);
        showErr("Link resetowania wysłany na email!");
      } catch (err) {
        const map = {
          "auth/user-not-found": "Użytkownik o tym emailu nie istnieje.",
          "auth/invalid-email": "Niepoprawny adres email.",
          "auth/too-many-requests": "Za dużo prób. Odczekaj chwilę.",
        };
        showErr(map[err.code] || "Błąd resetowania: " + (err.code || err.message));
      } finally {
        setLoading(resetBtn, false);
      }
    });
  }
}
