# Firebase Firestore Composite Indexes Required

This document lists all composite indexes that must be created in the Firebase Console for the application to function properly.

## Collection: challenge_invites

### Index 1: Received Challenges
- **Fields:** targetId (Ascending), status (Ascending)
- **Used by:** `js/challenge-system.js` line 596-597
- **Query:** Filter challenges received by user with status in [pending, quiz_pending, active]
- **Creation:** Firebase Console → Firestore → Indexes → Create Index
  - Collection: challenge_invites
  - Fields: targetId (Asc), status (Asc)
  - Scope: Collection

### Index 2: Active Challenges for User
- **Fields:** targetId (Ascending), status (Ascending)
- **Used by:** `js/challenge-system.js` line 1076-1077
- **Query:** Filter active challenges received by user
- **Note:** Same as Index 1 if 'in' operator and '==' operator use same field order

### Index 3: Completed/Rejected by Target
- **Fields:** targetId (Ascending), status (Ascending)
- **Used by:** `js/challenge-system.js` line 1148
- **Query:** Filter completed/rejected challenges received by user

### Index 4: Completed/Rejected by Challenger
- **Fields:** challengerId (Ascending), status (Ascending)
- **Used by:** `js/challenge-system.js` line 1149
- **Query:** Filter completed/rejected challenges issued by user

## How to Create Indexes

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Fill in Collection, Fields, and Scope as specified above
6. Click "Create"

**Note:** Firebase will automatically suggest index creation when a composite query fails with a permission error. The error message will include a direct link to create the required index.

## Implementation Notes

- All indexes use Ascending sort order
- Scope is always "Collection" (not sub-collection)
- The 'in' operator in Firestore still requires the same composite index as '==' operator for the same fields
- Once created, indexes typically become available within a few minutes
