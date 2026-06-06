/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — search.js
 * Wyszukiwarka użytkowników
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * STRUKTURA FIRESTORE:
 *   usernames/{username_lowercase}
 *     uid:      string
 *     username: string
 *
 *   users/{uid} — pola używane do wyświetlania wyników:
 *     displayName, username, photoURL, rank, points, bio
 *
 * EKSPORTY:
 *   initSearchPage()           — inicjalizuje search.html
 *   searchUsers(query)         → Array<userData>
 *   lookupByUsername(username) → uid | null
 *   registerUsername(uid, username) — rejestruje nick w kolekcji
 */

import { auth, db, COL, getRank, getLevel } from './firebase.js';
import { checkAuth, logout, showToast } from './auth.js';
import { followUser, unfollowUser, isFollowing } from './social.js';
import { injectMessengerBadge } from './messenger.js';
import { initTheme, injectLightModeCSS } from './weekly-ranking.js';

import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, limit,
  startAt, endAt, setDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COL_USERNAMES = 'usernames';
const SEARCH_LIMIT  = 20;

// ── State ─────────────────────────────────────────────────────
let currentUser     = null;
let currentUserData = null;
let searchTimer     = null;


// ════════════════════════════════════════════════════════════
// INIT — search.html
// ════════════════════════════════════════════════════════════

export function initSearchPage() {
  const TAG = '[initSearchPage]';
  console.log(TAG, '🚀 Start');

  injectLightModeCSS();
  initTheme();

  checkAuth(async (user) => {
    currentUser = user;
    try {
      const snap = await getDoc(doc(db, COL.USERS, user.uid));
      currentUserData = snap.exists() ? snap.data() : { displayName: user.displayName || 'Wojownik' };
    } catch { currentUserData = { displayName: user.displayName || 'Wojownik' }; }

    injectMessengerBadge(user.uid);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    _setupSearch();

    // Pokaż sugestie (nowi wojownicy) przy pustym polu
    _loadSuggestions();
  });
}


// ════════════════════════════════════════════════════════════
// SEARCH SETUP
// ════════════════════════════════════════════════════════════

function _setupSearch() {
  const input    = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');
  const form     = document.getElementById('search-form');

  if (!input) return;

  // Focus przy załadowaniu
  setTimeout(() => input.focus(), 300);

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearBtn && (clearBtn.style.display = q ? 'flex' : 'none');

    clearTimeout(searchTimer);
    if (!q) {
      _loadSuggestions();
      return;
    }
    if (q.length < 2) return;

    // Debounce 350ms
    searchTimer = setTimeout(() => _runSearch(q), 350);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    input.focus();
    _loadSuggestions();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length >= 2) _runSearch(q);
  });
}


// ════════════════════════════════════════════════════════════
// RUN SEARCH
// ════════════════════════════════════════════════════════════

async function _runSearch(queryStr) {
  const TAG      = '[search]';
  const resultsEl = document.getElementById('search-results');
  const titleEl   = document.getElementById('results-title');
  if (!resultsEl) return;

  _showLoading(resultsEl);

  const normalized = queryStr.toLowerCase().replace(/\s+/g, '_');
  console.log(TAG, '🔍 Szukam:', normalized);

  try {
    const results = await searchUsers(normalized);
    console.log(TAG, `✅ ${results.length} wyników`);

    if (titleEl) titleEl.textContent = results.length > 0
      ? `Wyniki dla „${queryStr}" (${results.length})`
      : `Brak wyników dla „${queryStr}"`;

    _renderResults(resultsEl, results);
  } catch(err) {
    console.error(TAG, '❌', err.code, err.message);
    resultsEl.innerHTML = `
      <div class="search-empty">
        <div style="font-size:1.5rem;">⚔️</div>
        <div>Błąd wyszukiwania. Spróbuj ponownie.</div>
      </div>`;
  }
}


// ════════════════════════════════════════════════════════════
// SEARCH USERS — Firestore prefix search
// ════════════════════════════════════════════════════════════

/**
 * Prefix search po polu username (lowercase).
 * Firestore nie ma full-text — używamy range query.
 *
 * @param {string} queryStr — znormalizowany lowercase
 * @returns {Promise<Array>}
 */
export async function searchUsers(queryStr) {
  if (!queryStr || queryStr.length < 1) return [];

  const normalized = queryStr.toLowerCase().replace(/\s+/g,'_');
  const end        = normalized + '\uf8ff'; // Unicode sentinel

  try {
    // Prefix search na username
    const usersSnap = await getDocs(query(
      collection(db, COL.USERS),
      orderBy('username'),
      startAt(normalized),
      endAt(end),
      limit(SEARCH_LIMIT),
    ));

    const results = [];
    usersSnap.forEach(d => {
      if (d.id !== currentUser?.uid) {
        results.push({ uid: d.id, ...d.data() });
      }
    });

    // Jeśli mało wyników — szukaj też po displayName (osobna query)
    if (results.length < 5) {
      const nameEnd  = queryStr + '\uf8ff';
      const nameSnap = await getDocs(query(
        collection(db, COL.USERS),
        orderBy('displayName'),
        startAt(queryStr),
        endAt(nameEnd),
        limit(SEARCH_LIMIT),
      ));
      nameSnap.forEach(d => {
        if (d.id !== currentUser?.uid && !results.find(r => r.uid === d.id)) {
          results.push({ uid: d.id, ...d.data() });
        }
      });
    }

    return results.slice(0, SEARCH_LIMIT);
  } catch(e) {
    console.error('[searchUsers]', e.code, e.message);
    return [];
  }
}


// ════════════════════════════════════════════════════════════
// SUGGESTIONS — nowi wojownicy przy pustym polu
// ════════════════════════════════════════════════════════════

async function _loadSuggestions() {
  const resultsEl = document.getElementById('search-results');
  const titleEl   = document.getElementById('results-title');
  if (!resultsEl) return;

  _showLoading(resultsEl);

  try {
    // Pobierz ostatnio dołączonych wojowników
    const snap = await getDocs(query(
      collection(db, COL.USERS),
      orderBy('createdAt', 'desc'),
      limit(12),
    ));
    const users = [];
    snap.forEach(d => { if (d.id !== currentUser?.uid) users.push({ uid: d.id, ...d.data() }); });

    if (titleEl) titleEl.textContent = 'Nowi Wojownicy na Arenie';
    _renderResults(resultsEl, users);
  } catch(e) {
    console.warn('[suggestions]', e.code);
    resultsEl.innerHTML = `
      <div class="search-empty">
        <div style="font-size:2rem;margin-bottom:.5rem;">⚔️</div>
        <div>Wpisz imię wojownika aby go znaleźć</div>
      </div>`;
    if (titleEl) titleEl.textContent = 'Szukaj wojownika';
  }
}


// ════════════════════════════════════════════════════════════
// RENDER RESULTS
// ════════════════════════════════════════════════════════════

function _renderResults(container, users) {
  container.innerHTML = '';

  if (users.length === 0) {
    container.innerHTML = `
      <div class="search-empty">
        <div style="font-size:2rem;margin-bottom:.5rem;">🔍</div>
        <div style="color:var(--text-muted);">Brak wyników</div>
        <div style="font-size:.8125rem;color:var(--text-faint);margin-top:.25rem;">
          Spróbuj innego nicku lub imienia
        </div>
      </div>`;
    return;
  }

  users.forEach((user, i) => {
    const card = _buildUserCard(user, i);
    container.appendChild(card);
  });
}

function _buildUserCard(user, idx) {
  const card = document.createElement('div');
  card.className = 'search-user-card';
  card.style.animationDelay = (idx * 0.04) + 's';

  const rankObj  = getRank(user.points ?? 0);
  const level    = getLevel(user.points ?? 0);
  const ini      = (user.displayName || 'W').charAt(0).toUpperCase();
  const avatarHTML = user.photoURL
    ? `<img src="${_esc(user.photoURL)}" alt="Avatar"
          onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
       <span style="display:none;">${ini}</span>`
    : `<span>${ini}</span>`;

  card.innerHTML = `
    <div class="suc-av" id="suc-av-${user.uid}">${avatarHTML}</div>
    <div class="suc-info">
      <div class="suc-name">${_esc(user.displayName || 'Wojownik')}</div>
      <div class="suc-meta">
        <span class="suc-rank">${rankObj.emoji} ${rankObj.label}</span>
        <span class="suc-level">Poz. ${level}</span>
        ${user.bio ? `<span class="suc-bio">${_esc(user.bio.slice(0, 50))}${user.bio.length > 50 ? '…' : ''}</span>` : ''}
      </div>
    </div>
    <div class="suc-actions" id="suc-actions-${user.uid}">
      <div class="suc-follow-wrap" id="suc-follow-${user.uid}"></div>
    </div>`;

  // Kliknięcie → profil
  card.querySelector('.suc-av')?.addEventListener('click', () => {
    window.location.href = `user.html?uid=${user.uid}`;
  });
  card.querySelector('.suc-info')?.addEventListener('click', () => {
    window.location.href = `user.html?uid=${user.uid}`;
  });
  card.style.cursor = 'pointer';

  // Follow widget
  if (currentUser) {
    _injectFollowBtn(card.querySelector(`#suc-follow-${user.uid}`), user.uid);
  }

  return card;
}

async function _injectFollowBtn(container, targetUid) {
  if (!container || !currentUser || currentUser.uid === targetUid) return;

  const btn = document.createElement('button');
  btn.className = 'suc-follow-btn';

  const { following, docId } = await isFollowing(currentUser.uid, targetUid).catch(() => ({ following: false, docId: null }));
  let followDocId = docId;
  _setFollowBtnState(btn, following);

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    btn.disabled = true;
    try {
      if (followDocId) {
        await unfollowUser(currentUser.uid, targetUid);
        followDocId = null;
        _setFollowBtnState(btn, false);
      } else {
        followDocId = await followUser(currentUser.uid, targetUid,
          currentUserData?.displayName || currentUser.displayName || 'Wojownik');
        _setFollowBtnState(btn, true);
      }
    } catch(e) {
      showToast('Błąd. Spróbuj ponownie.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  container.appendChild(btn);
}

function _setFollowBtnState(btn, following) {
  btn.textContent = following ? 'Obserwujesz' : '+ Obserwuj';
  btn.className   = 'suc-follow-btn' + (following ? ' following' : '');
}


// ════════════════════════════════════════════════════════════
// LOOKUP BY USERNAME (dla @mention)
// ════════════════════════════════════════════════════════════

/**
 * Znajdź uid po nicku użytkownika.
 * Używane przez @mention click handler.
 *
 * @param {string} username — lowercase bez @
 * @returns {Promise<string|null>}
 */
export async function lookupByUsername(username) {
  if (!username) return null;
  const key = username.toLowerCase().replace(/\s+/g,'_');
  try {
    const snap = await getDoc(doc(db, COL_USERNAMES, key));
    return snap.exists() ? snap.data().uid : null;
  } catch(e) {
    console.warn('[lookupByUsername]', e.code);
    return null;
  }
}


// ════════════════════════════════════════════════════════════
// REGISTER USERNAME (wywoływane przy rejestracji/zmianie nicku)
// ════════════════════════════════════════════════════════════

/**
 * Zapisuje mapowanie username → uid w kolekcji usernames.
 * Wywołaj w auth.js ensureUserDoc po setDoc(users).
 *
 * @param {string} uid
 * @param {string} username — lowercase, bez spacji
 */
export async function registerUsername(uid, username) {
  if (!uid || !username) return;
  const key = username.toLowerCase().replace(/\s+/g,'_').slice(0, 30);
  try {
    await setDoc(doc(db, COL_USERNAMES, key), {
      uid,
      username: key,
      createdAt: serverTimestamp(),
    });
    console.log('[registerUsername] ✅', key, '→', uid);
  } catch(e) {
    console.warn('[registerUsername]', e.code, e.message);
  }
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _showLoading(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.75rem;padding:.5rem 0;">
      ${[1,2,3].map(() => `
        <div style="display:flex;align-items:center;gap:.75rem;padding:.625rem 0;">
          <div class="skeleton" style="width:44px;height:44px;border-radius:50%;flex-shrink:0;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:.375rem;">
            <div class="skeleton" style="height:13px;width:45%;border-radius:4px;"></div>
            <div class="skeleton" style="height:10px;width:30%;border-radius:4px;"></div>
          </div>
          <div class="skeleton" style="height:30px;width:80px;border-radius:9999px;"></div>
        </div>`).join('')}
    </div>`;
}

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
