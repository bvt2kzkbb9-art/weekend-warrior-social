/**
 * WEEKEND WARRIOR SOCIAL — Usługa Użytkownika
 * Zarządzanie danymi profilu i statystykami użytkownika
 */

import { auth, db, RANKS } from '../core/firebase.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Pobiera dane profilu użytkownika z Firestore
 * @param {string} uid - ID użytkownika
 * @returns {Promise<Object>} Dane profilu użytkownika
 */
export async function pobierzDaneUzytkownika(uid) {
  if (!uid) {
    console.error('[usersService] Brak UID');
    return null;
  }

  try {
    const odwołanie = doc(db, 'users', uid);
    const snapshot = await getDoc(odwołanie);

    if (snapshot.exists()) {
      return snapshot.data();
    } else {
      console.warn('[usersService] Profil użytkownika nie istnieje:', uid);
      return null;
    }
  } catch (błąd) {
    console.error('[usersService] Błąd pobierania danych użytkownika:', błąd);
    throw błąd;
  }
}

/**
 * Aktualizuje profil użytkownika
 * @param {string} uid - ID użytkownika
 * @param {Object} dane - Dane do aktualizacji
 * @returns {Promise<void>}
 */
export async function aktualizujProfil(uid, dane) {
  if (!uid) {
    console.error('[usersService] Brak UID');
    throw new Error('Brak ID użytkownika');
  }

  try {
    const odwołanie = doc(db, 'users', uid);
    await updateDoc(odwołanie, {
      ...dane,
      zaktualizowanoO: serverTimestamp()
    });
    console.log('[usersService] Profil zaktualizowany:', uid);
  } catch (błąd) {
    console.error('[usersService] Błąd aktualizacji profilu:', błąd);
    throw błąd;
  }
}

/**
 * Pobiera statystyki użytkownika (poziom, ranga, punkty)
 * @param {string} uid - ID użytkownika
 * @returns {Promise<Object>} Statystyki użytkownika
 */
export async function pobierzStatystyki(uid) {
  const dane = await pobierzDaneUzytkownika(uid);

  if (!dane) {
    return {
      poziom: 1,
      punkty: 0,
      ranga: RANKS[0],
      xp: 0
    };
  }

  return {
    poziom: dane.poziom || 1,
    punkty: dane.punkty || 0,
    ranga: RANKS.find(r => r.id === dane.ranga) || RANKS[0],
    xp: dane.xp || 0
  };
}

/**
 * Pobiera lisę znajomych użytkownika
 * @param {string} uid - ID użytkownika
 * @returns {Promise<Array>} Lista znajomych
 */
export async function pobierzZnajomych(uid) {
  if (!uid) return [];

  try {
    const odwołanie = doc(db, 'users', uid);
    const snapshot = await getDoc(odwołanie);

    if (snapshot.exists() && snapshot.data().znajomi) {
      return snapshot.data().znajomi;
    }
    return [];
  } catch (błąd) {
    console.error('[usersService] Błąd pobierania znajomych:', błąd);
    return [];
  }
}

/**
 * Sprawdza czy profil użytkownika jest kompletny
 * @param {Object} dane - Dane użytkownika
 * @returns {number} Procent kompletności (0-100)
 */
export function obliczKompletnosćProfilu(dane) {
  if (!dane) return 0;

  let punkty = 0;
  const maksimum = 3;

  if (dane.username && dane.username !== '') punkty++;
  if (dane.avatar && dane.avatar !== '') punkty++;
  if (dane.email && dane.email !== '') punkty++;

  return Math.round((punkty / maksimum) * 100);
}

/**
 * Eksportuje profil użytkownika jako JSON
 * @param {string} uid - ID użytkownika
 * @returns {Promise<Object>} Dane profilu
 */
export async function eksportujProfil(uid) {
  try {
    const dane = await pobierzDaneUzytkownika(uid);
    const statystyki = await pobierzStatystyki(uid);

    return {
      ...dane,
      ...statystyki,
      kompletnosc: obliczKompletnosćProfilu(dane)
    };
  } catch (błąd) {
    console.error('[usersService] Błąd eksportu profilu:', błąd);
    throw błąd;
  }
}
