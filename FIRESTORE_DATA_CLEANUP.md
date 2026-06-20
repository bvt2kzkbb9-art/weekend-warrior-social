# 🔧 Firestore Data Cleanup & Migration Guide

**Status:** 🔴 CORRUPTED DATA FOUND  
**Severity:** HIGH - Data structure integrity issue  
**Date:** 2026-06-20  
**Action:** Automatic cleanup available

---

## 🚨 Problem Identified

Firestore documents contain **mixed old and new field names**, causing data inconsistency:

### ❌ Current (Corrupted) Document Structure
```javascript
{
  createdAt: Timestamp,
  displayName: "michaal",        // ❌ OLD FIELD
  email: "michaal.kulig@...",
  lastSeen: Timestamp,
  level: 2,
  online: true,
  photoURL: "",                  // ❌ OLD FIELD
  points: 965,                   // ❌ OLD FIELD (should be xp)
  uid: "5XOdrhFLQFkcfaa...",
  username: "Michao...",         // ✅ NEW FIELD
}
```

**Issues:**
- `points` (965) should be `xp`
- `displayName` conflicts with `username`
- `photoURL` shouldn't exist
- Missing: `rank`, `streak`, `updatedAt`

### ✅ Correct Document Structure
```javascript
{
  uid: "5XOdrhFLQFkcfaa...",
  email: "michaal.kulig@gmail.com",
  username: "michao",
  xp: 965,
  level: 2,
  rank: "Warrior",
  streak: 0,
  online: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastSeen: Timestamp,
}
```

---

## ✅ Automatic Cleanup

### Option 1: GitHub Actions (Easiest)

1. Go to: https://github.com/bvt2kzkbb9-art/weekend-warrior-social/actions

2. Find workflow: **"Cleanup Firestore Data"**

3. Click **"Run workflow"** → **"Run workflow"**

4. Watch progress (usually 1-2 minutes)

5. Check results in the workflow logs

**Status:** ✅ All documents cleaned automatically

---

### Option 2: Manual Cleanup (Requires Node.js)

#### Prerequisites:
```bash
# Install dependencies
npm install firebase-admin

# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

#### Run migration:
```bash
node scripts/migrate-firestore-data.js
```

#### Expected output:
```
[Firestore Migration] Starting data cleanup...
[Firestore Migration] Found 1 documents

  🔄 5XOdrhFLQFkcfaa... - Cleaning...
  ✅ 5XOdrhFLQFkcfaa... - Migrated successfully
     └─ username: michao, xp: 965, level: 2, rank: Warrior

[Firestore Migration] ========== MIGRATION SUMMARY ==========
[Firestore Migration] Total documents: 1
[Firestore Migration] Already clean: 0
[Firestore Migration] Migrated: 1
[Firestore Migration] Errors: 0

[Firestore Migration] ✅ Migration complete!
```

---

## 🔍 What the Cleanup Does

### Conversion Rules:

| Old Field | New Field | Logic |
|-----------|-----------|-------|
| `points` | `xp` | Direct copy |
| `displayName` | `username` | Convert or use email prefix |
| (remove) | (remove) | `photoURL`, `bannerURL`, `bio`, `lastLoginAt`, `avatar` |
| (auto) | `level` | `Math.floor(xp / 500) + 1` |
| (auto) | `rank` | Based on XP thresholds |
| (auto) | `updatedAt` | Current server timestamp |

### Rank Calculation:
```javascript
xp >= 10000  → "Legend" 👑
xp >= 2000   → "Champion" 🥇
xp >= 500    → "Warrior" 🥈
xp < 500     → "Rookie" 🥉
```

---

## 📋 Verification

After cleanup, verify the data:

### In Firebase Console:
1. Go to: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore
2. Click on `collections` → `users`
3. Check any document
4. Verify it has ONLY these fields:
   - ✅ uid
   - ✅ email
   - ✅ username
   - ✅ xp
   - ✅ level
   - ✅ rank
   - ✅ streak
   - ✅ online
   - ✅ createdAt
   - ✅ updatedAt
   - ✅ lastSeen

### In Browser Console:
```javascript
// Check current user data structure
import { getCurrentUserData } from './src/js/core/auth.js';
const data = await getCurrentUserData('USER_UID_HERE');
console.log(data);

// Should show:
// {
//   uid: "...",
//   email: "...",
//   username: "...",
//   xp: number,
//   level: number,
//   rank: "Rookie|Warrior|Champion|Legend",
//   streak: number,
//   online: boolean,
//   createdAt: Timestamp,
//   updatedAt: Timestamp,
//   lastSeen: Timestamp
// }
```

---

## 🛡️ Prevention (Going Forward)

### New Registration Code:
The updated `registerWithEmail()` function now:
- ✅ Creates documents with ONLY new field names
- ✅ Validates data structure before saving
- ✅ Logs all field creation steps
- ✅ Prevents old field names from being introduced

### New Migration Code:
The updated `migrateUserDoc()` function now:
- ✅ Detects old field names automatically
- ✅ Converts old data to new structure
- ✅ Recalculates rank and level
- ✅ Removes corrupted fields
- ✅ Logs all changes made

---

## 📊 Data Integrity Checklist

After running cleanup:

- [ ] All documents have `username` (not `displayName`)
- [ ] All documents have `xp` (not `points`)
- [ ] All documents have `rank` (calculated from xp)
- [ ] All documents have `level` (calculated from xp)
- [ ] No documents have `photoURL` or `bannerURL`
- [ ] No documents have `displayName`
- [ ] No documents have `bio`
- [ ] No documents have `lastLoginAt`
- [ ] No documents have `avatar`
- [ ] All documents have `createdAt`, `updatedAt`, `lastSeen` timestamps
- [ ] All documents have `uid`, `email`, `username`, `xp`, `level`, `rank`, `streak`, `online`

---

## 🚀 Next Steps

1. **Run the cleanup** (GitHub Actions or manual)
2. **Verify** in Firebase Console
3. **Test login** on the application
4. **Monitor** console logs for data structure errors
5. **Ensure** all future registrations use new structure

---

## 🔧 Troubleshooting

### "Firebase Admin SDK not found"
```bash
npm install firebase-admin
```

### "GOOGLE_APPLICATION_CREDENTIALS not set"
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### "Permission denied"
Verify service account has:
- `roles/firestore.admin` OR
- `roles/datastore.admin`

Check: https://console.cloud.google.com/iam-admin/iam?project=weekend-warrior-social-ed3d0

### "Cleanup failed for some documents"
Check the error message and:
1. Verify Firestore Rules allow updates
2. Verify document IDs are valid
3. Try cleanup again

---

## 📞 Support

If cleanup fails:
1. Check the error message in workflow logs
2. Verify credentials are correct
3. Ensure Firestore Rules allow updates
4. Open GitHub issue with error details

---

**Last Updated:** 2026-06-20  
**Impact:** HIGH - Affects all user data  
**Timeline:** Cleanup should take < 5 minutes
