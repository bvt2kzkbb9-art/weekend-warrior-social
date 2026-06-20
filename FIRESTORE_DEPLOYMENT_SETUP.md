# Firestore Rules Deployment Setup Guide

## Overview
The Firestore Rules deployment requires the Firebase service account to have specific IAM roles in Google Cloud Platform (GCP). This guide provides step-by-step instructions to configure these permissions.

## Service Account Information

**Service Account Email:**
```
firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com
```

**Project ID:**
```
weekend-warrior-social-ed3d0
```

## Required IAM Roles

Choose ONE of the following options:

### Option 1: Full Firebase Admin (Recommended for Simplicity)
- Role: `Firebase Admin` (roles/firebase.admin)
- Includes all Firebase permissions
- Simplest to configure

### Option 2: Least Privilege (Recommended for Security)
- Role 1: `Firebase Rules Admin` (roles/firebase.rulesAdmin)
- Role 2: `Firestore Admin` (roles/firestore.admin)
- More restricted permissions
- Follows security best practices

## Step-by-Step Setup Instructions

### Step 1: Open GCP IAM Console

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=weekend-warrior-social-ed3d0
2. Ensure you're logged in with an account that has Project Editor or Owner permissions
3. Verify the project is set to `weekend-warrior-social-ed3d0` (top left dropdown)

### Step 2: Grant IAM Roles

#### Method A: Using the Console UI (Easiest)

1. Click **"Grant Access"** button at the top of the IAM page
2. In the **"New principals"** field, paste:
   ```
   firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com
   ```
3. Click the **"Select a role"** dropdown
4. Search for and select ONE of:
   - `Firebase Admin` (for Option 1), OR
   - `Firebase Rules Admin` (for Option 2 - do this first)
5. Click **"Save"**
6. If using Option 2, repeat steps 1-5 and select `Firestore Admin` for the second role

#### Method B: Using gcloud CLI

If you have gcloud CLI installed locally:

```bash
# Option 1: Firebase Admin
gcloud projects add-iam-policy-binding weekend-warrior-social-ed3d0 \
  --member=serviceAccount:firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com \
  --role=roles/firebase.admin

# Option 2: Least Privilege (run both)
gcloud projects add-iam-policy-binding weekend-warrior-social-ed3d0 \
  --member=serviceAccount:firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com \
  --role=roles/firebase.rulesAdmin

gcloud projects add-iam-policy-binding weekend-warrior-social-ed3d0 \
  --member=serviceAccount:firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gservacecount.com \
  --role=roles/firestore.admin
```

### Step 3: Wait for Permission Propagation

- IAM changes can take **1-2 minutes** to fully propagate
- **Wait at least 2 minutes** before triggering deployment

### Step 4: Verify Role Assignment

1. Go back to: https://console.cloud.google.com/iam-admin/iam?project=weekend-warrior-social-ed3d0
2. Search for the service account email in the principals list
3. Confirm you see the assigned role(s):
   - `Firebase Admin`, OR
   - `Firebase Rules Admin` + `Firestore Admin`

### Step 5: Trigger Firestore Rules Deployment

1. Go to GitHub Actions:
   ```
   https://github.com/bvt2kzkbb9-art/weekend-warrior-social/actions/workflows/deploy-firestore-rules.yml
   ```

2. Click **"Run workflow"** button

3. Select branch: **`main`** (default)

4. Click **"Run workflow"**

### Step 6: Monitor Deployment

1. The workflow will appear in the list with status "in_progress"
2. Click on the workflow run to see detailed logs
3. Wait for completion (2-3 minutes)

### Step 7: Confirm Success

The deployment succeeds when:

✅ All workflow steps show **green checkmarks**

✅ Final log shows:
```
✔  Deploy complete!
```

✅ Go to Firebase Console to verify:
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/rules
```

Rules should display with deployment timestamp and status "Published"

## Troubleshooting

### Error: "The caller does not have permission"
- Wait 2-3 minutes for IAM propagation
- Refresh GitHub Actions and rerun the workflow
- Verify the service account email is spelled correctly
- Confirm the role assignment in IAM console

### Error: "Failed to authenticate"
- Verify GOOGLE_APPLICATION_CREDENTIALS secret exists in GitHub Settings
- Check that the secret contains a valid Firebase service account JSON key
- Confirm the project ID in the secret matches `weekend-warrior-social-ed3d0`

### Workflow runs but deployment hangs
- The Firestore Rules validation can take 30+ seconds
- Wait at least 5 minutes before considering it failed
- Check the workflow logs for actual error messages

## Additional Resources

- [Firebase IAM Roles](https://cloud.google.com/iam/docs/understanding-service-accounts)
- [Firebase Admin Documentation](https://firebase.google.com/docs/rules/manage-deploy)
- [GCP IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)

## Next Steps After Setup

Once Firestore Rules deployment succeeds:

1. ✅ Firebase Hosting automatically deploys on main branch pushes
2. ✅ Firestore Rules automatically deploy when rules file changes
3. ✅ Both deployments use secure service account authentication
4. ✅ No manual login tokens required

Your CI/CD pipeline is now fully configured!
