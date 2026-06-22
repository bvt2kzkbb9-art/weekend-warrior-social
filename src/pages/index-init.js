/**
 * Index (Arena) page initialization
 * Handles page protection and logout
 */

import { protectPage } from '../lib/guards.js';
import { authService } from '../services/AuthService.js';

async function initArenaPage() {
  try {
    // Protect this page - redirect if not authenticated
    await protectPage();

    // Setup logout button
    const logoutBtn = document.querySelector('a[href="login.html"][title="Wylogowanie"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await authService.logout();
          window.location.href = 'login.html';
        } catch (error) {
          console.error('Logout error:', error);
          window.location.href = 'login.html';
        }
      });
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  } catch (error) {
    console.error('Arena page initialization error:', error);
    window.location.href = 'login.html';
  }
}

initArenaPage();
