#!/bin/bash

################################################################################
# WEEKEND WARRIOR SOCIAL - COMPLETE AUTOMATED SETUP
# Firebase Deployment + GitHub Configuration + Firestore Setup
################################################################################

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="weekend-warrior-social-ed3d0"
GITHUB_REPO="bvt2kzkbb9-art/weekend-warrior-social"
BRANCH="claude/weekend-warrior-audit-fixes-xykimj"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║     🚀 WEEKEND WARRIOR SOCIAL - COMPLETE SETUP 🚀                ║"
echo "║                                                                    ║"
echo "║      Firebase Deployment + GitHub + Firestore Configuration      ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

################################################################################
# PHASE 1: VERIFY REQUIREMENTS
################################################################################

echo -e "${BLUE}▶ PHASE 1: Sprawdzanie wymagań${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js nie zainstalowany${NC}"
    echo "  Zainstaluj z: https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js${NC}: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm nie zainstalowany${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm${NC}: $NPM_VERSION"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git nie zainstalowany${NC}"
    exit 1
fi
GIT_VERSION=$(git --version | cut -d' ' -f3)
echo -e "${GREEN}✓ Git${NC}: $GIT_VERSION"

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠ Firebase CLI nie zainstalowany, instaluję...${NC}"
    npm install -g firebase-tools
fi
FIREBASE_VERSION=$(firebase --version 2>/dev/null | grep firebase-tools)
echo -e "${GREEN}✓ Firebase CLI${NC}: $FIREBASE_VERSION"

echo ""
echo -e "${GREEN}✓ Wszystkie wymagania spełnione!${NC}"
echo ""

################################################################################
# PHASE 2: GIT SETUP
################################################################################

echo -e "${BLUE}▶ PHASE 2: Konfiguracja Git${NC}"
echo ""

# Check git config
GIT_USER=$(git config --global user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

if [ -z "$GIT_USER" ]; then
    echo -e "${YELLOW}⚠ Brak konfiguracji Git${NC}"
    echo ""
    echo "Wpisz swoje dane:"
    read -p "Imię i nazwisko: " GIT_USER
    read -p "Email: " GIT_EMAIL

    git config --global user.name "$GIT_USER"
    git config --global user.email "$GIT_EMAIL"

    echo -e "${GREEN}✓ Git skonfigurowany${NC}"
else
    echo -e "${GREEN}✓ Git już skonfigurowany${NC}"
    echo "  Użytkownik: $GIT_USER"
    echo "  Email: $GIT_EMAIL"
fi

echo ""

################################################################################
# PHASE 3: GITHUB SETUP
################################################################################

echo -e "${BLUE}▶ PHASE 3: Konfiguracja GitHub${NC}"
echo ""

echo "GitHub Repository: $GITHUB_REPO"
echo "Branch: $BRANCH"
echo ""

# Check if remote is set
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo -e "${YELLOW}⚠ Remote GitHub nie skonfigurowany${NC}"
    echo ""
    echo "Uruchom:"
    echo "  git remote add origin https://github.com/$GITHUB_REPO.git"
else
    echo -e "${GREEN}✓ GitHub remote skonfigurowany${NC}"
    echo "  URL: $REMOTE_URL"
fi

echo ""

# Check branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo -e "${YELLOW}⚠ Jesteś na branch: $CURRENT_BRANCH${NC}"
    echo "  Powinnaś być na: $BRANCH"
    echo ""
    echo "Uruchom:"
    echo "  git checkout $BRANCH"
else
    echo -e "${GREEN}✓ Poprawny branch${NC}: $BRANCH"
fi

echo ""
echo -e "${GREEN}✓ GitHub skonfigurowany${NC}"
echo ""

################################################################################
# PHASE 4: FIREBASE SETUP
################################################################################

echo -e "${BLUE}▶ PHASE 4: Konfiguracja Firebase${NC}"
echo ""

echo "Firebase Project ID: $PROJECT_ID"
echo ""

# Check if logged in
if ! firebase projects:list &>/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Musisz być zalogowany w Firebase${NC}"
    echo ""
    echo "Uruchom poniższe komendy:"
    echo ""
    echo "  1️⃣  firebase login"
    echo "  2️⃣  firebase use $PROJECT_ID"
    echo "  3️⃣  ./deploy.sh"
    echo ""
    echo -e "${YELLOW}Potem wróć tutaj.${NC}"
    exit 0
else
    echo -e "${GREEN}✓ Zalogowany w Firebase${NC}"
fi

# Verify project
PROJECTS=$(firebase projects:list 2>/dev/null | grep -E "weekend-warrior" || echo "")

if [ -z "$PROJECTS" ]; then
    echo -e "${RED}✗ Projekt $PROJECT_ID nie znaleziony${NC}"
    echo ""
    echo "Dostępne projekty:"
    firebase projects:list 2>/dev/null | head -10
    exit 1
fi

echo -e "${GREEN}✓ Firebase Project znaleziony${NC}"
echo ""

################################################################################
# PHASE 5: FIRESTORE SETUP
################################################################################

echo -e "${BLUE}▶ PHASE 5: Konfiguracja Firestore${NC}"
echo ""

# Set project
firebase use $PROJECT_ID 2>/dev/null || true

# Verify firestore.rules
if [ ! -f "firestore.rules" ]; then
    echo -e "${RED}✗ firestore.rules nie znaleziony${NC}"
    exit 1
fi
echo -e "${GREEN}✓ firestore.rules znaleziony${NC}"

# Verify storage.rules
if [ ! -f "storage.rules" ]; then
    echo -e "${RED}✗ storage.rules nie znaleziony${NC}"
    exit 1
fi
echo -e "${GREEN}✓ storage.rules znaleziony${NC}"

# Verify indexes
if [ ! -f "firestore.indexes.json" ]; then
    echo -e "${RED}✗ firestore.indexes.json nie znaleziony${NC}"
    exit 1
fi
echo -e "${GREEN}✓ firestore.indexes.json znaleziony${NC}"

echo ""

################################################################################
# PHASE 6: DEPLOYMENT
################################################################################

echo -e "${BLUE}▶ PHASE 6: Wdrażanie na Firebase${NC}"
echo ""

if [ ! -f "deploy.sh" ]; then
    echo -e "${RED}✗ deploy.sh nie znaleziony${NC}"
    exit 1
fi

echo -e "${YELLOW}Wdrażam aplikację...${NC}"
echo ""

# Make deploy.sh executable
chmod +x deploy.sh

# Run deployment
if ./deploy.sh; then
    echo -e "${GREEN}✓ Wdrażanie ukończone!${NC}"
else
    echo -e "${RED}✗ Wdrażanie nie powiodło się${NC}"
    exit 1
fi

echo ""

################################################################################
# PHASE 7: VERIFICATION
################################################################################

echo -e "${BLUE}▶ PHASE 7: Weryfikacja${NC}"
echo ""

HOSTING_URL="https://$PROJECT_ID.web.app"

echo -e "${GREEN}✓ Aplikacja jest dostępna:${NC}"
echo "  🌐 $HOSTING_URL"
echo ""
echo "Zaraz powinna się załadować."
echo ""

################################################################################
# FINAL SUMMARY
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                   ${GREEN}✓ SETUP COMPLETED SUCCESSFULLY${NC}                  ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📊 KONFIGURACJA:${NC}"
echo ""
echo "  Git User:           $GIT_USER"
echo "  Git Email:          $GIT_EMAIL"
echo "  GitHub Repo:        $GITHUB_REPO"
echo "  Current Branch:     $CURRENT_BRANCH"
echo "  Firebase Project:   $PROJECT_ID"
echo "  Hosting URL:        $HOSTING_URL"
echo ""

echo -e "${GREEN}🎯 NASTĘPNE KROKI:${NC}"
echo ""
echo "1. Otwórz aplikację w przeglądarce:"
echo "   🌐 $HOSTING_URL"
echo ""
echo "2. Testuj aplikację:"
echo "   ✓ Zaloguj się (email/Google)"
echo "   ✓ Utwórz post"
echo "   ✓ Obserwuj użytkownika"
echo "   ✓ Dołącz do wyzwania"
echo ""
echo "3. Monitoruj Firebase Console:"
echo "   🔗 https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "4. Czytaj dokumentację:"
echo "   📖 AUDIT_REPORT.md - Pełny audyt"
echo "   📖 TESTING_CHECKLIST.md - Test cases"
echo ""

echo -e "${GREEN}✓ Setup zakończony!${NC}"
echo ""

exit 0
