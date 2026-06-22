/**
 * Feed page initialization
 * Handles page protection and logout
 */

import { protectPage } from '../lib/guards.js';
import { authService } from '../services/AuthService.js';

async function initFeedPage() {
  try {
    await protectPage();

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
  } catch (error) {
    console.error('Feed page initialization error:', error);
    window.location.href = 'login.html';
  }
}

initFeedPage();
