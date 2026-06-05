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
  getDoc,
  collection,
  getDocs,
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

// Map expected (JS) IDs → actual IDs / selectors present in HTML.
// This provides backward-compatibility when HTML and JS IDs diverged.
const ID_MAP = {
  // profile view
  'profile-avatar-el': 'profile-avatar',
  'profile-display-name': 'profile-name',
  'profile-username': 'profile-name', // no dedicated username element — reuse name
  'profile-rank-badge': 'profile-rank-label',
  'profile-level-badge': 'profile-level',
  'profile-stat-points': 'ps-xp',
  'profile-stat-level': 'profile-level',
  'profile-stat-rank': 'profile-rank-emoji',
  'profile-xp-bar': 'profile-xp-fill',
  'profile-xp-percent': 'profile-xp-val',
  'profile-bio': null, // optional — not present in current HTML
  'profile-email-display': null,
  'profile-rank-current': null,
  'profile-rank-next': null,
  // edit form
  'edit-display-name': 'edit-name',
  'edit-bio': null,
  // avatar upload wrapper / inputs (some HTML uses classes instead of IDs)
  'profile-avatar-wrap': '.profile-avatar-wrap',
  'avatar-file-input': 'avatar-file-input', // may be missing — handled gracefully
  'avatar-upload-progress': 'avatar-upload-progress',
};

// Helper: resolve logical id → actual selector (id or class)
function resolveSelector(id) {
  const mapped = ID_MAP[id];
  if (mapped === undefined) return `#${id}`; // try original id
  if (mapped === null) return null; // intentionally missing
  if (mapped.startsWith('.')) return mapped; // class selector
  // assume id string
  return `#${mapped}`;
}

// Helper: get element by logical id, with fallback to mapped selector or original id
function getEl(id) {
  if (!id) return null;
  const sel = resolveSelector(id);
  if (!sel) return null;
  // if selector starts with '#' use getElementById for performance/consistency
  if (sel.startsWith('#')) {
    return document.getElementById(sel.slice(1));
  }
  // otherwise querySelector (class or other)
  return document.querySelector(sel);
}

function setText(id, value) {
  const el = getEl(id);
  if (el) el.textContent = value;
}

function setVal(id, value) {
  const el = getEl(id);
  if (!el) return;
  if ('value' in el) el.value = value ?? '';
  else el.textContent = value ?? '';
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
    // barEl may be a fill element (width style) or a container with inner fill.
    if ('style' in barEl) barEl.style.width = pct + '%';
    barEl.setAttribute?.('aria-valuenow', pct);
  }
  if (pctEl) {
    // pctEl in current HTML shows "0 / 500 XP" — keep behavior but also accept percent display
    pctEl.textContent = pct + '%';
  }
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

... (reszta pliku bez zmian)
