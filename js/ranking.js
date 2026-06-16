/**
 * WEEKEND WARRIOR SOCIAL — ranking.js
 * Chwała/Ranking page initialization
 */

import { auth, db, COL } from './firebase.js';
import { checkAuth, getCurrentUserData, showToast } from './auth.js';
import { onAuthStateChanged, collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { hideSkeletonShowContent } from './utils.js';

export async function initRanking() {
  try {
    // Sprawdź autentykację
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      // Pokaż zawartość, ukryj skeleton
      hideSkeletonShowContent('ranking-skeleton', 'ranking-content');

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
        console.error('[Ranking] ❌ Load error:', err.message);
        showToast('Błąd ładowania rankingu: ' + err.code, 'error');
      }
    });
  } catch (error) {
    console.error('[Ranking] Init error:', error);
  }
}
