# 🎯 WEEKEND WARRIOR SOCIAL — QUICK START GUIDE

**Wersja:** Clean Build (22 czerwca 2026)  
**Status:** ✅ Production Ready  
**Baza:** weekend-warrior-social-main 15 (refactored)

---

## ⚡ 5-MINUTOWY SETUP

### Krok 1: Klonuj/Pobierz projekt

```bash
# Jeśli GitHub:
git clone https://github.com/YourUsername/weekend-warrior-social.git
cd weekend-warrior-social

# Jeśli ZIP:
unzip weekend-warrior-social-clean.zip
cd weekend-warrior-social-clean
```

### Krok 2: Skonfiguruj Firebase

1. Przejdź do [Firebase Console](https://console.firebase.google.com)
2. Stwórz nowy projekt lub użyj istniejącego
3. Idź do **Ustawienia projektu** → **Aplikacje** → **Aplikacja webowa**
4. Skopiuj `firebaseConfig` object

### Krok 3: Dodaj konfigurację

```bash
# Skopiuj szablon
cp firebase-config-template.js firebase-config.js

# Otwórz firebase-config.js i uzupełnij wartości z Firebase Console
# ⚠️ firebase-config.js jest już w .gitignore — bezpieczny
```

### Krok 4: Uruchom lokalnie

```bash
# Otwórz w przeglądarce:
# Mac: open index.html
# Linux: xdg-open index.html
# Windows: start index.html

# Lub użyj local server:
python3 -m http.server 8000
# Otwórz: http://localhost:8000
```

### Krok 5: Wdróż

```bash
# Firebase Hosting (rekomendowane):
npm install -g firebase-tools
firebase login
firebase deploy

# GitHub Pages:
git add .
git commit -m "Initial commit - clean build"
git push origin main
# Włącz GitHub Pages w Settings → Pages → main branch
```

**✅ Gotowe!** Aplikacja jest dostępna pod:
- Firebase: `https://your-project-id.web.app`
- GitHub Pages: `https://your-username.github.io/weekend-warrior-social`

---

## 📁 STRUKTURA PROJEKTU

```
weekend-warrior-social-clean/
├── index.html              → Arena (główna strona)
├── feed.html               → Feed społeczności
├── profile.html            → Profil użytkownika
├── ranking.html            → Ranking / Sala chwały
├── challenges.html         → Misje / Wyzwania
├── messenger.html          → Wiadomości
├── register.html           → Rejestracja
├── login.html              → Logowanie
├── terms.html              → Warunki użytkowania
│
├── css/
│   ├── style.css           → Design system + komponenty
│   ├── rpg-theme.css       → RPG visual identity
│   ├── arena.css           → Layout system
│   └── messenger.css       → Messenger UI
│
├── js/
│   ├── firebase.js         → Firebase init + Firestore API
│   ├── auth.js             → Authentication (login/register)
│   ├── feed.js             → Posts feed
│   ├── profile.js          → User profiles
│   ├── arena.js            → Dashboard logic
│   ├── social.js           → Social features (like, follow)
│   ├── messenger.js        → Chat system
│   ├── notifications.js    → Notifications
│   ├── challenge-system.js → Challenge definitions + logic
│   ├── weekly-ranking.js   → Ranking system
│   └── xp.js               → XP/leveling system
│
├── firebase-config-template.js  → Szablon konfiguracji (COPY THIS!)
├── .gitignore              → Git ignore list
├── manifest.json           → PWA configuration
├── sw.js                   → Service Worker (offline)
├── icon-512.svg            → PWA icon
│
├── firestore.rules         → Firestore Security Rules
├── storage.rules           → Storage Security Rules
├── firestore.indexes.json  → Firestore indexes
├── firebase.json           → Firebase Hosting config
│
├── SETUP.md (ten plik)     → Instrukcje setup
├── DEPLOYMENT_GUIDE.md     → Deployment szczegóły
├── PRODUCTION_READINESS_REPORT.md → Status
└── README.md               → Opis projektu
```

---

## 🔐 BEZPIECZEŃSTWO

### ✅ Wtedy jest BEZPIECZNE:

- ✅ `firebase-config.js` jest w `.gitignore`
- ✅ Firestore Security Rules są skonfigurowane
- ✅ Storage Rules ograniczają dostęp
- ✅ API keys są wczytywane z zmiennych (nie hardcoded)

### ⚠️ DO ZROBIENIA:

1. **Zmień Firebase API keys** (jeśli były kiedyś exponowane):
   - Firebase Console → Ustawienia projektu → API keys
   - Regeneruj API Key
   - Uzupełnij w `firebase-config.js`

2. **Wdróż Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Ustaw Cloudinary access:**
   - Project Manager musi sprawdzić `dxanfwb3l` account
   - Upewnij się że upload presets (`wws_avatar`, `wws_banner`) istnieją

---

## 📚 ARCHITEKTURA

### Firebase Collections (13)

```
users/{uid}                 → User profiles, XP, level, rank
posts/{postId}              → Social posts
comments/{commentId}        → Post comments
followers/{docId}           → Followers list
friend_requests/{docId}     → Friend request system
friends/{docId}             → Friends list
conversations/{convId}      → Direct messages conversations
messages/{msgId}            → Messages in conversations
notifications/{notifId}     → User notifications
challenge_invites/{id}      → Challenge invitations
challenges/{chalId}         → Challenge definitions
laga_requests/{id}          → Loan requests (future)
achievements/{achId}        → Achievement definitions
userAchievements/{id}       → User achievements unlocked
```

### Firestore Security Rules

**Już załadowane w `firestore.rules`:**

- `/users/{uid}` — Owner full edit, others can update XP
- `/posts/{postId}` — Author delete, others like/comment
- `/followers` — Follow/unfollow logic
- `/friend_requests` — Request system
- `/friends` — Friend connections
- `/conversations` — Private chat access
- `/messages` — Message ownership
- `/challenges` — Challenge definitions
- `/achievements` — Achievement tracking

---

## 🌐 DEPLOYMENT OPCJE

### A) Firebase Hosting (Rekomendowane dla PWA)

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

**Zalety:**
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Seamless Firestore integration
- ✅ Free tier: 1 GB/month

### B) GitHub Pages

```bash
# Wdróż na branch gh-pages
git subtree push --prefix . origin gh-pages

# LUB: włącz GitHub Pages w Settings
```

**Zalety:**
- ✅ Free hosting
- ✅ No build step needed
- ✅ Auto-deploy from main

### C) Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## 🧪 TESTOWANIE

### Offline (PWA)

```javascript
// 1. Otwórz DevTools (F12)
// 2. Network → Throttling → Offline
// 3. Aplikacja działa bez internetu (Service Worker cache)
```

### Firebase Auth

```javascript
// Test login:
// Email: test@example.com
// Password: Test123!

// Test Google OAuth:
// Kliknij "Zaloguj przez Google"
```

### Cloudinary Upload

```javascript
// 1. Idź do profilu
// 2. Zmień avatar
// 3. Wybierz zdjęcie
// 4. Upload → Cloudinary (100% progress)
// 5. Avatar zmieniony
```

---

## 🐛 TROUBLESHOOTING

### Firebase config nie załadowany

```javascript
// Problem: "Firebase configuration missing"
// Rozwiązanie:
// 1. Skopiuj firebase-config-template.js → firebase-config.js
// 2. Uzupełnij wartości z Firebase Console
// 3. Reload strony
```

### Firestore permission-denied

```javascript
// Problem: "permission-denied" w console
// Rozwiązanie:
// 1. Firebase Console → Firestore → Rules
// 2. Wdróż firestore.rules: firebase deploy --only firestore:rules
// 3. Czekaj 1-2 minuty na propagację
```

### Cloudinary upload fails

```javascript
// Problem: Upload zdjęcia nie działa
// Rozwiązanie:
// 1. Sprawdź czy cloud_name = 'dxanfwb3l'
// 2. Sprawdź upload_preset ('wws_avatar', 'wws_banner')
// 3. Kontakt: Cloudinary Console → Settings → Upload
```

---

## 📚 DOKUMENTACJA

- **DEPLOYMENT_GUIDE.md** — Szczegółowe kroki deploymentu
- **PRODUCTION_READINESS_REPORT.md** — Status & checklist
- **firestore.rules** — Pełne Security Rules
- **firebase.json** — Hosting configuration

---

## 🚀 NASTĘPNE KROKI

1. ✅ Setup + Deploy (ta sekcja)
2. 🔜 Warrior OS 2.0 Architecture Implementation
3. 🔜 Phase 1: Auth/Dashboard Refactor
4. 🔜 Phase 2-5: Feature rollout

---

## 💬 SUPPORT

**Pytania? Problemy?**

1. Sprawdź `console.log` (DevTools → Console)
2. Przejrzyj `firestore.rules` dla permission issues
3. Upewnij się że `firebase-config.js` ma prawidłowe wartości

---

*Opracowano: 22 czerwca 2026*  
*Wersja: Clean Build (v15 refactored)*  
*Gotowa do Warrior OS 2.0*
