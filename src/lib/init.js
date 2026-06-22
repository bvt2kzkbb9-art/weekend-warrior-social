/**
 * Application initialization module
 * Sets up Firebase, Cloudinary, and services when the app starts
 */

import { db } from './firebase.js';
import { firestoreService } from '../services/FirestoreService.js';
import { authService } from '../services/AuthService.js';
import { connectionManager } from '../services/ConnectionManager.js';

let initialized = false;

export async function initializeApp() {
  if (initialized) return;

  try {
    // Initialize connections to Firebase and Cloudinary
    const connectionsReady = await connectionManager.initialize();

    if (!connectionsReady) {
      console.warn('Warning: Not all external connections are ready, but continuing with app initialization');
    }

    // Initialize Firestore service
    firestoreService.initialize(db);

    // Initialize auth listener to track session changes
    authService.initializeAuthListener((user) => {
      if (user) {
        console.log('User authenticated:', user.email);
      } else {
        console.log('User logged out');
      }
    });

    initialized = true;
    console.log('✓ Application initialized successfully');
  } catch (error) {
    console.error('✗ Application initialization failed:', error);
    throw error;
  }
}

export function isInitialized() {
  return initialized;
}

export function getConnectionStatus() {
  return connectionManager.getStatus();
}
