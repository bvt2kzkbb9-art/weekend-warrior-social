/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — Auth Module
 * ============================================================
 *
 * Eksportuje:
 *   checkAuth()          — wymaga zalogowania, lub redirect → login.html
 *   redirectIfLogged()   — jeśli zalogowany → redirect → index.html
 *   logout()             — wylogowanie → login.html
 *   initLoginForm()      — obsługuje login.html
 *   initRegisterForm()   — obsługuje register.html
 *   getCurrentUserData() — pobiera dane użytkownika z Firestore
 */

import {
  auth, db, googleProvider, COL, getRank, getLevel
} from './firebase.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ════════════════════════════════════════════════════════════

export function showToast(message, type = 'info', duration = 3800) {
  let container = document.getElementById('wws-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'wws-toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const ICONS = {
    success: `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16C784" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4F8CFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${ICONS[type] ?? ICONS.info}<span>${message}</span>`;
  container.appendChild(toast);

  const dismiss = () => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateY(6px)';
    setTimeout(() => toast.remove(), 320);
  };

  const timer = setTimeout(dismiss, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}


// ════════════════════════════════════════════════════════════
// HELPERS — UI STATE
// ════════════════════════════════════════════════════════════

function btnLoading(btn, state) {
  if (!btn) return;
  btn.disabled = state;
  btn.classList.toggle('loading', state);
}

function fieldError(inputEl, msg) {
  if (!inputEl) return;
  inputEl.classList.add('error');
  inputEl.setAttribute('aria-invalid', 'true');
  const group = inputEl.closest('.form-group');
  if (!group) return;
  let el = group.querySelector('.form-error-msg');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-error-msg';
    el.setAttribute('role', 'alert');
    group.appendChild(el);
  }
  el.textContent = msg;
}

function clearField(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('error', 'valid');
  inputEl.removeAttribute('aria-invalid');
  const group = inputEl.closest('.form-group');
  if (!group) return;
  const el = group.querySelector('.form-error-msg');
  if (el) el.textContent = '';
}

function markValid(inputEl) {
  if (!inputEl) return;
  clearField(inputEl);
  inputEl.classList.add('valid');
}

function clearAllFields(form) {
  form.querySelectorAll('.form-input').forEach(clearField);
}


// ════════════════════════════════════════════════════════════
// HELPERS — FIREBASE ERRORS
// ════════════════════════════════════════════════════════════

const ERROR_MAP = {
  'auth/user-not-found':          'Nie znaleziono konta z tym adresem e-mail.',
  'auth/wrong-password':          'Nieprawidłowe hasło. Spróbuj ponownie.',
  'auth/invalid-credential':      'Nieprawidłowy e-mail lub hasło.',
  'auth/invalid-email':           'Podaj prawidłowy adres e-mail.',
  'auth/email-already-in-use':    'Ten adres e-mail jest już zajęty.',
  'auth/weak-password':           'Hasło jest za słabe (minimum 6 znaków).',
  'auth/too-many-requests':       'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.',
  'auth/network-request-failed':  'Błąd połączenia. Sprawdź internet.',
  'auth/popup-closed-by-user':    null,
  'auth/cancelled-popup-request': null,
  'auth/user-disabled':           'To konto zostało zablokowane.',
};

function firebaseError(code) {
  return ERROR_MAP[code] ?? 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
}


// ════════════════════════════════════════════════════════════
// FIRESTORE — USER PROFILE
// ════════════════════════════════════════════════════════════

/**
 * Tworzy dokument users/{uid} jeśli nie istnieje.
 * Zwraca dane profilu (nowe lub istniejące).
 */
export async function ensureUserDoc(user, extra = {}) {
  const ref  = doc(db, COL.USERS, user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const displayName = extra.displayName || user.displayName || 'Wojownik';
    const username    = extra.username    || displayName.toLowerCase().replace(/\s+/g, '_');

    const data = {
      uid:         user.uid,
      displayName,
      username,
      email:       user.email ?? '',
      photoURL:    user.photoURL ?? '',
      bio:         '',
      points:      0,
      level:       1,
      rank:        'Rookie',
      createdAt:   serverTimestamp(),
    };

    await setDoc(ref, data);
    return data;
  }

  return snap.data();
}

/**
 * Pobiera dane użytkownika z Firestore.
 * Zwraca null jeśli nie znaleziono.
 */
export async function getCurrentUserData(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COL.USERS, uid));
  return snap.exists() ? snap.data() : null;
}


// ════════════════════════════════════════════════════════════
// AUTH GUARDS
// ════════════════════════════════════════════════════════════

/**
 * Sprawdza czy użytkownik jest zalogowany.
 * Niezalogowany → redirect do login.html
 * Zalogowany → wywołuje callback(user)
 */
export function checkAuth(callback) {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        window.location.replace('login.html');
        return;
      }
      if (typeof callback === 'function') callback(user);
      resolve(user);
    });
  });
}

/**
 * Jeśli użytkownik już zalogowany → redirect do index.html
 * Używane na stronach logowania i rejestracji.
 */
export function redirectIfLogged(dest = 'index.html') {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    if (user) window.location.replace(dest);
  });
}


// ════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════

export async function logout() {
  try {
    await signOut(auth);
    window.location.replace('login.html');
  } catch {
    showToast('Błąd podczas wylogowywania.', 'error');
  }
}


// ════════════════════════════════════════════════════════════
// PASSWORD STRENGTH
// ════════════════════════════════════════════════════════════

function passwordStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6)                    s++;
  if (pwd.length >= 10)                   s++;
  if (/[A-Z]/.test(pwd))                  s++;
  if (/[0-9]/.test(pwd))                  s++;
  if (/[^A-Za-z0-9]/.test(pwd))           s++;
  if (s <= 1) return 1;   // słabe
  if (s <= 3) return 2;   // średnie
  return 3;               // silne
}

function renderStrength(bars, strength) {
  const cls = ['', 'weak', 'medium', 'strong'];
  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < strength) bar.classList.add(cls[strength]);
  });

  const labels = ['', 'Słabe', 'Średnie', 'Silne'];
  const colors = ['', 'var(--error)', 'var(--warning)', 'var(--success)'];
  const label  = document.getElementById('strength-label');
  if (label) {
    label.textContent = strength ? labels[strength] : '';
    label.style.color = strength ? colors[strength] : '';
  }
}

// Toggle password visibility
function togglePassword(inputEl, btn) {
  const isPassword = inputEl.type === 'password';
  inputEl.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? EYE_OFF_SVG : EYE_SVG;
  btn.setAttribute('aria-label', isPassword ? 'Ukryj hasło' : 'Pokaż hasło');
}

const EYE_SVG = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_SVG = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;


// ════════════════════════════════════════════════════════════
// LOGIN FORM
// ════════════════════════════════════════════════════════════

export function initLoginForm() {
  const form        = document.getElementById('login-form');
  const emailInput  = document.getElementById('email');
  const passInput   = document.getElementById('password');
  const submitBtn   = document.getElementById('login-btn');
  const googleBtn   = document.getElementById('google-btn');
  const forgotLink  = document.getElementById('forgot-link');
  const toggleBtn   = document.getElementById('toggle-password');

  if (!form) return;

  // Toggle password visibility
  toggleBtn?.addEventListener('click', () => togglePassword(passInput, toggleBtn));

  // ── Email/password login
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFields(form);

    const email    = emailInput.value.trim();
    const password = passInput.value;

    let valid = true;
    if (!email) {
      fieldError(emailInput, 'Podaj adres e-mail.'); valid = false;
    }
    if (!password) {
      fieldError(passInput, 'Podaj hasło.'); valid = false;
    }
    if (!valid) return;

    btnLoading(submitBtn, true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Zalogowano pomyślnie! Witaj z powrotem ⚔️', 'success');
      setTimeout(() => window.location.replace('index.html'), 700);
    } catch (err) {
      const msg = firebaseError(err.code);
      if (msg) showToast(msg, 'error');
      btnLoading(submitBtn, false);
    }
  });

  // ── Google login
  googleBtn?.addEventListener('click', async () => {
    btnLoading(googleBtn, true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(result.user);
      showToast('Zalogowano przez Google! 🎉', 'success');
      setTimeout(() => window.location.replace('index.html'), 700);
    } catch (err) {
      const msg = firebaseError(err.code);
      if (msg) showToast(msg, 'error');
      btnLoading(googleBtn, false);
    }
  });

  // ── Forgot password
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      fieldError(emailInput, 'Najpierw wpisz adres e-mail, aby zresetować hasło.');
      emailInput.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Link do resetowania hasła wysłany. Sprawdź skrzynkę 📬', 'success', 5000);
    } catch (err) {
      const msg = firebaseError(err.code);
      if (msg) showToast(msg, 'error');
    }
  });
}


// ════════════════════════════════════════════════════════════
// REGISTER FORM
// ════════════════════════════════════════════════════════════

export function initRegisterForm() {
  const form           = document.getElementById('register-form');
  const nameInput      = document.getElementById('display-name');
  const emailInput     = document.getElementById('email');
  const passInput      = document.getElementById('password');
  const confirmInput   = document.getElementById('confirm-password');
  const termsCheck     = document.getElementById('terms');
  const submitBtn      = document.getElementById('register-btn');
  const googleBtn      = document.getElementById('google-btn');
  const togglePass     = document.getElementById('toggle-password');
  const toggleConfirm  = document.getElementById('toggle-confirm');
  const strengthBars   = document.querySelectorAll('.strength-bar');

  if (!form) return;

  // Toggle password visibility
  togglePass?.addEventListener('click',    () => togglePassword(passInput, togglePass));
  toggleConfirm?.addEventListener('click', () => togglePassword(confirmInput, toggleConfirm));

  // Password strength live update
  passInput?.addEventListener('input', () => {
    renderStrength(strengthBars, passwordStrength(passInput.value));
    if (confirmInput.value) {
      confirmInput.value === passInput.value ? markValid(confirmInput) : fieldError(confirmInput, 'Hasła nie są identyczne.');
    }
  });

  // Confirm password live check
  confirmInput?.addEventListener('input', () => {
    if (!confirmInput.value) { clearField(confirmInput); return; }
    confirmInput.value === passInput.value ? markValid(confirmInput) : fieldError(confirmInput, 'Hasła nie są identyczne.');
  });

  // ── Email/password register
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFields(form);

    const displayName = nameInput?.value.trim()   ?? '';
    const email       = emailInput.value.trim();
    const password    = passInput.value;
    const confirm     = confirmInput.value;
    const termsOk     = termsCheck?.checked ?? false;

    let valid = true;

    if (!displayName || displayName.length < 2) {
      fieldError(nameInput, 'Podaj imię lub pseudonim (min. 2 znaki).'); valid = false;
    }
    if (!email) {
      fieldError(emailInput, 'Podaj adres e-mail.'); valid = false;
    }
    if (!password || password.length < 6) {
      fieldError(passInput, 'Hasło musi mieć minimum 6 znaków.'); valid = false;
    }
    if (password !== confirm) {
      fieldError(confirmInput, 'Hasła nie są identyczne.'); valid = false;
    }
    if (!termsOk) {
      showToast('Zaakceptuj regulamin, aby kontynuować.', 'error'); valid = false;
    }
    if (!valid) return;

    btnLoading(submitBtn, true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await ensureUserDoc(cred.user, { displayName, username: displayName.toLowerCase().replace(/\s+/g, '_') });
      showToast('Konto utworzone! Witaj na arenie ⚔️', 'success');
      setTimeout(() => window.location.replace('index.html'), 800);
    } catch (err) {
      const msg = firebaseError(err.code);
      if (msg) showToast(msg, 'error');
      btnLoading(submitBtn, false);
    }
  });

  // ── Google register
  googleBtn?.addEventListener('click', async () => {
    btnLoading(googleBtn, true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(result.user);
      showToast('Konto połączone z Google! 🎉', 'success');
      setTimeout(() => window.location.replace('index.html'), 700);
    } catch (err) {
      const msg = firebaseError(err.code);
      if (msg) showToast(msg, 'error');
      btnLoading(googleBtn, false);
    }
  });
}

export { onAuthStateChanged, auth };
