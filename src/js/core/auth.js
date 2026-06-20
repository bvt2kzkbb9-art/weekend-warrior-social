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

    // Create clean document with ONLY new field names (no old fields)
    const userData = {
      uid: user.uid,
      email: user.email,
      username: username,
      xp: 0,
      level: 1,
      rank: "Rookie",
      streak: 0,
      online: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    };

    // Explicitly avoid old field names to prevent data corruption
    // DO NOT INCLUDE: points, displayName, photoURL, bannerURL, bio, lastLoginAt, avatar

    console.log('[ensureUserDoc] User data prepared:', {
      uid: userData.uid,
      email: userData.email,
      username: userData.username,
      xp: userData.xp,
      level: userData.level,
      rank: userData.rank
    });

    try {
      await setDoc(ref, userData);
      console.log('[ensureUserDoc] User doc created successfully in Firestore (new structure)');
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
  const needsMigration = data.photoURL !== undefined || data.points !== undefined || !data.avatar || !data.xp || data.displayName !== undefined;

  if (needsMigration) {
    console.log('[migrateUserDoc] Detected migration needed for uid:', user.uid);

    // Convert points to xp if needed
    const xpValue = data.xp !== undefined ? data.xp : (data.points || 0);

    // Convert displayName to username if needed
    const usernameValue = data.username || data.displayName || user.displayName || user.email.split("@")[0];

    const migratedData = {
      uid: data.uid || user.uid,
      email: data.email || user.email,
      username: usernameValue,
      xp: xpValue,
      level: Math.floor(xpValue / 500) + 1,
      rank: data.rank || (xpValue >= 10000 ? "Legend" : xpValue >= 2000 ? "Champion" : xpValue >= 500 ? "Warrior" : "Rookie"),
      streak: data.streak !== undefined ? data.streak : 0,
      online: data.online !== undefined ? data.online : true,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: data.lastSeen || serverTimestamp(),
    };

    console.log('[migrateUserDoc] Clean data prepared:', {
      uid: migratedData.uid,
      username: migratedData.username,
      xp: migratedData.xp,
      level: migratedData.level,
      rank: migratedData.rank
    });

    try {
      await updateDoc(ref, migratedData);
      console.log('[migrateUserDoc] Migration completed successfully');
      return migratedData;
    } catch (err) {
      console.error('[migrateUserDoc] Migration failed:', err.code, err.message);
      return data;
    }
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
    window.location.href = 'login.html';
  });
  return unsubscribe;
}

export function redirectIfNotLogged(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    migrateUserDoc(user)
      .then(userData => updateLastSeen(user.uid).then(() => userData))
      .then(userData => callback(user, userData || {}))
      .catch(err => {
        console.error('[redirectIfNotLogged] error:', err.code);
        window.location.href = 'login.html';
      });
  });
}

export async function registerWithEmail(email, password, displayName) {
  console.log('[registerWithEmail] ========== START REGISTRATION ==========');
  console.log('[registerWithEmail] Email:', email);
  console.log('[registerWithEmail] Display Name:', displayName);
  console.log('[registerWithEmail] Auth instance:', {
    authDomain: auth.config.authDomain,
    projectId: auth.config.projectId,
    apiKey: auth.config.apiKey ? '(set)' : '(missing)',
    configured: !!auth
  });

  try {
    console.log('[registerWithEmail] Step 1: Creating user with Email/Password...');
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    console.log('[registerWithEmail] ✅ User created in Firebase Auth:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.metadata?.creationTime
    });

    console.log('[registerWithEmail] Step 2: Updating user profile...');
    await updateProfile(user, { displayName });
    console.log('[registerWithEmail] ✅ Profile updated:', { displayName });

    console.log('[registerWithEmail] Step 3: Creating Firestore user document...');
    const userData = await ensureUserDoc(user);
    console.log('[registerWithEmail] ✅ Firestore document created:', {
      uid: userData.uid,
      email: userData.email,
      username: userData.username,
      xp: userData.xp,
      level: userData.level,
      rank: userData.rank
    });

    console.log('[registerWithEmail] ========== REGISTRATION SUCCESS ==========');
    showToast("✅ Konto utworzone! Zalogowano automatycznie.", "success");
    return user;

  } catch (err) {
    console.error('[registerWithEmail] ========== REGISTRATION FAILED ==========');
    console.error('[registerWithEmail] Full error object:', err);
    console.error('[registerWithEmail] Error code:', err.code);
    console.error('[registerWithEmail] Error message:', err.message);
    console.error('[registerWithEmail] Error name:', err.name);

    if (err.stack) console.error('[registerWithEmail] Stack trace:', err.stack);

    let msg = "Błąd rejestracji";
    let details = "";

    if (err.code === "auth/email-already-in-use") {
      msg = "Email już w użyciu";
      details = "Spróbuj zalogować się lub użyć innego emaila";
    } else if (err.code === "auth/weak-password") {
      msg = "Hasło za słabe";
      details = "Hasło musi mieć co najmniej 6 znaków";
    } else if (err.code === "auth/invalid-email") {
      msg = "Niepoprawny email";
      details = "Sprawdź format adresu email";
    } else if (err.code === "auth/network-request-failed") {
      msg = "Brak połączenia z siecią";
      details = "Sprawdź połączenie internetowe";
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "Rejestracja wyłączona";
      details = "Rejestracja jest tymczasowo wyłączona. Spróbuj za chwilę.";
    } else if (err.code === "auth/operation-not-supported-in-this-environment") {
      msg = "Środowisko nie wspierane";
      details = "Upewnij się, że używasz HTTPS";
    } else if (err.code === "auth/requests-from-referer-blocked") {
      msg = "Domena nie autoryzowana";
      details = "Aplikacja nie ma dostępu do Firebase z tej domeny";
    } else {
      details = err.message || err.code;
    }

    console.error('[registerWithEmail] Mapped message:', msg);
    console.error('[registerWithEmail] Details:', details);
    console.error('[registerWithEmail] ========== END FAILED ATTEMPT ==========');

    showToast(`❌ ${msg}\n${details}`, "error");
    throw err;
  }
}

export async function loginWithEmail(email, password) {
  console.log('[loginWithEmail] ========== START LOGIN ==========');
  console.log('[loginWithEmail] Email:', email);
  console.log('[loginWithEmail] Auth configured:', {
    authDomain: auth.config.authDomain,
    projectId: auth.config.projectId,
    apiKey: auth.config.apiKey ? '(set)' : '(missing)',
    currentHost: window.location.hostname,
    currentOrigin: window.location.origin
  });

  try {
    console.log('[loginWithEmail] Step 1: Signing in with email/password...');
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('[loginWithEmail] ✅ User signed in:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });

    console.log('[loginWithEmail] Step 2: Loading user profile from Firestore...');
    const userData = await migrateUserDoc(user);
    console.log('[loginWithEmail] ✅ User data loaded:', {
      username: userData.username,
      xp: userData.xp,
      level: userData.level,
      rank: userData.rank
    });

    console.log('[loginWithEmail] Step 3: Updating last seen...');
    await updateLastSeen(user.uid);
    console.log('[loginWithEmail] ✅ Last seen updated');

    console.log('[loginWithEmail] ========== LOGIN SUCCESS ==========');
    showToast("✅ Zalogowano pomyślnie!", "success");
    return user;

  } catch (err) {
    console.error('[loginWithEmail] ========== LOGIN FAILED ==========');
    console.error('[loginWithEmail] Full error:', err);
    console.error('[loginWithEmail] Error code:', err.code);
    console.error('[loginWithEmail] Error message:', err.message);
    console.error('[loginWithEmail] Error name:', err.name);

    if (err.stack) console.error('[loginWithEmail] Stack:', err.stack);

    let msg = "Błąd logowania";
    let details = "";

    if (err.code === "auth/user-not-found") {
      msg = "Użytkownik nie istnieje";
      details = "Konto z tym emailem nie zostało znalezione";
    } else if (err.code === "auth/wrong-password") {
      msg = "Niepoprawne hasło";
      details = "Sprawdź poprawność hasła";
    } else if (err.code === "auth/invalid-email") {
      msg = "Niepoprawny email";
      details = "Sprawdź format adresu email";
    } else if (err.code === "auth/invalid-credential") {
      msg = "Niepoprawne dane";
      details = "Email lub hasło jest niepoprawne";
    } else if (err.code === "auth/network-request-failed") {
      msg = "Brak połączenia";
      details = "Sprawdź połączenie internetowe";
    } else if (err.code === "auth/too-many-requests") {
      msg = "Za dużo prób";
      details = "Zbyt wiele nieudanych prób logowania. Spróbuj za 15 minut.";
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "Logowanie wyłączone";
      details = "Logowanie jest tymczasowo wyłączone";
    } else if (err.code === "auth/requests-from-referer-blocked") {
      msg = "Błąd autoryzacji domeny";
      details = `Aplikacja (${window.location.hostname}) nie jest autoryzowana w Firebase`;
    } else {
      details = err.message || err.code;
    }

    console.error('[loginWithEmail] Mapped:', msg);
    console.error('[loginWithEmail] Details:', details);
    console.error('[loginWithEmail] Host:', window.location.hostname);
    console.error('[loginWithEmail] Origin:', window.location.origin);
    console.error('[loginWithEmail] ========== END FAILED ATTEMPT ==========');

    showToast(`❌ ${msg}\n${details}`, "error");
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
    window.location.href = "login.html";
  } catch (err) {
    showToast("❌ Błąd wylogowania", "error");
    throw err;
  }
}

export function handleAuthUI(user, userData) {
  if (!user) {
    window.location.href = "login.html";
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
    if (user) window.location.href = "index.html";
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
        window.location.href = "index.html";
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
  const errorMsgEl = document.getElementById("error-msg");
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
        window.location.href = "index.html";
      } catch (err) {
        console.error('[initRegisterForm] Caught error in form submit:', err);
        console.error('[initRegisterForm] Error Code:', err.code);
        console.error('[initRegisterForm] Error Message:', err.message);

        let errorDisplay = `❌ Błąd rejestracji\n\nKod: ${err.code}\nWiadomość: ${err.message}`;

        if (err.code === "auth/email-already-in-use") {
          setFieldError(emailIn, "Email już w użyciu.");
          errorDisplay = "❌ Ten email jest już zarejestrowany. Spróbuj się zalogować lub użyj innego emaila.";
        } else if (err.code === "auth/invalid-email") {
          setFieldError(emailIn, "Niepoprawny email.");
          errorDisplay = "❌ Adres email jest niepoprawny. Sprawdź format (xxx@xxx.xxx).";
        } else if (err.code === "auth/weak-password") {
          setFieldError(passIn, "Hasło za słabe.");
          errorDisplay = "❌ Hasło musi mieć co najmniej 6 znaków.";
        } else if (err.code === "auth/network-request-failed") {
          errorDisplay = "❌ Brak połączenia z siecią. Sprawdź połączenie internetowe.";
        } else if (err.code === "auth/operation-not-allowed") {
          errorDisplay = "❌ Rejestracja jest wyłączona. Spróbuj za chwilę.";
        } else if (err.code === "auth/requests-from-referer-blocked") {
          errorDisplay = `❌ Błąd autoryzacji domeny\n\nDomena: ${window.location.hostname}\nNie jest autoryzowana w Firebase.\n\nSzukaj: FIX_AUTH_BLOCKED.md`;
        } else {
          console.error('[initRegisterForm] Unhandled error code:', err.code);
        }

        if (errorMsgEl) {
          errorMsgEl.textContent = errorDisplay;
          errorMsgEl.style.display = 'block';
        }
        showToast(errorDisplay.split('\n')[0], "error");
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
