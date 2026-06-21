/**
 * AuthService
 *
 * Zarządza autentykacją użytkowników poprzez Firebase Authentication.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { userService } from './UserService.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.unsubscribe = null;
  }

  /**
   * Inicjalizuje nasłuchiwanie zmian stanu autentykacji
   */
  initializeAuthListener(callback) {
    this.unsubscribe = onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (callback) {
        callback(user);
      }
    });
  }

  /**
   * Zatrzymuje nasłuchiwanie zmian autentykacji
   */
  stopAuthListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Zwraca aktualnego zalogowanego użytkownika
   */
  getCurrentUser() {
    return this.currentUser || auth.currentUser;
  }

  /**
   * Rejestruje nowego użytkownika
   */
  async register(email, password, displayName) {
    try {
      if (!email || !password || !displayName) {
        throw new Error('Wszystkie pola są wymagane');
      }

      if (password.length < 6) {
        throw new Error('Hasło musi mieć co najmniej 6 znaków');
      }

      // Utwórz konto w Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Utwórz profil użytkownika w Firestore
      await userService.createUserProfile(user.uid, {
        displayName,
        email,
      });

      // Wyślij email weryfikacyjny
      await sendEmailVerification(user);

      return {
        uid: user.uid,
        email: user.email,
        displayName,
        emailVerified: false,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Loguje użytkownika
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email i hasło są wymagane');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Zaktualizuj lastLogin w profilu
      await userService.updateUserLastLogin(user.uid);

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Wylogowuje użytkownika
   */
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Wysyła email do resetowania hasła
   */
  async resetPassword(email) {
    try {
      if (!email) {
        throw new Error('Email jest wymagany');
      }

      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Wysyła email weryfikacyjny
   */
  async sendVerificationEmail(user = null) {
    try {
      const userToVerify = user || this.currentUser || currentUser(auth);
      if (!userToVerify) {
        throw new Error('Użytkownik nie zalogowany');
      }

      await sendEmailVerification(userToVerify);
      return true;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Sprawdza czy użytkownik jest zalogowany
   */
  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * Konwertuje błędy Firebase na przyjazne komunikaty
   */
  normalizeError(error) {
    const code = error.code;
    const message = error.message;

    const errorMap = {
      'auth/email-already-in-use': 'Konto z tym adresem email już istnieje',
      'auth/invalid-email': 'Nieprawidłowy adres email',
      'auth/weak-password': 'Hasło jest zbyt słabe (minimum 6 znaków)',
      'auth/user-not-found': 'Konto z tym adresem email nie istnieje',
      'auth/wrong-password': 'Niepoprawne hasło',
      'auth/too-many-requests': 'Zbyt wiele prób logowania. Spróbuj później.',
      'auth/account-exists-with-different-credential': 'Konto istnieje z innym dostawcą',
      'auth/invalid-credential': 'Nieprawidłowe dane logowania',
      'auth/network-request-failed': 'Błąd połączenia. Sprawdź internet.',
      'auth/operation-not-allowed': 'Operacja nie jest dostępna',
      'auth/internal-error': 'Błąd serwera. Spróbuj później.',
    };

    const friendlyMessage = errorMap[code] || 'Błąd autentykacji. Spróbuj ponownie.';
    const error_obj = new Error(friendlyMessage);
    error_obj.code = code;
    return error_obj;
  }
}

const authService = new AuthService();

export { authService, AuthService };
