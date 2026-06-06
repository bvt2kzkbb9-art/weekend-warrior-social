/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — achievements.js
 * System osiągnięć / odznak
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Eksporty:
 *   initAchievementsPage()           — inicjalizuje achievements.html
 *   checkAndUnlockAchievements(uid, userData) — sprawdza i odblokowuje
 *   ACHIEVEMENTS                     — definicje wszystkich osiągnięć
 */

import { auth, db, COL } from './firebase.js';
import { checkAuth, logout, getCurrentUserData, showToast } from './auth.js';

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// DEFINICJE OSIĄGNIĘĆ
// ════════════════════════════════════════════════════════════

export const ACHIEVEMENTS = [

  // ── Posty ─────────────────────────────────────────────────
  {
    id:       'first_post',
    category: 'Aktywność',
    emoji:    '📝',
    name:     'Pierwsze słowo',
    desc:     'Opublikuj swój pierwszy post na arenie.',
    secret:   false,
    check:    (d) => (d.postsCount ?? 0) >= 1,
  },
  {
    id:       'five_posts',
    category: 'Aktywność',
    emoji:    '✍️',
    name:     'Narrator areny',
    desc:     'Opublikuj 5 postów.',
    secret:   false,
    check:    (d) => (d.postsCount ?? 0) >= 5,
  },
  {
    id:       'ten_posts',
    category: 'Aktywność',
    emoji:    '📖',
    name:     'Kronikarz bitew',
    desc:     'Opublikuj 10 postów.',
    secret:   false,
    check:    (d) => (d.postsCount ?? 0) >= 10,
  },
  {
    id:       'fifty_posts',
    category: 'Aktywność',
    emoji:    '🗡️',
    name:     'Głos Areny',
    desc:     'Opublikuj 50 postów.',
    secret:   false,
    check:    (d) => (d.postsCount ?? 0) >= 50,
  },

  // ── Komentarze ────────────────────────────────────────────
  {
    id:       'first_comment',
    category: 'Aktywność',
    emoji:    '💬',
    name:     'Pierwszy głos',
    desc:     'Dodaj swój pierwszy komentarz.',
    secret:   false,
    check:    (d) => (d.commentsCount ?? 0) >= 1,
  },
  {
    id:       'twenty_comments',
    category: 'Aktywność',
    emoji:    '🗣️',
    name:     'Mówca areny',
    desc:     'Dodaj 20 komentarzy.',
    secret:   false,
    check:    (d) => (d.commentsCount ?? 0) >= 20,
  },

  // ── Lajki ─────────────────────────────────────────────────
  {
    id:       'first_like',
    category: 'Społeczność',
    emoji:    '❤️',
    name:     'Pierwsze uznanie',
    desc:     'Otrzymaj pierwszego lajka.',
    secret:   false,
    check:    (d) => (d.likesReceived ?? 0) >= 1,
  },
  {
    id:       'ten_likes',
    category: 'Społeczność',
    emoji:    '🔥',
    name:     'Wojownik popularny',
    desc:     'Otrzymaj 10 lajków.',
    secret:   false,
    check:    (d) => (d.likesReceived ?? 0) >= 10,
  },
  {
    id:       'fifty_likes',
    category: 'Społeczność',
    emoji:    '⭐',
    name:     'Gwiazda areny',
    desc:     'Otrzymaj 50 lajków.',
    secret:   false,
    check:    (d) => (d.likesReceived ?? 0) >= 50,
  },

  // ── Rangi ─────────────────────────────────────────────────
  {
    id:       'rank_warrior',
    category: 'Rangi',
    emoji:    '🥈',
    name:     'Warrior',
    desc:     'Osiągnij rangę Warrior (500 pkt).',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 500,
  },
  {
    id:       'rank_champion',
    category: 'Rangi',
    emoji:    '🥇',
    name:     'Champion',
    desc:     'Osiągnij rangę Champion (2000 pkt).',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 2000,
  },
  {
    id:       'rank_legend',
    category: 'Rangi',
    emoji:    '💎',
    name:     'Legend',
    desc:     'Osiągnij rangę Legend (10000 pkt).',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 10000,
  },

  // ── Specjalne ─────────────────────────────────────────────
  {
    id:       'golden_circle',
    category: 'Specjalne',
    emoji:    '🌕',
    name:     'Władca Złotego Kręgu',
    desc:     'Zdobądź 1000 punktów XP.',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 1000,
  },
  {
    id:       'dragon_slayer',
    category: 'Specjalne',
    emoji:    '🐉',
    name:     'Pogromca Dwugłowego Węża',
    desc:     'Zdobądź 5000 punktów XP.',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 5000,
  },
  {
    id:       'light_guardian',
    category: 'Specjalne',
    emoji:    '🌟',
    name:     'Strażnik Światła',
    desc:     'Zdobądź 3000 punktów XP.',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 3000,
  },
  {
    id:       'two_worlds',
    category: 'Specjalne',
    emoji:    '⚔️',
    name:     'Rycerz Dwóch Światów',
    desc:     'Zdobądź 7500 punktów XP.',
    secret:   false,
    check:    (d) => (d.points ?? 0) >= 7500,
  },

  // ── Laga Pajacu ───────────────────────────────────────────
  {
    id:       'first_pajac',
    category: 'Laga Pajacu',
    emoji:    '🍺',
    name:     'Pierwszy Pajac',
    desc:     'Rzuć pierwsze wyzwanie Lagi Pajacu.',
    secret:   false,
    check:    (d) => (d.pajacTotal ?? 0) >= 1,
  },
  {
    id:       'pajac_lord',
    category: 'Laga Pajacu',
    emoji:    '👑',
    name:     'Pajacowy Lord',
    desc:     'Wygraj 10 wyzwań Lagi Pajacu.',
    secret:   false,
    check:    (d) => (d.pajacWins ?? 0) >= 10,
  },
  {
    id:       'laga_legend',
    category: 'Laga Pajacu',
    emoji:    '🏆',
    name:     'Legenda Lagi',
    desc:     'Wygraj 50 wyzwań Lagi Pajacu.',
    secret:   false,
    check:    (d) => (d.pajacWins ?? 0) >= 50,
  },

  // ── Ukryte ────────────────────────────────────────────────
  {
    id:       'golden_disc',
    category: 'Tajemnicze',
    emoji:    '🏅',
    name:     'Wezwanie na Arenę Złotego Dysku',
    desc:     'Tajemnicze osiągnięcie. Odkryj je sam!',
    secret:   true,
    check:    (d) => (d.points ?? 0) >= 250,
  },
  {
    id:       'chaos_serpents',
    category: 'Tajemnicze',
    emoji:    '🌀',
    name:     'Pojedynek z Wężami Chaosu',
    desc:     'Tajemnicze osiągnięcie. Odkryj je sam!',
    secret:   true,
    check:    (d) => (d.postsCount ?? 0) >= 3 && (d.commentsCount ?? 0) >= 5,
  },
  {
    id:       'flower_order',
    category: 'Tajemnicze',
    emoji:    '🌸',
    name:     'Wyzwanie Kwiatowego Zakonu',
    desc:     'Tajemnicze osiągnięcie. Odkryj je sam!',
    secret:   true,
    check:    (d) => (d.likesReceived ?? 0) >= 25,
  },
  {
    id:       'sun_circle',
    category: 'Tajemnicze',
    emoji:    '☀️',
    name:     'Bitwa o Krąg Słońca',
    desc:     'Tajemnicze osiągnięcie. Odkryj je sam!',
    secret:   true,
    check:    (d) => (d.points ?? 0) >= 4000,
  },
];

// Kategorie w kolejności
const CATEGORIES = ['Aktywność', 'Społeczność', 'Rangi', 'Specjalne', 'Tajemnicze'];


// ════════════════════════════════════════════════════════════
// CHECK & UNLOCK
// ════════════════════════════════════════════════════════════

/**
 * Sprawdza wszystkie osiągnięcia i odblokowuje nowe.
 * Wywoływane po każdym przyznaniu XP.
 *
 * @param {string} uid
 * @param {object} userData  — aktualne dane użytkownika
 */
export async function checkAndUnlockAchievements(uid, userData) {
  const TAG = '[checkAndUnlockAchievements]';

  if (!uid || !userData) return;

  const unlocked  = Array.isArray(userData.achievements) ? userData.achievements : [];
  const newUnlocks = [];

  ACHIEVEMENTS.forEach(ach => {
    if (unlocked.includes(ach.id)) return;   // Już odblokowane
    if (ach.check(userData)) {
      newUnlocks.push(ach);
    }
  });

  if (newUnlocks.length === 0) return;

  console.log(TAG, `🏆 Nowe osiągnięcia (${newUnlocks.length}):`, newUnlocks.map(a => a.name));

  try {
    // Zapisz do Firestore
    await updateDoc(doc(db, COL.USERS, uid), {
      achievements: arrayUnion(...newUnlocks.map(a => a.id)),
    });

    // Pokaż animację odblokowania (z opóźnieniami)
    newUnlocks.forEach((ach, i) => {
      setTimeout(() => showUnlockAnimation(ach), i * 1200);
    });

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
  }
}


// ════════════════════════════════════════════════════════════
// UNLOCK ANIMATION
// ════════════════════════════════════════════════════════════

function showUnlockAnimation(ach) {
  // Usuń poprzedni
  document.querySelector('.unlock-backdrop')?.remove();
  document.querySelector('.unlock-popup')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'unlock-backdrop';

  const popup = document.createElement('div');
  popup.className = 'unlock-popup';
  popup.innerHTML = `
    <div class="unlock-popup-icon">${ach.emoji}</div>
    <div class="unlock-popup-label">🏆 Osiągnięcie odblokowane!</div>
    <div class="unlock-popup-name">${ach.name}</div>
    <div class="unlock-popup-desc">${ach.desc}</div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(popup);

  const dismiss = () => {
    backdrop.style.transition = 'opacity 0.3s ease';
    popup.style.transition    = 'opacity 0.3s ease, transform 0.3s ease';
    backdrop.style.opacity    = '0';
    popup.style.opacity       = '0';
    popup.style.transform     = 'translate(-50%,-50%) scale(0.9)';
    setTimeout(() => { backdrop.remove(); popup.remove(); }, 320);
  };

  backdrop.addEventListener('click', dismiss);
  setTimeout(dismiss, 3500);
}


// ════════════════════════════════════════════════════════════
// ACHIEVEMENTS PAGE
// ════════════════════════════════════════════════════════════

export function initAchievementsPage() {
  const TAG = '[initAchievementsPage]';
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
        uid:          user.uid,
        displayName:  user.displayName || 'Wojownik',
        achievements: [],
        points:       0,
        postsCount:   0,
        commentsCount:0,
        likesReceived:0,
      };
    }

    renderAchievementsPage(data);
  });

  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

function renderAchievementsPage(data) {
  const TAG = '[renderAchievementsPage]';

  const unlocked = Array.isArray(data.achievements) ? data.achievements : [];
  const total    = ACHIEVEMENTS.length;
  const done     = ACHIEVEMENTS.filter(a => unlocked.includes(a.id) || a.check(data)).length;

  console.log(TAG, `${done}/${total} osiągnięć`);

  // Summary
  const countEl = document.getElementById('ach-count');
  const totalEl = document.getElementById('ach-total');
  const subEl   = document.getElementById('ach-summary-sub');
  const barEl   = document.getElementById('ach-summary-bar');
  const pctEl   = document.getElementById('ach-summary-pct');

  if (countEl) countEl.textContent = done;
  if (totalEl) totalEl.textContent = total;
  if (subEl)   subEl.textContent   = `Odblokowano ${done} z ${total} osiągnięć`;

  const pct = Math.round((done / total) * 100);
  if (barEl) barEl.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';

  // Render categories
  const container = document.getElementById('achievements-container');
  if (!container) return;

  container.innerHTML = '';

  CATEGORIES.forEach(category => {
    const catAchs = ACHIEVEMENTS.filter(a => a.category === category);
    if (catAchs.length === 0) return;

    const section = document.createElement('div');
    section.className = 'ach-category';

    const unlockedInCat = catAchs.filter(a =>
      unlocked.includes(a.id) || a.check(data)
    ).length;

    section.innerHTML = `
      <div class="ach-category-title">
        ${category}
        <span style="font-size:0.625rem;font-weight:500;color:var(--text-muted);text-transform:none;letter-spacing:0;margin-left:auto;margin-right:0.5rem;">
          ${unlockedInCat}/${catAchs.length}
        </span>
      </div>
      <div class="ach-grid" id="ach-grid-${category.toLowerCase()}"></div>
    `;

    container.appendChild(section);

    const grid = section.querySelector(`#ach-grid-${category.toLowerCase()}`);

    catAchs.forEach((ach, idx) => {
      const isUnlocked = unlocked.includes(ach.id) || ach.check(data);
      const card       = document.createElement('div');
      card.className   = `ach-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.style.animationDelay = (idx * 0.04) + 's';

      // Ukryte osiągnięcia — pokaż ??? jeśli zablokowane
      const displayName = (!isUnlocked && ach.secret) ? '???' : ach.name;
      const displayDesc = (!isUnlocked && ach.secret) ? 'Tajemnicze osiągnięcie' : ach.desc;
      const displayEmoji= (!isUnlocked && ach.secret) ? '🔒' : ach.emoji;

      card.innerHTML = `
        ${isUnlocked ? `
          <div class="ach-unlocked-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        ` : ''}
        <div class="ach-icon">
          ${displayEmoji}
          ${!isUnlocked ? '<div class="ach-lock">🔒</div>' : ''}
        </div>
        <div class="ach-name">${displayName}</div>
        <div class="ach-desc">${displayDesc}</div>
      `;

      grid.appendChild(card);
    });
  });

  // Pokaż stronę
  document.getElementById('ach-skeleton')?.classList.add('hidden');
  document.getElementById('achievements-content')?.classList.remove('hidden');

  console.log(TAG, '✅ Osiągnięcia wyrenderowane');
}
