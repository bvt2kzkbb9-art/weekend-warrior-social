/**
 * ConnectionManager Tests
 *
 * Verifies that the connection manager properly monitors
 * Firebase and Cloudinary service health.
 */

import { ConnectionManager } from '../ConnectionManager.js';

describe('ConnectionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ConnectionManager();
  });

  test('should initialize with all connections false', () => {
    const status = manager.getStatus();
    expect(status.connections.firebase_auth).toBe(false);
    expect(status.connections.firebase_firestore).toBe(false);
    expect(status.connections.firebase_realtime_db).toBe(false);
    expect(status.connections.cloudinary).toBe(false);
    expect(status.initialized).toBe(false);
  });

  test('should return false for isAllConnected if any connection fails', () => {
    manager.connections.firebase_auth = true;
    manager.connections.firebase_firestore = false;
    expect(manager.isAllConnected()).toBe(false);
  });

  test('should return true for isAllConnected if all connections pass', () => {
    manager.connections.firebase_auth = true;
    manager.connections.firebase_firestore = true;
    manager.connections.firebase_realtime_db = true;
    manager.connections.cloudinary = true;
    expect(manager.isAllConnected()).toBe(true);
  });

  test('should check specific connection status', () => {
    manager.connections.firebase_auth = true;
    expect(manager.isConnected('firebase_auth')).toBe(true);
    expect(manager.isConnected('cloudinary')).toBe(false);
  });

  test('should notify listeners on status change', (done) => {
    let notificationReceived = false;

    manager.onStatusChange((status) => {
      notificationReceived = true;
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('connections');
      done();
    });

    manager.notifyListeners();
    expect(notificationReceived).toBe(true);
  });

  test('should allow unsubscribing from status changes', () => {
    let callCount = 0;
    const listener = () => callCount++;

    const unsubscribe = manager.onStatusChange(listener);
    manager.notifyListeners();
    expect(callCount).toBe(1);

    unsubscribe();
    manager.notifyListeners();
    expect(callCount).toBe(1); // Should not increment
  });

  test('should return current status with timestamp', () => {
    const status = manager.getStatus();
    expect(status).toHaveProperty('timestamp');
    expect(new Date(status.timestamp)).toBeInstanceOf(Date);
  });

  test('should include Firebase app diagnostics', async () => {
    const diagnostics = await manager.getDiagnostics();
    expect(diagnostics).toHaveProperty('status');
    expect(diagnostics).toHaveProperty('firebase');
    expect(diagnostics.firebase).toHaveProperty('auth');
    expect(diagnostics.firebase).toHaveProperty('firestore');
    expect(diagnostics.firebase).toHaveProperty('realtimeDb');
  });

  test('should include Cloudinary diagnostics', async () => {
    const diagnostics = await manager.getDiagnostics();
    expect(diagnostics).toHaveProperty('cloudinary');
    expect(diagnostics.cloudinary).toHaveProperty('configured');
  });
});
