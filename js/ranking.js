/**
 * WEEKEND WARRIOR SOCIAL — ranking.js
 * Chwała/Ranking page initialization
 */

import { initializeFirebase } from './firebase.js';

export async function initRanking() {
  try {
    const { db, auth } = initializeFirebase();

    // Hide skeleton, show content
    const skeletonEl = document.getElementById('ranking-skeleton');
    const contentEl = document.getElementById('ranking-content');

    if (skeletonEl && contentEl) {
      skeletonEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
    }

    console.log('[Ranking] Page initialized');
  } catch (error) {
    console.error('[Ranking] Init error:', error);
  }
}
