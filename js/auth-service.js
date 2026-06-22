/**
 * Auth Service - Warrior OS 2.0
 * Zarządzanie rejestracją, logowaniem, resetem hasła
 * Integracja z Firebase Auth + Firestore
 */

import { getAuth, getFirestore } from './firebase-config.js';

class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.currentUser = null;
  }

  /**
   * Inicjalizacja serwisu auth
   */
  async initialize() {
    try {
      this.auth = await getAuth();
      this.db = await getFirestore();
      
      const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      
      // Nasłuchiwanie zmian stanu autentykacji
      onAuthStateChanged(this.auth, async (user) => {
        this.currentUser = user;
        
        if (user) {
          // Zalogowany - pobranie danych z Firestore
          await this.syncUserData(user);
          this.onUserLoggedIn?.(user);
        } else {
          // Wylogowany
          this.onUserLoggedOut?.();
        }
      });
      
      console.log('✓ Auth Service zainicjalizowany');
      return true;
    } catch (error) {
      console.error('✗ Błąd inicjalizacji AuthService:', error);
      throw error;
    }
  }

  /**
   * Rejestracja nowego użytkownika
   * @param {string} email - Email użytkownika
   * @param {string} password - Hasło (min 6 znaków)
   * @param {string} username - Nazwa użytkownika (3-20 znaków)
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async register(email, password, username) {
    try {
      // Walidacja
      if (!this.validateEmail(email)) {
        return { success: false, error: 'Niepoprawny format email' };
      }
      
      if (!this.validatePassword(password)) {
        return { success: false, error: 'Hasło musi mieć minimum 6 znaków' };
      }
      
      if (!this.validateUsername(username)) {
        return { success: false, error: 'Nazwa użytkownika: 3-20 znaków, tylko litery, cyfry, _' };
      }

      // Sprawdzenie czy login już istnieje
      const { getDocs, query, where, collection } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const usersRef = collection(this.db, 'users');
      const usernameQuery = query(usersRef, where('username', '==', username.toLowerCase()));
      const snapshot = await getDocs(usernameQuery);
      
      if (!snapshot.empty) {
        return { success: false, error: 'Ta nazwa użytkownika jest już zajęta' };
      }

      // Utworzenie konta Auth
      const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const { user: authUser } = await createUserWithEmailAndPassword(this.auth, email, password);

      // Stworzenie dokumentu użytkownika w Firestore
      const userData = {
        uid: authUser.uid,
        email: authUser.email,
        username: username.toLowerCase(),
        displayName: username,
        avatar: this.getDefaultAvatar(),
        banner: this.getDefaultBanner(),
        level: 1,
        xp: 0,
        rank: 'Nowicjusz',
        streak: 0,
        online: true,
        bio: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        // Statystyki RPG
        stats: {
          totalMissions: 0,
          completedMissions: 0,
          totalDuels: 0,
          duelsWon: 0,
          totalGold: 0,
          artifacts: []
        }
      };

      const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      await setDoc(doc(this.db, 'users', authUser.uid), userData);

      console.log('✓ Użytkownik zarejestrowany:', username);
      return { 
        success: true, 
        user: {
          uid: authUser.uid,
          email: authUser.email,
          username: username
        }
      };

    } catch (error) {
      console.error('✗ Błąd rejestracji:', error);
      
      // Mapowanie błędów Firebase
      const errorMessage = this.mapFirebaseError(error.code);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logowanie użytkownika
   * @param {string} email - Email
   * @param {string} password - Hasło
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(email, password) {
    try {
      if (!this.validateEmail(email)) {
        return { success: false, error: 'Niepoprawny format email' };
      }

      const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const { user: authUser } = await signInWithEmailAndPassword(this.auth, email, password);

      // Aktualizacja lastSeen i online status
      const { updateDoc, doc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      await updateDoc(doc(this.db, 'users', authUser.uid), {
        online: true,
        lastSeen: new Date().toISOString()
      });

      console.log('✓ Zalogowano:', email);
      return { 
        success: true, 
        user: {
          uid: authUser.uid,
          email: authUser.email
        }
      };

    } catch (error) {
      console.error('✗ Błąd logowania:', error);
      const errorMessage = this.mapFirebaseError(error.code);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logowanie przez Google (opcja premium)
   */
  async loginWithGoogle() {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const provider = new GoogleAuthProvider();
      
      const { user: authUser } = await signInWithPopup(this.auth, provider);

      // Sprawdzenie czy użytkownik istnieje w Firestore
      const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const userDocRef = doc(this.db, 'users', authUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Nowy użytkownik - stworzenie profilu
        const defaultUsername = authUser.email.split('@')[0];
        await setDoc(userDocRef, {
          uid: authUser.uid,
          email: authUser.email,
          username: defaultUsername,
          displayName: authUser.displayName || defaultUsername,
          avatar: authUser.photoURL || this.getDefaultAvatar(),
          banner: this.getDefaultBanner(),
          level: 1,
          xp: 0,
          rank: 'Nowicjusz',
          streak: 0,
          online: true,
          bio: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          stats: {
            totalMissions: 0,
            completedMissions: 0,
            totalDuels: 0,
            duelsWon: 0,
            totalGold: 0,
            artifacts: []
          }
        });
      } else {
        // Istniejący użytkownik - aktualizacja statusu
        const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await updateDoc(userDocRef, {
          online: true,
          lastSeen: new Date().toISOString()
        });
      }

      console.log('✓ Zalogowano przez Google:', authUser.email);
      return { success: true, user: authUser };

    } catch (error) {
      console.error('✗ Błąd logowania Google:', error);
      return { success: false, error: 'Błąd logowania przez Google' };
    }
  }

  /**
   * Reset hasła
   * @param {string} email - Email użytkownika
   */
  async resetPassword(email) {
    try {
      if (!this.validateEmail(email)) {
        return { success: false, error: 'Niepoprawny format email' };
      }

      const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      await sendPasswordResetEmail(this.auth, email);

      console.log('✓ Email reset hasła wysłany:', email);
      return { success: true, message: 'Email z linkiem resetowania wysłany' };

    } catch (error) {
      console.error('✗ Błąd reset hasła:', error);
      const errorMessage = this.mapFirebaseError(error.code);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Wylogowanie
   */
  async logout() {
    try {
      if (this.currentUser) {
        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await updateDoc(doc(this.db, 'users', this.currentUser.uid), {
          online: false,
          lastSeen: new Date().toISOString()
        });
      }

      await this.auth.signOut();
      console.log('✓ Wylogowano');
      return { success: true };

    } catch (error) {
      console.error('✗ Błąd wylogowania:', error);
      return { success: false, error: 'Błąd podczas wylogowania' };
    }
  }

  /**
   * Synchronizacja danych użytkownika z Firestore
   */
  async syncUserData(authUser) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const userDoc = await getDoc(doc(this.db, 'users', authUser.uid));
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('✗ Błąd synchronizacji danych:', error);
      return null;
    }
  }

  /**
   * Walidacja email
   */
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Walidacja hasła
   */
  validatePassword(password) {
    return password && password.length >= 6;
  }

  /**
   * Walidacja nazwy użytkownika
   */
  validateUsername(username) {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
  }

  /**
   * Mapowanie błędów Firebase na polskie komunikaty
   */
  mapFirebaseError(code) {
    const errors = {
      'auth/email-already-in-use': 'Ten email jest już zarejestrowany',
      'auth/invalid-email': 'Niepoprawny format email',
      'auth/weak-password': 'Hasło jest zbyt słabe',
      'auth/user-not-found': 'Użytkownik nie znaleziony',
      'auth/wrong-password': 'Niepoprawne hasło',
      'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj później',
      'auth/operation-not-allowed': 'Operacja nie jest dostępna',
      'auth/network-request-failed': 'Błąd połączenia. Sprawdź internet'
    };
    return errors[code] || 'Nieznany błąd. Spróbuj ponownie';
  }

  /**
   * Domyślny avatar
   */
  getDefaultAvatar() {
    return 'https://res.cloudinary.com/dxanfwb3l/image/upload/v1/avatars/default_avatar.png';
  }

  /**
   * Domyślny banner
   */
  getDefaultBanner() {
    return 'https://res.cloudinary.com/dxanfwb3l/image/upload/v1/banners/default_banner.png';
  }

  /**
   * Pobranie aktualnie zalogowanego użytkownika
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Pobranie tokenu auth
   */
  async getIdToken() {
    try {
      if (this.currentUser) {
        return await this.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('✗ Błąd pobrania tokenu:', error);
      return null;
    }
  }
}

// Export singleton
export const authService = new AuthService();
