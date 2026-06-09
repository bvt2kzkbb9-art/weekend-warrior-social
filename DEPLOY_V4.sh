#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  WEEKEND WARRIOR SOCIAL V4 — DEPLOYMENT SCRIPT                 ║"
echo "║  Firebase Hosting Deployment                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}1️⃣  Sprawdzanie Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI nie znaleziony. Instalowanie...${NC}"
    npm install -g firebase-tools
else
    echo -e "${GREEN}✓ Firebase CLI zainstalowany${NC}"
    firebase --version
fi

echo ""
echo -e "${BLUE}2️⃣  Logowanie do Firebase...${NC}"
echo "To otworzy przeglądarkę do logowania."
firebase login

echo ""
echo -e "${BLUE}3️⃣  Weryfikacja konfiguracji...${NC}"
firebase projects:list

echo ""
echo -e "${BLUE}4️⃣  Wdrażanie na Firebase Hosting...${NC}"
echo "To może potrwać kilka minut..."
firebase deploy --only hosting

echo ""
echo -e "${BLUE}5️⃣  Sprawdzenie statusu wdrażania...${NC}"
firebase hosting:channel:list

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ WDRAŻANIE ZAKOŃCZONE!${NC}"
echo ""
echo -e "${BLUE}Twoja aplikacja jest dostępna na:${NC}"
echo -e "${YELLOW}https://weekend-warrior-social-ed3d0.web.app${NC}"
echo ""
echo -e "${BLUE}Lub:${NC}"
echo -e "${YELLOW}https://weekend-warrior-social-ed3d0.firebaseapp.com${NC}"
echo ""
echo -e "${BLUE}V4 App dostępny na:${NC}"
echo -e "${YELLOW}https://weekend-warrior-social-ed3d0.web.app/index-v4.html${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
