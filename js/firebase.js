/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — firebase.js
 * Firebase SDK 10.12.2 | ES Modules | CDN
 * ============================================================
 */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getAuth,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  getFirestore,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Konfiguracja ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98',
  authDomain:        'weekend-warrior-social-ed3d0.firebaseapp.com',
  projectId:         'weekend-warrior-social-ed3d0',
  storageBucket:     'weekend-warrior-social-ed3d0.firebasestorage.app',
  messagingSenderId: '487311448505',
  appId:             '1:487311448505:web:ffbe035b92efa8fc193e68',
};

// ── Inicjalizacja ────────────────────────────────────────────
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (err) {
  if (err.code !== 'app/duplicate-app') throw err;
  // already initialized in another module
  const { getApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  app = getApp();
}

export const auth = getAuth(app);
export const db   = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Kolekcje ─────────────────────────────────────────────────
export const COL = {
  USERS:                'users',
  POSTS:                'posts',
  CHALLENGES:           'challenges',
  ACHIEVEMENTS:         'achievements',
  FOLLOWERS:            'followers',
  NOTIFICATIONS:        'notifications',
  POKES:                'pokes',
  CONVERSATIONS:        'conversations',
  WEEKLY:               'weeklyScores',
  // Friends system
  FRIEND_REQUESTS:      'friend_requests',
  FRIENDS:              'friends',
  // Challenges v2
  CHALLENGE_INVITES:    'challenge_invites',
  CHALLENGE_COMPLETIONS:'challenge_completions',
  CHALLENGE_QUIZZES:    'challenge_quizzes',
  DUELS:                'duels',
  USER_CHALLENGES:      'userChallenges',
  // Misc
  USERNAMES:            'usernames',
  PAJAC:                'pajacChallenges',
  BLOCKS:               'blocks',
  REPORTS:              'reports',
  LAGA_INVITES:         'laga_invites',
  ACTIVE_LAGAS:         'active_lagas',
  LAGA_EVENTS:          'laga_events',
};

// ── System rang ──────────────────────────────────────────────
export const RANKS = [
  { id: 'Rookie',   label: 'Rookie',   emoji: '🥉', min: 0,     cssClass: 'rank-rookie'   },
  { id: 'Warrior',  label: 'Warrior',  emoji: '🥈', min: 500,   cssClass: 'rank-warrior'  },
  { id: 'Champion', label: 'Champion', emoji: '🥇', min: 2000,  cssClass: 'rank-champion' },
  { id: 'Legend',   label: 'Legend',   emoji: '💎', min: 10000, cssClass: 'rank-legend'   },
];

export function getRank(points = 0) {
  const p = Number(points) || 0;
  return [...RANKS].reverse().find(r => p >= r.min) ?? RANKS[0];
}

export function getLevel(points = 0) {
  return Math.max(1, Math.floor((Number(points) || 0) / 100) + 1);
}

export function getRankProgress(points = 0) {
  const p       = Number(points) || 0;
  const current = getRank(p);
  const idx     = RANKS.findIndex(r => r.id === current.id);
  const next    = RANKS[idx + 1];
  if (!next) return 100;
  return Math.min(100, Math.round(((p - current.min) / (next.min - current.min)) * 100));
}

export default app;
