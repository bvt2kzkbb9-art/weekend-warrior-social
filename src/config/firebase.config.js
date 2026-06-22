/**
 * Firebase Configuration Constants
 *
 * Firestore collections and constraints for Weekend Warrior Social.
 * Firebase initialization is handled in src/lib/firebase.js
 */

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
  FIRESTORE_COLLECTIONS,
  FIRESTORE_CONSTRAINTS,
};
