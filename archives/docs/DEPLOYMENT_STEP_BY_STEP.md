# 🚀 DEPLOYMENT - INSTRUKCJA KROK PO KROKU
## Weekend Warrior Social - Firebase Hosting

**Data**: 15 czerwca 2026  
**Status**: ✅ GOTOWY DO WDROŻENIA  
**Czas deploymentu**: ~15-20 minut  
**Wymagane**: Firebase CLI, Node.js 16+, dostęp do Firebase Project

---

## 📋 SPIS TREŚCI

1. [Przygotowanie środowiska](#1-przygotowanie-środowiska)
2. [Instalacja Firebase CLI](#2-instalacja-firebase-cli)
3. [Konfiguracja projektu](#3-konfiguracja-projektu)
4. [Weryfikacja plików](#4-weryfikacja-plików)
5. [Deployment Firestore Rules](#5-deployment-firestore-rules)
6. [Deployment Storage Rules](#6-deployment-storage-rules)
7. [Deployment Firestore Indexes](#7-deployment-firestore-indexes)
8. [Deployment Hosting](#8-deployment-hosting)
9. [Weryfikacja po deploymencie](#9-weryfikacja-po-deploymencie)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. PRZYGOTOWANIE ŚRODOWISKA

### Krok 1.1: Sprawdź wymagane narzędzia

```bash
# Sprawdź Node.js
node --version
# Powinno być: v16.0.0 lub wyżej

# Sprawdź npm
npm --version
# Powinno być: v7.0.0 lub wyżej

# Sprawdź Git
git --version
# Powinno być: git version 2.x.x
```

**Jeśli brakuje**: Zainstaluj z https://nodejs.org (LTS version)

### Krok 1.2: Zaloguj się do GitHub

```bash
# Sprawdź czy jesteś zalogowany do git
git config --global user.name
git config --global user.email

# Jeśli puste, skonfiguruj:
git config --global user.name "Twoje Imię"
git config --global user.email "twoj.email@example.com"
```

### Krok 1.3: Przygotuj katalog pracy

```bash
# Przejdź do katalogu projektu
cd /home/user/weekend-warrior-social

# Sprawdź czy jesteś w poprawnym katalogu
pwd
# Powinno wyświetlić: /home/user/weekend-warrior-social

ls -la | head -10
# Powinien być: firebase.json, firestore.rules, storage.rules, itp.
```

---

## 2. INSTALACJA FIREBASE CLI

### Krok 2.1: Zainstaluj Firebase CLI globalnie

```bash
npm install -g firebase-tools

# Weryfikuj instalację
firebase --version
# Powinno wyświetlić: firebase-tools/X.X.X
```

**Jeśli już zainstalowany, aktualizuj:**
```bash
npm install -g firebase-tools@latest
```

### Krok 2.2: Sprawdź dostęp Firebase CLI

```bash
# Wylistuj wszystkie dostępne polecenia
firebase --help

# Powinny być dostępne:
# - firebase login
# - firebase deploy
# - firebase projects:list
```

---

## 3. KONFIGURACJA PROJEKTU

### Krok 3.1: Wyloguj się i zaloguj ponownie do Firebase

```bash
# Wyloguj jeśli byłeś zalogowany
firebase logout

# Zaloguj się
firebase login

# Pozwoli ci to otworzyć przeglądarkę do zalogowania
# Zatwierdź dostęp Firebase CLI
```

### Krok 3.2: Ustaw aktywny projekt Firebase

```bash
# Wylistuj dostępne projekty
firebase projects:list

# Powinieneś zobaczyć:
# weekend-warrior-social-ed3d0 (active)

# Ustaw projekt (jeśli nie jest aktywny)
firebase use weekend-warrior-social-ed3d0
```

### Krok 3.3: Weryfikuj konfigurację projektu

```bash
# Wyświetl szczegóły projektu
firebase projects:describe weekend-warrior-social-ed3d0

# Powinieneś zobaczyć:
# Project ID: weekend-warrior-social-ed3d0
# Display Name: Weekend Warrior Social
# Resources: Firestore, Storage, Auth, Hosting
```

---

## 4. WERYFIKACJA PLIKÓW

### Krok 4.1: Sprawdź strukturę katalogów

```bash
# Sprawdź czy wszystkie wymagane pliki istnieją
echo "=== Sprawdzenie plików konfiguracyjnych ===" && \
ls -lh firebase.json firestore.rules firestore.indexes.json storage.rules manifest.json sw.js

# Powinieneś zobaczyć:
# -rw-r--r-- ... firebase.json
# -rw-r--r-- ... firestore.rules
# -rw-r--r-- ... firestore.indexes.json
# -rw-r--r-- ... storage.rules
# -rw-r--r-- ... manifest.json
# -rw-r--r-- ... sw.js
```

### Krok 4.2: Sprawdź katalogi aplikacji

```bash
# Sprawdź HTML files
echo "=== HTML Files ===" && ls -1 *.html | head -5

# Sprawdź CSS files
echo "=== CSS Files ===" && ls -lh css/

# Sprawdź JS files
echo "=== JS Files ===" && ls -lh js/

# Sprawdź ikony
echo "=== Icons ===" && ls -lh assets/icons/
```

**Oczekiwane rezultaty:**
```
✅ 11 plików .html
✅ 4 pliki .css
✅ 11 plików .js
✅ 3 pliki ikon (icon-192.png, icon-512.png, icon-512.svg)
✅ offline.html
```

### Krok 4.3: Sprawdzenie zawartości firebase.json

```bash
cat firebase.json | head -30
```

**Powinieneś zobaczyć:**
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      ...
    ],
    "rewrites": [
      ...
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## 5. DEPLOYMENT FIRESTORE RULES

### Krok 5.1: Waliduj Firestore Rules

```bash
# Sprawdź czy rules są poprawne
firebase validate

# Powinieneś zobaczyć:
# ✔ firestore.rules, storage.rules validated successfully
```

**Jeśli są błędy**, sprawdź plik `firestore.rules` i napraw błędy.

### Krok 5.2: Deploy Firestore Rules

```bash
# Deploy reguł Firestore
firebase deploy --only firestore:rules

# Proces deploymentu potrwa ~30 sekund
# Powinieneś zobaczyć:
# ✔ Deploy complete!
# 
# Project Console: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/rules
```

### Krok 5.3: Weryfikuj deployment w Firebase Console

```bash
# Otwórz Firebase Console
firebase open firestore:rules

# W przeglądarce:
# 1. Przejdź do Firestore > Rules tab
# 2. Powinieneś zobaczyć załadowane reguły
# 3. Status powinien być: "Rules update completed"
```

**Output potwierdzenia:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/rules
Hosting URL: https://weekend-warrior-social-ed3d0.web.app
```

---

## 6. DEPLOYMENT STORAGE RULES

### Krok 6.1: Sprawdź Storage Rules

```bash
# Wyświetl zawartość storage.rules
cat storage.rules | head -20
```

**Powinieneś zobaczyć:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuth() { return request.auth != null; }
    ...
```

### Krok 6.2: Deploy Storage Rules

```bash
# Deploy reguł Cloud Storage
firebase deploy --only storage

# Proces deploymentu potrwa ~30 sekund
# Powinieneś zobaczyć:
# ✔ Deploy complete!
```

### Krok 6.3: Weryfikuj w Firebase Console

```bash
# Otwórz Firebase Console
firebase open storage

# W przeglądarce:
# 1. Przejdź do Storage > Rules tab
# 2. Powinieneś zobaczyć załadowane reguły
# 3. Status powinien być: "Rules deployed"
```

---

## 7. DEPLOYMENT FIRESTORE INDEXES

### Krok 7.1: Sprawdź indeksy

```bash
# Wyświetl zawartość firestore.indexes.json
cat firestore.indexes.json | head -20
```

**Powinieneś zobaczyć:**
```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "Collection",
      "fields": [
        ...
```

### Krok 7.2: Deploy Firestore Indexes

```bash
# Deploy indeksów Firestore
firebase deploy --only firestore:indexes

# Proces może potrwać 5-15 minut
# Firebase tworzy indeksy w tle
# Powinieneś zobaczyć:
# ✔ Deploy complete!
```

### Krok 7.3: Monitoruj postęp tworzenia indeksów

```bash
# Otwórz Firebase Console aby monitorować
firebase open firestore:indexes

# W przeglądarce:
# 1. Firestore > Indexes tab
# 2. Sprawdź status każdego indeksu
# 3. Poczekaj aż wszystkie będą "Enabled"
# 4. Może to potrwać 5-15 minut
```

**Status indeksów:**
```
✅ Enabled (Index is ready)
⏳ Building (Creating index in progress)
❌ Error (Something went wrong)
```

---

## 8. DEPLOYMENT HOSTING

### Krok 8.1: Test lokalny (opcjonalnie)

```bash
# Uruchom lokalny serwer
firebase serve --only hosting

# Powinieneś zobaczyć:
# ✔ hosting[weekend-warrior-social-ed3d0]: Local server: http://localhost:5000

# Otwórz przeglądarkę: http://localhost:5000
# Sprawdź czy strona ładuje się poprawnie
# Ctrl+C aby zatrzymać serwer
```

### Krok 8.2: Deploy Hosting

```bash
# Deploy aplikacji do Firebase Hosting
firebase deploy --only hosting

# Proces deploymentu potrwa ~1-2 minuty
# Powinieneś zobaczyć:
# ✔ Deploy complete!
# 
# Project Console: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/hosting/sites/weekend-warrior-social-ed3d0
# Hosting URL: https://weekend-warrior-social-ed3d0.web.app
```

### Krok 8.3: Poczekaj na propagację CDN

```bash
# Firestore Hosting rozpowszechnia files na CDN
# Czekaj ~2-5 minut na pełną propagację
sleep 10 && echo "Propagacja trwa... poczekaj dalej"

# W tym czasie możesz monitorować:
firebase open hosting
```

---

## 9. WERYFIKACJA PO DEPLOYMENCIE

### Krok 9.1: Sprawdź czy aplikacja się ładuje

```bash
# Otwórz aplikację w przeglądarce
echo "Aplikacja dostępna pod:"
echo "https://weekend-warrior-social-ed3d0.web.app"

# Alternatywnie:
firebase open hosting:site
```

**Sprawdź w przeglądarce:**
- [ ] Strona się ładuje (bez błędu 404)
- [ ] Widać tekst "Weekend Warrior Social" lub logo
- [ ] Nie ma błędów w JavaScript Console (F12 > Console)
- [ ] Ikona aplikacji się wyświetla
- [ ] Manifest.json ładuje się (Network tab)

### Krok 9.2: Sprawdź Service Worker

```bash
# W przeglądarce (F12):
# 1. Application tab
# 2. Service Workers
# Powinieneś zobaczyć:
# - sw.js registered ✓
# - Status: activated and running
```

### Krok 9.3: Sprawdź manifest.json

```bash
# W przeglądarce (F12):
# 1. Network tab
# 2. Przenieś się na aplikację
# 3. Poszukaj manifest.json
# Powinieneś zobaczyć:
# - Status: 200 OK
# - Typ: application/manifest+json
```

### Krok 9.4: Test PWA Installation

```bash
# Na Android (Chrome):
# 1. Otwórz https://weekend-warrior-social-ed3d0.web.app
# 2. Menu (3 kropki) > "Install app"
# 3. Potwierdź instalację
# 4. Aplikacja pojawi się na home screen

# Na iOS (Safari):
# 1. Otwórz https://weekend-warrior-social-ed3d0.web.app
# 2. Kliknij Share
# 3. "Add to Home Screen"
# 4. Aplikacja pojawi się na home screen
```

### Krok 9.5: Sprawdź Firestore Rules w konsoli

```bash
# Otwórz Firebase Console
firebase open firestore

# Sprawdź:
# 1. Firestore > Rules tab
# 2. Powinno być: "Last deployed: [data i czas]"
# 3. Rules powinny być widoczne w edytorze
```

### Krok 9.6: Sprawdź Storage Rules w konsoli

```bash
# Otwórz Firebase Console
firebase open storage

# Sprawdź:
# 1. Storage > Rules tab
# 2. Powinno być: "Last deployed: [data i czas]"
# 3. Rules powinny być widoczne w edytorze
```

### Krok 9.7: Sprawdź Firestore Indexes w konsoli

```bash
# Otwórz Firebase Console
firebase open firestore:indexes

# Sprawdź każdy indeks:
# Status powinien być: "Enabled" (zielony haczyk)
# Jeśli jest "Building", czekaj dalej
```

### Krok 9.8: Test autentykacji

```bash
# W przeglądarce na https://weekend-warrior-social-ed3d0.web.app
# 1. Kliknij "Zaloguj" lub "Rejestruj"
# 2. Wpisz email i hasło
# 3. Sprawdź czy możesz się zalogować
# 4. Sprawdź czy pojawia się strona główna aplikacji
# 5. Wyloguj się

# Jeśli działa, Firebase Auth jest poprawnie skonfigurowany ✓
```

### Krok 9.9: Sprawdź logi deploymentu

```bash
# Wyświetl ostatnie logi deploymentu
firebase deploy:list

# Powinieneś zobaczyć listę ostatnich deploymentów
# Najnowszy powinien być dzisiaj
```

---

## 10. TROUBLESHOOTING

### Problem: "Permission denied" podczas logowania

```bash
# Rozwiązanie:
firebase logout
firebase login

# Jeśli dalej nie działa:
# Sprawdź role w Google Cloud:
# https://console.cloud.google.com/iam-admin/iam?project=weekend-warrior-social-ed3d0
# Powinnaś mieć role: Editor
```

### Problem: "firestore.rules not found"

```bash
# Sprawdź czy plik istnieje
ls -la firestore.rules

# Jeśli nie istnieje, sprawdź czy jesteś w poprawnym katalogu
pwd
# Powinna być: /home/user/weekend-warrior-social

# Jeśli jesteś w poprawnym katalogu, ale plik nie istnieje:
# Skopiuj z backup albo sklonuj repozytorium ponownie
```

### Problem: "Assets returning 404"

```bash
# Sprawdź czy assets są w ignorie w firebase.json
grep -A 20 "\"ignore\"" firebase.json

# Upewnij się że nie ma:
# "css/", "js/", "assets/" w ignore list

# Redeploy hosting:
firebase deploy --only hosting
```

### Problem: "Service Worker not registering"

```bash
# 1. Hard refresh w przeglądarce
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# 2. Wyczyść cache
# F12 > Application > Clear site data

# 3. Redeploy sw.js
firebase deploy --only hosting

# 4. Czekaj 2-3 minuty na propagację CDN
```

### Problem: "Firebase SDK not loading"

```bash
# Sprawdź czy firebase.js się ładuje
# F12 > Network tab > Poszukaj firebase-app.js
# Status powinien być: 200

# Jeśli 404:
# Sprawdź czy js/firebase.js istnieje
ls -la js/firebase.js

# Sprawdź czy jest błąd w firebase.js
# F12 > Console > Poszukaj error messages
```

### Problem: "Indexes in 'Building' state"

```bash
# To jest normalne! Firestore tworzy indeksy w tle
# Czekaj 5-15 minut na zakończenie

# Monitoruj postęp:
firebase open firestore:indexes

# Indeks jest gotowy kiedy status to "Enabled" (zielony haczyk)
```

### Problem: "Rules deployment failed"

```bash
# Sprawdź czy jest błąd w regułach
firebase validate

# Jeśli jest błąd, pokaże dokładnie gdzie
# Napraw błąd w firestore.rules

# Spróbuj deployować ponownie
firebase deploy --only firestore:rules
```

### Problem: "Connection timeout"

```bash
# To może być problem z internetem
# Sprawdź połączenie:
ping google.com

# Jeśli nie ma odpowiedzi, sprawdź sieć

# Spróbuj deployować ponownie:
firebase deploy --only hosting
```

---

## ✅ FINAL CHECKLIST

### Przed deploymentem:
- [ ] Node.js i npm zainstalowane
- [ ] Firebase CLI zainstalowany
- [ ] Zalogowany do Firebase (firebase login)
- [ ] Projekt ustawiony (firebase use ...)
- [ ] Wszystkie pliki na miejscu
- [ ] Nie ma błędów walidacji (firebase validate)

### Podczas deploymentu:
- [ ] Deploy firestore:rules (~/30 sec)
- [ ] Deploy storage (~/30 sec)
- [ ] Deploy firestore:indexes (5-15 min)
- [ ] Deploy hosting (~/1-2 min)
- [ ] Poczekaj na propagację CDN (2-5 min)

### Po deploymencie:
- [ ] Aplikacja się ładuje
- [ ] Service Worker zarejestrowany
- [ ] Manifest.json ładuje się
- [ ] Autentykacja działa
- [ ] Rules pokazują się w konsoli
- [ ] Indexes są enabled
- [ ] PWA instaluje się na telefonie

### Łączny czas: ~20-30 minut ⏱️

---

## 📞 SUPPORT

Jeśli napotkasz problemy:

1. **Sprawdź console output** - poszukaj konkretnych błędów
2. **Sprawdź Firebase Console** - czy resources się pokazują
3. **Sprawdź Browser Console** (F12) - JavaScript errors
4. **Sprawdź Network tab** (F12) - 404 errors
5. **Czytaj documentację**: https://firebase.google.com/docs

---

## 🎉 KONIEC!

Jeśli wszystko poszło dobrze, Twoja aplikacja jest dostępna na:

### 🌐 https://weekend-warrior-social-ed3d0.web.app

Gratulacje! 🎊

---

**Deployment zakończony**: [DATA DZISIEJSZA]  
**Status**: ✅ LIVE  
**Aplikacja dostępna**: 24/7 na Firebase Hosting CDN

