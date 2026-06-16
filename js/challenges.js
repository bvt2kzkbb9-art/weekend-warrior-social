/**
 * WEEKEND WARRIOR SOCIAL — challenges.js
 * Misje/Challenges page initialization
 */

import { auth, db, COL } from './firebase.js';
import { onAuthStateChanged, collection, query, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { hideSkeletonShowContent } from './utils.js';
import { showToast } from './auth.js';

export async function initChallengesPage() {
  try {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      // Pokaż zawartość, ukryj skeleton
      hideSkeletonShowContent('ch-skeleton', 'challenges-content');

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
        console.error('[Challenges] ❌ Load error:', err.message);
        showToast('Błąd ładowania wyzwań: ' + err.code, 'error');
      }
    });
  } catch (error) {
    console.error('[Challenges] Init error:', error);
  }
}
