import { protectPage } from '../lib/guards.js';
import { authService } from '../services/AuthService.js';

async function initMessengerPage() {
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
          window.location.href = 'login.html';
        }
      });
    }
  } catch (error) {
    window.location.href = 'login.html';
  }
}

initMessengerPage();
