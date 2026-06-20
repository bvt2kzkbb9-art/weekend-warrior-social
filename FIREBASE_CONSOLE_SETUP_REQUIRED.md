# 🔴 CRITICAL: Firebase Console Manual Setup Required

**Status:** Application code is ready, but Firebase Console is NOT configured  
**Time to fix:** 5 minutes + 2-5 minutes propagation  
**Required action:** Manual setup in Firebase Console

---

## ❌ CURRENT ISSUE

GitHub Pages login fails with:
```
auth/requests-from-referer-https://bvt2kzkbb9-art.github.io-are-blocked
```

**Cause:** Domain `bvt2kzkbb9-art.github.io` is NOT in Firebase Console's "Authorized domains"

---

## ✅ EXACT FIX (Copy-paste these steps)

### Step 1: Open Firebase Console
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/settings
```

### Step 2: Find "Authorized domains" Section
Scroll down on the Authentication Settings page until you see the section labeled:
```
AUTHORIZED DOMAINS
```

### Step 3: Add Missing Domain
Click the **"Add domain"** button

A popup will appear. In the text field, type EXACTLY:
```
bvt2kzkbb9-art.github.io
```

**IMPORTANT:** Do NOT include:
- ❌ `https://`
- ❌ `http://`
- ❌ Trailing slashes
- ❌ Paths like `/weekend-warrior-social`

Just the domain name: `bvt2kzkbb9-art.github.io`

### Step 4: Click "Add"
The domain should now appear in the list.

### Step 5: Verify All Required Domains Are Present

After adding, you should see ALL four domains:

```
✓ localhost
✓ weekend-warrior-social-ed3d0.web.app
✓ weekend-warrior-social-ed3d0.firebaseapp.com
✓ bvt2kzkbb9-art.github.io
```

### Step 6: Wait for Propagation
```
⏱️  2-5 minutes
```
Firebase updates its global DNS and CORS configuration

### Step 7: Test Login
1. Go to: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/login.html
2. Try logging in
3. Should now work without `auth/requests-from-referer-blocked` error

---

## 🧪 VERIFICATION AFTER FIX

Once you've added the domain and waited 2-5 minutes:

### Test 1: Clear Cache & Hard Refresh
```
Windows/Linux: Ctrl + Shift + Delete (select all)
               Then Ctrl + Shift + R
               
Mac: Cmd + Shift + Delete (select all)
     Then Cmd + Shift + R
```

### Test 2: Try Login on GitHub Pages
```
URL: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/login.html
Email: (any registered email)
Password: (corresponding password)
Expected: ✅ Successful login or clear error message (NOT referer-blocked)
```

### Test 3: Try Registration on GitHub Pages
```
URL: https://bvt2kzkbb9-art.github.io/weekend-warrior-social/register.html
Name: Test User
Email: test+timestamp@example.com
Password: TestPassword123
Expected: ✅ Account created
```

### Test 4: Check Firestore Document
1. Go to: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore
2. Click "collections" → "users"
3. Look for the document with the test email you just registered
4. Verify fields:
   ```
   uid: (should be populated)
   email: (should match your test email)
   username: (should be populated)
   xp: 0
   level: 1
   rank: "Rookie"
   ```

---

## 🚀 VERIFY FIREBASE CONFIG

After domain is added, verify in browser console:

```javascript
// Open browser console (F12) and paste this:

fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98')
  .then(r => r.json())
  .then(d => {
    console.log('Authorized Domains:', d.authorizedDomains);
    console.log('Has bvt2kzkbb9-art.github.io?', 
      d.authorizedDomains?.includes('bvt2kzkbb9-art.github.io') ? '✅ YES' : '❌ NO');
  });
```

Should show:
```
Authorized Domains: [
  "localhost",
  "weekend-warrior-social-ed3d0.web.app",
  "weekend-warrior-social-ed3d0.firebaseapp.com",
  "bvt2kzkbb9-art.github.io"
]
Has bvt2kzkbb9-art.github.io? ✅ YES
```

---

## ⚠️ COMMON MISTAKES

### ❌ Added domain WITH slash
```
bvt2kzkbb9-art.github.io/weekend-warrior-social/
```
❌ WRONG - Remove the path

### ❌ Added domain WITH protocol
```
https://bvt2kzkbb9-art.github.io
http://bvt2kzkbb9-art.github.io
```
❌ WRONG - Remove https://

### ❌ Still getting error after 5 minutes
```
Solution:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear all cookies for the domain
3. Try in incognito/private window
4. Try in different browser
5. Wait full 10 minutes
```

---

## 📞 IF DOMAIN NOT SHOWING IN FIREBASE CONSOLE

If you don't see the "Authorized domains" section:

1. Check you're in the RIGHT Firebase project:
   ```
   https://console.firebase.google.com/project/weekend-warrior-social-ed3d0
   ```

2. Check you're in the RIGHT section:
   ```
   Authentication → Settings → Authorized domains
   (NOT Sign-in method, NOT Users)
   ```

3. If you don't see "Authorized domains" at all:
   - Scroll down further
   - It may be below "Email link sign-in" section
   - It should be under "Authorized domains"

4. If still missing:
   - Check if Email/Password authentication is ENABLED
   - Go to: Authentication → Sign-in method
   - Make sure "Email/Password" has blue toggle (Enabled)

---

## 📋 FINAL CHECKLIST

After completing all steps:

- [ ] Logged into Firebase Console
- [ ] Went to Authentication → Settings
- [ ] Found "Authorized domains" section
- [ ] Clicked "Add domain"
- [ ] Entered: `bvt2kzkbb9-art.github.io` (exactly, no extras)
- [ ] Clicked "Add" button
- [ ] All 4 domains now visible
- [ ] Waited 2-5 minutes
- [ ] Cleared browser cache
- [ ] Hard refreshed page
- [ ] Tried login on GitHub Pages
- [ ] ✅ Login works WITHOUT referer-blocked error

---

## 🎯 ONCE THIS IS DONE

Email works on GitHub Pages:
- ✅ Registration creates users
- ✅ Login authenticates users  
- ✅ Password reset sends emails
- ✅ All Firestore operations work

Application is ready for production testing.

---

**Do NOT proceed with deployment or testing until this is fixed.**

**The application code is ready. Only Firebase Console configuration is missing.**
