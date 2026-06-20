/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — messaging.js
 * PHASE 1.3: DISABLED - Conversations and Messages collections not yet implemented
 * ============================================================
 *
 * TODO: Future implementation for in-app messaging
 * - Requires CONVERSATIONS and MESSAGES collections in Firestore
 * - Will handle: real-time chat, online presence, message history
 *
 * Current status: All functions disabled until Phase 2
 */

import { db, serverTimestamp } from "../core/firebase.js";

// ════════════════════════════════════════════════════════════
// STUB FUNCTIONS (disabled in Phase 1.3)
// ════════════════════════════════════════════════════════════

export function initMessenger(uid) {
  console.warn('[messenger] initMessenger disabled - CONVERSATIONS and MESSAGES collections required');
  return () => {};
}

export async function setOnlinePresence(uid, online) {
  console.warn('[messenger] setOnlinePresence disabled - CONVERSATIONS and MESSAGES collections required');
  return false;
}

// TODO: Re-enable functions when CONVERSATIONS and MESSAGES collections are implemented in Phase 2
