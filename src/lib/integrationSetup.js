/**
 * Firebase & Cloudinary Integration Setup
 *
 * Helper functions for setting up and managing Firebase and Cloudinary connections.
 * This module provides utilities for connection testing, diagnostics, and configuration.
 */

import { connectionManager } from '../services/ConnectionManager.js';
import { envValidator } from './envValidator.js';

/**
 * Sets up and validates both Firebase and Cloudinary connections
 */
export async function setupConnections() {
  console.log('\n🔧 Setting up Firebase and Cloudinary connections...\n');

  // Validate environment variables
  envValidator.logReport();

  // Initialize connections
  const initialized = await connectionManager.initialize();

  if (initialized) {
    console.log('\n✓ All connections initialized successfully!\n');
  } else {
    console.warn(
      '\n⚠ Some connections are not available. Check the logs above.\n'
    );
  }

  return initialized;
}

/**
 * Gets a comprehensive status of all connections
 */
export function getConnectionDiagnostics() {
  return {
    status: connectionManager.getStatus(),
    validation: envValidator.validate(),
  };
}

/**
 * Logs detailed diagnostics to console
 */
export async function logDiagnostics() {
  console.log('\n📊 Connection Diagnostics\n');

  const diagnostics = await connectionManager.getDiagnostics();
  console.log('Status:', diagnostics.status);
  console.log('Firebase:', diagnostics.firebase);
  console.log('Cloudinary:', diagnostics.cloudinary);

  const validation = envValidator.validate();
  if (validation.errors.length > 0) {
    console.error('Validation Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.warn('Validation Warnings:', validation.warnings);
  }
}

/**
 * Monitors connection health and logs changes
 */
export function monitorConnections(onStatusChange) {
  return connectionManager.onStatusChange((status) => {
    onStatusChange(status);
  });
}

/**
 * Tests a single connection
 */
export async function testConnection(connectionName) {
  console.log(`Testing connection: ${connectionName}...`);

  const status = connectionManager.getStatus();

  if (status.connections[connectionName] !== undefined) {
    const isConnected = status.connections[connectionName];
    console.log(`${connectionName}: ${isConnected ? '✓ Connected' : '✗ Disconnected'}`);
    return isConnected;
  } else {
    console.error(`Unknown connection: ${connectionName}`);
    return false;
  }
}

/**
 * Attempts to reconnect to all services
 */
export async function reconnectAll() {
  console.log('\n🔄 Reconnecting to all services...\n');
  const success = await connectionManager.reconnect();

  if (success) {
    console.log('\n✓ Successfully reconnected to all services!\n');
  } else {
    console.warn('\n⚠ Some services failed to reconnect. Check logs above.\n');
  }

  return success;
}

/**
 * Prints connection status in a formatted way
 */
export function printConnectionStatus() {
  const status = connectionManager.getStatus();
  const connections = status.connections;

  console.log('\n📡 Connection Status:\n');
  console.log(
    `  Firebase Auth:          ${connections.firebase_auth ? '✓' : '✗'}`
  );
  console.log(
    `  Firebase Firestore:     ${connections.firebase_firestore ? '✓' : '✗'}`
  );
  console.log(
    `  Firebase Realtime DB:   ${connections.firebase_realtime_db ? '✓' : '✗'}`
  );
  console.log(`  Cloudinary:             ${connections.cloudinary ? '✓' : '✗'}`);
  console.log(
    `\n  Overall Status:         ${status.allConnected ? '✓ All Connected' : '⚠ Some Disconnected'}\n`
  );
}

export default {
  setupConnections,
  getConnectionDiagnostics,
  logDiagnostics,
  monitorConnections,
  testConnection,
  reconnectAll,
  printConnectionStatus,
};
