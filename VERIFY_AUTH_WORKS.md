# ✅ VERIFICATION SCRIPT - Run After Firebase Console Fix

**Status:** Firebase Console configured with all authorized domains  
**Objective:** Verify authentication actually works  
**Requirements:** Must complete ALL tests before calling application "Production Ready"

---

## 🧪 TEST 1: REGISTRATION

### Instructions
1. Open: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/register.html
2. Fill form with:
   ```
   Name: Test Warrior
   Email: test+{timestamp}@example.com  (use current timestamp, e.g. test+20260620@example.com)
   Password: TestPass123!
   Confirm: TestPass123!
   Terms: ✓ Check
   ```
3. Click "Stwórz konto"

### Expected Result
```
✅ Toast shows: "✅ Konto utworzone! Zalogowano automatycznie."
✅ Redirects to feed.html
✅ No errors in console
```

### Console Should Show
```
[registerWithEmail] ========== START REGISTRATION ==========
[registerWithEmail] Email: test+{timestamp}@example.com
[registerWithEmail] Step 1: Creating user with Email/Password...
[registerWithEmail] ✅ User created in Firebase Auth:
[registerWithEmail] Step 2: Updating user profile...
[registerWithEmail] ✅ Profile updated
[registerWithEmail] Step 3: Creating Firestore user document...
[registerWithEmail] ✅ Firestore document created
[registerWithEmail] ========== REGISTRATION SUCCESS ==========
```

### Verify in Firebase Console
1. Go to: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/users
2. Find user with email: `test+{timestamp}@example.com`
3. Note the UID (e.g., `abc123def456`)

4. Go to: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/data/users/
5. Click on the UID document
6. Verify fields:
   ```
   uid: {UID from Auth}
   email: test+{timestamp}@example.com
   username: Test Warrior
   xp: 0
   level: 1
   rank: "Rookie"
   online: true
   createdAt: {timestamp}
   ```

### Test 1 Result
- [ ] Registration successful
- [ ] User created in Firebase Auth
- [ ] Document created in Firestore
- [ ] All fields present and correct

**Status: ✅ PASS** or **❌ FAIL**

---

## 🧪 TEST 2: LOGIN

### Instructions (Use account from Test 1)
1. Open: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/login.html
2. Fill form with:
   ```
   Email: test+{timestamp}@example.com
   Password: TestPass123!
   ```
3. Click "Zaloguj się"

### Expected Result
```
✅ Toast shows: "✅ Zalogowano pomyślnie!"
✅ Redirects to feed.html
✅ No errors in console
✅ NO referer-blocked error
```

### Console Should Show
```
[loginWithEmail] ========== START LOGIN ==========
[loginWithEmail] Email: test+{timestamp}@example.com
[loginWithEmail] Auth configured: { authDomain: "...", projectId: "..." }
[loginWithEmail] Step 1: Signing in with email/password...
[loginWithEmail] ✅ User signed in
[loginWithEmail] Step 2: Loading user profile from Firestore...
[loginWithEmail] ✅ User data loaded
[loginWithEmail] Step 3: Updating last seen...
[loginWithEmail] ✅ Last seen updated
[loginWithEmail] ========== LOGIN SUCCESS ==========
```

### Test 2 Result
- [ ] Login successful
- [ ] User data loaded from Firestore
- [ ] Redirected to feed page
- [ ] NO auth/requests-from-referer-blocked error

**Status: ✅ PASS** or **❌ FAIL**

---

## 🧪 TEST 3: PASSWORD RESET

### Instructions
1. Open: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/forgot-password.html
2. Enter email from Test 1:
   ```
   Email: test+{timestamp}@example.com
   ```
3. Click "Wyślij link resetowania"

### Expected Result
```
✅ Toast shows: "✅ Link resetowania wysłany na email!"
✅ No "Błąd resetowania" message
✅ Console shows no errors
```

### Console Should Show
```
[resetPassword] START: { email: "test+{timestamp}@example.com" }
[resetPassword] ✅ Email sent successfully
[resetPassword] Password reset email sent
```

### Verify Email Received
1. Check inbox of test+{timestamp}@example.com
2. Should have email from Firebase with password reset link
3. Link should be valid

### Test 3 Result
- [ ] Reset email sent successfully
- [ ] No "Błąd resetowania" error
- [ ] Email received in inbox
- [ ] Reset link is valid

**Status: ✅ PASS** or **❌ FAIL**

---

## 🧪 TEST 4: LOGOUT

### Instructions (If still logged in from Test 2)
1. Navigate to any page (e.g., feed.html)
2. Find logout button (usually in header/profile area)
3. Click logout

### Expected Result
```
✅ Redirects to login.html
✅ Session cleared
✅ Login page loads
```

### Test 4 Result
- [ ] Logged out successfully
- [ ] Redirected to login page
- [ ] Session cleared

**Status: ✅ PASS** or **❌ FAIL**

---

## 🧪 TEST 5: FIRESTORE OPERATIONS

### Instructions
1. Login again with test account from Test 1
2. Open browser console (F12 → Console)
3. Run:

```javascript
import { getCurrentUserData } from './src/js/core/auth.js';

const userData = await getCurrentUserData('{UID from Test 1}');
console.log('User Data:', userData);
```

### Expected Result
```javascript
{
  uid: "{UID}",
  email: "test+{timestamp}@example.com",
  username: "Test Warrior",
  xp: 0,
  level: 1,
  rank: "Rookie",
  streak: 0,
  online: true,
  createdAt: Timestamp(...),
  updatedAt: Timestamp(...),
  lastSeen: Timestamp(...)
}
```

### Test 5 Result
- [ ] User data reads correctly
- [ ] All fields present
- [ ] No permission errors

**Status: ✅ PASS** or **❌ FAIL**

---

## 🧪 TEST 6: MOBILE RESPONSIVENESS

### Instructions
1. Open any page in browser
2. Press F12 (Developer Tools)
3. Click "Toggle device toolbar" (mobile icon)
4. Test on these widths:
   - 320px (small phone)
   - 768px (tablet)
   - 1920px (desktop)

### Expected Result
```
✅ Layout adapts correctly
✅ Forms readable and usable
✅ Buttons clickable
✅ Text readable
✅ Navigation works
```

### Test 6 Result
- [ ] Small phone (320px) - responsive
- [ ] Tablet (768px) - responsive
- [ ] Desktop (1920px) - responsive

**Status: ✅ PASS** or **❌ FAIL**

---

## 📊 FINAL VERIFICATION REPORT

After completing ALL tests, fill in this checklist:

### Authentication
- [ ] Test 1: Registration - **PASS/FAIL**
- [ ] Test 2: Login - **PASS/FAIL**
- [ ] Test 3: Password Reset - **PASS/FAIL**
- [ ] Test 4: Logout - **PASS/FAIL**

### Data & Functionality
- [ ] Test 5: Firestore Operations - **PASS/FAIL**
- [ ] Test 6: Mobile Responsiveness - **PASS/FAIL**

### Hosting
- [ ] Firebase Hosting: https://weekend-warrior-social-ed3d0.web.app - **200/ERROR**
- [ ] GitHub Pages: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/ - **200/ERROR**

### Summary
```
Total Tests: 6
Passed: ___ / 6
Failed: ___ / 6
```

---

## ❌ IF ANY TEST FAILS

### Test 1-3 Fail (Auth errors)
Check browser console for error code (F12 → Console)

If error is `auth/requests-from-referer-blocked`:
- [ ] Domain is still not authorized
- [ ] Go back to FIREBASE_CONSOLE_SETUP_REQUIRED.md
- [ ] Verify `bvt2kzkbb9-art.github.io` is in list
- [ ] Wait 5-10 minutes (full propagation)
- [ ] Hard refresh (Ctrl+Shift+R)

If error is different:
- Copy full error message from console
- Document in issue report
- Refer to AUTH_DIAGNOSTIC_GUIDE.md for specific error codes

### Test 5 Fails (Firestore)
- Check Firestore Rules in Firebase Console
- Verify user document exists
- Check user is authenticated
- See QUICK_TROUBLESHOOTING.md

### Test 6 Fails (Mobile)
- Check CSS is loading correctly
- Verify foundation.css is in /src/styles/
- Check media queries are present

---

## ✅ IF ALL TESTS PASS

Application is now **PRODUCTION READY**:

1. ✅ Registration works
2. ✅ Login works
3. ✅ Password reset works
4. ✅ Logout works
5. ✅ Firestore operations work
6. ✅ Mobile responsive

Can deploy to:
- ✅ Firebase Hosting
- ✅ GitHub Pages

Both hosting platforms should work identically.

---

**Do NOT mark application as Production Ready until ALL 6 tests show ✅ PASS**
