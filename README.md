# ⚔️ Warrior OS 2.0 - System Autentykacji

## 📋 Spis treści
1. [Instalacja](#instalacja)
2. [Konfiguracja Firebase](#konfiguracja-firebase)
3. [Struktura projektu](#struktura-projektu)
4. [Funkcjonalności](#funkcjonalności)
5. [API Auth Service](#api-auth-service)
6. [Design System](#design-system)
7. [Bezpieczeństwo](#bezpieczeństwo)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Instalacja

### Wymagania
- Nowoczesna przeglądarka (Chrome 90+, Firefox 88+, Safari 14+)
- Dostęp do Firebase Console
- Domena do hostowania (GitHub Pages, Netlify, Vercel itp.)

### Kroki instalacji

1. **Pobierz pliki**
```bash
unzip warrior-os-2-auth.zip
cd warrior-os-2-auth
```

2. **Skonfiguruj Firebase** (patrz: [Konfiguracja Firebase](#konfiguracja-firebase))

3. **Wdrażanie** (GitHub Pages)
```bash
# Skopiuj pliki do folderu gh-pages repo
# Zapisz i wciśnij do origin
git push origin gh-pages
```

---

## 🔥 Konfiguracja Firebase

### 1. Stwórz projekt Firebase

1. Przejdź do https://console.firebase.google.com/
2. Kliknij "Add project"
3. Wpisz nazwę (np. "warrior-os-2")
4. Wyłącz Google Analytics (opcjonalne)
5. Kliknij "Create project"

### 2. Włącz Authentication

1. W lewym menu kliknij **Authentication**
2. Kliknij **Get started**
3. Włącz:
   - **Email/Password** (Sign-in method)
   - **Google** (jeśli chcesz logowanie przez Google)

Dla Google OAuth:
- Kliknij **Google**
- Wpisz email publiczny projektu
- Wpisz nazwę aplikacji
- Dodaj domenę: `yourdomain.com` i `localhost`

### 3. Skonfiguruj Firestore

1. Kliknij **Firestore Database**
2. Kliknij **Create database**
3. Wybierz **Start in production mode**
4. Wybierz region: `europe-west1` (Frankfurt) lub bliżej ciebie
5. Kliknij **Create**

### 4. Ustaw reguły bezpieczeństwa

W zakładce **Rules** wstaw:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Publiczny odczyt profili użytkowników
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update, delete: if request.auth.uid == userId;
    }
    
    // Misje, arena, posty - prywatne każdego użytkownika
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 5. Pobierz konfigurację Firebase

1. Kliknij ⚙️ (Settings) w górnym lewym rogu
2. Wybierz swój projekt
3. Przejdź do **Project settings**
4. W zakładce **General** scroll w dół do "Your apps"
5. Kliknij **Add app** > **Web**
6. Kopiuj wartości:

```javascript
apiKey: "YOUR_API_KEY"
authDomain: "your-project.firebaseapp.com"
projectId: "your-project-id"
storageBucket: "your-project.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123def456"
```

### 6. Wstaw konfigurację

Otwórz `js/firebase-config.js` i wstaw wartości:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "1:your-app-id:web:your-web-app-id"
};
```

⚠️ **WAŻNE**: Nigdy nie commituj prawdziwych kluczy do Git! Jeśli przez pomyłkę upubliczniłeś klucze, regeneruj je w Firebase Console.

---

## 📁 Struktura projektu

```
warrior-os-2-auth/
├── css/
│   └── auth.css                 # Style (glassmorphism, dark theme)
├── js/
│   ├── firebase-config.js       # Konfiguracja Firebase
│   ├── auth-service.js          # Serwis autentykacji (singleton)
│   ├── login.js                 # Logika strony logowania
│   ├── register.js              # Logika strony rejestracji
│   └── forgot-password.js       # Logika resetowania hasła
├── login.html                   # Strona logowania
├── register.html                # Strona rejestracji
├── forgot-password.html         # Strona resetowania hasła
└── README.md                    # Ta dokumentacja
```

---

## ✨ Funkcjonalności

### 🔐 Logowanie (login.html)
- Email + hasło
- Zapamiętaj mnie (localStorage)
- Google OAuth
- Reset hasła
- Walidacja real-time

### 📝 Rejestracja (register.html)
- Email, nazwa użytkownika, hasło
- Siłownik hasła (Słabe → Silne)
- Potwierdzenie hasła
- Akceptacja regulaminu
- Google OAuth
- Automatyczne tworzenie profilu w Firestore

### 🗝️ Reset hasła (forgot-password.html)
- Wysłanie linku resetowania
- Email verification
- Link ważny 24h

### 👤 Model użytkownika (Firestore)
```javascript
{
  uid: "firebase-uid",
  email: "user@example.com",
  username: "username",
  displayName: "Nazwa",
  avatar: "cloudinary-url",
  banner: "cloudinary-url",
  level: 1,
  xp: 0,
  rank: "Nowicjusz",
  streak: 0,
  online: true,
  bio: "Bio",
  createdAt: "2024-06-22T...",
  updatedAt: "2024-06-22T...",
  lastSeen: "2024-06-22T...",
  stats: {
    totalMissions: 0,
    completedMissions: 0,
    totalDuels: 0,
    duelsWon: 0,
    totalGold: 0,
    artifacts: []
  }
}
```

---

## 📚 API Auth Service

### Inicjalizacja
```javascript
import { authService } from './js/auth-service.js';

await authService.initialize();
```

### Rejestracja
```javascript
const result = await authService.register(email, password, username);
// {
//   success: true,
//   user: { uid, email, username }
// }
```

### Logowanie
```javascript
const result = await authService.login(email, password);
// { success: true, user: { uid, email } }
```

### Logowanie Google
```javascript
const result = await authService.loginWithGoogle();
// { success: true, user: {...} }
```

### Reset hasła
```javascript
const result = await authService.resetPassword(email);
// { success: true, message: "..." }
```

### Wylogowanie
```javascript
const result = await authService.logout();
// { success: true }
```

### Pobranie aktualnego użytkownika
```javascript
const user = authService.getCurrentUser();
// Firebase User object
```

### Event Listeners
```javascript
// Zalogowanie
authService.onUserLoggedIn = (user) => {
  console.log('Zalogowano:', user.email);
};

// Wylogowanie
authService.onUserLoggedOut = () => {
  console.log('Wylogowano');
};
```

---

## 🎨 Design System

### Kolory
```css
--primary-bg: #080B14        /* Ciemne tło */
--secondary-bg: #11161D      /* Panele */
--tertiary-bg: #1a1f2e       /* Elementy */
--gold-primary: #D4AF37      /* Gold */
--gold-light: #F7D36A        /* Gold light */
--action-orange: #FF8A00     /* CTA */
--success-green: #32D583     /* Success */
--warning-yellow: #F79009    /* Warning */
--error-red: #F04438         /* Error */
--text-primary: #E6E6E6      /* Tekst */
--text-secondary: #9AA4B2    /* Tekst secondary */
--border-metallic: #3a4557   /* Borders */
```

### Glassmorphism + Metallic Borders
```css
.auth-box {
  background: rgba(17, 22, 29, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-metallic);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### Typografia
- **Brand**: Cinzel (serif) - 28px, 700
- **Body**: Inter (sans-serif) - 14-16px, 400-600

### Responsive
- Mobile-first
- Breakpoint: 480px

---

## 🔒 Bezpieczeństwo

### ✅ Implemented
- ✓ Firebase Authentication (bcrypt hashing)
- ✓ HTTPS only (na hosting wdrażamy)
- ✓ CORS policies
- ✓ Email verification (opcja)
- ✓ Password reset secure tokens
- ✓ Real-time validation

### 🛡️ Best Practices
```javascript
// ✓ DOBRZE: Walidacja po stronie klienta + Firebase
if (!authService.validateEmail(email)) return;
const result = await authService.login(email, password);

// ✗ ŹLE: Poleganie tylko na kliencie
// ✗ ŹLE: Hardcoding tokenów
// ✗ ŹLE: Logowanie haseł
```

### Firestore Rules
```firestore
// Każdy użytkownik może czytać i edytować tylko swoje dane
allow read, write: if request.auth.uid == userId;

// Publiczne profile (jeśli chcesz)
allow read: if request.auth != null;
```

---

## 🐛 Troubleshooting

### "Firebase is not defined"
**Przyczyna**: Firebase SDK nie załadował się
**Rozwiązanie**:
```html
<!-- Dodaj na KONIEC body, przed app script -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
<script type="module" src="js/login.js"></script>
```

### "User creation disabled"
**Przyczyna**: Authentication nie jest włączone w Firebase Console
**Rozwiązanie**: 
1. Przejdź do Firebase Console > Authentication
2. Kliknij "Sign-in method"
3. Włącz "Email/Password"

### "Domain not authorized"
**Przyczyna**: Domena nie jest dodana do Firebase
**Rozwiązanie**:
1. Firebase Console > Authentication > Settings
2. Dodaj domenę do "Authorized domains"
3. Czekaj ~5 minut

### "Form won't submit on iOS"
**Przyczyna**: Keyboard interferes z touchem
**Rozwiązanie**: Już implementowane - input ma `font-size: 16px` (prevent zoom)

### "Password reset email not received"
**Przyczyna**: Email poszedł do spamu
**Rozwiązanie**:
1. Sprawdź folder Spam/Promotions
2. Czy używasz rzeczywistego maila? (nie test)
3. Czy domena jest zweryfikowana w Firebase?

---

## 📱 Mobile Considerations

- ✓ Responsive design (mobile-first)
- ✓ Touch-friendly buttons (min 44x44px)
- ✓ Prevent zoom on input (font-size 16px)
- ✓ Glassmorphism works na iPhone (iOS 15+)
- ✓ Storage: localStorage dla "Remember me"

---

## 🚀 Deployment

### GitHub Pages
```bash
# Build folder
# Push to gh-pages branch
git push origin gh-pages
```

### Netlify
1. Connect repo
2. Build command: (none - vanilla JS)
3. Publish directory: (root)
4. Deploy

### Vercel
```bash
vercel deploy
```

---

## 📧 Firebase Email Templates

Customize email templates w Firebase Console:
1. Authentication > Templates
2. "Email address verification"
3. "Password reset"
4. Dodaj branding, logo itp.

---

## 🎯 Next Steps

1. ✅ Skonfiguruj Firebase
2. ✅ Wdróż auth system
3. ⬜ Stwórz dashboard.html
4. ⬜ Integruj auth z dashboard
5. ⬜ Dodaj Avatar upload (Cloudinary)
6. ⬜ Profile page, settings, premium features

---

## 📞 Support

- 🐛 Bug reports: Check browser console (F12)
- 📖 Firebase docs: https://firebase.google.com/docs/auth
- 🔐 Security audit: https://cheatsheetseries.owasp.org/

---

**Warrior OS 2.0** - Zdobywaj, uczysz się, rośnij ⚔️
