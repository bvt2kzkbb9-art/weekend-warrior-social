/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — xp.js
 * System punktów doświadczenia (XP)
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * XP za aktywność:
 *   POST_CREATED      +10 XP
 *   LIKE_RECEIVED     +2  XP
 *   COMMENT_ADDED     +3  XP
 *   COMMENT_RECEIVED  +1  XP
 *   DAILY_LOGIN       +5  XP
 *
 * Eksporty:
 *   awardXP(uid, action, meta?)   — przyznaje XP + sprawdza osiągnięcia
 *   checkDailyLogin(uid)          — sprawdza i przyznaje daily login bonus
 *   XP_ACTIONS                    — stałe akcji
 */

import { auth, db, COL, getRank, getLevel } from './firebase.js';
import { createNotification } from './notifications.js';

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { checkAndUnlockAchievements } from './achievements.js';


// ── XP Values ────────────────────────────────────────────────
export const XP_ACTIONS = {
  POST_CREATED:     { key: 'post_created',     xp: 10, label: 'Opublikowano post'    },
  LIKE_RECEIVED:    { key: 'like_received',    xp: 2,  label: 'Otrzymano lajka'      },
  COMMENT_ADDED:    { key: 'comment_added',    xp: 3,  label: 'Dodano komentarz'     },
  COMMENT_RECEIVED: { key: 'comment_received', xp: 1,  label: 'Otrzymano komentarz'  },
  DAILY_LOGIN:      { key: 'daily_login',      xp: 5,  label: 'Dzienne logowanie'    },
};


// ════════════════════════════════════════════════════════════
// AWARD XP
// ════════════════════════════════════════════════════════════

/**
 * Przyznaje XP użytkownikowi i sprawdza osiągnięcia.
 * Nie rzuca błędów — wszystkie są łapane wewnętrznie.
 *
 * @param {string} uid       — UID użytkownika który dostaje XP
 * @param {object} action    — jeden z XP_ACTIONS
 * @param {object} [meta]    — dodatkowe dane (np. { postAuthorId })
 */
export async function awardXP(uid, action, meta = {}) {
  const TAG = '[awardXP]';

  if (!uid || !action) {
    console.warn(TAG, '⚠️ Brak uid lub action');
    return;
  }

  console.log(TAG, `+${action.xp} XP dla ${uid} za: ${action.label}`);

  try {
    const userRef  = doc(db, COL.USERS, uid);
    const snap     = await getDoc(userRef);

    if (!snap.exists()) {
      console.warn(TAG, '⚠️ Dokument użytkownika nie istnieje:', uid);
      return;
    }

    const userData = snap.data();
    const oldPoints = Number(userData.points) || 0;
    const newPoints = oldPoints + action.xp;
    const newLevel  = getLevel(newPoints);
    const newRank   = getRank(newPoints);

    // Aktualizuj Firestore
    const updateData = {
      points:     increment(action.xp),
      level:      newLevel,
      rank:       newRank.id,
      lastActive: serverTimestamp(),
    };

    // Inkrementuj liczniki aktywności
    if (action.key === 'post_created')    updateData.postsCount    = increment(1);
    if (action.key === 'like_received')   updateData.likesReceived = increment(1);
    if (action.key === 'comment_added')   updateData.commentsCount = increment(1);

    await updateDoc(userRef, updateData);

    console.log(TAG, `✅ ${uid}: ${oldPoints} → ${newPoints} pkt | Lvl ${newLevel} | ${newRank.label}`);

    // Notif dla właściciela
    if (uid === auth.currentUser?.uid) {
      // Self notification handled by XP toast
    } else if (action.xp >= 10) {
      // Notify other user they got XP
      createNotification(uid, {
        type:  'xp',
        title: `+${action.xp} XP zdobyte! ⭐`,
        body:  action.label,
        url:   'index.html',
      }).catch(() => {});
    }

    // Sprawdź awans rangi
    const oldRank = getRank(oldPoints);
    if (oldRank.id !== newRank.id) {
      console.log(TAG, `🏆 AWANS RANGI: ${oldRank.label} → ${newRank.label}`);
      showRankUpNotification(newRank);
    }

    // Pokaż XP floating toast (tylko dla własnego użytkownika)
    if (uid === auth.currentUser?.uid) {
      showXpGainToast(action.xp, action.label);
    }

    // Sprawdź osiągnięcia
    const updatedData = { ...userData, points: newPoints, level: newLevel };
    await checkAndUnlockAchievements(uid, updatedData);

  } catch (err) {
    // Nie blokuje głównej akcji
    console.error(TAG, '❌ Błąd przyznawania XP:', err.code, err.message);
  }
}


// ════════════════════════════════════════════════════════════
// DAILY LOGIN BONUS
// ════════════════════════════════════════════════════════════

/**
 * Sprawdza czy użytkownik był dzisiaj aktywny.
 * Jeśli nie — przyznaje 5 XP za daily login.
 */
export async function checkDailyLogin(uid) {
  const TAG = '[checkDailyLogin]';

  if (!uid) return;

  try {
    const userRef = doc(db, COL.USERS, uid);
    const snap    = await getDoc(userRef);

    if (!snap.exists()) return;

    const data        = snap.data();
    const lastLogin   = data.lastDailyLogin;
    const today       = new Date();
    today.setHours(0, 0, 0, 0);

    let lastLoginDate = null;
    if (lastLogin) {
      lastLoginDate = lastLogin?.toDate?.()
        ?? (lastLogin?.seconds ? new Date(lastLogin.seconds * 1000) : null);
      if (lastLoginDate) lastLoginDate.setHours(0, 0, 0, 0);
    }

    // Sprawdź czy ostatnie logowanie było przed dzisiaj
    const isNewDay = !lastLoginDate || lastLoginDate.getTime() < today.getTime();

    if (isNewDay) {
      console.log(TAG, '🌅 Nowy dzień! Przyznuję daily login bonus');

      await updateDoc(userRef, {
        lastDailyLogin: serverTimestamp(),
      });

      // Przyznaj XP
      await awardXP(uid, XP_ACTIONS.DAILY_LOGIN);

    } else {
      console.log(TAG, '✅ Daily login już zaliczony dziś');
    }

  } catch (err) {
    console.warn(TAG, '⚠️ Błąd daily login:', err.message);
  }
}


// ════════════════════════════════════════════════════════════
// UI — XP GAIN TOAST
// ════════════════════════════════════════════════════════════

function showXpGainToast(xp, label) {
  // Arena version — dynamic import to avoid circular deps
  import('./arena.js').then(({ spawnXPFloat, arenaVibrate }) => {
    // Float above the XP bar if visible, otherwise center screen
    const xpEl = document.getElementById('user-xp') ||
                 document.getElementById('xp-bar')   ||
                 document.querySelector('.progress-fill') ||
                 document.querySelector('.xp-section');
    spawnXPFloat(xpEl, xp);
  }).catch(() => {
    // Fallback: old toast
    document.querySelector('.xp-gain-toast')?.remove();
    const el = document.createElement('div');
    el.className   = 'xp-gain-toast';
    el.textContent = `+${xp} XP`;
    el.title       = label;
    document.body.appendChild(el);

  setTimeout(() => el.remove(), 2600);
}


// ════════════════════════════════════════════════════════════
// UI — RANK UP NOTIFICATION
// ════════════════════════════════════════════════════════════

function showRankUpNotification(rankObj) {
  // Arena ceremony
  import('./arena.js').then(({ showRankUp }) => {
    showRankUp(rankObj.id);
  }).catch(() => {});

  // Fallback legacy
  document.querySelector('.unlock-backdrop')?.remove();
  document.querySelector('.unlock-popup')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'unlock-backdrop';

  const popup = document.createElement('div');
  popup.className = 'unlock-popup';
  popup.innerHTML = `
    <div class="unlock-popup-icon">${rankObj.emoji}</div>
    <div class="unlock-popup-label">Awans rangi!</div>
    <div class="unlock-popup-name">${rankObj.label}</div>
    <div class="unlock-popup-desc">Gratulacje wojowniku!<br>Osiągnąłeś nową rangę.</div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(popup);

  const dismiss = () => {
    backdrop.remove();
    popup.remove();
  };

  backdrop.addEventListener('click', dismiss);
  setTimeout(dismiss, 4000);
}
