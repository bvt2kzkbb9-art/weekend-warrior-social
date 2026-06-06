/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — notifications.js
 * In-app notification system — 100% Firestore, zero cost
 * ============================================================
 *
 * Kolekcja Firestore:
 *   notifications/{uid}/items/{notifId}
 *     type, title, body, icon, url, read, createdAt
 *
 * Eksporty:
 *   initNotifications(uid)        — start real-time listener
 *   markAllRead(uid)              — mark all as read
 *   createNotification(uid, data) — create notification for user
 *   destroyNotifications()        — cleanup
 */

import { db } from './firebase.js';
import {
  collection, doc, addDoc, writeBatch,
  onSnapshot, query, where, orderBy,
  limit, serverTimestamp, updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const NOTIF_ICONS = {
  like:             '❤️',
  comment:          '💬',
  duel:             '⚔️',
  challenge:        '🐍',
  challenge_invite: '⚔️',
  follow:           '👁️',
  achievement:      '🏆',
  xp:               '⭐',
  system:           '📣',
  message:          '💬',
  poke:             '👈',
  // Laga Pajacu
  pajac_challenge:  '🍺',
  pajac_accepted:   '🔥',
  pajac_declined:   '🚫',
  pajac_completed:  '🏆',
  pajac_expired:    '⏰',
  // Social
  friend_added:     '🤝',
  share:            '↻',
};

let unsubNotifications = null;
let notifCache = [];

// ════════════════════════════════════════════════════════════
// INIT — real-time listener
// ════════════════════════════════════════════════════════════

export function initNotifications(uid) {
  if (!uid) return;
  if (unsubNotifications) { unsubNotifications(); }

  const q = query(
    collection(db, 'notifications', uid, 'items'),
    orderBy('createdAt', 'desc'),
    limit(30),
  );

  unsubNotifications = onSnapshot(q, (snap) => {
    notifCache = [];
    let unread  = 0;
    snap.forEach(d => {
      const n = { ...d.data(), id: d.id };
      notifCache.push(n);
      if (!n.read) unread++;
    });
    updateBadge(unread);
    renderNotifDropdown(uid);
  }, err => {
    // Fail silently — notifications are non-critical
    console.warn('[notifications]', err.code);
  });
}

export function destroyNotifications() {
  if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }
}

// ════════════════════════════════════════════════════════════
// BADGE — red dot on nav
// ════════════════════════════════════════════════════════════

function updateBadge(count) {
  document.querySelectorAll('.notif-badge').forEach(el => {
    if (count > 0) {
      el.textContent    = count > 9 ? '9+' : count;
      el.style.display  = 'flex';
    } else {
      el.style.display  = 'none';
    }
  });
}

// ════════════════════════════════════════════════════════════
// DROPDOWN
// ════════════════════════════════════════════════════════════

function renderNotifDropdown(uid) {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;

  const list = dropdown.querySelector('#notif-list');
  if (!list) return;

  list.innerHTML = '';

  if (notifCache.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:2rem 1rem;">
        <div style="font-size:1.75rem;margin-bottom:0.5rem;">🔔</div>
        <div style="font-size:0.875rem;color:var(--text-muted);">
          Brak powiadomień
        </div>
      </div>`;
    return;
  }

  notifCache.forEach(n => {
    const item = document.createElement('div');
    item.className = `notif-item${n.read ? '' : ' unread'}`;
    item.innerHTML = `
      <div class="notif-item-icon">${NOTIF_ICONS[n.type] ?? '📣'}</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${escHtml(n.title)}</div>
        <div class="notif-item-text">${escHtml(n.body)}</div>
        <div class="notif-item-time">${formatTime(n.createdAt)}</div>
      </div>
      ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
    `;

    if (n.url) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', async () => {
        await markRead(uid, n.id);
        window.location.href = n.url;
      });
    }

    list.appendChild(item);
  });
}

async function markRead(uid, notifId) {
  try {
    await updateDoc(
      doc(db, 'notifications', uid, 'items', notifId),
      { read: true }
    );
  } catch { /* non-critical */ }
}

export async function markAllRead(uid) {
  const unreadItems = notifCache.filter(n => !n.read);
  if (unreadItems.length === 0) return;

  const batch = writeBatch(db);
  unreadItems.forEach(n => {
    batch.update(
      doc(db, 'notifications', uid, 'items', n.id),
      { read: true }
    );
  });

  try {
    await batch.commit();
  } catch (err) {
    console.warn('[markAllRead]', err.message);
  }
}

// ════════════════════════════════════════════════════════════
// CREATE NOTIFICATION
// ════════════════════════════════════════════════════════════

/**
 * Vytvořit notifikaci pro uživatele.
 * @param {string} uid     — příjemce
 * @param {object} data    — { type, title, body, url? }
 */
export async function createNotification(uid, data) {
  if (!uid || !data) return;
  try {
    await addDoc(collection(db, 'notifications', uid, 'items'), {
      type:      data.type      || 'system',
      title:     data.title     || 'Powiadomienie',
      body:      data.body      || '',
      url:       data.url       || '',
      icon:      NOTIF_ICONS[data.type] ?? '📣',
      read:      false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[createNotification]', err.message);
  }
}

// ════════════════════════════════════════════════════════════
// INJECT BELL + DROPDOWN INTO NAV
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje dzwonek powiadomień do nawigacji.
 * Wywołaj raz po załadowaniu każdej strony z navem.
 */
export function injectNotifBell(uid) {
  if (!uid) return;
  if (document.getElementById('notif-bell')) return; // already injected

  // Inject CSS
  injectNotifStyles();

  // Find nav-actions or nav
  const navActions = document.querySelector('.nav-actions') || document.querySelector('.nav');
  if (!navActions) return;

  // Bell button
  const bell = document.createElement('div');
  bell.id    = 'notif-bell';
  bell.style.cssText = 'position:relative;display:flex;align-items:center;';
  bell.innerHTML = `
    <button class="notif-bell-btn" id="notif-bell-btn" aria-label="Powiadomienia">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.9"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span class="notif-badge" style="display:none;">0</span>
    </button>

    <!-- Dropdown -->
    <div id="notif-dropdown" class="notif-dropdown hidden">
      <div class="notif-dropdown-header">
        <span class="notif-dropdown-title">Powiadomienia</span>
        <button class="notif-mark-all-btn" id="notif-mark-all">
          Oznacz jako przeczytane
        </button>
      </div>
      <div id="notif-list" class="notif-list"></div>
    </div>
  `;

  // Insert before logout button if exists, else append
  const logoutBtn = navActions.querySelector('#logout-btn');
  if (logoutBtn) {
    navActions.insertBefore(bell, logoutBtn);
  } else {
    navActions.appendChild(bell);
  }

  // Toggle dropdown
  document.getElementById('notif-bell-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('notif-dropdown');
    dd?.classList.toggle('hidden');
    if (!dd?.classList.contains('hidden')) {
      markAllRead(uid);
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notif-bell')) {
      document.getElementById('notif-dropdown')?.classList.add('hidden');
    }
  });

  document.getElementById('notif-mark-all')?.addEventListener('click', () => {
    markAllRead(uid);
  });

  // Start listener
  initNotifications(uid);
}

// ════════════════════════════════════════════════════════════
// INJECT STYLES
// ════════════════════════════════════════════════════════════

function injectNotifStyles() {
  if (document.getElementById('notif-styles')) return;
  const style = document.createElement('style');
  style.id = 'notif-styles';
  style.textContent = `
    .notif-bell-btn {
      position:relative;background:none;border:none;
      color:var(--text-muted);cursor:pointer;padding:0.375rem;
      border-radius:var(--r-md);transition:color .2s ease;
      display:flex;align-items:center;justify-content:center;
      -webkit-tap-highlight-color:transparent;
    }
    .notif-bell-btn:hover { color:var(--text-primary); }
    .notif-bell-btn svg { width:20px;height:20px;display:block; }

    .notif-badge {
      position:absolute;top:-4px;right:-4px;
      min-width:17px;height:17px;border-radius:9999px;
      background:#EF4444;color:#fff;
      font-size:0.5625rem;font-weight:800;
      display:flex;align-items:center;justify-content:center;
      border:2px solid var(--bg-base);
      line-height:1;
      animation:notifPop .3s cubic-bezier(.34,1.56,.64,1) both;
    }

    @keyframes notifPop {
      from { transform:scale(0); }
      to   { transform:scale(1); }
    }

    .notif-dropdown {
      position:fixed;
      bottom:calc(56px + env(safe-area-inset-bottom) + 8px);
      right:.75rem;
      width:min(320px, calc(100vw - 1.5rem));
      max-height:min(420px, calc(100vh - 120px));
      background:var(--bg-card);
      border:1px solid var(--border-mid);
      border-radius:var(--r-xl);
      box-shadow:0 -4px 40px rgba(0,0,0,.75);
      z-index:200;
      overflow:hidden;
      animation:slideUp .25s ease both;
    }

    .notif-dropdown.hidden { display:none; }

    .notif-dropdown-header {
      display:flex;align-items:center;justify-content:space-between;
      padding:.875rem 1rem;border-bottom:1px solid var(--border);
    }

    .notif-dropdown-title {
      font-family:var(--font-hd);font-size:.9375rem;font-weight:700;
      color:var(--text-primary);letter-spacing:.02em;
    }

    .notif-mark-all-btn {
      font-size:.75rem;color:var(--gold);font-weight:500;
      background:none;border:none;cursor:pointer;padding:0;
      font-family:var(--font);transition:opacity .2s ease;
    }

    .notif-mark-all-btn:hover { opacity:.75; }

    .notif-list {
      overflow-y:auto;max-height:360px;
    }

    .notif-item {
      display:flex;align-items:flex-start;gap:.75rem;
      padding:.875rem 1rem;border-bottom:1px solid var(--border);
      transition:background .15s ease;position:relative;
    }

    .notif-item:last-child { border-bottom:none; }
    .notif-item:hover { background:var(--bg-elevated); }
    .notif-item.unread { background:rgba(212,175,55,.04); }

    .notif-item-icon {
      font-size:1.25rem;flex-shrink:0;
      width:36px;height:36px;border-radius:50%;
      background:var(--bg-elevated);
      display:flex;align-items:center;justify-content:center;
    }

    .notif-item-body { flex:1;min-width:0; }

    .notif-item-title {
      font-size:.875rem;font-weight:600;
      color:var(--text-primary);line-height:1.3;margin-bottom:.125rem;
    }

    .notif-item-text {
      font-size:.8125rem;color:var(--text-secondary);
      line-height:1.45;display:-webkit-box;
      -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
    }

    .notif-item-time {
      font-size:.6875rem;color:var(--text-muted);margin-top:.25rem;
    }

    .notif-unread-dot {
      width:8px;height:8px;border-radius:50%;
      background:var(--gold);flex-shrink:0;margin-top:.25rem;
    }
  `;
  document.head.appendChild(style);
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function escHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(ts) {
  if (!ts) return '';
  const date = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds*1000) : new Date(ts));
  if (isNaN(date)) return '';
  const diff = Date.now() - date;
  const m = Math.floor(diff/60000);
  const h = Math.floor(m/60);
  const d = Math.floor(h/24);
  if (m < 1)  return 'przed chwilą';
  if (m < 60) return `${m} min. temu`;
  if (h < 24) return `${h} godz. temu`;
  return `${d} dni temu`;
}
