/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — ranking.js
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Eksporty:
 *   initRanking()  — inicjalizuje stronę ranking.html
 *
 * Tryby rankingu:
 *   all     — wszystkie czasy (sortowanie po points)
 *   monthly — ten miesiąc  (sortowanie po points, filtr createdAt)
 *   weekly  — ten tydzień  (sortowanie po points, filtr createdAt)
 *
 * Architektura:
 *   - Pobiera max 50 użytkowników z Firestore
 *   - Filtrowanie tygodniowe/miesięczne po stronie klienta
 *     (Firestore nie obsługuje compound sort bez indeksu)
 *   - Podium TOP 3 z animacją korony
 *   - Wyróżnienie zalogowanego użytkownika
 *   - Wyświetla pozycję użytkownika nawet gdy poza TOP 50
 */

import {
  auth, db, COL, getRank, getLevel,
} from './firebase.js';

import {
  checkAuth, logout, getCurrentUserData, showToast,
} from './auth.js';
import { makeAvatarsClickable } from './social.js';

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ── State ────────────────────────────────────────────────────
let currentUser     = null;
let currentUserData = null;
let allUsers        = [];       // Cache wszystkich pobranych users
let activeTab       = 'all';   // 'all' | 'monthly' | 'weekly'


// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initRanking() {
  const TAG = '[initRanking]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    currentUser = user;
    console.log(TAG, '✅ User:', user.uid);

    // Pobierz własne dane
    try {
      currentUserData = await getCurrentUserData(user.uid, user);
    } catch {
      currentUserData = null;
    }

    if (!currentUserData) {
      currentUserData = {
        uid:         user.uid,
        displayName: user.displayName || 'Wojownik',
        photoURL:    user.photoURL    || '',
        points:      0,
        level:       1,
        rank:        'Rookie',
      };
    }

    // Setup tabs
    setupTabs();

    // Pobierz i wyrenderuj ranking
    await loadAndRender();

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', logout);
  });
}


// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;

      activeTab = tab;

      // Update active class
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update subtitle
      updateSubtitle();

      // Re-render z cache
      renderRanking(filterUsers(allUsers, activeTab));
    });
  });
}

function updateSubtitle() {
  const el = document.getElementById('ranking-subtitle');
  if (!el) return;
  const labels = {
    all:     'Wszechczasy — wszyscy wojownicy',
    monthly: 'Ten miesiąc — aktywni gracze',
    weekly:  'Ten tydzień — najnowsi',
  };
  el.textContent = labels[activeTab] ?? '';
}


// ════════════════════════════════════════════════════════════
// LOAD DATA
// ════════════════════════════════════════════════════════════

async function loadAndRender() {
  const TAG = '[loadAndRender]';

  showSkeleton();

  try {
    console.log(TAG, '🔍 Pobieranie użytkowników...');

    const q = query(
      collection(db, COL.USERS),
      orderBy('points', 'desc'),
      limit(100),
    );

    const snap = await getDocs(q);
    console.log(TAG, `✅ Pobrano ${snap.size} użytkowników`);

    allUsers = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      // Upewnij się że mamy uid w danych
      allUsers.push({ ...data, uid: docSnap.id });
    });

    // Upewnij się że zalogowany user jest na liście
    ensureCurrentUserInList();

    hideSkeleton();
    updateSubtitle();
    renderRanking(filterUsers(allUsers, activeTab));

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    hideSkeleton();

    if (err.code === 'permission-denied') {
      showToast('Brak dostępu. Sprawdź reguły Firestore.', 'error');
    } else if (err.code === 'failed-precondition') {
      // Brak indeksu Firestore
      console.warn(TAG, '⚠️ Brak indeksu Firestore dla points. Używam fallback.');
      await loadFallback();
    } else {
      showToast('Błąd ładowania rankingu.', 'error');
      showError();
    }
  }
}

// Fallback gdy brak indeksu — pobierz bez sortowania i posortuj w JS
async function loadFallback() {
  const TAG = '[loadFallback]';
  console.log(TAG, 'Używam fallback (sort po stronie klienta)');

  try {
    const snap = await getDocs(collection(db, COL.USERS));

    allUsers = [];
    snap.forEach(docSnap => {
      allUsers.push({ ...docSnap.data(), uid: docSnap.id });
    });

    // Sortuj po stronie klienta
    allUsers.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

    ensureCurrentUserInList();
    hideSkeleton();
    updateSubtitle();
    renderRanking(filterUsers(allUsers, activeTab));

    console.log(TAG, `✅ Fallback OK — ${allUsers.length} użytkowników`);

  } catch (err) {
    console.error(TAG, '❌', err);
    showError();
  }
}

// Dodaj zalogowanego użytkownika do listy jeśli go nie ma
function ensureCurrentUserInList() {
  if (!currentUser || !currentUserData) return;
  const exists = allUsers.some(u => u.uid === currentUser.uid);
  if (!exists) {
    allUsers.push({ ...currentUserData, uid: currentUser.uid });
    // Re-sort
    allUsers.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    console.log('[ensureCurrentUserInList] Dodano bieżącego użytkownika do listy');
  }
}


// ════════════════════════════════════════════════════════════
// FILTER
// ════════════════════════════════════════════════════════════

function filterUsers(users, tab) {
  if (tab === 'all') return users;

  const now   = new Date();
  let cutoff;

  if (tab === 'weekly') {
    cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);
  } else if (tab === 'monthly') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Filtr po createdAt — pokaż użytkowników zarejestrowanych w tym okresie
  // Użytkownicy bez createdAt (fallback) są zawsze wyświetlani
  return users.filter(u => {
    if (!u.createdAt) return true;
    const created = u.createdAt?.toDate?.() ?? new Date(u.createdAt?.seconds * 1000);
    return created >= cutoff;
  });
}


// ════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════

function renderRanking(users) {
  const TAG = '[renderRanking]';
  console.log(TAG, `Renderuję ${users.length} użytkowników`);

  // Znajdź pozycję zalogowanego
  const myPosition = users.findIndex(u => u.uid === currentUser?.uid) + 1;
  renderMyPosition(myPosition, users.length, users);

  // Podium TOP 3
  renderPodium(users.slice(0, 3));

  // Lista od 4. miejsca
  renderList(users, myPosition);
}

// ── Moja pozycja ─────────────────────────────────────────────
function renderMyPosition(pos, total, users) {
  const card = document.getElementById('my-position-card');
  if (!card) return;

  if (pos === 0 || !currentUser) {
    card.style.display = 'none';
    return;
  }

  card.style.display = '';

  const userData  = users[pos - 1] ?? currentUserData;
  const points    = Number(userData?.points) ?? 0;
  const rankObj   = getRank(points);
  const posEl     = document.getElementById('my-pos-number');
  const nameEl    = document.getElementById('my-pos-name');
  const subEl     = document.getElementById('my-pos-sub');

  if (posEl) posEl.textContent = '#' + pos;
  if (nameEl) nameEl.textContent = userData?.displayName || 'Wojownik';
  if (subEl) subEl.textContent =
    `${rankObj.emoji} ${rankObj.label} · ${points.toLocaleString('pl-PL')} pkt · ${total} graczy`;
}

// ── Podium ───────────────────────────────────────────────────
function renderPodium(top3) {
  const podiumEl = document.getElementById('podium');
  if (!podiumEl) return;

  if (top3.length === 0) {
    podiumEl.style.display = 'none';
    return;
  }

  podiumEl.style.display = '';

  const slots = [
    { id: 'podium-1st', data: top3[0], pos: 1, label: '🥇', cls: 'first',  crown: '👑' },
    { id: 'podium-2nd', data: top3[1], pos: 2, label: '🥈', cls: 'second', crown: null },
    { id: 'podium-3rd', data: top3[2], pos: 3, label: '🥉', cls: 'third',  crown: null },
  ];

  slots.forEach(({ id, data, pos, label, cls, crown }) => {
    const el = document.getElementById(id);
    if (!el || !data) {
      document.getElementById(id)?.style && (document.getElementById(id).style.display = 'none');
      return;
    }

    const isMe     = data.uid === currentUser?.uid;
    const points   = Number(data.points) || 0;
    const rankObj  = getRank(points);
    const initials = (data.displayName || 'W')
      .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

    const avatarHTML = data.photoURL
      ? `<img src="${escHtml(data.photoURL)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.textContent='${escHtml(initials)}'">`
      : escHtml(initials);

    el.innerHTML = `
      <div class="podium-avatar-wrap">
        ${crown ? `<div class="podium-crown">${crown}</div>` : ''}
        <div class="podium-avatar${isMe ? ' avatar-ring' : ''}">${avatarHTML}</div>
        <div class="podium-name${isMe ? ' is-me' : ''}">${escHtml(data.displayName || 'Wojownik')}${isMe ? ' 👈' : ''}</div>
        <div class="podium-points">${points.toLocaleString('pl-PL')} pkt</div>
      </div>
      <div class="podium-block">${label}</div>
    `;
  });
}

// ── Lista rankingowa ─────────────────────────────────────────
function renderList(users, myPosition) {
  const listEl = document.getElementById('ranking-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (users.length === 0) {
    listEl.innerHTML = `
      <div class="ranking-empty">
        <div class="ranking-empty-icon">🏜️</div>
        <p>Brak graczy w tym okresie</p>
      </div>`;
    return;
  }

  // Renderuj wszystkich (lub od 4. miejsca jeśli jest podium)
  const startFrom = users.length >= 3 ? 3 : 0;

  users.slice(startFrom).forEach((userData, idx) => {
    const pos    = startFrom + idx + 1;
    const isMe   = userData.uid === currentUser?.uid;
    const points = Number(userData.points) || 0;
    const level  = getLevel(points);
    const rankObj= getRank(points);

    const initials = (userData.displayName || 'W')
      .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

    const avatarHTML = userData.photoURL
      ? `<img src="${escHtml(userData.photoURL)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.textContent='${escHtml(initials)}'">`
      : escHtml(initials);

    const posClass  = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';

    const row = document.createElement('div');
    row.className = `ranking-row${isMe ? ' is-me' : ''}`;
    row.style.animationDelay = (idx * 0.03) + 's';

    row.innerHTML = `
      <div class="ranking-pos ${posClass}">${pos}</div>
      <div class="ranking-user">
        <div class="ranking-avatar" data-user-uid="${userData.uid}" style="cursor:pointer;">${avatarHTML}</div>
        <div class="ranking-user-info">
          <div class="ranking-name${isMe ? ' is-me' : ''}">${escHtml(userData.displayName || 'Wojownik')}</div>
          <div class="ranking-rank-badge">${rankObj.emoji} ${rankObj.label}</div>
        </div>
      </div>
      <div class="ranking-pts">${points.toLocaleString('pl-PL')}</div>
      <div class="ranking-lvl">Lvl ${level}</div>
    `;

    listEl.appendChild(row);
  });

  // Make avatars clickable
  makeAvatarsClickable(listEl);

  // Jeśli user jest poza TOP i lista ma >= 3 pozycje — dodaj separator + jego pozycję
  if (myPosition > users.length && myPosition > 0) {
    const sep = document.createElement('div');
    sep.style.cssText = `
      text-align:center;
      padding:0.5rem;
      font-size:0.75rem;
      color:var(--text-muted);
      border-bottom:1px solid var(--border);
    `;
    sep.textContent = '· · ·';
    listEl.appendChild(sep);
  }
}


// ════════════════════════════════════════════════════════════
// SKELETON & ERROR
// ════════════════════════════════════════════════════════════

function showSkeleton() {
  document.getElementById('ranking-skeleton')?.classList.remove('hidden');
  document.getElementById('ranking-content')?.classList.add('hidden');
}

function hideSkeleton() {
  document.getElementById('ranking-skeleton')?.classList.add('hidden');
  document.getElementById('ranking-content')?.classList.remove('hidden');
}

function showError() {
  const listEl = document.getElementById('ranking-list');
  if (listEl) {
    listEl.innerHTML = `
      <div class="ranking-empty">
        <div class="ranking-empty-icon">⚠️</div>
        <p style="color:var(--error)">Błąd ładowania rankingu.<br>Odśwież stronę.</p>
      </div>`;
  }
  hideSkeleton();
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
