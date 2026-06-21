# Weekend Warrior Social - Foundation v0.1

Czysty zarys aplikacji. Struktura UI i stylów gotowa.

## 📋 Co zawiera

- **HTML** — Pełna struktura UI (5 głównych stron)
- **CSS** — Kompletny design system (RGP theme, style, responsive)
- **JS** — Minimalne moduły (stubs gotowe do implementacji)
- **Assets** — Icon i manifest dla PWA

## 🚀 Kroki setup Firebase

### 1. Utwórz nowy projekt Firebase
```
https://console.firebase.google.com
```

### 2. Dodaj dane do `js/firebase.js`
Znajdź w Firebase Console → Ustawienia projektu → Aplikacje sieci web

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Włącz usługi w Firebase
- **Authentication** → Email/Password
- **Firestore Database** → Tryb testowy
- **Storage** (opcjonalnie)

### 4. Uruchom lokalnie
```bash
python -m http.server 8000
# Otwórz http://localhost:8000
```

### 5. Deploy na GitHub Pages
```bash
git push origin main
# GitHub Pages → Settings → Enable
```

## 📁 Struktura

```
/css           — Style (rpg-theme.css, style.css, arena.css, messenger.css)
/js            — Moduły (firebase.js, auth.js, arena.js, feed.js, itp.)
/index.html    — Arena (strona główna)
/feed.html     — Kroniki (feed społeczny)
/arena.html    — Misje (challenges)
/ranking.html  — Chwała (leaderboard)
/profile.html  — Bohater (profil)
/messenger.html — Wiadomości (chat)
/login.html    — Login
/register.html — Rejestracja
/manifest.json — PWA manifest
/sw.js         — Service Worker
```

## 🎨 Design System

- **Kolory**: `#D4AF37` (gold), `#080808` (bg primary), `#111111` (bg secondary)
- **Typografia**: 28px–12px scale
- **Spacing**: 4/8/12/16/24/32px
- **Touch targets**: min 44px

## ⚠️ TODO

- [ ] Zaimplementuj Firebase Auth
- [ ] Dodaj Firestore queries
- [ ] Integruj Cloudinary
- [ ] Zbuduj system XP/Challenges
- [ ] Dodaj real-time wiadomości

Wersja: Foundation 0.1
Data: 2024-05-24
