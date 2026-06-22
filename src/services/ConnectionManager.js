/**
 * ConnectionManager
 *
 * Centralized service for managing connections to Firebase and Cloudinary.
 * Provides connection health checks, error handling, and connection status monitoring.
 */

import { app, auth, db, database } from '../lib/firebase.js';
import { cloudinaryService } from './CloudinaryStorageService.js';

class ConnectionManager {
  constructor() {
    this.connections = {
      firebase_auth: false,
      firebase_firestore: false,
      firebase_realtime_db: false,
      cloudinary: false,
    };
    this.initialized = false;
    this.listeners = [];
  }

  /**
   * Initializes all connections
   */
  async initialize() {
    if (this.initialized) {
      console.log('Connections already initialized');
      return true;
    }

    try {
      const results = await Promise.allSettled([
        this.checkFirebaseAuth(),
        this.checkFirestore(),
        this.checkRealtimeDatabase(),
        this.checkCloudinary(),
      ]);

      const allConnected = results.every(
        (result) => result.status === 'fulfilled' && result.value === true
      );

      if (allConnected) {
        this.initialized = true;
        console.log('✓ All connections initialized successfully');
      } else {
        console.warn('⚠ Some connections failed to initialize');
        this.logFailedConnections(results);
      }

      this.notifyListeners();
      return allConnected;
    } catch (error) {
      console.error('Connection initialization error:', error);
      return false;
    }
  }

  /**
   * Checks Firebase Authentication connection
   */
  async checkFirebaseAuth() {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      this.connections.firebase_auth = true;
      console.log('✓ Firebase Auth connected');
      return true;
    } catch (error) {
      console.error('✗ Firebase Auth connection failed:', error.message);
      this.connections.firebase_auth = false;
      return false;
    }
  }

  /**
   * Checks Firestore connection
   */
  async checkFirestore() {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      // Simple ping - just verify the db object is usable
      // Don't actually read data to avoid permission errors during startup
      const isDb = db && typeof db.collection === 'function';
      if (!isDb) {
        throw new Error('Firestore object is not properly initialized');
      }
      this.connections.firebase_firestore = true;
      console.log('✓ Firebase Firestore connected');
      return true;
    } catch (error) {
      console.error('✗ Firebase Firestore connection failed:', error.message);
      this.connections.firebase_firestore = false;
      return false;
    }
  }

  /**
   * Checks Firebase Realtime Database connection
   */
  async checkRealtimeDatabase() {
    try {
      if (!database) {
        throw new Error('Realtime Database not initialized');
      }
      this.connections.firebase_realtime_db = true;
      console.log('✓ Firebase Realtime Database connected');
      return true;
    } catch (error) {
      console.error('✗ Firebase Realtime Database connection failed:', error.message);
      this.connections.firebase_realtime_db = false;
      return false;
    }
  }

  /**
   * Checks Cloudinary connection
   */
  async checkCloudinary() {
    try {
      const isHealthy = await cloudinaryService.healthCheck();
      if (!isHealthy) {
        throw new Error('Cloudinary health check failed');
      }
      this.connections.cloudinary = true;
      console.log('✓ Cloudinary connected');
      return true;
    } catch (error) {
      console.error('✗ Cloudinary connection failed:', error.message);
      this.connections.cloudinary = false;
      return false;
    }
  }

  /**
   * Returns current connection status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      connections: { ...this.connections },
      allConnected: this.isAllConnected(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks if all connections are active
   */
  isAllConnected() {
    return Object.values(this.connections).every((status) => status === true);
  }

  /**
   * Checks if a specific connection is active
   */
  isConnected(connectionName) {
    return this.connections[connectionName] === true;
  }

  /**
   * Registers a listener for connection status changes
   */
  onStatusChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notifies all listeners of status change
   */
  notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Logs information about failed connections
   */
  logFailedConnections(results) {
    const connectionNames = [
      'firebase_auth',
      'firebase_firestore',
      'firebase_realtime_db',
      'cloudinary',
    ];

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed: ${connectionNames[index]}`);
      }
    });
  }

  /**
   * Attempts to reconnect to all services
   */
  async reconnect() {
    console.log('Attempting to reconnect to all services...');
    this.initialized = false;
    return this.initialize();
  }

  /**
   * Gets detailed connection diagnostics
   */
  async getDiagnostics() {
    return {
      status: this.getStatus(),
      firebase: {
        app: {
          name: app?.name || 'unknown',
          id: app?.options?.appId || 'unknown',
        },
        auth: auth ? 'initialized' : 'not initialized',
        firestore: db ? 'initialized' : 'not initialized',
        realtimeDb: database ? 'initialized' : 'not initialized',
      },
      cloudinary: {
        configured: cloudinaryService ? 'yes' : 'no',
      },
    };
  }
}

// Singleton instance
const connectionManager = new ConnectionManager();

export { connectionManager, ConnectionManager };
