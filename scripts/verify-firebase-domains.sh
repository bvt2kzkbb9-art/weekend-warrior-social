#!/bin/bash

# Firebase Domain Verification Script
# Checks if authorized domains are properly configured
# Usage: bash scripts/verify-firebase-domains.sh

PROJECT_ID="weekend-warrior-social-ed3d0"
API_KEY="AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98"

REQUIRED_DOMAINS=(
  "weekend-warrior-social-ed3d0.web.app"
  "weekend-warrior-social-ed3d0.firebaseapp.com"
  "bvt2kzkbb9-art.github.io"
  "localhost"
)

echo "🔍 Firebase Domain Verification"
echo "================================"
echo "Project: $PROJECT_ID"
echo ""

# Test if curl is available
if ! command -v curl &> /dev/null; then
  echo "❌ curl is not installed. Please install curl and try again."
  exit 1
fi

# Get current Firebase config
echo "📡 Fetching current Firebase configuration..."
echo ""

RESPONSE=$(curl -s \
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${API_KEY}" \
  -H "Content-Type: application/json")

# Check if response contains authorized domains
if echo "$RESPONSE" | grep -q "authorizedDomains"; then
  echo "✅ Firebase API responded successfully"
  echo ""

  # Extract and display authorized domains
  echo "📋 Current Authorized Domains in Firebase:"
  echo "$RESPONSE" | grep -o '"authorizedDomains":\[.*\]' | sed 's/"authorizedDomains":\[//;s/\]//' | tr ',' '\n' | sed 's/"//g;s/^[[:space:]]*/  ✓ /'

  echo ""
  echo "🔄 Checking Required Domains:"
  echo ""

  MISSING_DOMAINS=()
  for domain in "${REQUIRED_DOMAINS[@]}"; do
    if echo "$RESPONSE" | grep -q "\"$domain\""; then
      echo "  ✅ $domain"
    else
      echo "  ❌ $domain"
      MISSING_DOMAINS+=("$domain")
    fi
  done

  echo ""

  if [ ${#MISSING_DOMAINS[@]} -eq 0 ]; then
    echo "🎉 SUCCESS! All required domains are authorized."
    echo ""
    echo "If authentication still fails:"
    echo "  1. Clear browser cache (Ctrl+Shift+Delete)"
    echo "  2. Hard refresh (Ctrl+Shift+R)"
    echo "  3. Try a fresh Incognito/Private window"
    exit 0
  else
    echo "⚠️  MISSING DOMAINS (${#MISSING_DOMAINS[@]}):"
    for domain in "${MISSING_DOMAINS[@]}"; do
      echo "  • $domain"
    done

    echo ""
    echo "❌ FIX REQUIRED:"
    echo ""
    echo "1. Go to Firebase Console:"
    echo "   https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings"
    echo ""
    echo "2. Find 'Authorized domains' section"
    echo ""
    echo "3. Click 'Add domain' and add these:"
    for domain in "${MISSING_DOMAINS[@]}"; do
      echo "   - $domain"
    done
    echo ""
    echo "4. Click 'Save'"
    echo ""
    echo "5. Wait 2-5 minutes for propagation"
    echo ""
    echo "6. Clear browser cache and hard refresh"
    echo ""
    echo "7. Run this script again to verify:"
    echo "   bash scripts/verify-firebase-domains.sh"

    exit 1
  fi
else
  echo "❌ Firebase API did not return expected response"
  echo ""
  echo "Response: $RESPONSE"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check that API_KEY is correct"
  echo "2. Check that PROJECT_ID is correct"
  echo "3. Verify internet connection"
  echo "4. Wait a few minutes and try again"

  exit 2
fi
