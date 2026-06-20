#!/bin/bash
# WEEKEND WARRIOR SOCIAL - DEPLOYMENT EXECUTION SCRIPT
# Skopiuj i uruchom wszystkie polecenia po kolei

echo "🚀 Weekend Warrior Social - Setup & Deployment"
echo "=============================================="
echo ""
echo "Postępuj zgodnie z instrukcjami poniżej."
echo "Skopiuj każdą sekcję do terminala i wykonaj."
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 1: KONFIGURACJA GIT
# ============================================================================
echo "📝 SEKCJA 1: Konfiguracja Git"
echo ""
echo "Jeśli nigdy nie konfigurówałeś Git, uruchom:"
echo ""
echo "git config --global user.name \"Twoje Imię\""
echo "git config --global user.email \"twoj.email@gmail.com\""
echo ""
echo "Aby sprawdzić czy już skonfigurowano:"
echo "git config --global user.name"
echo "git config --global user.email"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 2: KONFIGURACJA GITHUB
# ============================================================================
echo "🔗 SEKCJA 2: Konfiguracja GitHub"
echo ""
echo "Dodaj GitHub remote (jeśli jeszcze nie dodałeś):"
echo ""
echo "git remote add origin https://github.com/bvt2kzkbb9-art/weekend-warrior-social.git"
echo ""
echo "Aby sprawdzić:"
echo "git remote -v"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 3: POPRAWNY BRANCH
# ============================================================================
echo "🌳 SEKCJA 3: Sprawdzenie/Przełączenie na poprawny branch"
echo ""
echo "Sprawdź aktualny branch:"
echo "git branch --show-current"
echo ""
echo "Jeśli nie jesteś na: claude/weekend-warrior-audit-fixes-xykimj"
echo "Przełącz się:"
echo ""
echo "git checkout claude/weekend-warrior-audit-fixes-xykimj"
echo ""
echo "Lub utwórz nowy z najnowszymi zmianami:"
echo ""
echo "git fetch origin"
echo "git checkout -b claude/weekend-warrior-audit-fixes-xykimj origin/claude/weekend-warrior-audit-fixes-xykimj"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 4: FIREBASE LOGIN
# ============================================================================
echo "🔐 SEKCJA 4: Zalogowanie do Firebase"
echo ""
echo "Uruchom:"
echo ""
echo "firebase login"
echo ""
echo "Pozwoli to otworzyć przeglądarkę do zalogowania się w Firebase."
echo "Zatwierdzić dostęp dla Firebase CLI."
echo ""
echo "Potem sprawdź czy zalogowano się:"
echo "firebase projects:list"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 5: USTAWIANIE PROJEKTU FIREBASE
# ============================================================================
echo "⚙️  SEKCJA 5: Ustawianie projektu Firebase"
echo ""
echo "Ustaw projekt:"
echo ""
echo "firebase use weekend-warrior-social-ed3d0"
echo ""
echo "Sprawdź czy ustawiono:"
echo "firebase projects:describe weekend-warrior-social-ed3d0"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 6: DEPLOYMENT
# ============================================================================
echo "🚀 SEKCJA 6: DEPLOYMENT - GŁÓWNY KROK"
echo ""
echo "Upewnij się że jesteś w katalogu projektu:"
echo ""
echo "cd /home/user/weekend-warrior-social"
echo ""
echo "Sprawdź czy deploy.sh istnieje:"
echo ""
echo "ls -la deploy.sh"
echo ""
echo "Uruchom deployment:"
echo ""
echo "./deploy.sh"
echo ""
echo "⏱️  To potrwa 20-30 minut!"
echo "   - Deploy Firestore Rules: ~30 sec"
echo "   - Deploy Storage Rules: ~30 sec"
echo "   - Deploy Firestore Indexes: 5-15 min (CZEKAJ!)"
echo "   - Deploy Hosting: ~1-2 min"
echo "   - CDN Propagation: 2-5 min"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 7: WERYFIKACJA
# ============================================================================
echo "✅ SEKCJA 7: Weryfikacja"
echo ""
echo "Po deploymencie (20-30 minut), otwórz w przeglądarce:"
echo ""
echo "https://weekend-warrior-social-ed3d0.web.app"
echo ""
echo "Powinieneś zobaczyć:"
echo "  ✓ Stronę logowania"
echo "  ✓ Ciemny interfejs (dark theme)"
echo "  ✓ Złote akcenty"
echo "  ✓ Przycisk 'Zaloguj się'"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# SEKCJA 8: TESTY
# ============================================================================
echo "🧪 SEKCJA 8: Testy (Po deploymencie)"
echo ""
echo "Otwórz aplikację i testuj:"
echo ""
echo "1. Zaloguj się (utwórz konto email lub użyj Google OAuth)"
echo "2. Utwórz post"
echo "3. Obserwuj innego użytkownika"
echo "4. Dołącz do wyzwania"
echo "5. Sprawdź czy PWA instaluje się na telefonie"
echo ""
echo "=============================================="
echo ""

# ============================================================================
# PODSUMOWANIE
# ============================================================================
echo "📋 PODSUMOWANIE KOMEND (szybka kopia):"
echo ""
echo "# 1. Konfiguracja Git"
echo "git config --global user.name \"Twoje Imię\""
echo "git config --global user.email \"twoj.email@gmail.com\""
echo ""
echo "# 2. GitHub remote"
echo "git remote add origin https://github.com/bvt2kzkbb9-art/weekend-warrior-social.git"
echo ""
echo "# 3. Poprawny branch"
echo "git checkout claude/weekend-warrior-audit-fixes-xykimj"
echo ""
echo "# 4. Firebase login"
echo "firebase login"
echo ""
echo "# 5. Ustaw projekt"
echo "firebase use weekend-warrior-social-ed3d0"
echo ""
echo "# 6. DEPLOYMENT (GŁÓWNY KROK!)"
echo "cd /home/user/weekend-warrior-social"
echo "./deploy.sh"
echo ""
echo "# 7. Otwórz aplikację"
echo "https://weekend-warrior-social-ed3d0.web.app"
echo ""
echo "=============================================="
echo ""
echo "🎉 To wszystko!"
echo ""
echo "Powodzenia! 🚀"
echo ""
