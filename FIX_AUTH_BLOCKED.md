# 🚨 CRITICAL FIX: auth/requests-from-referer-blocked

**Error:** `auth/requests-from-referer-blocked`  
**Cause:** Domain `weekend-warrior-social-ed3d0.web.app` is NOT in Firebase Console Authorized Domains  
**Impact:** Login and registration are completely blocked  
**Fix Time:** 5-10 minutes + 2-5 min propagation

---

## ⚡ IMMEDIATE FIX (5 minutes)

### Step 1: Go to Firebase Console
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/settings
```

### Step 2: Find "Authorized Domains" Section
Look for the section labeled **"Authorized domains"** on the authentication settings page.

### Step 3: Add Required Domains
Click **"Add domain"** and add these one by one:

```
1. weekend-warrior-social-ed3d0.web.app
2. weekend-warrior-social-ed3d0.firebaseapp.com
3. bvt2kzkbb9-art.github.io
4. localhost
```

**IMPORTANT:** Add each domain WITHOUT `https://` or `http://`

### Step 4: Save
Click **"Save"** button (bottom right)

### Step 5: Wait for Propagation
```
⏱️  2-5 minutes for global propagation
   (Firebase is updating their internal DNS/CORS settings)
```

### Step 6: Clear Cache
Open your browser and:
- **Chrome/Edge:** Press `Ctrl+Shift+Delete` → Clear all data
- **Firefox:** Press `Ctrl+Shift+Delete` → Clear everything
- **Safari:** Menu → Develop → Empty Web Storage

### Step 7: Hard Refresh
- **Chrome/Edge/Firefox:** Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- **Safari:** Press `Cmd+Option+E` then `Cmd+R`

### Step 8: Test Login
Go to: https://weekend-warrior-social-ed3d0.web.app/login

Try logging in. **Error should be gone!**

---

## 🔍 Verify the Fix

### In Firebase Console
1. Go to: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/settings
2. Scroll to "Authorized domains"
3. You should see:
   - ✅ weekend-warrior-social-ed3d0.web.app
   - ✅ weekend-warrior-social-ed3d0.firebaseapp.com
   - ✅ bvt2kzkbb9-art.github.io
   - ✅ localhost

### In Browser Console (F12)
```javascript
// Copy and paste in Console:
fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98')
  .then(r => r.json())
  .then(d => {
    console.log('Authorized Domains:', d.authorizedDomains);
    d.authorizedDomains.includes('weekend-warrior-social-ed3d0.web.app') 
      ? console.log('✅ Domain is AUTHORIZED') 
      : console.log('❌ Domain is NOT authorized - wait 5 more minutes');
  });
```

---

## 📋 Troubleshooting

### ❌ Still getting error after 10 minutes?

1. **Verify domains were actually saved:**
   - Refresh Firebase Console page
   - Check that all 4 domains are still listed

2. **Check for typos:**
   - `weekend-warrior-social-ed3d0.web.app` (NOT `weekend-warrior-social.web.app`)
   - `bvt2kzkbb9-art.github.io` (NOT `bvt2kzkbb9-art.github.io/weekend-warrior-social`)

3. **Try different browser:**
   - Clear cache in NEW browser (Incognito mode)
   - Test from different device

4. **Check for regional issues:**
   - If on VPN → try without VPN
   - If using proxy → try direct connection

5. **Last resort:**
   - Wait full 15 minutes
   - Try in Incognito/Private mode
   - Restart browser completely

---

## 🎯 Expected Behavior (After Fix)

### ✅ Login Page Should Now:
- Load without errors
- Accept email/password
- Show proper error messages (not referer-blocked)
- Successfully authenticate users

### ✅ Console Should Show:
```javascript
[Firebase] Initializing with config: {...}
[Firebase] App initialized: { name: ... }
[Firebase] Auth initialized: {...}
[loginWithEmail] START: { email: "..." }
[loginWithEmail] User signed in: { uid: "...", email: "..." }
```

---

## 📞 If Still Broken After All Steps

Please provide:
1. Screenshot of "Authorized domains" section from Firebase Console
2. Browser console output (F12 → Console)
3. Current URL showing the error
4. Which browser/OS you're using

Then open GitHub issue: https://github.com/bvt2kzkbb9-art/weekend-warrior-social/issues

---

## 🔐 Security Note

**These domains are safe to authorize because:**
- `weekend-warrior-social-ed3d0.web.app` = Your official Firebase Hosting
- `weekend-warrior-social-ed3d0.firebaseapp.com` = Firebase's internal domain
- `bvt2kzkbb9-art.github.io` = Your official GitHub Pages
- `localhost` = Local development only

**DO NOT add wildcards** like `*.firebaseapp.com` or `*.web.app`

---

**Last Updated:** 2026-06-20  
**Status:** 🔴 CRITICAL - Action Required
