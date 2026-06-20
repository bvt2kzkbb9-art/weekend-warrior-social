import { auth, db, COL, googleProvider, uploadImage, compressImage } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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

export function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("wws-toasts");
  if (!container) {
    container = document.createElement("div");
    container.id = "wws-toasts";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const ICON = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16C784" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F8CFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `${ICON[type] || ICON.info}<span>${message}</span>`;
  container.appendChild(el);

  const dismiss = () => {
    el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    setTimeout(() => el.remove(), 280);
  };

  const t = setTimeout(dismiss, duration);
  el.addEventListener("click", () => {
    clearTimeout(t);
    dismiss();
  });
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
  if (!user) return null;
  const ref = doc(db, COL.USERS, user.uid);
  const snap = await getDoc(ref).catch(() => null);

  if (!snap || !snap.exists()) {
    const username = user.displayName || user.email.split("@")[0];
    const userData = {
      uid: user.uid,
      email: user.email,
      username: username,
      avatar: user.photoURL || "",
      level: 1,
      xp: 0,
      rank: "Rookie",
      streak: 0,
      online: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    };
    await setDoc(ref, userData);
    return userData;
  }
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
      avatar: data.avatar || data.photoURL || "",
      xp: data.xp !== undefined ? data.xp : (data.points || 0),
      rank: data.rank || "Rookie",
      streak: data.streak !== undefined ? data.streak : 0,
      online: data.online !== undefined ? data.online : false,
      updatedAt: data.updatedAt ? data.updatedAt : serverTimestamp(),
      lastSeen: data.lastSeen ? data.lastSeen : serverTimestamp(),
    };

    delete migratedData.photoURL;
    delete migratedData.points;
    delete migratedData.displayName;
    delete migratedData.bannerURL;
    delete migratedData.bio;
    delete migratedData.lastLoginAt;

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

export async function registerWithEmail(email, password, displayName) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await ensureUserDoc(user);
    showToast("✅ Konto utworzone!", "success");
    return user;
  } catch (err) {
    let msg = "Błąd rejestracji";
    if (err.code === "auth/email-already-in-use") msg = "Email już w użyciu";
    else if (err.code === "auth/weak-password") msg = "Hasło za słabe (min. 6 znaków)";
    else if (err.code === "auth/invalid-email") msg = "Niepoprawny email";
    showToast(`❌ ${msg}`, "error");
    throw err;
  }
}

export async function loginWithEmail(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await migrateUserDoc(user);
    await updateLastSeen(user.uid);
    showToast("✅ Zalogowano!", "success");
    return user;
  } catch (err) {
    let msg = "Błąd logowania";
    if (err.code === "auth/user-not-found") msg = "Użytkownik nie istnieje";
    else if (err.code === "auth/wrong-password") msg = "Niepoprawne hasło";
    else if (err.code === "auth/invalid-email") msg = "Niepoprawny email";
    showToast(`❌ ${msg}`, "error");
    throw err;
  }
}

export async function loginWithGoogle() {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(user);
    await updateLastSeen(user.uid);
    showToast("✅ Zalogowano przez Google!", "success");
    return user;
  } catch (err) {
    let msg = "Błąd logowania Google";
    if (err.code === "auth/popup-closed-by-user") msg = "Okno logowania zostało zamknięte";
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

  if (userNameEl) userNameEl.textContent = userData.displayName || "Wojownik";
  if (userAvatarEl) userAvatarEl.textContent = (userData.displayName || "W").charAt(0).toUpperCase();
  if (userLevelEl) userLevelEl.textContent = userData.level || 1;
  if (userRankEl) userRankEl.textContent = userData.rank || "Rookie";
  if (userXpEl) userXpEl.textContent = userData.points || 0;
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
  const form = document.getElementById("login-form");
  const emailIn = document.getElementById("email");
  const passIn = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const googleBtn = document.getElementById("google-btn");
  const forgotLink = document.getElementById("forgot-link");
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
      const password = passIn?.value;
      if (!email || !password) { showErr("Podaj email i hasło."); return; }
      setLoading(loginBtn, true);
      try {
        await loginWithEmail(email, password);
        window.location.href = "index.html";
      } catch (err) {
        const map = {
          "auth/user-not-found": "Nie znaleziono wojownika o tym adresie.",
          "auth/wrong-password": "Niepoprawne słowo mocy.",
          "auth/invalid-credential": "Niepoprawny email lub hasło.",
          "auth/invalid-email": "Niepoprawny adres email.",
          "auth/too-many-requests": "Za dużo prób. Odczekaj chwilę.",
          "auth/network-request-failed": "Brak połączenia z siecią.",
        };
        showErr(map[err.code] || "Błąd logowania: " + (err.code || err.message));
      } finally {
        setLoading(loginBtn, false);
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault(); // przycisk bez type="button" w <form> domyślnie submituje
      showErr("");
      try {
        await loginWithGoogle();
        window.location.href = "index.html";
      } catch (err) {
        if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
          showErr("Błąd logowania Google: " + (err.code || err.message));
        }
      }
    });
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = emailIn?.value.trim() || prompt("Podaj adres email do resetu słowa mocy:");
      if (!email) return;
      try { await resetPassword(email); } catch { /* toast pokazany */ }
    });
  }
}

// ════════════════════════════════════════════════════════════
// FORMULARZ REJESTRACJI — register.html
// ════════════════════════════════════════════════════════════

export function initRegisterForm() {
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
      [nameIn, emailIn, passIn, confirmIn].forEach(clearFieldError);

      const name = nameIn?.value.trim();
      const email = emailIn?.value.trim();
      const pass = passIn?.value;
      const confirm = confirmIn?.value;

      let ok = true;
      if (!name) { setFieldError(nameIn, "Podaj imię wojownika."); ok = false; }
      if (!email) { setFieldError(emailIn, "Podaj adres email."); ok = false; }
      if (!pass || pass.length < 6) { setFieldError(passIn, "Min. 6 znaków."); ok = false; }
      if (pass !== confirm) { setFieldError(confirmIn, "Słowa mocy nie są zgodne."); ok = false; }
      if (termsIn && !termsIn.checked) {
        showToast("⚠️ Musisz zaakceptować Regulamin Areny.", "error");
        ok = false;
      }
      if (!ok) return;

      setLoading(registerBtn, true);
      try {
        await registerWithEmail(email, pass, name);
        window.location.href = "index.html";
      } catch (err) {
        if (err.code === "auth/email-already-in-use") setFieldError(emailIn, "Email już w użyciu.");
        else if (err.code === "auth/invalid-email") setFieldError(emailIn, "Niepoprawny email.");
        else if (err.code === "auth/weak-password") setFieldError(passIn, "Hasło za słabe.");
      } finally {
        setLoading(registerBtn, false);
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await loginWithGoogle();
        window.location.href = "index.html";
      } catch { /* toast pokazany */ }
    });
  }
}
