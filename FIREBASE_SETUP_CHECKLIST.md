# Firebase Console - Checklist Konfiguracji

**Projekt:** weekend-warrior-social-ed3d0  
**URL:** https://console.firebase.google.com/project/weekend-warrior-social-ed3d0

---

## ✅ Authentication Setup

### 1. Enable Email/Password Authentication
```
Path: Authentication → Sign-in method → Email/Password
```

- [ ] Email/Password włączona (enable button powinien być wyłączony)
- [ ] Status: `Enabled` (zielony)
- [ ] Email link (passwordless) - optional
- [ ] Email enumeration protection - zaznaczone

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/providers
```

### 2. Authorized Domains
```
Path: Authentication → Sign-in method → Authorized domains
```

- [ ] `weekend-warrior-social-ed3d0.web.app` ✓
- [ ] `weekend-warrior-social-ed3d0.firebaseapp.com` ✓
- [ ] `localhost` ✓
- [ ] Brak domen z `*` (wildcard)

**WAŻNE:** Jeśli domena nie jest na liście → `auth/requests-from-referer-blocked`

Jak dodać domenę:
1. Kliknij "Add domain"
2. Wpisz domenę bez `https://` (np. `weekend-warrior-social-ed3d0.web.app`)
3. Czekaj propagacji (może trwać kilka minut)

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/settings
```

---

## 📚 Firestore Database Setup

### 1. Database Instance
```
Path: Firestore Database
```

- [ ] Database istnieje
- [ ] Region: `europe-west1` lub inny (powinna być wyświetlona lokalizacja)
- [ ] Mode: `Native mode` (nie `Datastore mode`)
- [ ] Status: `Production` lub `Test mode`

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore
```

### 2. Firestore Rules
```
Path: Firestore Database → Rules
```

- [ ] Rules są opublikowane (pokazuje datę i godzinę ostatniej publikacji)
- [ ] Nie ma błędów (czerwonego X obok Rules)
- [ ] Wersjowanie: `rules_version = '2';` na początku
- [ ] Zawiera regułę dla `/users/{uid}`

**Treść reguły dla users:**
```firestore
match /users/{uid} {
  allow create: if isOwner(uid) && isValidUser(request.resource.data);
  allow read: if isAuth();
  allow update: if isOwner(uid) || /* ... */;
}
```

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/rules
```

### 3. Firestore Indexes
```
Path: Firestore Database → Indexes
```

- [ ] Indexes są wdrożone (status = `Enabled`)
- [ ] Brak błędów lub ostrzeżeń
- [ ] Ilość indexes: 11

**Lista indexów:**
```
users (createdAt)
posts (createdAt)
posts (authorId, createdAt)
followers (followerId)
followers (followingId)
conversations (participants)
conversations (lastMessageAt)
weeklyScores (xpThisWeek)
pokes (targetId, createdAt)
challenge_completions (userId, createdAt)
friend_requests (senderId, status)
```

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/indexes
```

---

## 🔐 IAM & Service Accounts

### 1. Service Account dla GitHub Actions
```
Path: Project Settings → Service Accounts → Firebase Admin SDK
```

- [ ] Service account email: `firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com`
- [ ] Posiada role:
  - [ ] `roles/firebase.admin` LUB
  - [ ] `roles/firebase.rulesAdmin` + `roles/firestore.admin`

**Sprawdzenie IAM:**
```
https://console.cloud.google.com/iam-admin/iam?project=weekend-warrior-social-ed3d0
```

Szukaj:
- firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com
- powinien mieć role (zielona ikona 🟢)

---

## 🚀 Firebase Hosting

### 1. Hosting Configuration
```
Path: Hosting
```

- [ ] Site istnieje: `weekend-warrior-social-ed3d0`
- [ ] Domain: `weekend-warrior-social-ed3d0.web.app`
- [ ] HTTPS: ✓ (powinno być)
- [ ] Ostatni deploy: pokazana data i godzina

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/hosting/sites
```

### 2. Deployment History
```
Path: Hosting → Releases
```

- [ ] Ostatni deploy ma status `✓ Success`
- [ ] Pokazana data i godzina
- [ ] Commit hash lub build ID

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/hosting/releases
```

---

## 🌐 Web App Configuration

### 1. Web App Registration
```
Path: Project Settings → Your apps → [Weekend Warrior Social]
```

- [ ] Firebase SDK config powinien zawierać:

```javascript
apiKey: "AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98"
authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com"
projectId: "weekend-warrior-social-ed3d0"
messagingSenderId: "487311448505"
appId: "1:487311448505:web:ffbe035b92efa8fc193e68"
```

- [ ] `apiKey` - nie jest pusty i zawiera znaki
- [ ] `authDomain` - zawiera `.firebaseapp.com`
- [ ] `projectId` - zgadza się z nazwą projektu

**Sprawdzenie:**
```
https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/settings/general
```

Kliknij na app > Web configuration

---

## 🔧 GitHub Actions Secrets

### 1. Repository Secrets
```
Path: GitHub → Settings → Secrets → Actions
```

- [ ] Secret: `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] Value: pełny JSON service account (skopiowany z Firebase Console)

**Format JSON:**
```json
{
  "type": "service_account",
  "project_id": "weekend-warrior-social-ed3d0",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "firebase-adminsdk-fbsvc@weekend-warrior-social-ed3d0.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**Sprawdzenie:**
```
https://github.com/bvt2kzkbb9-art/weekend-warrior-social/settings/secrets/actions
```

---

## 📊 Checklist przed testowaniem

### Step 1: Firebase Console
- [ ] Email/Password authentication ENABLED
- [ ] Authorized domains zawierają `weekend-warrior-social-ed3d0.web.app`
- [ ] Firestore Rules opublikowane (show timestamp)
- [ ] Firestore Database istnieje
- [ ] Service account ma poprawne role (IAM)

### Step 2: Aplikacja
- [ ] Firebase config w `src/js/core/firebase.js` jest poprawny
- [ ] Kod auth w `src/js/core/auth.js` zawiera nowe logi
- [ ] Zmiany committed i pushed
- [ ] Hosting deployment zakończył się SUCCESS

### Step 3: Aplikacja Live
- [ ] URL: https://weekend-warrior-social-ed3d0.web.app
- [ ] Otwórz Developer Console (F12)
- [ ] Obserwuj logi inicjalizacji Firebase
- [ ] Kliknij "Stwórz konto" i obserwuj logi
- [ ] Szukaj błędów w Console

---

## 🚨 Najczęstsze Problemy

### Problem: `auth/requests-from-referer-blocked`
**Rozwiązanie:**
1. Idź do: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/settings
2. Sprawdź "Authorized domains"
3. Dodaj `weekend-warrior-social-ed3d0.web.app` jeśli brakuje
4. Czekaj 2-5 minut na propagację
5. Wyczyść cache przeglądarki (Ctrl+Shift+Delete)

### Problem: `auth/operation-not-allowed`
**Rozwiązanie:**
1. Idź do: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/authentication/providers
2. Sprawdź czy "Email/Password" jest ENABLED (powinien być niebieski)
3. Kliknij na niego jeśli jest wyłączony
4. Włącz Email/Password (toggle)

### Problem: `permission-denied` (Firestore)
**Rozwiązanie:**
1. Idź do: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/firestore/rules
2. Sprawdź czy Rules są opublikowane (powinny pokazywać timestamp)
3. Sprawdź Rules Simulator (Rules > Rules Playground)
4. Test: `users/{uid}` → Create

### Problem: Hosting nie pokazuje aplikacji
**Rozwiązanie:**
1. Sprawdź URL: https://weekend-warrior-social-ed3d0.web.app (bez `/index.html`)
2. Idź do: https://console.firebase.google.com/project/weekend-warrior-social-ed3d0/hosting/releases
3. Sprawdź czy ostatni deploy ma `✓`
4. Jeśli nie, redeploy: `firebase deploy --only hosting`

---

## 🎯 Test Connectivity

### Test 1: Firebase Auth Connection
W Developer Console:
```javascript
import { auth } from './src/js/core/firebase.js';
console.log('Auth config:', auth.config);
```

Powinno wyświetlić:
```javascript
{
  apiKey: "AIzaSyA...",
  authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com",
  projectId: "weekend-warrior-social-ed3d0",
  ...
}
```

### Test 2: Firestore Connection
```javascript
import { db } from './src/js/core/firebase.js';
console.log('Firestore project:', db.projectId);
```

Powinno wyświetlić: `weekend-warrior-social-ed3d0`

### Test 3: Auth State
```javascript
import { auth } from './src/js/core/firebase.js';
auth.onAuthStateChanged(user => {
  console.log('Current user:', user ? user.email : 'Not logged in');
});
```

---

## 📋 Ostateczna Weryfikacja

Przed zgłoszeniem problemu, sprawdź:

1. **Firebase Console:**
   - [ ] Email/Password ENABLED
   - [ ] Authorized domains zawierają aplikację
   - [ ] Firestore Rules opublikowane
   - [ ] Service account ma role

2. **Aplikacja:**
   - [ ] Firebase config jest poprawny
   - [ ] Deployment SUCCESS
   - [ ] Console nie pokazuje błędów
   - [ ] Logi inicjalizacji są widoczne

3. **Browser:**
   - [ ] HTTPS (nie HTTP)
   - [ ] Poprawna domena (`weekend-warrior-social-ed3d0.web.app`)
   - [ ] Cache wyczyszczony
   - [ ] Bez VPN/proxy (może blokować CORS)

Jeśli wszystko OK, aplikacja powinna działać!

---

## 🆘 Debug Mode

Aby uzyskać maksymalnie szczegółowe logi:

1. Otwórz Developer Console (F12)
2. Wpisz w Console:
```javascript
localStorage.debug = 'firebase-*';
```

3. Przeładuj stronę
4. Będą widoczne wewnętrzne logi Firebase

Aby wyłączyć:
```javascript
localStorage.removeItem('debug');
```

