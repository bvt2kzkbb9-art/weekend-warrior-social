/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — profile.js v2
 * Firebase SDK 10.12.2 | ES Modules | GitHub Pages Ready
 * ============================================================
 *
 * Eksporty publiczne:
 *   initDashboard()    — index.html
 *   initProfilePage()  — profile.html
 *   renderAvatar()     — helper
 *   renderRankBadge()  — helper
 *   renderLevelBadge() — helper
 *   renderXpBar()      — helper
 */

import {
  auth, db, COL, RANKS, getRank, getLevel, getRankProgress,
} from '../core/firebase.js';

import {
  checkAuth, logout, getCurrentUserData, ensureUserDoc, showToast,
} from '../core/auth.js';

import {
  doc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { uploadAvatar } from './profile-service.js';


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

export function renderAvatar(el, user, data) {
  if (!el) return;
  const avatar = data?.avatar || user?.photoURL || '';
  const name     = data?.username || user?.displayName || 'W';
  const initials = name
    .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  if (avatar) {
    el.innerHTML = '';
    const img     = document.createElement('img');
    img.src       = avatar;
    img.alt       = `Avatar ${name}`;
    img.className = 'avatar av-xl';
    img.onerror   = () => { el.innerHTML = ''; el.textContent = initials; };
    el.appendChild(img);
  } else {
    el.innerHTML   = '';
    el.textContent = initials;
  }
}

export function renderRankBadge(el, xp) {
  if (!el) return;
  const rank = getRank(xp);
  el.textContent = `${rank.emoji} ${rank.label}`;
}

export function renderLevelBadge(el, xp) {
  if (!el) return;
  el.textContent = `Poziom ${getLevel(xp)}`;
}

export function renderXpBar(barEl, pctEl, xp) {
  const pct = getRankProgress(xp);
  if (barEl) {
    barEl.style.width = pct + '%';
    barEl.setAttribute('aria-valuenow', pct);
  }
  if (pctEl) pctEl.textContent = pct + '%';
}

function formatDate(ts) {
  if (!ts) return '';
  const date = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}


// ════════════════════════════════════════════════════════════
// DASHBOARD — index.html
// ════════════════════════════════════════════════════════════

export function initDashboard() {
  const TAG = '[initDashboard]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    console.log(TAG, '✅ User:', user.uid);

    let data;
    try {
      data = await getCurrentUserData(user.uid, user);
    } catch (err) {
      console.error(TAG, '❌', err);
      data = null;
    }

    if (!data) {
      data = {
        uid:      user.uid,
        username: user.displayName || 'Wojownik',
        email:    user.email       || '',
        avatar:   user.photoURL    || '',
        xp:       0,
        level:    1,
        rank:     'Rookie',
      };
    }

    if (data._fallback) {
      showToast('Dane z Firestore niedostępne. Sprawdź reguły bezpieczeństwa.', 'info', 6000);
    }

    renderDashboard(user, data);
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('logout-mobile')?.addEventListener('click', logout);
}

function renderDashboard(user, data) {
  const xp       = Number(data.xp) || 0;
  const level    = getLevel(xp);
  const rankObj  = getRank(xp);
  const progress = getRankProgress(xp);
  const rankIdx  = RANKS.findIndex(r => r.id === rankObj.id);
  const nextRank = RANKS[rankIdx + 1] ?? null;

  renderAvatar(document.getElementById('user-avatar'), user, data);
  setText('user-name',  data.username || user.displayName || 'Wojownik');
  setText('user-email', data.email        || user.email        || '');

  const rankBadge  = document.getElementById('rank-badge');
  const levelBadge = document.getElementById('level-badge');
  if (rankBadge)  rankBadge.textContent  = `${rankObj.emoji} ${rankObj.label}`;
  if (levelBadge) levelBadge.textContent = `Poziom ${level}`;

  setText('stat-points', xp.toLocaleString('pl-PL'));
  setText('stat-level',  String(level));

  const emojiEl = document.getElementById('stat-rank-emoji');
  if (emojiEl) {
    emojiEl.textContent = rankObj.emoji;
    emojiEl.className   = `stat-value ${rankObj.cssClass}`;
  }

  renderXpBar(document.getElementById('xp-bar'), document.getElementById('xp-percent'), xp);

  setText('rank-current-label',
    `${rankObj.emoji} ${rankObj.label} (${rankObj.min.toLocaleString('pl-PL')} pkt)`);
  setText('rank-next-label',
    nextRank
      ? `${nextRank.emoji} ${nextRank.label} (${nextRank.min.toLocaleString('pl-PL')} pkt)`
      : '🏅 Maks. ranga!');

  document.getElementById('skeleton')?.classList.add('hidden');
  document.getElementById('dashboard')?.classList.remove('hidden');
}


// ════════════════════════════════════════════════════════════
// PROFILE PAGE — profile.html
// ════════════════════════════════════════════════════════════

export function initProfilePage() {
  const TAG = '[initProfilePage]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    console.log(TAG, '✅ User:', user.uid);

    let data;
    try {
      data = await getCurrentUserData(user.uid, user);
    } catch (err) {
      console.error(TAG, '❌', err);
      data = null;
    }

    if (!data) {
      data = {
        uid:      user.uid,
        username: user.displayName || 'Wojownik',
        email:    user.email       || '',
        avatar:   user.photoURL    || '',
        xp:       0,
        level:    1,
        rank:     'Rookie',
      };
    }

    renderProfilePage(user, data);
    initAvatarUpload(user, data);
    initEditProfileSection(user, data);
    initPasswordSection(user);
    initDangerSection(user);
    initSectionToggles();

    // Update updatedAt — not critical
    updateDoc(doc(db, COL.USERS, user.uid), { updatedAt: serverTimestamp() })
      .catch(() => {});
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
}


// ── Render profilu ───────────────────────────────────────────
function renderProfilePage(user, data) {
  const TAG = '[renderProfilePage]';

  const xp       = Number(data.xp) || 0;
  const level    = getLevel(xp);
  const rankObj  = getRank(xp);
  const progress = getRankProgress(xp);
  const rankIdx  = RANKS.findIndex(r => r.id === rankObj.id);
  const nextRank = RANKS[rankIdx + 1] ?? null;

  console.log(TAG, { username: data.username, xp, rank: rankObj.id });

  // Avatar
  const avatarEl = document.getElementById('profile-avatar-el');
  renderAvatar(avatarEl, user, data);

  // Dane
  setText('profile-display-name', data.username || 'Wojownik');
  setText('profile-username',     '@' + (data.username || data.username?.toLowerCase().replace(/\s+/g,'_') || 'wojownik'));
  setText('profile-bio',          '');
  setText('profile-email-display', data.email || user.email || '');

  // Badges
  const rankBadge = document.getElementById('profile-rank-badge');
  if (rankBadge) {
    rankBadge.textContent = `${rankObj.emoji} ${rankObj.label}`;
    rankBadge.className   = `badge badge-gold`;
  }
  const levelBadge = document.getElementById('profile-level-badge');
  if (levelBadge) levelBadge.textContent = `Poziom ${level}`;

  // Stats
  setText('profile-stat-points', xp.toLocaleString('pl-PL'));
  setText('profile-stat-level',  String(level));
  setText('profile-stat-rank',   rankObj.emoji);

  const statRankEl = document.getElementById('profile-stat-rank');
  if (statRankEl) statRankEl.className = `stat-value ${rankObj.cssClass}`;

  // XP bar
  renderXpBar(
    document.getElementById('profile-xp-bar'),
    document.getElementById('profile-xp-percent'),
    xp,
  );

  setText('profile-rank-current',
    `${rankObj.emoji} ${rankObj.label} (${rankObj.min.toLocaleString('pl-PL')} pkt)`);
  setText('profile-rank-next',
    nextRank
      ? `${nextRank.emoji} ${nextRank.label} (${nextRank.min.toLocaleString('pl-PL')} pkt)`
      : '🏅 Maks. ranga!');

  // Formularz edycji — wypełnij
  setVal('edit-display-name', data.username || '');
  setVal('edit-bio',          data.bio          || '');

  // Member since
  if (data.createdAt) {
    setText('member-since', `Członek od ${formatDate(data.createdAt)}`);
  }

  // Osiągnięcia (preview)
  renderAchievementsPreview(data);

  // Pokaż stronę
  document.getElementById('profile-skeleton')?.classList.add('hidden');
  document.getElementById('profile-content')?.classList.remove('hidden');

  console.log(TAG, '✅ Profil wyrenderowany');
}


// ── Achievements preview ─────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_post',    emoji: '📝', name: 'Pierwszy post',     condition: d => (d.postsCount ?? 0) >= 1 },
  { id: 'ten_posts',     emoji: '✍️', name: '10 postów',         condition: d => (d.postsCount ?? 0) >= 10 },
  { id: 'first_like',    emoji: '❤️', name: 'Pierwsze lajki',    condition: d => (d.likesReceived ?? 0) >= 1 },
  { id: 'warrior_rank',  emoji: '🥈', name: 'Ranga Warrior',     condition: d => (d.xp ?? 0) >= 500 },
  { id: 'champion_rank', emoji: '🥇', name: 'Ranga Champion',    condition: d => (d.xp ?? 0) >= 2000 },
  { id: 'legend_rank',   emoji: '💎', name: 'Ranga Legend',      condition: d => (d.xp ?? 0) >= 10000 },
  { id: 'golden_circle', emoji: '🌕', name: 'Złoty Krąg',        condition: d => (d.xp ?? 0) >= 1000 },
  { id: 'dragon',        emoji: '🐉', name: 'Pogromca Smoków',   condition: d => (d.xp ?? 0) >= 5000 },
];

function renderAchievementsPreview(data) {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;

  grid.innerHTML = '';

  ACHIEVEMENT_DEFS.forEach(ach => {
    const unlocked = ach.condition(data);
    const chip     = document.createElement('div');
    chip.className = `achievement-chip${unlocked ? '' : ' locked'}`;
    chip.title     = unlocked ? ach.name : `${ach.name} (zablokowane)`;
    chip.innerHTML = `
      <div class="achievement-emoji">${ach.emoji}</div>
      <div class="achievement-chip-name">${ach.name}</div>
    `;
    grid.appendChild(chip);
  });
}


// ════════════════════════════════════════════════════════════
// AVATAR UPLOAD
// ════════════════════════════════════════════════════════════

function initAvatarUpload(user, data) {
  const TAG        = '[initAvatarUpload]';
  const wrap       = document.getElementById('profile-avatar-wrap');
  const fileInput  = document.getElementById('avatar-file-input');
  const progressEl = document.getElementById('avatar-upload-progress');

  if (!wrap || !fileInput) return;

  wrap.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(TAG, '⬆️ Uploading avatar:', file.name);

    if (progressEl) {
      progressEl.classList.add('visible');
      progressEl.textContent = '0%';
    }

    try {
      // Simulate progress since Cloudinary doesn't provide granular progress
      const progressInterval = setInterval(() => {
        const current = parseInt(progressEl?.textContent || '0');
        if (current < 90) {
          const next = current + Math.random() * 30;
          if (progressEl) progressEl.textContent = Math.min(90, next).toFixed(0) + '%';
        }
      }, 200);

      // Upload to Cloudinary
      const result = await uploadAvatar(file);
      clearInterval(progressInterval);

      if (progressEl) progressEl.textContent = '100%';
      console.log(TAG, '✅ Upload successful:', result.url);

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: result.url });

      // Update Firestore
      await updateDoc(doc(db, COL.USERS, user.uid), {
        avatar:    result.url,
        updatedAt: serverTimestamp(),
      });

      // Update avatar in UI
      const avatarEl = document.getElementById('profile-avatar-el');
      if (avatarEl) {
        avatarEl.innerHTML = '';
        const img     = document.createElement('img');
        img.src       = result.url;
        img.alt       = 'Avatar';
        img.className = 'avatar av-xl';
        img.onerror   = () => { avatarEl.innerHTML = ''; avatarEl.textContent = '?'; };
        avatarEl.appendChild(img);
      }

      showToast('Avatar zaktualizowany! 🎉', 'success');

    } catch (err) {
      console.error(TAG, '❌', err.message);
      showToast(err.message || 'Błąd uploadu avatara. Spróbuj ponownie.', 'error');
    } finally {
      if (progressEl) progressEl.classList.remove('visible');
      fileInput.value = '';
    }
  });
}


// ════════════════════════════════════════════════════════════
// EDIT PROFILE SECTION
// ════════════════════════════════════════════════════════════

function initEditProfileSection(user, data) {
  const TAG  = '[initEditProfileSection]';
  const form = document.getElementById('edit-profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('edit-display-name');
    const bioInput  = document.getElementById('edit-bio');
    const saveBtn   = document.getElementById('save-profile-btn');

    const newName = nameInput?.value.trim() ?? '';
    const newBio  = bioInput?.value.trim()  ?? '';

    if (!newName || newName.length < 2) {
      showToast('Imię/pseudonim musi mieć min. 2 znaki.', 'error');
      nameInput?.focus();
      return;
    }

    if (newBio.length > 200) {
      showToast('Opis może mieć max. 200 znaków.', 'error');
      return;
    }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add('loading'); }
    console.log(TAG, 'Zapisuję:', { newName, newBio });

    try {
      // Aktualizuj Auth
      await updateProfile(user, { displayName: newName });

      // Aktualizuj Firestore
      await updateDoc(doc(db, COL.USERS, user.uid), {
        username:  newName,
        updatedAt: serverTimestamp(),
      });

      // Aktualizuj UI natychmiast
      setText('profile-display-name', newName);
      setText('profile-bio', newBio || 'Brak opisu profilu. Kliknij "Edytuj profil" aby dodać.');

      showToast('Profil zaktualizowany! ✅', 'success');
      console.log(TAG, '✅ Profil zapisany');

      // Zwiń sekcję
      const body = document.getElementById('edit-profile-body');
      const chevron = document.getElementById('edit-profile-chevron');
      body?.classList.remove('open');
      chevron?.classList.remove('open');

    } catch (err) {
      console.error(TAG, '❌', err.code, err.message);
      showToast(
        err.code === 'permission-denied'
          ? 'Brak uprawnień. Sprawdź reguły Firestore.'
          : 'Błąd zapisu. Spróbuj ponownie.',
        'error',
      );
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.classList.remove('loading'); }
    }
  });
}


// ════════════════════════════════════════════════════════════
// PASSWORD SECTION
// ════════════════════════════════════════════════════════════

function initPasswordSection(user) {
  const TAG  = '[initPasswordSection]';
  const form = document.getElementById('change-password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPass = document.getElementById('current-password')?.value ?? '';
    const newPass     = document.getElementById('new-password')?.value      ?? '';
    const confirmPass = document.getElementById('confirm-new-password')?.value ?? '';
    const saveBtn     = document.getElementById('save-password-btn');

    if (!currentPass) { showToast('Podaj aktualne hasło.', 'error'); return; }
    if (!newPass || newPass.length < 6) { showToast('Nowe hasło min. 6 znaków.', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Nowe hasła nie są identyczne.', 'error'); return; }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add('loading'); }
    console.log(TAG, 'Zmiana hasła...');

    try {
      // Re-autentykacja wymagana przez Firebase
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPass);

      showToast('Hasło zmienione! 🔐', 'success');
      console.log(TAG, '✅ Hasło zmienione');
      form.reset();

      // Zwiń sekcję
      document.getElementById('password-body')?.classList.remove('open');
      document.getElementById('password-chevron')?.classList.remove('open');

    } catch (err) {
      console.error(TAG, '❌', err.code, err.message);
      const msgs = {
        'auth/wrong-password':       'Aktualne hasło jest nieprawidłowe.',
        'auth/weak-password':        'Nowe hasło jest za słabe.',
        'auth/requires-recent-login':'Zaloguj się ponownie aby zmienić hasło.',
      };
      showToast(msgs[err.code] ?? 'Błąd zmiany hasła.', 'error');
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.classList.remove('loading'); }
    }
  });
}


// ════════════════════════════════════════════════════════════
// DANGER SECTION
// ════════════════════════════════════════════════════════════

function initDangerSection(user) {
  // Logout button
  document.getElementById('danger-logout-btn')?.addEventListener('click', logout);
}


// ════════════════════════════════════════════════════════════
// SECTION TOGGLES (accordion)
// ════════════════════════════════════════════════════════════

function initSectionToggles() {
  const toggles = [
    { headerId: 'edit-profile-header', bodyId: 'edit-profile-body', chevronId: 'edit-profile-chevron' },
    { headerId: 'password-header',     bodyId: 'password-body',     chevronId: 'password-chevron'     },
    { headerId: 'danger-header',       bodyId: 'danger-body',       chevronId: 'danger-chevron'       },
  ];

  toggles.forEach(({ headerId, bodyId, chevronId }) => {
    const header  = document.getElementById(headerId);
    const body    = document.getElementById(bodyId);
    const chevron = document.getElementById(chevronId);

    if (!header || !body) return;

    header.addEventListener('click', () => {
      const isOpen = body.classList.toggle('open');
      chevron?.classList.toggle('open', isOpen);
    });
  });
}
