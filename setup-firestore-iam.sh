#!/bin/bash

# Firestore Rules IAM Setup Script
# This script grants the required IAM roles to the Firebase service account
# for Firestore Rules deployment to work in GitHub Actions

set -e

PROJECT_ID="weekend-warrior-social-ed3d0"
SERVICE_ACCOUNT_EMAIL="firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com"

echo "=========================================="
echo "Firestore Rules IAM Setup"
echo "=========================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✓ gcloud CLI found"
echo ""

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "✓ Authenticated as: $ACTIVE_ACCOUNT"
echo ""

# Confirm project
echo "Confirming project access..."
if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
    echo "❌ No access to project: $PROJECT_ID"
    echo "Ensure you have Project Editor or Owner role"
    exit 1
fi

echo "✓ Project access confirmed"
echo ""

# Ask user which option to use
echo "Choose an option:"
echo ""
echo "1) Firebase Admin (full permissions - simpler)"
echo "2) Firebase Rules Admin + Firestore Admin (least privilege - secure)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Setting up: Firebase Admin role..."
    echo ""

    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
        --role=roles/firebase.admin \
        --quiet

    echo ""
    echo "✓ Firebase Admin role assigned"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "Setting up: Firebase Rules Admin + Firestore Admin roles..."
    echo ""

    echo "Assigning Firebase Rules Admin..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
        --role=roles/firebase.rulesAdmin \
        --quiet

    echo "✓ Firebase Rules Admin role assigned"
    echo ""

    echo "Assigning Firestore Admin..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
        --role=roles/firestore.admin \
        --quiet

    echo "✓ Firestore Admin role assigned"

else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for permissions to propagate"
echo "2. Go to GitHub Actions:"
echo "   https://github.com/bvt2kzkbb9-art/weekend-warrior-social/actions/workflows/deploy-firestore-rules.yml"
echo "3. Click 'Run workflow'"
echo "4. Monitor the deployment"
echo ""
echo "Verification:"
echo "View assigned roles:"
echo "gcloud projects get-iam-policy $PROJECT_ID --flatten='bindings[].members' --filter='members:$SERVICE_ACCOUNT_EMAIL'"
echo ""
