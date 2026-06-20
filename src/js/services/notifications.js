/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — notifications.js
 * PHASE 1.3: DISABLED - Notifications collection not yet implemented
 * ============================================================
 *
 * TODO: Future implementation for in-app notifications
 * - Requires NOTIFICATIONS collection in Firestore
 * - Will handle: like, comment, follow, friend_request, message, etc.
 *
 * Current status: All functions disabled until Phase 2
 */

import { db, serverTimestamp } from "../core/firebase.js";

// ════════════════════════════════════════════════════════════
// STUB FUNCTIONS (disabled in Phase 1.3)
// ════════════════════════════════════════════════════════════

export async function createNotification(toUid, typeOrPayload, message = "", relatedUid = "", relatedData = {}) {
  console.warn('[notifications] createNotification disabled - notifications collection required');
  return false;
}

export function loadNotifications(uid, callback) {
  console.warn('[notifications] loadNotifications disabled - notifications collection required');
  if (callback) callback([]);
  return () => {};
}

export async function markNotificationAsRead(uid, notifId) {
  console.warn('[notifications] markNotificationAsRead disabled - notifications collection required');
  return false;
}

export async function markAllAsRead(uid) {
  console.warn('[notifications] markAllAsRead disabled - notifications collection required');
  return false;
}

export async function deleteNotification(uid, notifId) {
  console.warn('[notifications] deleteNotification disabled - notifications collection required');
  return false;
}

export async function getUnreadCount(uid) {
  console.warn('[notifications] getUnreadCount disabled - notifications collection required');
  return 0;
}

export function injectNotifBell(uid) {
  console.warn('[notifications] injectNotifBell disabled - notifications collection required');
  return null;
}

// TODO: Re-enable functions when NOTIFICATIONS collection is implemented in Phase 2
