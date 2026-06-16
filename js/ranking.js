/**
 * WEEKEND WARRIOR SOCIAL — ranking.js
 * Chwała/Ranking page initialization
 */

import { auth, db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { hideSkeletonShowContent } from './utils.js';

export async function initRanking() {
  const skeletonEl = document.getElementById('ranking-skeleton');
  const contentEl = document.getElementById('ranking-content');

  // Set 5-second fallback timeout IMMEDIATELY
  const fallbackTimer = setTimeout(() => {
    if (skeletonEl && contentEl) {
      skeletonEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
    }
  }, 5000);

  try {
    onAuthStateChanged(auth, async (user) => {
      try {
        clearTimeout(fallbackTimer);

        if (!user) {
          window.location.href = 'login.html';
          return;
        }

        // Pokaż zawartość, ukryj skeleton
        if (skeletonEl && contentEl) {
          skeletonEl.classList.add('hidden');
          contentEl.classList.remove('hidden');
        }

        // Załaduj ranking
        try {
          const q = query(collection(db, COL.USERS), orderBy('points', 'desc'), limit(50));
          const snap = await getDocs(q);
          const users = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('[Ranking] ✅ Loaded', users.length, 'users');
        } catch (err) {
          console.error('[Ranking] ❌ Error:', err.message);
          if (skeletonEl && contentEl) {
            skeletonEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('[Ranking] ❌ Error:', err.message);
        if (skeletonEl && contentEl) {
          skeletonEl.classList.add('hidden');
          contentEl.classList.remove('hidden');
        }
      }
    });
  } catch (error) {
    console.error('[Ranking] Init error:', error);
    if (skeletonEl && contentEl) {
      skeletonEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
    }
  }
}
