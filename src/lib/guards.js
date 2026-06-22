/**
 * Page Guards
 *
 * System ochrony stron - sprawdza czy użytkownik jest zalogowany.
 * Redirectuje do odpowiedniej strony na podstawie stanu autentykacji.
 */

import { authService } from '../services/AuthService.js';
import { initializeApp } from './init.js';

/**
 * Czeka aż Firebase Auth będzie zainicjalizowany
 */
function waitForAuthInitialization(timeout = 5000) {
  return new Promise((resolve) => {
    let resolved = false;
    const startTime = Date.now();

    const check = () => {
      if (resolved) return;

      const user = authService.getCurrentUser();
      const elapsed = Date.now() - startTime;

      if (user !== null) {
        resolved = true;
        resolve(true);
        return;
      }

      if (elapsed >= timeout) {
        resolved = true;
        resolve(false);
        return;
      }

      setTimeout(check, 100);
    };

    check();

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeout);
  });
}

/**
 * Chroni stronę - wymaga logowania
 * Jeśli użytkownik nie jest zalogowany, redirectuje do login.html
 */
export async function protectPage() {
  try {
    await initializeApp();
    const isAuthenticated = await waitForAuthInitialization();

    if (!isAuthenticated) {
      window.location.replace('login.html');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Page protection error:', error);
    window.location.replace('login.html');
    return false;
  }
}

/**
 * Chroni stronę logowania - jeśli użytkownik jest zalogowany, redirectuje do index.html
 */
export async function protectAuthPage() {
  try {
    await initializeApp();

    // Czekaj aż autentykacja będzie zainicjalizowana
    const isAuthenticated = await waitForAuthInitialization();

    if (isAuthenticated) {
      window.location.href = 'index.html';
      return false;
    }

    return true;
  } catch (error) {
    console.error('Auth page protection error:', error);
    return true;
  }
}

/**
 * Pobiera zalogowanego użytkownika
 */
export async function getAuthenticatedUser() {
  try {
    await initializeApp();
    return authService.getCurrentUser();
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Inicjalizuje nasłuchiwanie zmian stanu logowania
 */
export async function onAuthStateChange(callback) {
  try {
    await initializeApp();
    authService.initializeAuthListener(callback);
  } catch (error) {
    console.error('Error initializing auth listener:', error);
  }
}
