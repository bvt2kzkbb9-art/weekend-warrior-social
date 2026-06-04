/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — auth.js
 * Firebase SDK 10.12.2 | ES Modules | GitHub Pages Ready
 * ============================================================
 */

import {
  auth, db, googleProvider, COL,
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
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  btn.innerHTML = show ? EYE_OFF : EYE_ON;
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
  'auth/too-many-requests':       'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.',
  'auth/network-request-failed':  'Błąd połączenia. Sprawdź internet.',
  'auth/popup-closed-by-user':    null,
  'auth/cancelled-popup-request': null,
  'auth/popup-blocked':           'Przeglądarka zablokowała popup. Zezwól na wyskakujące okna.',
  'auth/user-disabled':           'To konto zostało zablokowane.',
  'auth/missing-email':           'Podaj adres e-mail.',
  'auth/requires-recent-login':   'Zaloguj się ponownie aby wykonać tę operację.',
  'auth/account-exists-with-different-credential': 'Konto z tym e-mailem istnieje z inną metodą logowania.',
  'auth/operation-not-allowed':   'Ta metoda logowania jest wyłączona w Firebase Console.',
  'auth/expired-action-code':     'Link wygasł. Wyślij nowy link resetujący.',
  'auth/invalid-action-code':     'Nieprawidłowy link resetujący. Wyślij nowy.',
};

function fbMsg(code) {
  if (code in FB_ERRORS) return FB_ERRORS[code];
  return `Błąd (${code ?? 'nieznany'})`;
}


// ════════════════════════════════════════════════════════════
// FIRESTORE — PROFIL UŻYTKOWNIKA
// ════════════════════════════════════════════════════════════

/**
 * Tworzy dokument users/{uid} gdy nie istnieje.
 * Gdy istnieje — aktualizuje tylko lastActive (nie krytyczne).
 * Zawsze zwraca dane profilu.
 *
 * NIE rzuca błędu permission-denied jako fatal —
 * logowanie nie powinno być blokowane przez Firestore.
 */
export async function ensureUserDoc(user, extra = {}) {
  const TAG = '[ensureUserDoc]';

  if (!user?.uid) {
    console.error(TAG, '❌ Brak user.uid');
    return null;
  }

  console.log(TAG, '🔍 Sprawdzam users/' + user.uid);

  let snap;
  try {
    snap = await getDoc(doc(db, COL.USERS, user.uid));
  } catch (err) {
    // permission-denied przy getDoc = reguły blokują odczyt
    // Nie blokujemy logowania — zwracamy dane z Auth
    console.error(TAG, '❌ getDoc error:', err.code, err.message);
    if (err.code === 'permission-denied') {
      console.warn(TAG, '⚠️ Reguły Firestore blokują odczyt. Sprawdź Firebase Console → Firestore → Rules.');
    }
    return buildFallbackProfile(user, extra);
  }

  // Dokument istnieje
  if (snap.exists()) {
    console.log(TAG, '✅ Dokument istnieje');
    // Próba aktualizacji lastActive — nie krytyczna
    updateLastActiveSilent(user.uid);
    return snap.data();
  }

  // Dokument nie istnieje — utwórz
  console.log(TAG, '📝 Tworzę nowy dokument users/' + user.uid);

  const data = buildProfileData(user, extra);

  try {
    await setDoc(doc(db, COL.USERS, user.uid), data);
    console.log(TAG, '✅ Dokument utworzony:', data.displayName);
    return data;
  } catch (err) {
    console.error(TAG, '❌ setDoc error:', err.code, err.message);
    if (err.code === 'permission-denied') {
      console.warn(TAG, '⚠️ Reguły Firestore blokują zapis.');
      console.warn(TAG, 'Wymagane reguły:\n' + REQUIRED_RULES);
    }
    // Zwróć dane bez zapisu — przynajmniej dashboard zadziała
    return data;
  }
}

function buildProfileData(user, extra = {}) {
  const displayName = (extra.displayName || user.displayName || 'Wojownik').trim();
  const username    = (extra.username    || displayName)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30) || 'wojownik';

  return {
    uid:         user.uid,
    displayName,
    username,
    email:       user.email    ?? '',
    photoURL:    user.photoURL ?? '',
    bio:         '',
    points:      0,
    level:       1,
    rank:        'Rookie',
    createdAt:   serverTimestamp(),
    lastActive:  serverTimestamp(),
  };
}

// Fallback gdy Firestore niedostępny — używa danych z Firebase Auth
function buildFallbackProfile(user, extra = {}) {
  const displayName = extra.displayName || user.displayName || 'Wojownik';
  return {
    uid:         user.uid,
    displayName,
    username:    displayName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
    email:       user.email    ?? '',
    photoURL:    user.photoURL ?? '',
    bio:         '',
    points:      0,
    level:       1,
    rank:        'Rookie',
    _fallback:   true, // oznacza że dane nie są z Firestore
  };
}

async function updateLastActiveSilent(uid) {
  try {
    await updateDoc(doc(db, COL.USERS, uid), { lastActive: serverTimestamp() });
  } catch {
    // Cicha porażka — nie blokuje niczego
  }
}

const REQUIRED_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && request.auth.uid == uid;
    }
  }
}`;

/**
 * Pobiera dane użytkownika z Firestore.
 * Auto-repair: jeśli dokument nie istnieje — tworzy go.
 * Fallback: jeśli Firestore niedostępny — dane z Auth.
 *
 * NIGDY nie rzuca błędu który blokuje UI.
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

    if (err.code === 'permission-denied') {
      console.warn(TAG, '⚠️ permission-denied! Sprawdź reguły Firestore:' + REQUIRED_RULES);
    }

    // Fallback z Auth jeśli mamy użytkownika
    const user = authUser ?? auth.currentUser;
    if (user) {
      console.warn(TAG, '⚠️ Używam danych fallback z Auth (bez Firestore)');
      return buildFallbackProfile(user);
    }

    throw err; // Re-throw tylko gdy brak fallbacku
  }

  // Dokument istnieje
  if (snap.exists()) {
    const data = snap.data();
    console.log(TAG, '✅ Dane pobrane:', data.displayName, '| pkt:', data.points, '| ranga:', data.rank);
    return data;
  }

  // Dokument nie istnieje — auto-repair
  console.warn(TAG, '⚠️ Dokument nie istnieje, auto-repair...');

  const user = authUser ?? auth.currentUser;
  if (!user) {
    console.error(TAG, '❌ Brak auth.currentUser — nie można naprawić');
    return null;
  }

  try {
    const newData = await ensureUserDoc(user);
    console.log(TAG, '✅ Auto-repair zakończony');
    return newData;
  } catch (err) {
    console.error(TAG, '❌ Auto-repair failed:', err.message);
    return buildFallbackProfile(user);
  }
}


// ════════════════════════════════════════════════════════════
// AUTH GUARDS
// ════════════════════════════════════════════════════════════

/**
 * Wymaga zalogowania.
 * Niezalogowany → login.html
 * Zalogowany    → callback(user)
 */
export function checkAuth(callback) {
  console.log('[checkAuth] Sprawdzam stan logowania...');

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();

      if (!user) {
        console.warn('[checkAuth] ❌ Niezalogowany → login.html');
        window.location.replace('login.html');
        return;
      }

      console.log('[checkAuth] ✅ Zalogowany:', user.uid, user.email);

      if (typeof callback === 'function') {
        try {
          const result = callback(user);
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error('[checkAuth] ❌ Błąd w callback:', err);
              reject(err);
            });
          }
        } catch (err) {
          console.error('[checkAuth] ❌ Sync błąd w callback:', err);
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
 * Jeśli zalogowany → przekieruj do index.html.
 * Używaj na login.html i register.html.
 */
export function redirectIfLogged(dest = 'index.html') {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    if (user) {
      console.log('[redirectIfLogged] Zalogowany → redirect:', dest);
      window.location.replace(dest);
    }
  });
}


// ════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════

export async function logout() {
  console.log('[logout] Wylogowuję...');
  try {
    await signOut(auth);
    console.log('[logout] ✅ Wylogowano');
    window.location.replace('login.html');
  } catch (err) {
    console.error('[logout] ❌', err);
    showToast('Błąd podczas wylogowywania.', 'error');
  }
}


// ════════════════════════════════════════════════════════════
// PASSWORD STRENGTH
// ════════════════════════════════════════════════════════════

function calcStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6)           s++;
  if (pwd.length >= 10)          s++;
  if (/[A-Z]/.test(pwd))         s++;
  if (/[0-9]/.test(pwd))         s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
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

  if (!form) { console.warn(TAG, '⚠️ #login-form nie znaleziony'); return; }
  console.log(TAG, '✅ Init');

  // Toggle hasła
  toggleBtn?.addEventListener('click', () => toggleVisibility(passInput, toggleBtn));

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors(form);

    const email    = emailInput?.value.trim() ?? '';
    const password = passInput?.value         ?? '';

    let ok = true;
    if (!email)    { setFieldError(emailInput, 'Podaj adres e-mail.'); ok = false; }
    if (!password) { setFieldError(passInput,  'Podaj hasło.');        ok = false; }
    if (!ok) return;

    setLoading(submitBtn, true);
    console.log(TAG, '🔐 Loguję:', email);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(TAG, '✅ Auth OK:', cred.user.uid);

      showToast('Zalogowano! Witaj z powrotem ⚔️', 'success');
      setTimeout(() => window.location.replace('index.html'), 600);

    } catch (err) {
      console.error(TAG, '❌', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(submitBtn, false);
    }
  });

  // Google
  googleBtn?.addEventListener('click', async () => {
    setLoading(googleBtn, true);
    console.log(TAG, '🔐 Google popup...');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(TAG, '✅ Google OK:', result.user.uid);

      // Utwórz/zaktualizuj dokument Firestore (nie blokuje redirectu)
      ensureUserDoc(result.user)
        .then(() => console.log(TAG, '✅ Firestore doc ready (Google login)'))
        .catch(err => console.error(TAG, '⚠️ Firestore doc error:', err.code));

      showToast('Zalogowano przez Google! 🎉', 'success');
      setTimeout(() => window.location.replace('index.html'), 600);

    } catch (err) {
      console.error(TAG, '❌ Google:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(googleBtn, false);
    }
  });

  // Reset hasła
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    clearFieldError(emailInput);

    const email = emailInput?.value.trim() ?? '';

    if (!email) {
      setFieldError(emailInput, 'Najpierw wpisz adres e-mail.');
      emailInput?.focus();
      return;
    }

    // Prosta walidacja formatu email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(emailInput, 'Podaj prawidłowy adres e-mail.');
      emailInput?.focus();
      return;
    }

    console.log(TAG, '📧 Reset hasła dla:', email);

    // Zablokuj link żeby uniknąć podwójnego kliknięcia
    if (forgotLink.dataset.sending === '1') return;
    forgotLink.dataset.sending = '1';
    forgotLink.style.opacity   = '0.5';

    try {
      await sendPasswordResetEmail(auth, email);
      console.log(TAG, '✅ Reset email wysłany na:', email);
      showToast('Link resetujący wysłany! Sprawdź skrzynkę pocztową (też spam) 📬', 'success', 7000);
      // Wyczyść pole po sukcesie
      passInput && (passInput.value = '');
    } catch (err) {
      console.error(TAG, '❌ Reset error — code:', err.code, '| message:', err.message);

      // Firebase zwraca user-not-found lub invalid-email
      const RESET_ERRORS = {
        'auth/user-not-found':    'Nie znaleziono konta z tym adresem e-mail.',
        'auth/invalid-email':     'Podaj prawidłowy adres e-mail.',
        'auth/too-many-requests': 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.',
        'auth/network-request-failed': 'Brak połączenia z internetem.',
        // Nowsze wersje Firebase mogą zwracać invalid-credential zamiast user-not-found
        'auth/invalid-credential': 'Nie znaleziono konta z tym adresem e-mail.',
      };

      const msg = RESET_ERRORS[err.code]
        ?? `Błąd wysyłania: ${err.code ?? err.message}`;

      showToast(msg, 'error', 6000);
      setFieldError(emailInput, msg);
    } finally {
      forgotLink.dataset.sending = '0';
      forgotLink.style.opacity   = '1';
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

  if (!form) { console.warn(TAG, '⚠️ #register-form nie znaleziony'); return; }
  console.log(TAG, '✅ Init');

  // Toggles
  togglePass?.addEventListener('click',    () => toggleVisibility(passInput,    togglePass));
  toggleConfirm?.addEventListener('click', () => toggleVisibility(confirmInput, toggleConfirm));

  // Siła hasła
  passInput?.addEventListener('input', () => {
    renderStrength(strengthBars, calcStrength(passInput.value));
    if (confirmInput?.value) {
      confirmInput.value === passInput.value
        ? markFieldValid(confirmInput)
        : setFieldError(confirmInput, 'Hasła nie są identyczne.');
    }
  });

  confirmInput?.addEventListener('input', () => {
    if (!confirmInput.value) { clearFieldError(confirmInput); return; }
    confirmInput.value === passInput?.value
      ? markFieldValid(confirmInput)
      : setFieldError(confirmInput, 'Hasła nie są identyczne.');
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors(form);

    const displayName = nameInput?.value.trim()  ?? '';
    const email       = emailInput?.value.trim() ?? '';
    const password    = passInput?.value         ?? '';
    const confirm     = confirmInput?.value      ?? '';
    const termsOk     = termsCheck?.checked      ?? false;

    let ok = true;
    if (!displayName || displayName.length < 2) {
      setFieldError(nameInput, 'Podaj imię lub pseudonim (min. 2 znaki).'); ok = false;
    }
    if (!email) {
      setFieldError(emailInput, 'Podaj adres e-mail.'); ok = false;
    }
    if (!password || password.length < 6) {
      setFieldError(passInput, 'Hasło musi mieć min. 6 znaków.'); ok = false;
    }
    if (password !== confirm) {
      setFieldError(confirmInput, 'Hasła nie są identyczne.'); ok = false;
    }
    if (!termsOk) {
      showToast('Zaakceptuj regulamin, aby kontynuować.', 'error'); ok = false;
    }
    if (!ok) return;

    setLoading(submitBtn, true);
    console.log(TAG, '📝 Rejestruję:', email, '|', displayName);

    try {
      // 1. Utwórz konto w Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log(TAG, '✅ Auth konto:', cred.user.uid);

      // 2. Ustaw displayName w Auth
      await updateProfile(cred.user, { displayName });
      console.log(TAG, '✅ displayName set:', displayName);

      // 3. Utwórz dokument Firestore (nie blokuje redirectu nawet przy błędzie)
      const username = displayName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 30) || 'wojownik';

      ensureUserDoc(cred.user, { displayName, username })
        .then(() => console.log(TAG, '✅ Firestore doc ready'))
        .catch(err => console.error(TAG, '⚠️ Firestore doc error (nie blokuje):', err.code));

      showToast('Konto utworzone! Witaj na arenie ⚔️', 'success');
      setTimeout(() => window.location.replace('index.html'), 700);

    } catch (err) {
      console.error(TAG, '❌ Rejestracja error:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(submitBtn, false);
    }
  });

  // Google
  googleBtn?.addEventListener('click', async () => {
    setLoading(googleBtn, true);
    console.log(TAG, '🔐 Google popup (rejestracja)...');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(TAG, '✅ Google:', result.user.uid);

      ensureUserDoc(result.user)
        .then(() => console.log(TAG, '✅ Firestore doc ready'))
        .catch(err => console.error(TAG, '⚠️ Firestore doc error:', err.code));

      showToast('Konto połączone z Google! 🎉', 'success');
      setTimeout(() => window.location.replace('index.html'), 600);

    } catch (err) {
      console.error(TAG, '❌ Google:', err.code, err.message);
      const msg = fbMsg(err.code);
      if (msg) showToast(msg, 'error');
      setLoading(googleBtn, false);
    }
  });
}


// Re-eksporty
export { onAuthStateChanged, auth };
