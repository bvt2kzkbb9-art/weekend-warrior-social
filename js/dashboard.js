/**
 * WEEKEND WARRIOR SOCIAL — dashboard.js
 * Arena home screen initialization
 */

import { auth, db, COL, getLevel, getRank } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function initDashboard() {
  const skeletonEl = document.getElementById('skeleton');
  const dashboardEl = document.getElementById('dashboard');

  // Set 5-second fallback timeout IMMEDIATELY
  const fallbackTimer = setTimeout(() => {
    if (skeletonEl && dashboardEl) {
      skeletonEl.classList.add('hidden');
      dashboardEl.classList.remove('hidden');
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

        if (skeletonEl && dashboardEl) {
          try {
            const userDocRef = doc(db, COL.USERS, user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              updateDashboard(userData);
            }
          } catch (error) {
            console.warn('[Dashboard] Error loading user data:', error);
          }

          skeletonEl.classList.add('hidden');
          dashboardEl.classList.remove('hidden');
        }
      } catch (error) {
        console.error('[Dashboard] Error:', error);
        if (skeletonEl && dashboardEl) {
          skeletonEl.classList.add('hidden');
          dashboardEl.classList.remove('hidden');
        }
      }
    });
  } catch (error) {
    console.error('[Dashboard] Init error:', error);
    if (skeletonEl && dashboardEl) {
      skeletonEl.classList.add('hidden');
      dashboardEl.classList.remove('hidden');
    }
  }
}

function updateDashboard(userData) {
  // Update stats
  const statXpEl = document.getElementById('stat-xp');
  const statLevelEl = document.getElementById('stat-level');
  const statStreakEl = document.getElementById('stat-streak');

  const points = userData.points || 0;
  const level = getLevel(points);
  const streak = userData.streak || 0;

  if (statXpEl) statXpEl.textContent = points;
  if (statLevelEl) statLevelEl.textContent = level;
  if (statStreakEl) statStreakEl.textContent = streak;
}
