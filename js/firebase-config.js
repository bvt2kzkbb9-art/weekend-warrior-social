/**
 * Firebase Configuration - Warrior OS 2.0
 * Konfiguracja Firebase Auth + Firestore
 * 
 * ⚠️ WAŻNE: Wymień poniższe wartości swoimi danymi Firebase Console
 * Project Settings > Service Accounts > Web SDK configuration
 */

export const firebaseConfig = {
  apiKey: "AIzaSyCbDrX7ZXjz_78wvYIpZt95UDElLne3EWA",
  authDomain: "weekend-warrior-social-c23ae.firebaseapp.com",
  databaseURL: "https://weekend-warrior-social-c23ae-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "weekend-warrior-social-c23ae",
  storageBucket: "weekend-warrior-social-c23ae.firebasestorage.app",
  messagingSenderId: "493489696733",
  appId: "1:493489696733:web:88173236a68210c1ca9034"
};

/**
 * Inicjalizacja Firebase (global)
 * Wywoływane w index.html
 */
export async function initializeFirebase() {
  try {
    // Importowanie Firebase z CDN
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const app = initializeApp(firebaseConfig);
    
    // Globalne referencje dla całej aplikacji
    window.firebase = {
      app,
      auth: null,
      db: null,
      initialized: false
    };
    
    console.log('✓ Firebase zaincjalizowany');
    return app;
  } catch (error) {
    console.error('✗ Błąd inicjalizacji Firebase:', error);
    throw error;
  }
}

/**
 * Pobranie instancji Auth
 */
export async function getAuth() {
  if (window.firebase?.auth) {
    return window.firebase.auth;
  }
  
  const { getAuth: getAuthFirebase } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
  const auth = getAuthFirebase(window.firebase.app);
  window.firebase.auth = auth;
  return auth;
}

/**
 * Pobranie instancji Firestore
 */
export async function getFirestore() {
  if (window.firebase?.db) {
    return window.firebase.db;
  }
  
  const { getFirestore: getFirestoreFirebase } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
  const db = getFirestoreFirebase(window.firebase.app);
  window.firebase.db = db;
  return db;
}
