/**
 * Firebase Configuration
 * 
 * Konfiguracja Firebase dla bazy danych (Firestore) i autentykacji.
 * Przechowywania metadanych uploadów z Cloudinary.
 */

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  STORIES: 'stories',
  COMMENTS: 'comments',
  LIKES: 'likes',
  FOLLOWS: 'follows',
  NOTIFICATIONS: 'notifications',
  CHALLENGES: 'challenges',
  CHALLENGE_MESSAGES: 'challengeMessages',
  MISSIONS: 'missions',
  ACHIEVEMENTS: 'achievements',
  RANKING: 'ranking',
  REPORTS: 'reports',
  SETTINGS: 'settings',
};

const FIRESTORE_CONSTRAINTS = {
  MAX_BATCH_WRITES: 500,
  MAX_DOCUMENT_SIZE: 1048576, // 1MB
  REQUEST_TIMEOUT: 60000, // 60s
};

export {
  FIREBASE_CONFIG,
  FIRESTORE_COLLECTIONS,
  FIRESTORE_CONSTRAINTS,
};
