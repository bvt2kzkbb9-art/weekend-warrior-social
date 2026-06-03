/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — auth.js
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Eksporty publiczne:
 *   showToast(msg, type, duration)
 *   ensureUserDoc(user, extra?)    → tworzy/zwraca profil Firestore
 *   getCurrentUserData(uid)        → pobiera profil, auto-naprawia brak doc
 *   checkAuth(callback?)           → guard — wymaga logowania
 *   redirectIfLogged(dest?)        → guard — przekieruj jeśli zalogowany
 *   logout()
 *   initLoginForm()
 *   initRegisterForm()
 *   auth                           → re-export dla innych modułów
 *   onAuthStateChanged             → re-export dla innych modułów
 */

import {
  auth, db, googleProvider, COL, getRank, getLevel,
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
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════

export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('wws-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id        = 'wws-toasts';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const ICON = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16C784" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F8CFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${ICON[type] ?? ICON.info}<span>${message}</span>`;
  container.appendChild(el);

  const dismiss = () => {
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(6px)';
    setTimeout(() => el.remove(), 280);
  };

  const t = setTimeout(dismiss, duration);
  el.addEventListener('click', () => { clearTimeout(t); dismiss(); });
}


// ════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════

function setLoading(btn, state) {
  if (!btn) return;
  btn.disabled = state;
  btn.classList.toggle('loading', state);
}

function setFieldError(input, msg) {
  if (!input) return;
  input.classList.add('error');
  input.setAttribute('aria-invalid', 'true');
  const group = input.closest('.form-group');
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

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove('error', 'valid');
  input.removeAttribute('aria-invalid');
  const group = input.closest('.form-group');
  if (!group) return;
  const el = group.querySelector('.form-error-msg');
  if (el) el.textContent = '';
}

function markFieldValid(input) {
  clearFieldError(input);
  input?.classList.add('valid');
}

function clearAllErrors(form) {
  form?.querySelectorAll('.form-input').forEach(clearFieldError);
}

function toggleVisibility(input, btn) {
  if (!input || !btn) return;
  const show = input.type === 'password';
  input.type     = show ? 'text' : 'password';
  btn.innerHTML  = show ? EYE_OFF : EYE_ON;
  btn.setAttribute('aria-label', show ? 'Ukryj hasło' : 'Pokaż hasło');
}

const EYE_ON  = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;


// ════════════════════════════════════════════════════════════
// FIREBASE ERROR → POLISH MESSAGE
// ════════════════════════════════════════════════════════════

const FB_ERRORS = {
  'auth/user-not-found':          'Nie znaleziono konta z tym adresem e-mail.',
  'auth/wrong-password':          'Nieprawidłowe hasło.',
  'auth/invalid-credential':      'Nieprawidłowy e-mail lub hasło.',
  'auth/invalid-email':           'Podaj prawidłowy adres e-mail.',
  'auth/email-already-in-use':    'Ten adres e-mail jest już zajęty.',
  'auth/weak-password':           'Hasło jest za słabe (min. 6 znaków).',
  'auth/too-many-requests':       'Zbyt wiele prób. Poczekaj chwilę.',
  'auth/network-request-failed':  'Błąd połączenia. Sprawdź internet.',
  'auth/popup-closed-by-user':    null,
  'auth/cancelled-popup-request': null,
  'auth/popup-blocked':           'Przeglądarka zablokowała okno logowania. Zezwól na popup.',
  'auth/user-disabled':           'To konto zostało zablokowane.',
  'permission-denied':            'Brak uprawnień do Firestore. Sprawdź reguły bezpieczeństwa.',
};

function fbMsg(code) {
  return FB_ERRORS[code] ?? `Błąd: ${code ?? 'nieznany'}`;
}


// ════════════════════════════════════════════════════════════
// FIRESTORE — PROFIL UŻYTKOWNIKA
// ════════════════════════════════════════════════════════════

/**
 * Tworzy dokument users/{uid} gdy nie istnieje.
 * Gdy istnieje — aktualizuje tylko lastActive.
 * Zawsze zwraca aktualne dane profilu.
 *
 * @param {import('firebase/auth').User} user
 * @param {Object} extra  — dodatkowe pola przy rejestracji (displayName, username)
 * @returns {Promise<Object>} dane profilu
 */
export async function ensureUserDoc(user, extra = {}) {
  const TAG = '[ensureUserDoc]';

  if (!user?.uid) {
    console.error(TAG, '❌ Brak user.uid');
    throw new Error('Brak user.uid');
  }

  console.log(TAG, '🔍 Sprawdzam users/' + user.uid);

  const ref  = doc(db, COL.USERS, user.uid);
  let   snap;

  try {
    snap = await getDoc(ref);
  } catch (err) {
    console.error(TAG, '❌ getDoc failed:', err.code, err.message);
    throw err;
  }

  // ── Dokument istnieje → aktualizuj lastActive ────────────
  if (snap.exists()) {
    console.log(TAG, '✅ Dokument istnieje, aktualizuję lastActive');

    try {
      await updateDoc(ref, { lastActive: serverTimestamp() });
    } catch (err) {
      // Nie krytyczne — loguj ale nie rzucaj
      console.warn(TAG, '⚠️ Nie udało się zaktualizować lastActive:', err.message);
    }

    return snap.data();
  }

  // ── Dokument nie istnieje → utwórz ──────────────────────
  console.log(TAG, '📝 Tworzę nowy dokument users/' + user.uid);

  const displayName = (extra.displayName || user.displayName || 'Wojownik').trim();
  const username    = (extra.username    || displayName)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30) || 'wojownik';

  const data = {
    uid:         user.uid,
    displayName,
    username,
    email:       user.email       ?? '',
    photoURL:    user.photoURL    ?? '',
    bio:         '',
    points:      0,
    level:       1,
    rank:        'Rookie',
    createdAt:   serverTimestamp(),
    lastActive:  serverTimestamp(),
  };

  try {
    await setDoc(ref, data);
    console.log(TAG, '✅ Dokument utworzony pomyślnie:', data);
  } catch (err) {
    console.error(TAG, '❌ setDoc failed:', err.code, err.message);
    throw err;
  }

  return data;
}

/**
 * Pobiera dane użytkownika z Firestore.
 * Jeśli dokument nie istnieje, automatycznie go tworzy (auto-repair).
 *
 * @param {string}                        uid
 * @param {import('firebase/auth').User}  [authUser]  — opcjonalnie do auto-repair
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUserData(uid, authUser = null) {
  const TAG = '[getCurrentUserData]';

  if (!uid) {
    console.error(TAG, '❌ Brak uid');
    return null;
  }

  console.log(TAG, '🔍 Pobieram users/' + uid);

  let snap;
  try {
    snap = await getDoc(doc(db, COL.USERS, uid));
  } catch (err) {
    console.error(TAG, '❌ getDoc error:', err.code, err.message);
    throw err;
  }

  // ── Dokument istnieje ────────────────────────────────────
  if (snap.exists()) {
    const data = snap.data();
    console.log(TAG, '✅ Dane pobrane:', {
      uid:         data.uid,
      displayName: data.displayName,
      points:      data.points,
      rank:        data.rank,
      level:       data.level,
    });
    return data;
  }

  // ── Auto-repair: dokument nie istnieje ───────────────────
  console.warn(TAG, '⚠️ Dokument users/' + uid + ' nie istnieje — uruchamiam auto-repair');

  const user = authUser ?? auth.currentUser;

  if (!user) {
    console.error(TAG, '❌ Brak auth.currentUser — nie można naprawić');
    return null;
  }

  try {
    const newData = await ensureUserDoc(user);
    console.log(TAG, '✅ Auto-repair zakończony pomyślnie');
    return newData;
  } catch (err) {
    console.error(TAG, '❌ Auto-repair failed:', err.code, err.message);
    throw err;
  }
}


// ════════════════════════════════════════════════════════════
// AUTH GUARDS
// ════════════════════════════════════════════════════════════

/**
 * Wymaga zalogowania.
 * Niezalogowany → login.html
 * Zalogowany    → wywołuje callback(user)
 *
 * @param {function} [callback]
 * @returns {Promise<import('firebase/auth').User>}
 */
export function checkAuth(callback) {
  console.log('[checkAuth] Sprawdzam stan logowania...');

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();

      if (!user) {
        console.warn('[checkAuth] ❌ Użytkownik niezalogowany → login.html');
        window.location.replace('login.html');
        return;
      }

      console.log('[checkAuth] ✅ Zalogowany:', user.uid, user.email);

      if (typeof callback === 'function') {
        // Callback async — łapiemy błędy
        try {
          const result = callback(user);
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error('[checkAuth] ❌ Błąd w callback:', err);
              reject(err);
            });
          }
        } catch (err) {
          console.error('[checkAuth] ❌ Synchroniczny błąd w callback:', err);
          reject(err);
        }
      }

      resolve(user);
    }, (err) => {
      console.error('[checkAuth] ❌ onAuthStateChanged error:', err);
      reject(err);
    });
  });
}

/**
 * Jeśli użytkownik zalogowany → przekieruj do index.html
 * Używane na login.html i register.html.
 *
 * @param {string} [dest='index.html']
 */
export function redirectIfLogged(dest = 'index.html') {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    if (user) {
      console.log('[redirectIfLogged] Użytkownik zalogowany → redirect do', dest);
      window.location.replace(dest);
    }
  });
}


// ════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════

export async function logout() {
  const TAG = '[logout]';
  console.log(TAG, 'Wylogowuję...');

  try {
    await signOut(auth);
    console.log(TAG, '✅ Wylogowano pomyślnie');
    window.location.replace('login.html');
  } catch (err) {
    console.error(TAG, '❌ signOut failed:', err);
    showToast('Błąd podczas wylogowywania.', 'error');
  }
}


// ════════════════════════════════════════════════════════════
// PASSWORD STRENGTH
// ════════════════════════════════════════════════════════════

function calcStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6)              s++;
  if (pwd.length >= 10)             s++;
  if (/[A-Z]/.test(pwd))            s++;
  if (/[0-9]/.test(pwd))            s++;
  if (/[^A-Za-z0-9]/.test(pwd))    s++;
  if (s <= 1) return 1;
  if (s <= 3) return 2;
  return 3;
}

function renderStrength(bars, strength) {
  const cls = ['', 'weak', 'medium', 'strong'];
  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < strength) bar.classList.add(cls[strength]);
  });

  const label  = document.getElementById('strength-label');
  const labels = ['', 'Słabe', 'Średnie', 'Silne'];
  const colors = ['', 'var(--error)', 'var(--warning)', 'var(--success)'];
  if (label) {
    label.textContent = strength ? labels[strength] : '';
    label.style.color = strength ? colors[strength] : '';
  }
}


// ════════════════════════════════════════════════════════════
// LOGIN FORM
// ════════════════════════════════════════════════════════════

export function initLoginForm() {
  const TAG = '[initLoginForm]';

  const form       = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passInput  = document.getElementById('password');
  const submitBtn  = document.getElementById('login-btn');
  const googleBtn  = document.getElementById('google-btn');
  const forgotLink = document.getElementById('forgot-link');
  const toggleBtn  = document.getElementById('toggle-password');

  if (!form) {
    console.warn(TAG, '⚠️ #login-form nie znaleziony w DOM');
    return;
  }

  console.log(TAG, '✅ Inicjalizacja formularza logowania');

  // Toggle widoczności hasła
  toggleBtn?.addEventListener('click', () => toggleVisibility(passInput, toggleBtn));

  // ── Submit: email + hasło ────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors(form);

    const email    = emailInput?.value.trim() ?? '';
    const password = passInput?.value         ?? '';

    console.log(TAG, 'Submit — email:', email);

    let ok = true;
    if (!email)    { setFieldError(emailInput, 'Podaj adres e-mail.');  ok = false; }
    if (!password) { setFieldError(passInput,  'Podaj hasło.');         ok = false; }
    if (!ok) return;

    setLoading(submitBtn, true);

    try {
      console.log(TAG, '🔐 signInWithEmailAndPassword...');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(TAG, '✅ Zalogowano:', cred.user.uid);

      // Upewnij się że dokument istnieje (auto-repair po ewentualnym braku)
      await ensureUserDoc(cred.user);

      showToast('Zalogowano pomyślnie! Witaj z powrotem ⚔️', 'success');
      setTimeout(() => window.location.replace('index.html'), 600);

    } catch (err) {
      console.error(TAG, '❌ Błąd logowania:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(submitBtn, false);
    }
  });

  // ── Google login ─────────────────────────────────────────
  googleBtn?.addEventListener('click', async () => {
    console.log(TAG, '🔐 signInWithPopup (Google)...');
    setLoading(googleBtn, true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(TAG, '✅ Google login:', result.user.uid, result.user.email);

      await ensureUserDoc(result.user);

      showToast('Zalogowano przez Google! 🎉', 'success');
      setTimeout(() => window.location.replace('index.html'), 600);

    } catch (err) {
      console.error(TAG, '❌ Google login error:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(googleBtn, false);
    }
  });

  // ── Reset hasła ──────────────────────────────────────────
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput?.value.trim() ?? '';

    if (!email) {
      setFieldError(emailInput, 'Najpierw wpisz adres e-mail.');
      emailInput?.focus();
      return;
    }

    console.log(TAG, '📧 sendPasswordResetEmail:', email);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log(TAG, '✅ Email resetujący wysłany');
      showToast('Link do resetowania hasła wysłany. Sprawdź skrzynkę! 📬', 'success', 5500);
    } catch (err) {
      console.error(TAG, '❌ Reset email error:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
    }
  });
}


// ════════════════════════════════════════════════════════════
// REGISTER FORM
// ════════════════════════════════════════════════════════════

export function initRegisterForm() {
  const TAG = '[initRegisterForm]';

  const form          = document.getElementById('register-form');
  const nameInput     = document.getElementById('display-name');
  const emailInput    = document.getElementById('email');
  const passInput     = document.getElementById('password');
  const confirmInput  = document.getElementById('confirm-password');
  const termsCheck    = document.getElementById('terms');
  const submitBtn     = document.getElementById('register-btn');
  const googleBtn     = document.getElementById('google-btn');
  const togglePass    = document.getElementById('toggle-password');
  const toggleConfirm = document.getElementById('toggle-confirm');
  const strengthBars  = document.querySelectorAll('.strength-bar');

  if (!form) {
    console.warn(TAG, '⚠️ #register-form nie znaleziony w DOM');
    return;
  }

  console.log(TAG, '✅ Inicjalizacja formularza rejestracji');

  // Toggles
  togglePass?.addEventListener('click',    () => toggleVisibility(passInput,    togglePass));
  toggleConfirm?.addEventListener('click', () => toggleVisibility(confirmInput, toggleConfirm));

  // Siła hasła — live
  passInput?.addEventListener('input', () => {
    renderStrength(strengthBars, calcStrength(passInput.value));
    if (confirmInput?.value) {
      confirmInput.value === passInput.value
        ? markFieldValid(confirmInput)
        : setFieldError(confirmInput, 'Hasła nie są identyczne.');
    }
  });

  // Confirm live
  confirmInput?.addEventListener('input', () => {
    if (!confirmInput.value) { clearFieldError(confirmInput); return; }
    confirmInput.value === passInput?.value
      ? markFieldValid(confirmInput)
      : setFieldError(confirmInput, 'Hasła nie są identyczne.');
  });

  // ── Submit ───────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors(form);

    const displayName = nameInput?.value.trim()  ?? '';
    const email       = emailInput?.value.trim() ?? '';
    const password    = passInput?.value         ?? '';
    const confirm     = confirmInput?.value      ?? '';
    const termsOk     = termsCheck?.checked      ?? false;

    console.log(TAG, 'Submit — name:', displayName, '| email:', email);

    let ok = true;

    if (!displayName || displayName.length < 2) {
      setFieldError(nameInput, 'Podaj imię lub pseudonim (min. 2 znaki).');
      ok = false;
    }
    if (!email) {
      setFieldError(emailInput, 'Podaj adres e-mail.');
      ok = false;
    }
    if (!password || password.length < 6) {
      setFieldError(passInput, 'Hasło musi mieć minimum 6 znaków.');
      ok = false;
    }
    if (password !== confirm) {
      setFieldError(confirmInput, 'Hasła nie są identyczne.');
      ok = false;
    }
    if (!termsOk) {
      showToast('Zaakceptuj regulamin, aby kontynuować.', 'error');
      ok = false;
    }
    if (!ok) return;

    setLoading(submitBtn, true);

    try {
      console.log(TAG, '📝 createUserWithEmailAndPassword...');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log(TAG, '✅ Konto Auth utworzone:', cred.user.uid);

      // Ustaw displayName w Auth
      await updateProfile(cred.user, { displayName });
      console.log(TAG, '✅ updateProfile displayName:', displayName);

      // Utwórz dokument Firestore
      const username = displayName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 30) || 'wojownik';

      await ensureUserDoc(cred.user, { displayName, username });
      console.log(TAG, '✅ Dokument Firestore utworzony');

      showToast('Konto utworzone! Witaj na arenie ⚔️', 'success');
      setTimeout(() => window.location.replace('index.html'), 700);

    } catch (err) {
      console.error(TAG, '❌ Rejestracja error:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(submitBtn, false);
    }
  });

  // ── Google rejestracja ───────────────────────────────────
  googleBtn?.addEventListener('click', async () => {
    console.log(TAG, '🔐 signInWithPopup (Google) — rejestracja...');
    setLoading(googleBtn, true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(TAG, '✅ Google:', result.user.uid, result.user.email);

      await ensureUserDoc(result.user);

      showToast('Konto połączone z Google! 🎉', 'success');
      setTimeout(() => window.location.replace('index.html'), 600);

    } catch (err) {
      console.error(TAG, '❌ Google register error:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(googleBtn, false);
    }
  });
}


// ── Re-eksporty dla innych modułów ───────────────────────────
export { onAuthStateChanged, auth };
