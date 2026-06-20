/**
 * COMPATIBILITY LAYER - js/firebase.js
 *
 * This file maintains backwards compatibility by re-exporting from the main Firebase module.
 * Import from src/js/core/firebase.js instead for new code.
 *
 * Old imports like: import { auth } from './js/firebase.js'
 * Will now use the unified system from src/js/core/firebase.js
 */

console.log('[js/firebase.js] DEPRECATED: Using compatibility layer - please import from src/js/core/firebase.js');

// Import all exports from the unified Firebase module
export {
  auth,
  db,
  googleProvider,
  COL,
  RANKS,
  getRank,
  getRankId,
  getLevel,
  getRankProgress,
  uploadImage,
  deleteImageByURL,
  compressImage,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  addDoc,
  increment,
  writeBatch,
  documentId
} from '../src/js/core/firebase.js';
