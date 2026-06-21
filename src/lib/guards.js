/**
 * Page Guards
 *
 * System ochrony stron - sprawdza czy użytkownik jest zalogowany.
 * Redirectuje do odpowiedniej strony na podstawie stanu autentykacji.
 */

import { authService } from '../services/AuthService.js';
import { initializeApp } from './init.js';

/**
 * Chroni stronę - wymaga logowania
 * Jeśli użytkownik nie jest zalogowany, redirectuje do login.html
 */
export async function protectPage() {
  try {
    await initializeApp();

    return new Promise((resolve) => {
      authService.initializeAuthListener((user) => {
        if (!user) {
          window.location.href = 'login.html';
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
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

    return new Promise((resolve) => {
      authService.initializeAuthListener((user) => {
        if (user) {
          window.location.href = 'index.html';
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Auth page protection error:', error);
    resolve(true);
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
