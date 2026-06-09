import { auth, db, COL, googleProvider } from "./firebase.js";
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
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Wojownik",
      photoURL: user.photoURL || "",
      bannerURL: "",
      username: user.email.split("@")[0],
      bio: "",
      points: 0,
      level: 1,
      rank: "Rookie",
      streak: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(ref, userData);
    return userData;
  }
  return snap.data();
}

export async function getCurrentUserData(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COL.USERS, uid)).catch(() => null);
  return snap && snap.exists() ? snap.data() : null;
}

export function checkAuth(callback) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await getCurrentUserData(user.uid);
      callback(user, userData || {});
    } else {
      callback(null, null);
    }
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
    await updateDoc(doc(db, COL.USERS, user.uid), { lastLoginAt: serverTimestamp() });
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
    await updateDoc(doc(db, COL.USERS, user.uid), { lastLoginAt: serverTimestamp() });
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
