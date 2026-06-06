/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — firebase.js
 * Firebase SDK 10.12.2 | ES Modules | CDN
 * ============================================================
 */
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "authorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "points",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "followers",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "followerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "followingId",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "followers",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "followingId",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "lastMessageAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "weeklyScores",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "xpThisWeek",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pokes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "targetId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "username",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pajacChallenges",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "targetId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pajacChallenges",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "initiatorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pajacChallenges",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "expiresAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "blocks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "blockerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
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
  console.log('[Firebase] ✅ App initialized — project:', firebaseConfig.projectId);
} catch (err) {
  console.error('[Firebase] ❌ initializeApp failed:', err);
  throw err;
}

export const auth = getAuth(app);
export const db   = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

console.log('[Firebase] ✅ Auth + Firestore ready');

// {
  "firestore": {
    "indexes": "firestore.indexes.json"
  }
}
── Kolekcje ─────────────────────────────────────────────────
export const COL = {
  USERS:              'users',
  POSTS:              'posts',
  CHALLENGES:         'challenges',
  ACHIEVEMENTS:       'achievements',
  FOLLOWERS:          'followers',
  NOTIFICATIONS:      'notifications',
  POKES:              'pokes',
  CONVERSATIONS:      'conversations',
  WEEKLY:             'weeklyScores',
  CHALLENGE_INVITES:  'challenge_invites',
  CHALLENGE_COMPLETIONS: 'challenge_completions',
  CHALLENGE_QUIZZES:  'challenge_quizzes',
  DUELS:              'duels',
  USER_CHALLENGES:    'userChallenges',
};

// ── System rang RPG ──────────────────────────────────────────
export const RANKS = [
  { id: 'Rookie',   label: 'Rookie',   emoji: '🥉', min: 0,     cssClass: 'rank-rookie'   },
  { id: 'Warrior',  label: 'Warrior',  emoji: '🥈', min: 500,   cssClass: 'rank-warrior'  },
  { id: 'Champion', label: 'Champion', emoji: '🥇', min: 2000,  cssClass: 'rank-champion' },
  { id: 'Legend',   label: 'Legend',   emoji: '💎', min: 10000, cssClass: 'rank-legend'   },
];

/**
 * Zwraca obiekt rangi dla podanej liczby punktów.
 * @param {number} points
 * @returns {{ id, label, emoji, min, cssClass }}
 */
export function getRank(points = 0) {
  const p = Number(points) || 0;
  const sorted = [...RANKS].reverse();
  return sorted.find(r => p >= r.min) ?? RANKS[0];
}

/**
 * Oblicza poziom (co 100 pkt = 1 poziom, min 1).
 * @param {number} points
 * @returns {number}
 */
export function getLevel(points = 0) {
  const p = Number(points) || 0;
  return Math.max(1, Math.floor(p / 100) + 1);
}

/**
 * Procent postępu do następnej rangi (0–100).
 * @param {number} points
 * @returns {number}
 */
export function getRankProgress(points = 0) {
  const p       = Number(points) || 0;
  const current = getRank(p);
  const idx     = RANKS.findIndex(r => r.id === current.id);
  const next    = RANKS[idx + 1];
  if (!next) return 100;
  const done  = p - current.min;
  const range = next.min - current.min;
  return Math.min(100, Math.round((done / range) * 100));
}

export default app;

// ════════════════════════════════════════════════════════════
// GLOBALNY DEBUG LOGGER
// ════════════════════════════════════════════════════════════
// Wywołaj: window.wwsDebug() w konsoli przeglądarki
window.wwsDebug = async function() {
  const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  const { collection, getDocs, query, limit } =
    await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

  console.group('🔍 Firebase Debug — Weekend Warrior Social');

  const user = getAuth().currentUser;
  console.log('Auth:', user ? `✅ ${user.email} (${user.uid})` : '❌ Niezalogowany');

  for (const [name, colName] of Object.entries(COL)) {
    try {
      const snap = await getDocs(query(collection(db, colName), limit(1)));
      console.log(`Firestore ${colName}:`, snap.empty ? '⚠️ Pusta kolekcja' : `✅ Dostęp OK (≥${snap.size} doc)`);
    } catch(e) {
      console.error(`Firestore ${colName}:`, '❌', e.code || e.message);
    }
  }

  console.groupEnd();
};

console.log('[Firebase] 💡 Debug: wpisz window.wwsDebug() w konsoli przeglądarki');


// ── Storage (eksportowane dla feed.js) ──────────────────────
export { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
