# Firebase Configuration Verification

## Critical Configuration Check

### Firebase Config (src/js/core/firebase.js)
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98",
  authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com",
  projectId: "weekend-warrior-social-ed3d0",
  messagingSenderId: "487311448505",
  appId: "1:487311448505:web:ffbe035b92efa8fc193e68",
};
```

### Authorized Domains Required in Firebase Console

These domains MUST be added to Firebase Console > Authentication > Settings > Authorized domains:

```
1. weekend-warrior-social-ed3d0.web.app
2. weekend-warrior-social-ed3d0.firebaseapp.com
3. bvt2kzkbb9-art.github.io
4. localhost
```

**Status:** ⚠️ If `auth/requests-from-referer-blocked` error appears, these domains are missing.

### Email/Password Authentication

Must be ENABLED in Firebase Console > Authentication > Sign-in method

**Required settings:**
- ✅ Email/Password sign-in enabled
- ✅ Email link (passwordless) - optional
- ✅ Email enumeration protection - enabled

### Firestore Database

Must exist and be in production mode:
- Location: `europe-west1` or regional
- Mode: Native (not Datastore)
- Status: Production

### Firestore Rules

Must be deployed from `firestore.rules`

**Test in Rules Playground:**
```
Collection: users
Document ID: (use any uid)
Operation: Create
Data:
{
  "uid": "test-uid",
  "email": "test@test.com",
  "username": "testuser",
  "xp": 0,
  "level": 1,
  "rank": "Rookie",
  "streak": 0,
  "online": true,
  "createdAt": now,
  "updatedAt": now,
  "lastSeen": now
}
```

Should show: ✓ Allow

### Service Account (GitHub Actions)

Required for deployment:
```
Email: firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com
```

Roles:
- `roles/firebase.admin` OR
- `roles/firebase.rulesAdmin` + `roles/firestore.admin`

### GitHub Actions Secrets

Required for deployment:

```
GOOGLE_APPLICATION_CREDENTIALS: (Service account JSON - full)
```

Format:
```json
{
  "type": "service_account",
  "project_id": "weekend-warrior-social-ed3d0",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Quick Verification Checklist

- [ ] Firebase Console - https://console.firebase.google.com/project/weekend-warrior-social-ed3d0
  - [ ] Authorized domains include weekend-warrior-social-ed3d0.web.app
  - [ ] Email/Password authentication ENABLED
  - [ ] Firestore Database exists
  - [ ] Firestore Rules deployed (show timestamp)

- [ ] GitHub Secrets - https://github.com/bvt2kzkbb9-art/weekend-warrior-social/settings/secrets/actions
  - [ ] GOOGLE_APPLICATION_CREDENTIALS set (full JSON)

- [ ] Deployment
  - [ ] Latest deploy-hosting.yml run SUCCESS
  - [ ] Pages.yml run SUCCESS
  - [ ] Deploy-firestore-rules.yml run SUCCESS

- [ ] Firebase Hosting
  - [ ] https://weekend-warrior-social-ed3d0.web.app returns HTTP 200
  - [ ] https://weekend-warrior-social-ed3d0.web.app/login.html returns HTTP 200
  - [ ] https://weekend-warrior-social-ed3d0.web.app/register.html returns HTTP 200

- [ ] GitHub Pages
  - [ ] https://bvt2kzkbb9-art.github.io/weekend-warrior-social/ returns HTTP 200
  - [ ] Links work correctly (relative paths)
  - [ ] Assets load (CSS, JS, images)

## Common Issues & Fixes

### `auth/requests-from-referer-blocked`

**Cause:** Domain not in Authorized Domains

**Fix:**
1. Firebase Console > Authentication > Settings
2. Find "Authorized domains"
3. Add: `weekend-warrior-social-ed3d0.web.app`
4. Save
5. Wait 2-5 minutes
6. Clear cache + hard refresh

### `auth/operation-not-allowed`

**Cause:** Email/Password authentication disabled

**Fix:**
1. Firebase Console > Authentication > Sign-in method
2. Find "Email/Password"
3. Click to expand
4. Enable Email/Password
5. Save

### `permission-denied` (Firestore)

**Cause:** Rules blocking operation or user not authenticated

**Fix:**
1. Verify user is authenticated
2. Test rules in Rules Playground
3. Verify Firestore Rules are deployed
4. Check user is owner (for create operations)

### Deployment failing with authentication error

**Cause:** Service account not properly authenticated

**Fix:**
1. Verify GOOGLE_APPLICATION_CREDENTIALS secret is full JSON (not truncated)
2. Verify service account has correct roles in IAM
3. Check GitHub Actions workflow uses proper auth step:

```yaml
- uses: google-github-actions/auth@v1
  with:
    credentials_json: ${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}
```

## Testing Without Deployment

### Test Auth Config Locally

```javascript
// In browser console
import { auth } from './src/js/core/firebase.js';
console.log('Auth config:', auth.config);
console.log('Hostname:', window.location.hostname);

// Should show projectId and authDomain matching Firebase Console
```

### Test Firestore Rules

Go to: Firebase Console > Firestore Database > Rules

Click "Rules Playground" (top right)

Test:
- Operation: Create
- Collection: users
- Document: {uid}
- Data: (see above)

Should show: ✓ Allow

## Final Checklist

- [ ] Firebase config matches Firebase Console
- [ ] Authorized domains include all hosting platforms
- [ ] Email/Password authentication enabled
- [ ] Firestore Database exists and rules deployed
- [ ] Service account has correct permissions
- [ ] GitHub Actions secrets set correctly
- [ ] Deploy workflow runs successfully
- [ ] Hosting URLs return HTTP 200
- [ ] All auth flows tested (register, login, logout)
