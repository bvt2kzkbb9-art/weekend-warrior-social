/**
 * WEEKEND WARRIOR SOCIAL — challenges.js
 * Misje/Challenges page initialization
 */

import { initializeFirebase } from './firebase.js';

export async function initChallengesPage() {
  try {
    const { db, auth } = initializeFirebase();

    // Hide skeleton, show content
    const skeletonEl = document.getElementById('ch-skeleton');
    const contentEl = document.getElementById('challenges-content');

    if (skeletonEl && contentEl) {
      skeletonEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
    }

    console.log('[Challenges] Page initialized');
  } catch (error) {
    console.error('[Challenges] Init error:', error);
  }
}
