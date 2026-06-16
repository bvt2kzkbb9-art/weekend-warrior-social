/**
 * WEEKEND WARRIOR SOCIAL — dashboard.js
 * Arena home screen initialization
 */

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { initializeFirebase } from './firebase.js';

export async function initDashboard() {
  try {
    // Initialize Firebase
    const { db, auth } = initializeFirebase();

    // Handle authentication state
    onAuthStateChanged(auth, async (user) => {
      const skeletonEl = document.getElementById('skeleton');
      const dashboardEl = document.getElementById('dashboard');

      if (skeletonEl && dashboardEl) {
        if (user) {
          try {
            // Load user data from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();

              // Update dashboard with user data
              updateDashboard(userData);
            }
          } catch (error) {
            console.warn('[Dashboard] Error loading user data:', error);
          }
        }

        // Hide skeleton, show dashboard
        skeletonEl.classList.add('hidden');
        dashboardEl.classList.remove('hidden');
      }
    });
  } catch (error) {
    console.error('[Dashboard] Init error:', error);
    // Still show dashboard even if there's an error
    const skeletonEl = document.getElementById('skeleton');
    const dashboardEl = document.getElementById('dashboard');
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

  if (statXpEl) statXpEl.textContent = userData.xp || 0;
  if (statLevelEl) statLevelEl.textContent = userData.level || 1;
  if (statStreakEl) statStreakEl.textContent = userData.streak || 0;
}
