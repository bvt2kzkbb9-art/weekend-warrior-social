# Weekend Warrior Social

Społeczna platforma fitness oparta na Firebase z mobilnym interfejsem, autentykacją, profilami użytkowników, systemem misji i czatem w czasie rzeczywistym.

## Status Projektu

**Fundament v1.0 - Gotowy** ✅

Architektura aplikacji, system autentykacji, design system i 8 głównych ekranów zrealizowane. Projekt gotowy do dalszego rozwijania funkcjonalności.

## Struktura Projektu

```
weekend-warrior-social/
├── index.html                 # Punkt wejścia (redirect do src/pages/)
├── manifest.json              # PWA manifest
├── src/
│   ├── pages/
│   │   ├── index.html        # Router aplikacji (auth check)
│   │   ├── auth/
│   │   │   ├── login.html    # Formularz logowania
│   │   │   └── register.html # Formularz rejestracji
│   │   └── screens/
│   │       ├── arena.html         # Główna arena, wyzwania, ranking
│   │       ├── kroniki.html       # Feed aktywności
│   │       ├── misje.html         # Codzienne/tygodniowe misje
│   │       ├── sala-chwaly.html   # Leaderboard
│   │       ├── bohater.html       # Profil użytkownika
│   │       ├── wiadomosci.html    # Lista rozmów
│   │       ├── czat.html          # Okno czatu
│   │       └── ustawienia.html    # Ustawienia aplikacji
│   ├── js/
│   │   ├── core/
│   │   │   ├── firebase.js       # Inicjalizacja Firebase, konfiguracja
│   │   │   ├── auth.js          # Autentykacja (login/register)
│   │   │   └── storage.js       # Cloudinary integration
│   │   ├── services/
│   │   │   ├── users.js         # Zarządzanie profilami użytkowników
│   │   │   ├── messaging.js     # System wiadomości
│   │   │   ├── notifications.js # Powiadomienia
│   │   │   └── profile.js       # Logika profilu
│   │   ├── ui/
│   │   │   ├── forms.js         # Walidacja i obsługa formularzy
│   │   │   ├── modals.js        # Dialogi i potwierdzenia
│   │   │   └── navigation.js    # Auto-hide nawigacji
│   │   ├── utils/
│   │   │   └── helpers.js       # Funkcje pomocnicze
│   │   └── app.js               # Inicjalizacja aplikacji
│   └── css/
│       ├── main.css             # Import wszystkich modułów CSS
│       ├── base/
│       │   ├── reset.css        # CSS reset
│       │   └── typography.css   # Typografia
│       ├── system/
│       │   ├── colors.css       # System kolorów
│       │   ├── spacing.css      # Skala odstępów
│       │   ├── typography.css   # Zmienne typografii
│       │   ├── animations.css   # Animacje
│       │   ├── utilities.css    # Klasy użyteczne
│       │   └── theme.css        # Motyw aplikacji
│       ├── components/
│       │   ├── auth.css         # Formularze auth
│       │   ├── navigation.css   # Nawigacja dolna
│       │   ├── cards.css        # Komponenty kart
│       │   ├── forms.css        # Pola formularzy
│       │   ├── buttons.css      # Przyciski
│       │   └── modals.css       # Modalne okna
│       ├── layouts/
│       │   ├── screens.css      # Layout ekranów
│       │   ├── grid.css         # System grid
│       │   └── responsive.css   # Media queries
│       └── effects/
│           ├── premium.css      # Efekty premium (glass morphism)
│           └── transitions.css  # Przejścia i animacje
└── README.md                      # Ta dokumentacja
```

## 8 Głównych Ekranów

1. **Arena** - Główny hub aplikacji, aktywne wyzwania, ranking górnych wojowników, seria ćwiczeń
2. **Kroniki** - Feed aktywności użytkowników, posty, komentarze
3. **Misje** - Codzienne, tygodniowe i specjalne misje fitness z nagrodami XP
4. **Sala Chwały** - Leaderboard z podium dla top 3 użytkowników
5. **Bohater** - Profil użytkownika z statystykami, osiągnięciami, znajomymi
6. **Wiadomości** - Lista aktywnych rozmów z ostatnią wiadomością
7. **Czat** - Okno rozmowy w czasie rzeczywistym
8. **Ustawienia** - Preferencje konta, powiadomienia, prywatność, wylogowanie

## Szybki Start

### Wymagania

- Node.js 16+
- npm lub yarn
- Firebase CLI (opcjonalnie do deploymentu)
- Konto Cloudinary (do zarządzania zdjęciami)

### Instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd weekend-warrior-social

# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173` (lub portem wskazanym przez bundler).

## Konfiguracja Firebase

Utwórz plik `.env` w katalogu głównym:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
```

## Architektura

### Systemy Główne

**Autentykacja** (`src/js/core/auth.js`)
- Rejestracja i logowanie email/hasło
- OAuth2 Google
- Automatyczne tworzenie dokumentu użytkownika w Firestore

**Zarządzanie Profilami** (`src/js/services/users.js`)
- Pobieranie danych profilu
- Aktualizacja profilu z timestampem serwera
- System rang: Rookie → Warrior → Champion → Legend
- Obliczanie poziomu i doświadczenia (XP)

**Wiadomości** (`src/js/services/messaging.js`)
- Tworzenie rozmów
- Synchronizacja wiadomości w czasie rzeczywistym
- Obsługa statusu online

**Przechowywanie Mediów** (`src/js/core/storage.js`)
- Integracja z Cloudinary
- Kompresja obrazów
- Upload avatarów i banerów profilu
- Usuwanie starych zdjęć

### System Kolorów

```css
--bg-primary: #080808         /* Ciemne tło */
--bg-secondary: #0f0f0f       /* Tło wtórne */
--card-bg: #1a1a1a            /* Tło kart */
--gold-primary: #d4af37       /* Złoty główny */
--gold-accent: #ffd700        /* Złoty akcent */
--text-primary: #ffffff       /* Tekst główny */
--text-secondary: #b0b0b0     /* Tekst wtórny */
--border: #2a2a2a             /* Obramowania */
--success: #16c784            /* Sukces */
--warning: #f59e0b            /* Ostrzeżenie */
--error: #ef4444              /* Błąd */
```

### Skalowanie Odstępów

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 48px
--spacing-4xl: 64px
```

## Responsywność

Aplikacja jest optymalizowana dla wszystkich urządzeń:

- **Mobile** (≤480px) - Pełna responsywność, navigation dolna
- **Tablet** (481-768px) - Zoptymalizowany layout
- **Desktop** (≥769px) - Pełny interfejs z boczną nawigacją

CSS wykorzystuje mobile-first approach z media queries dla większych ekranów.

## Bezpieczeństwo

### Firebase Security Rules

- Dokumenty użytkowników edytowalne tylko przez właściciela
- Wiadomości dostępne tylko dla uczestników rozmowy
- Publiczne posty z kontrolą dostępu do edycji
- Validacja danych po stronie klienta i serwera

### Walidacja Formularzy

- Email: Format RFC 5322 z regex
- Hasło: Min 8 znaków, wymagane cyfry i znaki specjalne
- Nazwa użytkownika: 3-20 znaków, litery/cyfry/podkreślenie/myślnik

## Fazy Rozwoju

- ✅ **Faza 0-4: Fundament** - Autentykacja, routing, 8 ekranów, design system
- ⏳ **Faza 5-7: Funkcjonalność** - Logika misji, XP, czat real-time, powiadomienia
- ⏳ **Faza 8+: Optymalizacja** - Performance, PWA, offline mode, deployment

## Polecenia NPM

```bash
npm run dev      # Uruchomienie serwera deweloperskiego
npm run build    # Kompilacja do produkcji
npm run preview  # Podgląd production build
npm run lint     # Sprawdzenie kodu (jeśli skonfigurowany)
```

## Git Workflow

Główna gałąź: `main`
Gałęzie deweloperskie: `claude/<feature-name>`

```bash
git checkout -b claude/<feature-name>
# ... implementacja
git commit -m "feat: opis zmian"
git push origin claude/<feature-name>
```

## ZmianaLog

### v1.0.0 (Fundament)

- ✅ Przebudowa architekturi na src/
- ✅ Integracja Firebase Authentication
- ✅ Tworzenie 8 głównych ekranów
- ✅ System kolorów i design tokens
- ✅ Responsywny layout mobile-first
- ✅ Integracja Cloudinary
- ✅ Walidacja formularzy
- ✅ Modal i toast notifications
- ✅ PWA manifest

## Zasoby

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [MDN Web Docs](https://developer.mozilla.org/)

## Licencja

© 2026 Weekend Warrior Social. Wszystkie prawa zastrzeżone.

---

**Status**: Fundament aplikacji gotowy do dalszego rozwoju 🚀
