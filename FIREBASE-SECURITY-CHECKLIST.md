# Firebase Security Configuration Checklist

This document outlines security measures that MUST be implemented in Firebase Console to protect the application and user data.

## API Key Restrictions

**Status:** ⚠️ ACTION REQUIRED

Firebase API Key `AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98` is exposed in client-side code (js/firebase.js line 28). This is required for Firebase SDK to function, but must be restricted.

### Steps to Implement:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `weekend-warrior-social-ed3d0`
3. Navigate to APIs & Services → Credentials
4. Find API Key: `AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98`
5. Click to edit and apply these restrictions:

   **Application restrictions:**
   - Type: HTTP referrers (websites)
   - Add website URL: `https://weekend-warrior-social.com` (or your domain)
   - Add localhost for development: `http://localhost:*`

   **API restrictions:**
   - Select "Restrict key" → "Cloud Firestore API" ONLY
   - DO NOT allow: Cloud Storage, Cloud Functions (use service account for backend)
   - DO NOT enable general access to other Google APIs

## Firestore Security Rules

**Status:** ⚠️ VERIFY

Firestore should enforce strict security rules to prevent unauthorized access.

### Critical Rules:
- ✅ Users can only read/write their own profile
- ✅ Users can only read posts/comments (not write arbitrary data)
- ✅ Users can only interact with their own content
- ✅ Followers collection requires proper authentication checks

### Verify at:
Firebase Console → Firestore Database → Rules tab

## Rate Limiting

**Status:** ⚠️ ACTION REQUIRED - Implement backend rate limiting

Firestore alone doesn't enforce rate limits. Implement:

1. **Per-user rate limits via Cloud Functions:**
   - Max 10 posts/hour
   - Max 50 messages/hour
   - Max 5 image uploads/minute

2. **Global rate limits:**
   - Max 1000 writes/second
   - Max 5000 reads/second

3. **DDoS Protection:**
   - Enable Cloud Armor
   - Set up Cloud CDN with caching

## Firebase SDK Version

**Current:** 10.12.2
**Latest:** 10.12.2 (latest as of Feb 2025)
**Status:** ✅ Up to date

Keep updated with latest Firebase SDK for security patches.

## Service Accounts for Backend Operations

If you implement backend API (Cloud Functions, App Engine, etc.):
- Use service account credentials, NOT exposed API keys
- Never store keys in environment files in version control
- Use Workload Identity or IAM roles instead

## Regular Security Audits

- [ ] Weekly: Review Firestore access patterns in Logs
- [ ] Monthly: Check for suspicious user activity
- [ ] Quarterly: Audit API key usage and rate limits
- [ ] Annually: Penetration test and security review

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/database/security)
- [Firestore Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- [API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys)
