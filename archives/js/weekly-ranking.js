/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — weekly-ranking.js
 * Ranking tygodniowy + System odznak
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * STRUKTURA FIRESTORE:
 *   weeklyScores/{weekId}/scores/{uid}
 *     uid, displayName, photoURL, xpThisWeek, rank, weekId
 *
 *   weekId = "2025-W23"  (rok-numer tygodnia ISO)
 *
 * System odznak (oddzielny od osiągnięć):
 *   Gaduła       — 50 komentarzy
 *   Streamer     — link YouTube/SoundCloud w poście
 *   Lagowy Lord  — 10 zaczepień wysłanych
 *   Kronikarz    — 20 postów
 *   Rozpalacz    — 5 postów z reakcją 🔥
 *
 * EKSPORTY:
 *   recordWeeklyXP(uid, xpAmount)          — zapisuje XP tygodniowy
 *   getWeeklyRanking()                     → array posortowany
 *   checkAndAwardBadges(uid, userData)     — sprawdza i przyznaje odznaki
 *   renderWeeklyRankingWidget(containerEl) — wstrzykuje widget
 */

import { db, COL, getRank, getLevel } from './firebase.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, limit, where, increment, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COL_WEEKLY = 'weeklyScores';


// ════════════════════════════════════════════════════════════
// WEEK ID
// ════════════════════════════════════════════════════════════

/**
 * Generuje ISO week string: "2025-W23"
 */
export function getWeekId(date = new Date()) {
  const d    = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}


// ════════════════════════════════════════════════════════════
// RECORD WEEKLY XP
// ════════════════════════════════════════════════════════════

/**
 * Dodaje xpAmount do tygodniowego wyniku użytkownika.
 * Wywołaj równolegle z awardXP().
 */
export async function recordWeeklyXP(uid, xpAmount, displayName = '', photoURL = '') {
  if (!uid || !xpAmount) return;
  const weekId = getWeekId();
  const ref    = doc(db, COL_WEEKLY, weekId, 'scores', uid);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        xpThisWeek: increment(xpAmount),
        displayName: displayName || snap.data().displayName,
        photoURL:    photoURL    || snap.data().photoURL,
        updatedAt:   serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid, displayName, photoURL,
        xpThisWeek: xpAmount,
        weekId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch(e) { console.warn('[recordWeeklyXP]', e.code); }
}


// ════════════════════════════════════════════════════════════
// GET WEEKLY RANKING
// ════════════════════════════════════════════════════════════

/**
 * Pobiera TOP 20 rankingu tygodniowego.
 * @param {string} [weekId]  — opcjonalnie podaj konkretny tydzień
 * @returns {Promise<Array>}
 */
export async function getWeeklyRanking(weekId = null) {
  const wid = weekId || getWeekId();
  try {
    const snap = await getDocs(query(
      collection(db, COL_WEEKLY, wid, 'scores'),
      orderBy('xpThisWeek', 'desc'),
      limit(20),
    ));
    return snap.docs.map((d, i) => ({ ...d.data(), position: i + 1 }));
  } catch(e) {
    console.warn('[getWeeklyRanking]', e.code);
    return [];
  }
}


// ════════════════════════════════════════════════════════════
// SYSTEM ODZNAK
// ════════════════════════════════════════════════════════════

export const BADGES = [
  {
    id:    'gaduła',
    emoji: '🗣️',
    name:  'Gaduła',
    desc:  'Dodaj 50 komentarzy',
    check: (d) => (d.commentsCount ?? 0) >= 50,
  },
  {
    id:    'kronikarz',
    emoji: '📜',
    name:  'Kronikarz',
    desc:  'Opublikuj 20 postów',
    check: (d) => (d.postsCount ?? 0) >= 20,
  },
  {
    id:    'lagowy_lord',
    emoji: '👈',
    name:  'Lagowy Lord',
    desc:  'Wyślij 10 zaczepień',
    check: (d) => (d.pokeSentCount ?? 0) >= 10,
  },
  {
    id:    'streamer',
    emoji: '🎬',
    name:  'Streamer',
    desc:  'Dodaj link YouTube lub SoundCloud w poście',
    check: (d) => (d.embedPostCount ?? 0) >= 1,
  },
  {
    id:    'rozpalacz',
    emoji: '🔥',
    name:  'Rozpalacz',
    desc:  'Zbierz 25 lajków na jednym poście',
    check: (d) => (d.maxLikesOnPost ?? 0) >= 25,
  },
  {
    id:    'wojownik_tygodnia',
    emoji: '🏆',
    name:  'Wojownik Tygodnia',
    desc:  'Zajmij 1. miejsce w rankingu tygodniowym',
    check: (d) => (d.weeklyWins ?? 0) >= 1,
  },
];

/**
 * Sprawdza i przyznaje nowe odznaki.
 * Wywołaj po każdej akcji która może zmienić statystyki.
 */
export async function checkAndAwardBadges(uid, userData) {
  if (!uid || !userData) return;
  const existing = new Set(userData.badges || []);
  const newBadges = BADGES.filter(b => !existing.has(b.id) && b.check(userData));

  if (newBadges.length === 0) return;

  try {
    const badges = [...existing, ...newBadges.map(b => b.id)];
    await updateDoc(doc(db, COL.USERS, uid), { badges });

    // Powiadomienia + animacje
    newBadges.forEach((badge, i) => {
      setTimeout(() => {
        _showBadgeAnimation(badge);
        createNotification(uid, {
          type:  'achievement',
          title: `Odznaka: ${badge.name} ${badge.emoji}`,
          body:  badge.desc,
          url:   'achievements.html',
        }).catch(() => {});
      }, i * 1500);
    });

  } catch(e) { console.warn('[checkAndAwardBadges]', e.code); }
}

function _showBadgeAnimation(badge) {
  // Usuń poprzednią
  document.getElementById('badge-toast')?.remove();
  const el = document.createElement('div');
  el.id = 'badge-toast';
  el.style.cssText = `
    position:fixed;bottom:calc(72px + env(safe-area-inset-bottom,0));left:50%;
    transform:translateX(-50%);
    background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.1));
    border:1px solid rgba(212,175,55,.4);
    border-radius:9999px;
    padding:.5rem 1.25rem;
    display:flex;align-items:center;gap:.625rem;
    font-family:var(--font-hd,'Rajdhani',sans-serif);
    font-size:.875rem;font-weight:700;color:var(--gold,#D4AF37);
    z-index:9996;
    animation:toast-slide-up .35s ease both;
    white-space:nowrap;
    box-shadow:0 8px 32px rgba(0,0,0,.5);
  `;
  el.innerHTML = `${badge.emoji} <span>Odznaka: ${badge.name}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}


// ════════════════════════════════════════════════════════════
// WEEKLY RANKING WIDGET (do wstrzyknięcia na index/ranking)
// ════════════════════════════════════════════════════════════

/**
 * Renderuje widget Top 5 rankingu tygodniowego.
 * @param {HTMLElement} containerEl
 */
export async function renderWeeklyRankingWidget(containerEl) {
  if (!containerEl) return;

  const weekId  = getWeekId();
  const ranking = await getWeeklyRanking(weekId);

  containerEl.innerHTML = `
    <div class="weekly-widget">
      <div class="weekly-widget-header">
        <span class="weekly-widget-title">🏆 Ranking Tygodnia</span>
        <span class="weekly-widget-week">${_formatWeekId(weekId)}</span>
      </div>
      <div class="weekly-widget-list" id="weekly-list">
        ${ranking.length === 0
          ? '<div style="text-align:center;padding:1rem;font-size:.875rem;color:var(--text-muted);">Brak danych. Zdobądź XP!</div>'
          : ranking.slice(0, 5).map((u, i) => _buildWeeklyRow(u, i)).join('')
        }
      </div>
      <a href="ranking.html" class="weekly-widget-more">
        Zobacz pełny ranking →
      </a>
    </div>`;

  _injectWeeklyStyles();
}

function _buildWeeklyRow(user, index) {
  const medals = ['🥇','🥈','🥉','4.','5.'];
  const ini    = (user.displayName || 'W').charAt(0).toUpperCase();
  return `
    <div class="weekly-row">
      <span class="weekly-pos">${medals[index] || (index + 1) + '.'}</span>
      <div class="weekly-av">
        ${user.photoURL
          ? `<img src="${_esc(user.photoURL)}" alt="Avatar" onerror="this.style.display='none'"/>`
          : `<span>${ini}</span>`}
      </div>
      <span class="weekly-name">${_esc(user.displayName || 'Wojownik')}</span>
      <span class="weekly-xp">${(user.xpThisWeek || 0).toLocaleString('pl-PL')} XP</span>
    </div>`;
}

function _formatWeekId(weekId) {
  // "2025-W23" → "Tydzień 23"
  const m = weekId.match(/W(\d+)/);
  return m ? `Tydzień ${parseInt(m[1], 10)}` : weekId;
}

function _injectWeeklyStyles() {
  if (document.getElementById('weekly-styles')) return;
  const s = document.createElement('style');
  s.id = 'weekly-styles';
  s.textContent = `
    .weekly-widget {
      background: var(--bg-card, #121317);
      border: 1px solid var(--border-mid, rgba(255,255,255,.11));
      border-radius: var(--r-lg, 16px);
      overflow: hidden;
    }
    .weekly-widget-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1rem;
      border-bottom: 1px solid var(--border, rgba(255,255,255,.07));
    }
    .weekly-widget-title {
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-size: .9375rem; font-weight: 700; letter-spacing: .04em;
      color: var(--gold, #D4AF37);
    }
    .weekly-widget-week {
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-size: .6875rem; color: var(--text-muted, #4E5464);
      letter-spacing: .08em; text-transform: uppercase;
    }
    .weekly-widget-list { padding: .5rem 0; }
    .weekly-row {
      display: flex; align-items: center; gap: .625rem;
      padding: .5rem 1rem;
      transition: background .15s ease;
    }
    .weekly-row:hover { background: var(--bg-elevated, #1A1C22); }
    .weekly-pos {
      width: 1.5rem; text-align: center;
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-size: .875rem; font-weight: 700;
    }
    .weekly-av {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: var(--bg-elevated, #1A1C22);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-size: .75rem; font-weight: 700; color: var(--gold, #D4AF37);
      overflow: hidden;
    }
    .weekly-av img { width: 100%; height: 100%; object-fit: cover; }
    .weekly-name {
      flex: 1; font-size: .875rem; color: var(--text-primary, #fff);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .weekly-xp {
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-size: .75rem; font-weight: 700; color: var(--gold, #D4AF37);
      white-space: nowrap;
    }
    .weekly-widget-more {
      display: block; text-align: center; padding: .625rem 1rem;
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-size: .75rem; letter-spacing: .08em;
      color: var(--text-muted, #4E5464); text-decoration: none;
      border-top: 1px solid var(--border, rgba(255,255,255,.07));
      transition: color .15s ease;
    }
    .weekly-widget-more:hover { color: var(--gold, #D4AF37); }
  `;
  document.head.appendChild(s);
}


// ════════════════════════════════════════════════════════════
// DARK / LIGHT MODE TOGGLE
// ════════════════════════════════════════════════════════════

/**
 * Przełącza tryb ciemny/jasny.
 * Zapisuje preferencję w localStorage.
 * Wywołaj z przycisku w UI.
 */
export function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('wws_theme', isDark ? 'light' : 'dark');
  return !isDark;
}

/**
 * Wczytuje zapisaną preferencję przy starcie.
 * Wywołaj w każdej stronie: initTheme()
 */
export function initTheme() {
  const saved = localStorage.getItem('wws_theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light-mode');
  }
}

// CSS dla light mode — wstrzykuj tylko jeśli jeszcze nie ma
export function injectLightModeCSS() {
  if (document.getElementById('light-mode-css')) return;
  const s = document.createElement('style');
  s.id = 'light-mode-css';
  s.textContent = `
    .light-mode {
      --bg-base:      #F4F4F6;
      --bg-card:      #FFFFFF;
      --bg-elevated:  #EEEEEF;
      --bg-input:     #EEEEEF;
      --bg-hover:     #E5E5E8;
      --bg-nav:       rgba(255,255,255,0.97);
      --text-primary: #111113;
      --text-muted:   #666672;
      --border:       rgba(0,0,0,0.09);
      --border-mid:   rgba(0,0,0,0.12);
    }
    .light-mode .bg-orbs { opacity: .08; }
    .light-mode .particles { opacity: .2; }
  `;
  document.head.appendChild(s);
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
