#!/usr/bin/env node
/**
 * Firestore Data Migration Script
 * Cleans up corrupted documents with mixed old/new field names
 *
 * Usage: node scripts/migrate-firestore-data.js
 * Requires: GOOGLE_APPLICATION_CREDENTIALS set or Firebase CLI authenticated
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'weekend-warrior-social-ed3d0';

console.log('[Firestore Migration] Starting data cleanup...');
console.log('[Firestore Migration] Project:', PROJECT_ID);
console.log('[Firestore Migration] Time:', new Date().toISOString());

// Initialize Firebase Admin SDK
let db;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('[Firestore Migration] Using service account from GOOGLE_APPLICATION_CREDENTIALS');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
    });
  } else if (fs.existsSync(path.join(process.env.HOME, '.config/gcloud/application_default_credentials.json'))) {
    console.log('[Firestore Migration] Using gcloud default credentials');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
    });
  } else {
    console.log('[Firestore Migration] No credentials found. Using emulator or relying on FIREBASE_CONFIG');
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }
  db = admin.firestore();
  console.log('[Firestore Migration] Firebase initialized successfully');
} catch (err) {
  console.error('[Firestore Migration] Error initializing Firebase:', err.message);
  process.exit(1);
}

/**
 * Rank determination based on XP
 */
function getRankForXp(xp) {
  const xpNum = Number(xp) || 0;
  if (xpNum >= 10000) return "Legend";
  if (xpNum >= 2000) return "Champion";
  if (xpNum >= 500) return "Warrior";
  return "Rookie";
}

/**
 * Level calculation based on XP
 */
function getLevelForXp(xp) {
  return Math.floor((Number(xp) || 0) / 500) + 1;
}

/**
 * Clean single user document
 */
async function cleanUserDocument(docId, data) {
  try {
    // Check if migration is needed
    const hasOldFields = data.points !== undefined ||
                         data.displayName !== undefined ||
                         data.photoURL !== undefined ||
                         data.bannerURL !== undefined ||
                         data.bio !== undefined ||
                         data.lastLoginAt !== undefined ||
                         data.avatar !== undefined;

    if (!hasOldFields && data.xp !== undefined && data.username !== undefined) {
      console.log(`  ✓ ${docId} - Already clean`);
      return { status: 'clean', docId };
    }

    console.log(`  🔄 ${docId} - Cleaning...`);

    // Determine XP value
    const xp = data.xp !== undefined ? data.xp : (data.points || 0);

    // Determine username
    const username = data.username || data.displayName || data.email?.split('@')[0] || 'Warrior';

    // Create clean document
    const cleanData = {
      uid: data.uid || docId,
      email: data.email,
      username: username,
      xp: xp,
      level: getLevelForXp(xp),
      rank: getRankForXp(xp),
      streak: data.streak !== undefined ? data.streak : 0,
      online: data.online !== undefined ? data.online : true,
      createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: data.lastSeen || admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update document
    const userRef = db.collection('users').doc(docId);
    await userRef.update(cleanData);

    console.log(`  ✅ ${docId} - Migrated successfully`);
    console.log(`     └─ username: ${username}, xp: ${xp}, level: ${cleanData.level}, rank: ${cleanData.rank}`);

    return { status: 'migrated', docId, changes: { xp, username, rank: cleanData.rank } };
  } catch (err) {
    console.error(`  ❌ ${docId} - Error:`, err.message);
    return { status: 'error', docId, error: err.message };
  }
}

/**
 * Main migration function
 */
async function migrateAll() {
  try {
    console.log('\n[Firestore Migration] Fetching all user documents...');

    const snapshot = await db.collection('users').get();
    const totalDocs = snapshot.size;

    console.log(`[Firestore Migration] Found ${totalDocs} documents\n`);

    if (totalDocs === 0) {
      console.log('[Firestore Migration] No documents to migrate');
      return;
    }

    const results = [];
    const batchSize = 10;
    let processed = 0;

    // Process documents in batches
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = snapshot.docs.slice(i, i + batchSize);
      const batchPromises = batch.map(doc => cleanUserDocument(doc.id, doc.data()));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      processed += batch.length;

      // Show progress
      const progressPercent = Math.round((processed / totalDocs) * 100);
      console.log(`[Progress] ${processed}/${totalDocs} (${progressPercent}%)`);
    }

    // Summary
    console.log('\n[Firestore Migration] ========== MIGRATION SUMMARY ==========');
    const summary = {
      total: results.length,
      clean: results.filter(r => r.status === 'clean').length,
      migrated: results.filter(r => r.status === 'migrated').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    console.log(`[Firestore Migration] Total documents: ${summary.total}`);
    console.log(`[Firestore Migration] Already clean: ${summary.clean}`);
    console.log(`[Firestore Migration] Migrated: ${summary.migrated}`);
    console.log(`[Firestore Migration] Errors: ${summary.errors}`);

    if (summary.errors > 0) {
      console.log('\n[Firestore Migration] Failed documents:');
      results.filter(r => r.status === 'error').forEach(r => {
        console.log(`  - ${r.docId}: ${r.error}`);
      });
    }

    console.log('\n[Firestore Migration] ✅ Migration complete!');

  } catch (err) {
    console.error('[Firestore Migration] Fatal error:', err);
    process.exit(1);
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run migration
migrateAll().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
