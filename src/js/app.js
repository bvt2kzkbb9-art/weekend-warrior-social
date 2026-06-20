/**
 * WEEKEND WARRIOR SOCIAL — Application Initialization
 * Central entry point for the app
 */

import { auth } from './core/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

let isInitialized = false;

export async function initApp() {
  if (isInitialized) return;
  isInitialized = true;

  // Listen for auth state changes
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      const publicPages = ['login', 'register', 'reset-password', 'offline'];
      const currentPage = window.location.pathname.split('/').pop()?.split('.')[0] || '';
      const isPublicPage = publicPages.some(p => currentPage.includes(p));

      if (user && !isPublicPage) {
        // User is logged in and not on a public page
        // Initialize user-dependent features
        console.log('✅ User authenticated:', user.uid);
        await initUserSession(user);
        resolve(true);
      } else if (!user && !isPublicPage) {
        // User is not logged in and on a protected page
        console.log('⚠️ Unauthorized access, redirecting to login');
        window.location.href = '/src/pages/auth/login.html';
      } else if (user && isPublicPage) {
        // User is logged in but on a public page, redirect to main app
        console.log('ℹ️ Already logged in, redirecting to app');
        window.location.href = '/src/pages/screens/arena.html';
      }

      resolve(!isPublicPage || !user);
    });
  });
}

async function initUserSession(user) {
  // Initialize user-dependent services
  // This is called after authentication

  // Load user data
  const userData = await loadUserData(user.uid);

  // Store in session
  sessionStorage.setItem('currentUser', JSON.stringify({
    uid: user.uid,
    email: user.email,
    ...userData
  }));

  // Initialize services
  console.log('ℹ️ User session initialized');
}

async function loadUserData(uid) {
  // TODO: Fetch user data from Firestore
  return {
    displayName: 'Warrior',
    level: 1,
    points: 0
  };
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export { isInitialized };
