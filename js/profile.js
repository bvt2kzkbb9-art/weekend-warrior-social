/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — profile.js v3
 * Firebase SDK 10.12.2 | ES Modules | GitHub Pages Ready
 * Cloudinary avatar upload (Firebase Storage usunięty)
 * ============================================================
 */

import {
  auth, db, COL, RANKS, getRank, getLevel, getRankProgress,
} from './firebase.js';

import {
  checkAuth, logout, getCurrentUserData, ensureUserDoc, showToast,
} from './auth.js';

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

import { uploadToCloudinary } from './cloudinary.js';


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
  const photoURL = data?.photoURL || user?.photoURL || '';
  const name     = data?.displayName || user?.displayName || 'W';
  const initials = name
    .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  if (photoURL) {
    el.innerHTML = '';
    const img     = document.createElement('img');
    img.src       = photoURL;
    img.alt       = `Avatar ${name}`;
    img.className = 'avatar av-xl';
    img.onerror   = () => { el.innerHTML = ''; el.textContent = initials; };
    el.appendChild(img);
  } else {
    el.innerHTML   = '';
    el.textContent = initials;
  }
}

export function renderRankBadge(el, points) {
  if (!el) return;
  const rank = getRank(points);
  el.textContent = `${rank.emoji} ${rank.label}`;
}

export function renderLevelBadge(el, points) {
  if (!el) return;
  el.textContent = `Poziom ${getLevel(points)}`;
}

export function renderXpBar(barEl, pctEl, points) {
  const pct = getRankProgress(points);
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
        uid:         user.uid,
        displayName: user.displayName || 'Wojownik',
        email:       user.email       || '',
        photoURL:    user.photoURL    || '',
        points:      0, level: 1, rank: 'Rookie',
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
  const points   = Number(data.points) || 0;
  const level    = getLevel(points);
  const rankObj  = getRank(points);
  const progress = getRankProgress(points);
  const rankIdx  = RANKS.findIndex(r => r.id === rankObj.id);
  const nextRank = RANKS[rankIdx + 1] ?? null;

  renderAvatar(document.getElementById('user-avatar'), user, data);
  setText('user-name',  data.displayName || user.displayName || 'Wojownik');
  setText('user-email', data.email        || user.email        || '');

  const rankBadge  = document.getElementById('rank-badge');
  const levelBadge = document.getElementById('level-badge');
  if (rankBadge)  rankBadge.textContent  = `${rankObj.emoji} ${rankObj.label}`;
  if (levelBadge) levelBadge.textContent = `Poziom ${level}`;

  setText('stat-points', points.toLocaleString('pl-PL'));
  setText('stat-level',  String(level));

  const emojiEl = document.getElementById('stat-rank-emoji');
  if (emojiEl) {
    emojiEl.textContent = rankObj.emoji;
    emojiEl.className   = `stat-value ${rankObj.cssClass}`;
  }

  renderXpBar(document.getElementById('xp-bar'), document.getElementById('xp-percent'), points);

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
        uid:         user.uid,
        displayName: user.displayName || 'Wojownik',
        email:       user.email       || '',
        photoURL:    user.photoURL    || '',
        points:      0, level: 1, rank: 'Rookie',
        bio: '', username: '',
      };
    }

    renderProfilePage(user, data);
    initAvatarUpload(user);
    initEditProfileSection(user, data);
    initPasswordSection(user);
    initDangerSection(user);
    initSectionToggles();

    updateDoc(doc(db, COL.USERS, user.uid), { lastActive: serverTimestamp() })
      .catch(() => {});
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
}


// ── Render profilu ───────────────────────────────────────────
function renderProfilePage(user, data) {
  const TAG = '[renderProfilePage]';

  const points   = Number(data.points) || 0;
  const level    = getLevel(points);
  const rankObj  = getRank(points);
  const progress = getRankProgress(points);
  const rankIdx  = RANKS.findIndex(r => r.id === rankObj.id);
  const nextRank = RANKS[rankIdx + 1] ?? null;

  console.log(TAG, { displayName: data.displayName, points, rank: rankObj.id });

  renderAvatar(document.getElementById('profile-avatar-el'), user, data);

  setText('profile-display-name', data.displayName || 'Wojownik');
  setText('profile-username',     '@' + (data.username || (data.displayName || 'wojownik').toLowerCase().replace(/\s+/g,'_')));
  setText('profile-bio',          data.bio || 'Brak opisu profilu. Kliknij "Edytuj profil" aby dodać.');
  setText('profile-email-display', data.email || user.email || '');

  const rankBadge = document.getElementById('profile-rank-badge');
  if (rankBadge) {
    rankBadge.textContent = `${rankObj.emoji} ${rankObj.label}`;
    rankBadge.className   = `badge badge-gold`;
  }
  const levelBadge = document.getElementById('profile-level-badge');
  if (levelBadge) levelBadge.textContent = `Poziom ${level}`;

  setText('profile-stat-points', points.toLocaleString('pl-PL'));
  setText('profile-stat-level',  String(level));

  const statRankEl = document.getElementById('profile-stat-rank');
  if (statRankEl) {
    statRankEl.textContent = rankObj.emoji;
    statRankEl.className   = `stat-value ${rankObj.cssClass}`;
  }

  renderXpBar(
    document.getElementById('profile-xp-bar'),
    document.getElementById('profile-xp-percent'),
    points,
  );

  setText('profile-rank-current',
    `${rankObj.emoji} ${rankObj.label} (${rankObj.min.toLocaleString('pl-PL')} pkt)`);
  setText('profile-rank-next',
    nextRank
      ? `${nextRank.emoji} ${nextRank.label} (${nextRank.min.toLocaleString('pl-PL')} pkt)`
      : '🏅 Maks. ranga!');

  setVal('edit-display-name', data.displayName || '');
  setVal('edit-bio',          data.bio          || '');

  if (data.createdAt) {
    setText('member-since', `Członek od ${formatDate(data.createdAt)}`);
  }

  renderAchievementsPreview(data);

  document.getElementById('profile-skeleton')?.classList.add('hidden');
  document.getElementById('profile-content')?.classList.remove('hidden');

  console.log(TAG, '✅ Profil wyrenderowany');
}


// ── Achievements preview ─────────────────────────────────────
// Używamy dokładnie tych samych IDs co achievements.js ACHIEVEMENTS
const ACHIEVEMENT_DEFS = [
  { id: 'first_post',       emoji: '📝', name: 'Pierwsze słowo',           check: d => (d.postsCount    ?? 0) >= 1   },
  { id: 'ten_posts',        emoji: '📖', name: 'Kronikarz bitew',          check: d => (d.postsCount    ?? 0) >= 10  },
  { id: 'first_like',       emoji: '❤️', name: 'Pierwsze uznanie',         check: d => (d.likesReceived ?? 0) >= 1   },
  { id: 'ten_likes',        emoji: '🔥', name: 'Wojownik popularny',       check: d => (d.likesReceived ?? 0) >= 10  },
  { id: 'rank_warrior',     emoji: '🥈', name: 'Warrior',                  check: d => (d.points        ?? 0) >= 500 },
  { id: 'rank_champion',    emoji: '🥇', name: 'Champion',                 check: d => (d.points        ?? 0) >= 2000},
  { id: 'rank_legend',      emoji: '💎', name: 'Legend',                   check: d => (d.points        ?? 0) >= 10000},
  { id: 'golden_circle',    emoji: '🌕', name: 'Władca Złotego Kręgu',     check: d => (d.points        ?? 0) >= 1000},
  { id: 'dragon_slayer',    emoji: '🐉', name: 'Pogromca Dwugłowego Węża', check: d => (d.points        ?? 0) >= 5000},
];

function renderAchievementsPreview(data) {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const earnedSet = new Set(Array.isArray(data.achievements) ? data.achievements : []);

  ACHIEVEMENT_DEFS.forEach(ach => {
    // Odznaka odblokowana jeśli: jest w tablicy achievements LUB warunek jest spełniony
    const unlocked = earnedSet.has(ach.id) || ach.check(data);
    const chip     = document.createElement('div');
    chip.className = `achievement-item${unlocked ? '' : ' locked'}`;
    chip.title     = unlocked ? ach.name : `${ach.name} (zablokowane)`;
    chip.innerHTML = `
      <div class="achievement-icon">${unlocked ? ach.emoji : '🔒'}</div>
      <div class="achievement-name">${unlocked ? ach.name : '???'}</div>
    `;
    grid.appendChild(chip);
  });
}


// ════════════════════════════════════════════════════════════
// AVATAR UPLOAD — Cloudinary (Firebase Storage usunięty)
// ════════════════════════════════════════════════════════════

function initAvatarUpload(user) {
  const TAG        = '[initAvatarUpload]';
  const wrap       = document.getElementById('profile-avatar-wrap');
  const fileInput  = document.getElementById('avatar-file-input');
  const progressEl = document.getElementById('avatar-upload-progress');

  if (!fileInput) return;

  // Kliknięcie w avatar otwiera file picker
  wrap?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      showToast('Dozwolone formaty: JPG, PNG, WebP', 'error');
      fileInput.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Avatar może mieć max. 3 MB.', 'error');
      fileInput.value = '';
      return;
    }

    console.log(TAG, '⬆️ Upload avatara przez Cloudinary:', file.name);
    if (progressEl) { progressEl.textContent = '0%'; progressEl.classList.add('visible'); }

    try {
      const result = await uploadToCloudinary(
        file,
        `avatars/${user.uid}`,
        (pct) => {
          if (progressEl) progressEl.textContent = pct + '%';
        }
      );

      const url = result.url;
      console.log(TAG, '✅ Cloudinary URL:', url);

      // Aktualizuj Auth
      await updateProfile(user, { photoURL: url });

      // Aktualizuj Firestore
      await updateDoc(doc(db, COL.USERS, user.uid), {
        photoURL:          url,
        photoPublicId:     result.publicId,
        lastActive:        serverTimestamp(),
      });

      // Aktualizuj avatar w UI natychmiast
      const avatarEl = document.getElementById('profile-avatar-el');
      if (avatarEl) {
        avatarEl.innerHTML = '';
        const img     = document.createElement('img');
        img.src       = url;
        img.alt       = 'Avatar';
        img.className = 'avatar av-xl';
        img.onerror   = () => { avatarEl.innerHTML = ''; };
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
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, COL.USERS, user.uid), {
        displayName: newName,
        bio:         newBio,
        lastActive:  serverTimestamp(),
      });

      setText('profile-display-name', newName);
      setText('profile-bio', newBio || 'Brak opisu profilu.');

      showToast('Profil zaktualizowany! ✅', 'success');
      console.log(TAG, '✅ Profil zapisany');

      document.getElementById('edit-profile-body')?.classList.remove('open');
      document.getElementById('edit-profile-chevron')?.classList.remove('open');

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

    const currentPass = document.getElementById('current-password')?.value   ?? '';
    const newPass     = document.getElementById('new-password')?.value        ?? '';
    const confirmPass = document.getElementById('confirm-new-password')?.value ?? '';
    const saveBtn     = document.getElementById('save-password-btn');

    if (!currentPass)               { showToast('Podaj aktualne hasło.',         'error'); return; }
    if (!newPass || newPass.length < 6) { showToast('Nowe hasło min. 6 znaków.', 'error'); return; }
    if (newPass !== confirmPass)    { showToast('Nowe hasła nie są identyczne.',  'error'); return; }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.classList.add('loading'); }
    console.log(TAG, 'Zmiana hasła...');

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);

      showToast('Hasło zmienione! 🔐', 'success');
      console.log(TAG, '✅ Hasło zmienione');
      form.reset();

      document.getElementById('password-body')?.classList.remove('open');
      document.getElementById('password-chevron')?.classList.remove('open');

    } catch (err) {
      console.error(TAG, '❌', err.code, err.message);
      const msgs = {
        'auth/wrong-password':        'Aktualne hasło jest nieprawidłowe.',
        'auth/weak-password':         'Nowe hasło jest za słabe.',
        'auth/requires-recent-login': 'Zaloguj się ponownie aby zmienić hasło.',
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
