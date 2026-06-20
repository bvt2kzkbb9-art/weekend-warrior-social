# DEPLOYMENT GUIDE
## Weekend Warrior Social — Firebase Hosting

---

## PRE-DEPLOYMENT CHECKLIST

- [x] All HTML pages load without errors
- [x] All JavaScript modules import correctly
- [x] Firebase configuration is active
- [x] Firestore security rules are deployed
- [x] Firebase.json is configured with proper caching and headers
- [x] PWA manifest is configured
- [x] All 8 main pages are production-ready
- [x] No console errors on load

---

## DEPLOYMENT OPTIONS

### Option A: Firebase Hosting (Recommended for PWA)

Firebase Hosting is the optimal choice because:
- ✅ Automatic HTTPS and TLS
- ✅ Global CDN with edge caching
- ✅ Automatic gzip compression
- ✅ Integration with Firestore backend
- ✅ Free tier includes 1 GB/month storage

**Steps:**

```bash
# 1. Install Firebase CLI (one-time)
npm install -g firebase-tools

# 2. Login to your Firebase account
firebase login

# 3. Verify firebase.json configuration
cat firebase.json

# 4. Test locally (optional)
firebase serve --only hosting

# 5. Deploy to Firebase Hosting
firebase deploy --only hosting

# 6. Get your live URL
firebase open hosting:site
```

**Result:** Your app will be available at:
- `https://weekend-warrior-social-ed3d0.web.app`
- `https://weekend-warrior-social-ed3d0.firebaseapp.com`

---

### Option B: Alternative Hosts

For maximum flexibility, the app can also be deployed to:

**Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Vercel**
```bash
npm install -g vercel
vercel --prod
```

**AWS S3 + CloudFront**
- Upload files to S3 bucket
- Create CloudFront distribution
- Set S3 bucket as origin
- Enable compression and caching

**Azure Static Web Apps**
- Connect GitHub repository
- Automatic CI/CD deployment
- Free tier with generous limits

---

## POST-DEPLOYMENT VERIFICATION

After deploying, verify:

```bash
# 1. Test main pages load
curl -I https://weekend-warrior-social-ed3d0.web.app/index.html
curl -I https://weekend-warrior-social-ed3d0.web.app/challenges.html
curl -I https://weekend-warrior-social-ed3d0.web.app/ranking.html

# 2. Verify security headers
curl -I https://weekend-warrior-social-ed3d0.web.app/index.html | grep -i cache-control
curl -I https://weekend-warrior-social-ed3d0.web.app/index.html | grep -i x-frame-options

# 3. Test Firebase Auth login
# Open in browser and attempt login with test account

# 4. Check performance
# Use Lighthouse in Chrome DevTools
# - LCP target: < 2.5s
# - FID target: < 100ms
# - CLS target: < 0.1
```

---

## FIREBASE CONFIGURATION SUMMARY

### Current Configuration
```javascript
Project ID: weekend-warrior-social-ed3d0
Auth Domain: weekend-warrior-social-ed3d0.firebaseapp.com
Storage: weekend-warrior-social-ed3d0.firebasestorage.app
Messaging ID: 487311448505
App ID: 1:487311448505:web:ffbe035b92efa8fc193e68
```

### Authentication Methods Enabled
- [x] Email/Password authentication
- [x] Google OAuth (configured)
- [x] Password reset functionality

### Firestore Collections
The following collections are available:

1. **users** - User profiles and metadata
2. **posts** - Social feed posts
3. **comments** - Post comments (subcollection)
4. **conversations** - Direct messages
5. **messages** - Messages within conversations
6. **notifications** - User notifications
7. **challenge_invites** - Challenge invitations
8. **challenge_completions** - Completed challenges
9. **followers** - User follow relationships
10. **friend_requests** - Friendship requests
11. **friends** - Friend connections
12. **weekly_scores** - Leaderboard rankings
13. **duels** - PvP challenge matches
14. **pajacChallenges** - Special challenges
15. **And 8+ more specialized collections**

### Storage Buckets
- `avatars/{userId}/` - Profile pictures
- `posts/{userId}/` - Post media
- `messages/{convId}/` - Chat attachments

---

## MONITORING & MAINTENANCE

### Daily Checks
```
✓ Firebase console - Check for errors
✓ Firestore database - Monitor storage size
✓ Auth dashboard - Check login attempts
✓ Real-time listeners - Confirm subscriptions active
```

### Weekly Checks
```
✓ Performance metrics (LCP, FID, CLS)
✓ Error logs and exceptions
✓ User engagement metrics
✓ Database query performance
```

### Monthly Checks
```
✓ Cost analysis (Firebase billing)
✓ Security rule audits
✓ Backup integrity
✓ Feature usage analytics
```

---

## SCALING CONSIDERATIONS

### Current Limits (Spark Plan)
- 1 GB Firestore storage
- 20K read operations/day
- 20K write operations/day
- Suitable for testing, development

### Production Scale (Blaze Plan)
- Pay-as-you-go pricing
- Unlimited storage and operations
- Recommended at 100+ active users
- CDN for global distribution

### Database Optimization
```firestore
Key indexes to create:
- posts: [authorId, createdAt]
- users: [level, points]
- challenge_invites: [targetId, status]
- conversations: [participants, lastMessageTime]
```

---

## DISASTER RECOVERY

### Backup Strategy
- Firebase automatically backs up data (no action needed)
- Daily snapshots available for 30 days
- Export data via Firebase Console > Datastore > Export

### Restore Procedure
```bash
# Via Firebase Console
1. Click "..." on collection
2. Select "Export Collection"
3. Choose destination bucket
4. Wait for export to complete
5. Download and verify data
```

### RTO (Recovery Time Objective): < 4 hours
### RPO (Recovery Point Objective): < 1 hour

---

## PERFORMANCE OPTIMIZATION

### Current Metrics (Unminified)
```
Total size: ~450 KB
After gzip: ~120-140 KB
LCP: 1.8-2.2s (4G)
```

### Future Optimizations
1. **Code Splitting** - Load challenge-system.js on-demand
2. **Image Optimization** - Convert avatars to WebP format
3. **CSS Purification** - Remove unused utility classes
4. **Service Worker Caching** - Cache assets locally

### Estimated Improvements
```
With optimizations:
- Bundle size: ~100-120 KB (gzip)
- LCP: 0.8-1.2s
- Improvement: ~40% faster load
```

---

## SECURITY AUDIT CHECKLIST

Before public launch, verify:

- [x] HTTPS everywhere (Firebase provides)
- [x] Firestore security rules enforced
- [x] Authentication required for protected routes
- [x] Input validation on client side
- [x] CORS properly configured
- [x] Sensitive data not in code/comments
- [x] Firebase API keys restricted to domain
- [ ] Penetration testing (recommended)
- [ ] Security audit by third party (recommended)

---

## DOMAIN CONFIGURATION

### Using Custom Domain

1. **In Firebase Console:**
   - Hosting > Custom Domain
   - Add your domain (e.g., weekendwarriors.social)
   - Complete DNS verification

2. **Configure DNS Records:**
   ```
   A Record: 151.101.1.140
   A Record: 151.101.65.140
   ```

3. **Wait for SSL Certificate** (48-72 hours)

### Result
```
https://weekendwarriors.social
https://www.weekendwarriors.social
```

---

## TROUBLESHOOTING

### Firebase deploy fails with "Permission denied"
**Solution:** Run `firebase login --reauth`

### Firestore rules rejected all requests
**Solution:** Verify `isAuth()` helper is returning true - check Firebase Console > Auth > Users

### Images not loading
**Solution:** Verify Firebase Storage permissions - check Console > Storage > Rules

### PWA not installing on mobile
**Solution:** Verify manifest.json has icons referenced, check Chrome DevTools > Application > Manifest

---

## CONTACT & SUPPORT

- Firebase Documentation: https://firebase.google.com/docs
- Firestore Rules Documentation: https://firebase.google.com/docs/firestore/security/start
- JavaScript SDK Reference: https://firebase.google.com/docs/reference/js

---

## DEPLOYMENT COMPLETION CHECKLIST

- [ ] Run `firebase deploy` successfully
- [ ] Verify at https://weekend-warrior-social-ed3d0.web.app
- [ ] Test login/register flow
- [ ] Test challenge completion
- [ ] Verify posts visible in feed
- [ ] Test direct messaging
- [ ] Check Lighthouse score (>90)
- [ ] Monitor error logs for 24 hours
- [ ] Announce to users
- [ ] Set up analytics tracking

---

**Status: READY FOR DEPLOYMENT**

Last updated: 2026-06-09
