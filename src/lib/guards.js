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
    const startTime = Date.now();

    const check = () => {
      const user = authService.getCurrentUser();

      // Jeśli mamy user (zalogowany)
      if (user !== null) {
        resolve(true);
        return;
      }

      // Timeout
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      // Czekaj 100ms i spróbuj ponownie
      setTimeout(check, 100);
    };

    // Rozpocznij sprawdzanie
    check();
  });
}

/**
 * Chroni stronę - wymaga logowania
 * Jeśli użytkownik nie jest zalogowany, redirectuje do login.html
 */
export async function protectPage() {
  try {
    await initializeApp();

    // Czekaj aż autentykacja będzie zainicjalizowana
    const isAuthenticated = await waitForAuthInitialization();

    if (!isAuthenticated) {
      window.location.href = 'login.html';
      return false;
    }

    return true;
  } catch (error) {
    console.error('Page protection error:', error);
    window.location.href = 'login.html';
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
