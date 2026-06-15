#!/bin/bash

################################################################################
# WEEKEND WARRIOR SOCIAL - AUTOMATED DEPLOYMENT SCRIPT
# Firebase Hosting + Firestore + Cloud Storage
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║        🚀 WEEKEND WARRIOR SOCIAL - DEPLOYMENT SCRIPT 🚀           ║"
echo "║                                                                    ║"
echo "║              Firebase Hosting Automated Deployment                 ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

################################################################################
# FUNCTIONS
################################################################################

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 not found. Please install $1 and try again."
        exit 1
    fi
}

wait_with_spinner() {
    local duration=$1
    local message=$2
    echo -ne "${BLUE}${message}${NC}"

    for ((i = 0; i < duration; i++)); do
        echo -ne "."
        sleep 1
    done
    echo -e "${GREEN} Done!${NC}"
}

################################################################################
# PRE-DEPLOYMENT CHECKS
################################################################################

print_step "PHASE 1: Pre-Deployment Checks"
echo ""

# Check required commands
print_step "Checking required tools..."
check_command "node"
check_command "npm"
check_command "git"
check_command "firebase"
print_success "All required tools found"
echo ""

# Check Firebase CLI version
FIREBASE_VERSION=$(firebase --version | grep "firebase-tools" | cut -d'/' -f2)
print_success "Firebase CLI version: $FIREBASE_VERSION"
echo ""

# Check Node.js version
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"
echo ""

# Check current directory
print_step "Checking project structure..."
if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found. Are you in the project root?"
    exit 1
fi
print_success "firebase.json found"

if [ ! -f "firestore.rules" ]; then
    print_error "firestore.rules not found"
    exit 1
fi
print_success "firestore.rules found"

if [ ! -f "storage.rules" ]; then
    print_error "storage.rules not found"
    exit 1
fi
print_success "storage.rules found"

if [ ! -f "firestore.indexes.json" ]; then
    print_error "firestore.indexes.json not found"
    exit 1
fi
print_success "firestore.indexes.json found"

echo ""

# Check if logged in
print_step "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "Not authenticated with Firebase"
    print_step "Logging in to Firebase..."
    firebase login
fi
print_success "Firebase authentication verified"
echo ""

# Set project
print_step "Setting Firebase project..."
firebase use weekend-warrior-social-ed3d0 || {
    print_error "Failed to set Firebase project"
    exit 1
}
PROJECT_ID=$(firebase projects:describe weekend-warrior-social-ed3d0 | grep "Project ID" | cut -d: -f2 | xargs)
print_success "Project ID: $PROJECT_ID"
echo ""

################################################################################
# VALIDATION
################################################################################

print_step "PHASE 2: Validation"
echo ""

print_step "Validating Firebase configuration..."
if firebase validate; then
    print_success "Firebase configuration is valid"
else
    print_error "Firebase configuration validation failed"
    exit 1
fi
echo ""

################################################################################
# DEPLOYMENT
################################################################################

print_step "PHASE 3: Deployment"
echo ""

# Deploy Firestore Rules
print_step "Deploying Firestore Rules..."
if firebase deploy --only firestore:rules; then
    print_success "Firestore Rules deployed"
else
    print_error "Firestore Rules deployment failed"
    exit 1
fi
echo ""

# Deploy Storage Rules
print_step "Deploying Cloud Storage Rules..."
if firebase deploy --only storage; then
    print_success "Cloud Storage Rules deployed"
else
    print_error "Cloud Storage Rules deployment failed"
    exit 1
fi
echo ""

# Deploy Firestore Indexes
print_step "Deploying Firestore Indexes..."
print_warning "This may take 5-15 minutes depending on index size"
if firebase deploy --only firestore:indexes; then
    print_success "Firestore Indexes deployment initiated"
    print_warning "Indexes may still be building in the background"
else
    print_error "Firestore Indexes deployment failed"
    exit 1
fi
echo ""

# Deploy Hosting
print_step "Deploying to Firebase Hosting..."
if firebase deploy --only hosting; then
    print_success "Hosting deployment completed"
else
    print_error "Hosting deployment failed"
    exit 1
fi
echo ""

################################################################################
# POST-DEPLOYMENT
################################################################################

print_step "PHASE 4: Post-Deployment Verification"
echo ""

# Get hosting URL
HOSTING_URL="https://weekend-warrior-social-ed3d0.web.app"
print_success "Application URL: $HOSTING_URL"
echo ""

# Check deployment status
print_step "Checking deployment status..."
if firebase deploy:list | grep -q "COMPLETE"; then
    print_success "Deployment status: COMPLETE"
else
    print_warning "Could not verify deployment status automatically"
fi
echo ""

# Summary
print_step "Waiting for CDN propagation (2 minutes)..."
wait_with_spinner 120 "Propagating to CDN"
echo ""

################################################################################
# FINAL CHECKLIST
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                   ${GREEN}✓ DEPLOYMENT COMPLETED${NC}                        ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📱 NEXT STEPS:${NC}"
echo ""
echo "1. ${YELLOW}Visit your app:${NC}"
echo "   🌐 https://weekend-warrior-social-ed3d0.web.app"
echo ""
echo "2. ${YELLOW}Verify PWA on mobile:${NC}"
echo "   📱 Open on Android Chrome or iOS Safari"
echo "   📱 Menu > \"Install app\""
echo ""
echo "3. ${YELLOW}Test core features:${NC}"
echo "   ✓ Login/Registration"
echo "   ✓ Create a post"
echo "   ✓ Follow a user"
echo "   ✓ Join a challenge"
echo ""
echo "4. ${YELLOW}Monitor Firebase Console:${NC}"
echo "   🔗 https://console.firebase.google.com/project/weekend-warrior-social-ed3d0"
echo ""
echo "5. ${YELLOW}Check Firestore indexes status:${NC}"
echo "   (May take 5-15 minutes to complete)"
echo ""

echo -e "${GREEN}📊 DEPLOYMENT SUMMARY:${NC}"
echo ""
echo "  Project ID:        weekend-warrior-social-ed3d0"
echo "  Hosting URL:       https://weekend-warrior-social-ed3d0.web.app"
echo "  Firestore Rules:   ✓ Deployed"
echo "  Storage Rules:     ✓ Deployed"
echo "  Firestore Indexes: ✓ Deployment Initiated"
echo "  Hosting:           ✓ Deployed"
echo ""

echo -e "${GREEN}⏱️  Deployment completed in: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

################################################################################
# OPTIONAL: Open in browser
################################################################################

read -p "Do you want to open the app in your browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "$HOSTING_URL"  # Linux
    elif command -v open &> /dev/null; then
        open "$HOSTING_URL"  # macOS
    elif command -v start &> /dev/null; then
        start "$HOSTING_URL"  # Windows
    else
        print_warning "Could not open browser automatically"
        print_step "Please visit: $HOSTING_URL"
    fi
fi

echo -e "${GREEN}✓ Deployment script completed successfully!${NC}"
echo ""

exit 0
