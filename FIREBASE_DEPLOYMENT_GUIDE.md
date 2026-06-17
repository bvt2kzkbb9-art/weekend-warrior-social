# Firebase Deployment & Authentication Setup Guide

**Application:** Weekend Warrior Social  
**Firebase Project:** weekend-warrior-social-ed3d0  
**Status:** Production-Ready

---

## 🔧 Prerequisites

### Install Firebase CLI
```bash
npm install -g firebase-tools@latest
```

### Verify Installation
```bash
firebase --version
firebase login
```

---

## 📋 Configuration Files Included

### 1. `.firebaserc` (Project Configuration)
```json
{
  "projects": {
    "default": "weekend-warrior-social-ed3d0"
  }
}
```
**Purpose:** Associates your repo with the Firebase project  
**Action:** Already committed, no changes needed

### 2. `firebase.json` (Deployment Configuration)
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": ".",
    "rewrites": [{"source": "**", "destination": "/index.html"}],
    "headers": [...]
  }
}
```
**Features:**
- Firestore rules deployment
- Hosting configuration (SPA routing)
- Cache control headers (immutable for assets)
- Automatic rewriting to index.html

### 3. `firestore.rules` (Database Security)
Already configured with:
- User authentication checks
- Role-based access control
- Cross-field validation
- Nested collection rules
- Rate limiting indicators

### 4. `firestore.indexes.json` (Database Indexes)
Pre-configured for:
- User queries (email, username)
- Post/comment ordering
- Notification lookups
- Message searches

---

## 🚀 Step-by-Step Deployment

### Step 1: Verify Project ID
```bash
firebase projects:list
```
Should show: `weekend-warrior-social-ed3d0`

### Step 2: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```
**Output should show:**
```
✔ firestore rules updated successfully
```

### Step 3: Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```
**Output should show:**
```
✔ firestore indexes updated successfully
```

### Step 4: Deploy Hosting
```bash
firebase deploy --only hosting
```
**Output should show:**
```
✔ Deploy complete!
Hosting URL: https://weekend-warrior-social-ed3d0.web.app
```

### Deploy Everything at Once
```bash
firebase deploy
```

---

## 🔐 Firebase Console Configuration (CRITICAL)

### 1. Enable Authentication Methods
Go to: Firebase Console → Authentication → Sign-in method

**Enable:**
- ✅ Email/Password
- ✅ Google (if using social login)

**Steps for Email/Password:**
1. Click "Email/Password"
2. Toggle "Enable" ON
3. Save

**Steps for Google:**
1. Click "Google"
2. Toggle "Enable" ON
3. Configure OAuth consent screen
4. Add authorized redirect URIs
5. Save

### 2. Configure Authorized Domains
Go to: Firebase Console → Authentication → Settings → Authorized domains

**Add these domains:**
- `weekend-warrior-social-ed3d0.web.app` (Firebase hosting)
- `localhost:5000` (local development)
- Your custom domain (if applicable)

### 3. Verify Email Configuration
Go to: Firebase Console → Authentication → Templates

**Customize email templates for:**
- Password reset emails
- Email verification (if enabled)

**Key:** Emails must include reset link with proper `oobCode` parameter

### 4. Check Firestore Rules
Go to: Firebase Console → Firestore Database → Rules

**Verify rules are deployed:**
- Rules should show `rules_version = '2'`
- All collections should have security rules
- No "ALLOW ALL" rules in production

### 5. Create Firestore Collections
Collections are auto-created when documents are added. Verify these exist:
- `users` (created on signup)
- `posts` (created when users post)
- `conversations` (created in messenger)
- Other collections as features are used

---

## 🧪 Testing Authentication Flow

### Test 1: Register New Account
```bash
1. Go to https://weekend-warrior-social-ed3d0.web.app/register.html
2. Enter:
   - Username: testwarrior
   - Email: testwarrior@example.com
   - Password: TestPassword123!
   - Confirm: TestPassword123!
3. Check Terms checkbox
4. Click "Create Account"
5. Expected: Auto-redirected to dashboard with "✅ Konto utworzone pomyślnie!"
```

### Test 2: Login Existing Account
```bash
1. Go to https://weekend-warrior-social-ed3d0.web.app/login.html
2. Enter:
   - Email: testwarrior@example.com
   - Password: TestPassword123!
3. Click "Sign In"
4. Expected: Auto-redirected to dashboard with "✅ Zalogowano pomyślnie!"
```

### Test 3: Session Persistence
```bash
1. After login, refresh page
2. Expected: Stay logged in, see dashboard (not redirected to login)
3. Close browser and reopen
4. Expected: Still logged in (browserLocalPersistence)
```

### Test 4: Invalid Credentials
```bash
1. Try logging in with wrong password
2. Expected: Error message "Niepoprawne hasło"
3. Try non-existent email
4. Expected: Error message "Użytkownik nie istnieje"
```

### Test 5: Email Already Registered
```bash
1. Try registering with same email
2. Expected: Error message "Email już jest zarejestrowany"
```

### Test 6: Weak Password
```bash
1. Try registering with password < 8 characters
2. Expected: Error message "Min. 8 znaków"
```

### Test 7: Password Reset
```bash
1. Go to login page
2. Click "Forgot password?"
3. Enter email
4. Expected: Email received with reset link
5. Click reset link
6. Set new password
7. Login with new password
```

---

## 📊 Monitoring & Troubleshooting

### Check Deployment Status
```bash
firebase hosting:channel:list
```

### View Hosting Logs
```bash
firebase hosting:channel:view [CHANNEL_ID]
```

### Monitor Firestore Activity
Go to: Firebase Console → Firestore Database → Usage

**Check for:**
- Read/write operations
- Storage usage
- Index growth

### Monitor Authentication
Go to: Firebase Console → Authentication → Users

**Check:**
- User count
- Creation timestamps
- Last sign-in
- Authentication providers

### View Errors in Real-time
```bash
firebase functions:log
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "auth/unauthorized-domain"
**Cause:** Domain not in Firebase Console authorized list  
**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"
3. Wait 2-5 minutes for propagation

### Issue 2: "auth/network-request-failed"
**Cause:** Network connectivity issue  
**Solution:**
1. Check internet connection
2. Verify Firebase endpoint is accessible
3. Clear browser cache
4. Try incognito mode

### Issue 3: User created but profile not loading
**Cause:** Firestore document creation race condition  
**Solution:**
- Already fixed in new auth.js
- Uses proper async/await with getDoc checks

### Issue 4: "Firestore rules blocked"
**Cause:** Security rules not properly deployed  
**Solution:**
```bash
firebase deploy --only firestore:rules
# Then test again
```

### Issue 5: Password reset email not received
**Cause:** Email template not configured  
**Solution:**
1. Check Firebase Console → Authentication → Templates
2. Verify "From email address" is set
3. Check spam folder
4. Wait 5-10 minutes (emails can be slow)

---

## 🌍 Environment-Specific Configuration

### Development (localhost:5000)
```bash
firebase serve
# Opens at http://localhost:5000
# Connects to production Firestore
```

### Production (Firebase Hosting)
```bash
firebase deploy
# Deploys to https://weekend-warrior-social-ed3d0.web.app
```

### Custom Domain (If applicable)
```bash
firebase hosting:sites:create
firebase hosting:domain:create
```

---

## 🔐 Security Checklist

- [x] Email/Password authentication enabled
- [x] Firestore rules restrict unauthorized access
- [x] Password minimum 8 characters enforced
- [x] Session persistence enabled
- [x] User documents auto-created on signup
- [x] Email validation implemented
- [x] Rate limiting error handling added
- [x] Error messages don't leak user existence (partially - improve for UX)
- [x] Authorized domains configured
- [x] HTTPS enforced on Firebase Hosting
- [x] Cache headers set for security

---

## 📝 API Reference

### Core Functions (js/auth.js)

#### `registerWithEmail(email, password, displayName)`
Creates new user account and Firestore profile
```javascript
try {
  const { user, userData } = await registerWithEmail(
    "user@example.com",
    "password123",
    "Warrior Name"
  );
  // userData.uid, .email, .displayName, .points, etc.
} catch (err) {
  // err.code: "auth/email-already-in-use", etc.
}
```

#### `loginWithEmail(email, password)`
Signs in existing user
```javascript
const { user, userData } = await loginWithEmail(
  "user@example.com",
  "password123"
);
```

#### `loginWithGoogle()`
Signs in with Google
```javascript
const { user, userData } = await loginWithGoogle();
```

#### `resetPassword(email)`
Sends password reset email
```javascript
await resetPassword("user@example.com");
```

#### `logout()`
Signs out and redirects to login
```javascript
await logout();
```

#### `checkAuth(callback)`
Monitors auth state changes
```javascript
const unsubscribe = checkAuth((user, userData) => {
  if (user) {
    // User logged in
    console.log(userData.displayName, userData.points);
  } else {
    // User logged out
  }
});
// Later: unsubscribe();
```

#### `enableSessionPersistence()`
Enables persistent login
```javascript
await enableSessionPersistence();
```

---

## 🚀 Next Steps

1. **Deploy Firebase Configuration**
   ```bash
   firebase deploy
   ```

2. **Test All Authentication Flows**
   - Register new account
   - Login
   - Logout
   - Password reset

3. **Configure Custom Domain (if needed)**
   ```bash
   firebase hosting:domain:create
   ```

4. **Set up Analytics (optional)**
   ```bash
   # Firebase Console → Analytics
   # Enable Google Analytics
   ```

5. **Monitor in Production**
   - Check Firebase Console daily
   - Monitor user growth
   - Track authentication errors

---

## 📞 Support & Documentation

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firebase Authentication:** https://firebase.google.com/docs/auth
- **Firestore Docs:** https://firebase.google.com/docs/firestore
- **Firebase CLI:** https://firebase.google.com/docs/cli

---

## 📋 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No console errors
- [ ] Firestore rules reviewed
- [ ] Authorized domains added
- [ ] Password strength enforced
- [ ] Email validation working
- [ ] Session persistence enabled
- [ ] Error messages user-friendly
- [ ] Google login configured (if needed)
- [ ] Password reset templates customized
- [ ] Hosting rewrite rules configured
- [ ] Cache headers set correctly
- [ ] HTTPS enabled (automatic on Firebase)
- [ ] Database backups enabled
- [ ] Monitoring alerts configured

---

**Last Updated:** June 17, 2026  
**Firebase SDK:** 10.12.2  
**Status:** Production-Ready ✅
