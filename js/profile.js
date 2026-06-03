/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — profile.js
 * Firebase SDK 10.12.2 | ES Modules | GitHub Pages Ready
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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

export function renderAvatar(el, user, data) {
  if (!el) return;

  const photoURL = user?.photoURL || data?.photoURL || '';
  const name     = data?.displayName || user?.displayName || 'W';
  const initials = name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

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
  if (pctEl) {
    pctEl.textContent = pct + '%';
  }
}


// ════════════════════════════════════════════════════════════
// DASHBOARD — index.html
// ════════════════════════════════════════════════════════════

export function initDashboard() {
  const TAG = '[initDashboard]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    console.log(TAG, '✅ User:', user.uid, user.email);

    let data;
    try {
      // getCurrentUserData nigdy nie rzuca — zawsze zwraca coś
      data = await getCurrentUserData(user.uid, user);
    } catch (err) {
      console.error(TAG, '❌ Nieoczekiwany błąd:', err);
      data = null;
    }

    if (!data) {
      console.warn(TAG, '⚠️ data null — ostatnia próba z Auth');
      data = {
        uid:         user.uid,
        displayName: user.displayName || 'Wojownik',
        email:       user.email       || '',
        photoURL:    user.photoURL    || '',
        points:      0,
        level:       1,
        rank:        'Rookie',
      };
    }

    if (data._fallback) {
      console.warn(TAG, '⚠️ Używam danych fallback — Firestore niedostępny');
      showToast('Dane profilowe z Firestore niedostępne. Sprawdź reguły bezpieczeństwa.', 'info', 6000);
    }

    console.log(TAG, '📊 Renderuję dla:', data.displayName);
    renderDashboard(user, data);
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('logout-mobile')?.addEventListener('click', logout);
}

function renderDashboard(user, data) {
  const TAG = '[renderDashboard]';

  const points   = Number(data.points) || 0;
  const level    = getLevel(points);
  const rankObj  = getRank(points);
  const progress = getRankProgress(points);
  const rankIdx  = RANKS.findIndex(r => r.id === rankObj.id);
  const nextRank = RANKS[rankIdx + 1] ?? null;

  console.log(TAG, { points, level, rank: rankObj.id, progress });

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

  renderXpBar(
    document.getElementById('xp-bar'),
    document.getElementById('xp-percent'),
    points,
  );

  setText('rank-current-label',
    `${rankObj.emoji} ${rankObj.label} (${rankObj.min.toLocaleString('pl-PL')} pkt)`);
  setText('rank-next-label',
    nextRank
      ? `${nextRank.emoji} ${nextRank.label} (${nextRank.min.toLocaleString('pl-PL')} pkt)`
      : '🏅 Maks. ranga!');

  document.getElementById('skeleton')?.classList.add('hidden');
  document.getElementById('dashboard')?.classList.remove('hidden');

  console.log(TAG, '✅ Dashboard wyrenderowany');
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
      console.error(TAG, '❌ Błąd pobierania:', err);
      data = null;
    }

    if (!data) {
      data = {
        uid:         user.uid,
        displayName: user.displayName || 'Wojownik',
        email:       user.email       || '',
        photoURL:    user.photoURL    || '',
        points:      0,
        level:       1,
        rank:        'Rookie',
        bio:         '',
        username:    '',
      };
    }

    renderProfilePage(user, data);
    initProfileEditForm(user, data);

    // Aktualizuj lastActive — nie krytyczne
    updateDoc(doc(db, COL.USERS, user.uid), { lastActive: serverTimestamp() })
      .catch(() => {});
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

function renderProfilePage(user, data) {
  const TAG = '[renderProfilePage]';

  const points   = Number(data.points) || 0;
  const level    = getLevel(points);
  const rankObj  = getRank(points);
  const progress = getRankProgress(points);
  const rankIdx  = RANKS.findIndex(r => r.id === rankObj.id);
  const nextRank = RANKS[rankIdx + 1] ?? null;

  console.log(TAG, { points, level, rank: rankObj.id });

  renderAvatar(document.getElementById('profile-avatar'), user, data);

  setText('profile-name',     data.displayName || 'Wojownik');
  setText('profile-username', '@' + (data.username || 'wojownik'));
  setText('profile-bio',      data.bio          || 'Brak opisu profilu.');
  setText('profile-email',    data.email        || user.email || '');
  setText('profile-points',   points.toLocaleString('pl-PL'));
  setText('profile-level',    String(level));

  const rankEl = document.getElementById('profile-rank');
  if (rankEl) {
    rankEl.textContent = `${rankObj.emoji} ${rankObj.label}`;
    rankEl.className   = 'badge badge-gold';
  }

  const nameInput = document.getElementById('edit-name');
  const bioInput  = document.getElementById('edit-bio');
  if (nameInput) nameInput.value = data.displayName || '';
  if (bioInput)  bioInput.value  = data.bio          || '';

  renderXpBar(
    document.getElementById('profile-xp-bar'),
    document.getElementById('profile-xp-percent'),
    points,
  );

  setText('profile-rank-current', `${rankObj.emoji} ${rankObj.label}`);
  setText('profile-rank-next',
    nextRank ? `${nextRank.emoji} ${nextRank.label}` : '🏅 Max!');

  document.getElementById('profile-skeleton')?.classList.add('hidden');
  document.getElementById('profile-content')?.classList.remove('hidden');

  console.log(TAG, '✅ Profil wyrenderowany');
}

function initProfileEditForm(user, data) {
  const TAG  = '[initProfileEditForm]';
  const form = document.getElementById('edit-profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('edit-name');
    const bioInput  = document.getElementById('edit-bio');
    const saveBtn   = document.getElementById('save-profile-btn');

    const newName = nameInput?.value.trim() ?? '';
    const newBio  = bioInput?.value.trim()  ?? '';

    if (!newName || newName.length < 2) {
      showToast('Imię/pseudonim musi mieć min. 2 znaki.', 'error');
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    console.log(TAG, 'Zapisuję:', { newName, newBio });

    try {
      await updateProfile(user, { displayName: newName });

      await updateDoc(doc(db, COL.USERS, user.uid), {
        displayName: newName,
        bio:         newBio,
        lastActive:  serverTimestamp(),
      });

      setText('profile-name', newName);
      setText('profile-bio',  newBio || 'Brak opisu profilu.');

      showToast('Profil zapisany! ✅', 'success');
      console.log(TAG, '✅ Profil zaktualizowany');

    } catch (err) {
      console.error(TAG, '❌', err.code, err.message);
      showToast(
        err.code === 'permission-denied'
          ? 'Brak uprawnień. Sprawdź reguły Firestore.'
          : 'Błąd zapisu. Spróbuj ponownie.',
        'error',
      );
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  });
}
