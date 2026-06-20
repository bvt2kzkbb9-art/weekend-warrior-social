/**
 * WEEKEND WARRIOR SOCIAL — challenges.js
 * Misje/Challenges page initialization
 */

import { auth, db, COL } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, query, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { hideSkeletonShowContent } from './utils.js';
import { showToast } from './auth.js';

export async function initChallengesPage() {
  const skeletonEl = document.getElementById('ch-skeleton');
  const contentEl = document.getElementById('challenges-content');

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

        // Załaduj wyzwania
        try {
          const q = query(collection(db, COL.CHALLENGES));
          const snap = await getDocs(q);
          const challenges = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('[Challenges] ✅ Loaded', challenges.length, 'challenges');
        } catch (err) {
          console.error('[Challenges] ❌ Error:', err.message);
          if (skeletonEl && contentEl) {
            skeletonEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('[Challenges] ❌ Error:', err.message);
        if (skeletonEl && contentEl) {
          skeletonEl.classList.add('hidden');
          contentEl.classList.remove('hidden');
        }
      }
    });
  } catch (error) {
    console.error('[Challenges] Init error:', error);
    if (skeletonEl && contentEl) {
      skeletonEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
    }
  }
}
