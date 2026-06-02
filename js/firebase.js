/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — Firebase Configuration
 * ============================================================
 */

import { initializeApp }               from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore }                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Konfiguracja Firebase ────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98",
  authDomain:        "weekend-warrior-social-ed3d0.firebaseapp.com",
  projectId:         "weekend-warrior-social-ed3d0",
  storageBucket:     "weekend-warrior-social-ed3d0.firebasestorage.app",
  messagingSenderId: "487311448505",
  appId:             "1:487311448505:web:ffbe035b92efa8fc193e68"
};
// ────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Nazwy kolekcji Firestore ─────────────────────────────────
export const COL = {
  USERS: 'users',
};

// ── System rang RPG ──────────────────────────────────────────
export const RANKS = [
  { id: 'Rookie',   label: 'Rookie',   emoji: '🥉', min: 0,     cssClass: 'rank-rookie'   },
  { id: 'Warrior',  label: 'Warrior',  emoji: '🥈', min: 500,   cssClass: 'rank-warrior'  },
  { id: 'Champion', label: 'Champion', emoji: '🥇', min: 2000,  cssClass: 'rank-champion' },
  { id: 'Legend',   label: 'Legend',   emoji: '💎', min: 10000, cssClass: 'rank-legend'   },
];

export function getRank(points = 0) {
  return [...RANKS].reverse().find(r => points >= r.min) ?? RANKS[0];
}

export function getLevel(points = 0) {
  return Math.max(1, Math.floor(points / 100) + 1);
}

export function getRankProgress(points = 0) {
  const current = getRank(points);
  const idx     = RANKS.findIndex(r => r.id === current.id);
  const next    = RANKS[idx + 1];
  if (!next) return 100;
  const progress = points - current.min;
  const range    = next.min - current.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

export default app;
