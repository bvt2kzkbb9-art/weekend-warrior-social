/**
 * Auth Integration Examples - Warrior OS 2.0
 * Przykłady jak użyć Auth Service w aplikacji
 */

// ============================================
// 1. OCHRONA STRON (PROTECTED ROUTES)
// ============================================

/**
 * Wrapper do ochrony stron
 * Użycie: Na każdej stronie poza login/register
 */
export class AuthGuard {
  static async protectPage(requiredRole = null) {
    const { authService } = await import('./auth-service.js');
    await authService.initialize();
    
    const user = authService.getCurrentUser();
    
    if (!user) {
      // Nie zalogowany - redirect do logowania
      window.location.href = '/auth/login.html';
      return false;
    }
    
    // Opcjonalnie: sprawdzenie roli
    if (requiredRole) {
      const userRole = await this.getUserRole(user.uid);
      if (userRole !== requiredRole) {
        window.location.href = '/access-denied.html';
        return false;
      }
    }
    
    return true;
  }
  
  static async getUserRole(uid) {
    const { getFirestore } = await import('./firebase-config.js');
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const db = await getFirestore();
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data()?.role || 'user';
  }
}

// Użycie w dashboard.html:
/*
<script type="module">
  import { AuthGuard } from './js/auth-guard.js';
  
  document.addEventListener('DOMContentLoaded', async () => {
    const isProtected = await AuthGuard.protectPage();
    if (!isProtected) return;
    
    // Dashboard initialization...
  });
</script>
*/

// ============================================
// 2. WYŚWIETLANIE DANYCH UŻYTKOWNIKA
// ============================================

export class UserProfileManager {
  static async loadUserProfile(containerId) {
    const { authService } = await import('./auth-service.js');
    const { getFirestore } = await import('./firebase-config.js');
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const user = authService.getCurrentUser();
    if (!user) return null;
    
    const db = await getFirestore();
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    // Renderuj profil
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="user-profile">
        <img src="${userData.avatar}" alt="${userData.displayName}" class="avatar">
        <h2>${userData.displayName}</h2>
        <p class="username">@${userData.username}</p>
        <p class="rank">${userData.rank} • Level ${userData.level}</p>
        <p class="bio">${userData.bio}</p>
      </div>
    `;
    
    return userData;
  }
  
  static async updateUserProfile(uid, updates) {
    const { getFirestore } = await import('./firebase-config.js');
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const db = await getFirestore();
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  }
}

// ============================================
// 3. LOGOUT Z NAV BAR
// ============================================

export class NavBar {
  static async setupLogout() {
    const { authService } = await import('./auth-service.js');
    const logoutBtn = document.getElementById('logoutBtn');
    
    logoutBtn?.addEventListener('click', async () => {
      if (confirm('Na pewno się wylogujesz?')) {
        const result = await authService.logout();
        if (result.success) {
          window.location.href = '/auth/login.html';
        }
      }
    });
  }
  
  static async showUserMenu() {
    const { authService } = await import('./auth-service.js');
    const user = authService.getCurrentUser();
    
    if (user) {
      const userMenuBtn = document.getElementById('userMenuBtn');
      userMenuBtn.textContent = user.email;
      userMenuBtn.style.display = 'block';
    }
  }
}

// ============================================
// 4. REAL-TIME USER STATUS
// ============================================

export class UserStatusTracker {
  static async trackUserActivity(uid) {
    const { getFirestore } = await import('./firebase-config.js');
    const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const db = await getFirestore();
    
    // Update na zalogowanie
    await updateDoc(doc(db, 'users', uid), {
      online: true,
      lastSeen: new Date().toISOString()
    });
    
    // Update na wylogowanie (przed refresh)
    window.addEventListener('beforeunload', async () => {
      await updateDoc(doc(db, 'users', uid), {
        online: false,
        lastSeen: new Date().toISOString()
      });
    });
  }
}

// ============================================
// 5. XP / LEVEL SYSTEM
// ============================================

export class RPGSystem {
  // Przykład: graj misionę, zyskaj XP
  static async completeQuest(uid, questXp = 100) {
    const { getFirestore } = await import('./firebase-config.js');
    const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const db = await getFirestore();
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    let newXp = userData.xp + questXp;
    let newLevel = userData.level;
    
    // Level up co 1000 XP
    const xpPerLevel = 1000;
    if (newXp >= xpPerLevel) {
      newLevel = Math.floor(newXp / xpPerLevel) + 1;
    }
    
    await updateDoc(userRef, {
      xp: newXp,
      level: newLevel,
      'stats.completedMissions': userData.stats.completedMissions + 1,
      updatedAt: new Date().toISOString()
    });
    
    return { newLevel, newXp };
  }
}

// ============================================
// 6. FRIEND SYSTEM
// ============================================

export class FriendSystem {
  static async sendFriendRequest(fromUid, toUsername) {
    const { getFirestore } = await import('./firebase-config.js');
    const { collection, query, where, getDocs, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const db = await getFirestore();
    
    // Znajdź użytkownika po username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', toUsername.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Użytkownik nie znaleziony' };
    }
    
    const toUid = snapshot.docs[0].id;
    
    // Wyślij zaproszenie
    const invitesRef = doc(db, 'invites', `${fromUid}_${toUid}`);
    await updateDoc(invitesRef, {
      fromUid,
      toUid,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    return { success: true, message: 'Zaproszenie wysłane' };
  }
  
  static async acceptFriendRequest(fromUid, toUid) {
    const { getFirestore } = await import('./firebase-config.js');
    const { doc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const db = await getFirestore();
    
    // Dodaj do friends list
    await updateDoc(doc(db, 'users', toUid), {
      friends: arrayUnion(fromUid)
    });
    
    await updateDoc(doc(db, 'users', fromUid), {
      friends: arrayUnion(toUid)
    });
    
    // Usuń zaproszenie
    await updateDoc(doc(db, 'invites', `${fromUid}_${toUid}`), {
      status: 'accepted'
    });
  }
}

// ============================================
// 7. CLOUD FUNCTIONS INTEGRATION
// ============================================

/**
 * Jeśli używasz Firebase Cloud Functions
 * Przykład: leaderboard update
 */
export class Leaderboard {
  static async updateLeaderboard(uid) {
    try {
      const response = await fetch('https://us-central1-your-project.cloudfunctions.net/updateLeaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getIdToken()}`
        },
        body: JSON.stringify({ uid })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Leaderboard update error:', error);
    }
  }
  
  static async getIdToken() {
    const { authService } = await import('./auth-service.js');
    return await authService.getIdToken();
  }
}

// ============================================
// 8. ANALYTICS
// ============================================

/**
 * Śledź user events dla analytics
 */
export class Analytics {
  static trackEvent(eventName, data = {}) {
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
    console.log(`📊 Event: ${eventName}`, data);
  }
  
  static trackLogin(email) {
    this.trackEvent('login', { email });
  }
  
  static trackRegister(username) {
    this.trackEvent('sign_up', { username });
  }
  
  static trackLogout() {
    this.trackEvent('logout');
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*

// Dashboard.html
import { AuthGuard } from './auth-guard.js';
import { UserProfileManager } from './user-manager.js';
import { NavBar } from './navbar.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Sprawdź autentykację
  if (!await AuthGuard.protectPage()) return;
  
  // Załaduj profil
  await UserProfileManager.loadUserProfile('profile-container');
  
  // Setup nav
  await NavBar.setupLogout();
  await NavBar.showUserMenu();
});

// Complete quest example
async function completeQuestHandler() {
  const { authService } = await import('./auth-service.js');
  const user = authService.getCurrentUser();
  
  const { newLevel } = await RPGSystem.completeQuest(user.uid, 250);
  console.log(`✨ Level up! Nowy level: ${newLevel}`);
}

*/

export default {
  AuthGuard,
  UserProfileManager,
  NavBar,
  UserStatusTracker,
  RPGSystem,
  FriendSystem,
  Leaderboard,
  Analytics
};
