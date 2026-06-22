/**
 * Firebase Configuration - Warrior OS 2.0
 * Konfiguracja Firebase Auth + Firestore
 * 
 * ⚠️ WAŻNE: Wymień poniższe wartości swoimi danymi Firebase Console
 * Project Settings > Service Accounts > Web SDK configuration
 */

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "1:your-app-id:web:your-web-app-id"
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
