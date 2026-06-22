# Konfiguracja Weekend Warrior Social

## Przegląd Architektury

Weekend Warrior Social jest zbudowany na trzech filarach:

```
┌─────────────────────────────────────────────────────┐
│           Weekend Warrior Social                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Frontend (HTML/CSS/JavaScript)              │  │
│  │  - UI Components                             │  │
│  │  - Pages                                     │  │
│  │  - Services (abstraction layer)              │  │
│  └──────────────────────────────────────────────┘  │
│           ↓                        ↓                │
│  ┌──────────────────────┐ ┌──────────────────────┐ │
│  │   Cloudinary CDN     │ │    Firebase          │ │
│  │  ────────────────    │ │  ────────────────    │ │
│  │  • Wszystkie pliki   │ │  • Autentykacja      │ │
│  │  • Obrazy/Wideo      │ │  • Baza danych       │ │
│  │  • Optymalizacja     │ │  • Metadane zasobów  │ │
│  │  • CDN               │ │  • Messaging         │ │
│  └──────────────────────┘ └──────────────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Konfiguracja Cloudinary

### 1. Utwórz konto Cloudinary

1. Przejdź do https://cloudinary.com/users/register/free
2. Zarejestruj się bezpłatnie
3. Zweryfikuj email

### 2. Pobierz dane dostępowe

1. Zaloguj się do https://cloudinary.com/console
2. Skopiuj swoje dane:
   - **Cloud Name** (widoczny na stronie głównej)
   - **API Key** (sekcja Account Details)
   - **API Secret** (sekcja Account Details)

### 3. Utwórz Upload Preset

1. Przejdź do Settings → Upload → Upload Presets
2. Kliknij "Create Upload Preset"
3. Ustaw następujące opcje:
   - **Mode**: Unsigned (dla aplikacji frontendowej)
   - **Allowed file types**: Image, Video
   - **Eager Transformations**: 
     - Auto format (WebP/AVIF)
     - Quality: auto
   - **Folder**: weekend-warrior-social/temp
4. Zapisz preset
5. Skopiuj **Preset Name**

### 4. Skonfiguruj bezpieczeństwo

1. Przejdź do Settings → Upload
2. Ustaw **Restricted file types**: Zezwól na jpg, png, gif, webp, mp4, webm
3. Ustaw **Max file size**: 50 MB
4. Włącz **Malware detection**: Basic
5. Włącz **Signed uploads**: Dla operacji z backend

## Konfiguracja Firebase

### 1. Utwórz projekt Firebase

1. Przejdź do https://console.firebase.google.com
2. Kliknij "Add project"
3. Podaj nazwę: `weekend-warrior-social`
4. Pomiń Google Analytics (na razie)
5. Utwórz projekt

### 2. Dodaj aplikację webową

1. Kliknij ikonę `</>` (Web app)
2. Podaj nick: `weekend-warrior-social-web`
3. Skopiuj config (pojawi się poniżej)

### 3. Włącz Firestore

1. W menu po lewej: Build → Firestore Database
2. Kliknij "Create database"
3. Wybierz region: `europe-west1` (Belgia)
4. Ustaw rules na:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### 4. Włącz Authentication

1. W menu po lewej: Build → Authentication
2. Kliknij "Get started"
3. Włącz Email/Password
4. Włącz Google (opcjonalnie)

## Zmienne Środowiskowe

### 1. Stwórz plik `.env.local`

Skopiuj `.env.example` i wyczyść dane:

```bash
cp .env.example .env.local
```

### 2. Wypełnij dane

Edytuj `.env.local` i dodaj swoje dane:

```env
# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=abc123xyz
VITE_CLOUDINARY_UPLOAD_PRESET=wws_unsigned
VITE_CLOUDINARY_API_KEY=your_key_here
VITE_CLOUDINARY_API_SECRET=your_secret_here

# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=weekend-warrior-social.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=weekend-warrior-social
VITE_FIREBASE_STORAGE_BUCKET=weekend-warrior-social.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### 3. Bezpieczeństwo

⚠️ **WAŻNE**: 
- `.env.local` dodaj do `.gitignore` (już dodany)
- Nigdy nie commituj secretów
- Clousinary Upload Preset powinien być unsigned dla frontend
- API Secret przechowuj tylko na backend

## Testowanie

### 1. Sprawdź Cloudinary

```javascript
import { cloudinaryService } from './src/services/CloudinaryStorageService.js';

// Test health check
const isHealthy = await cloudinaryService.healthCheck();
console.log('Cloudinary is healthy:', isHealthy);
```

### 2. Sprawdź Firestore

```javascript
import { firestoreService } from './src/services/FirestoreService.js';

// Będzie dostępne po zintegrowaniu Firebase SDK
```

## Struktura Projektu

```
src/
├── config/
│   ├── cloudinary.config.js      # Konfiguracja Cloudinary
│   └── firebase.config.js        # Konfiguracja Firebase
├── models/
│   └── CloudinaryAsset.js        # Model zasobu
├── services/
│   ├── CloudinaryStorageService.js  # Upload & optymalizacja
│   ├── FirestoreService.js          # Baza danych
│   ├── ChallengeService.js          # Logika wyzwań
│   ├── UserService.js               # Logika użytkowników
│   ├── PostService.js               # Logika postów
│   ├── StoryService.js              # Logika storiesów
│   ├── MissionService.js            # Logika misji
│   ├── AchievementService.js        # Logika osiągnięć
│   ├── RankingService.js            # Logika rankingu
│   └── NotificationService.js       # Logika powiadomień
├── repositories/                 # Będą dodane - data access layer
├── models/                       # Będą dodane - data models
└── utils/                        # Będą dodane - utility functions
```

## Best Practices

### 1. Nigdy nie komunikuj się bezpośrednio z Cloudinary/Firebase z komponentów

❌ **Źle**:
```javascript
// W komponencie
const response = await fetch('https://api.cloudinary.com/...');
```

✅ **Dobrze**:
```javascript
// W komponencie
import { cloudinaryService } from '../services/CloudinaryStorageService.js';
const asset = await cloudinaryService.uploadPostImage(file, userId, postId);
```

### 2. Zawsze przechowuj metadane w Firestore, nie same pliki

❌ **Źle**:
```javascript
// localStorage nie jest dla tego
localStorage.setItem('post-image', imageBlob);
```

✅ **Dobrze**:
```javascript
// Cloudinary - plik
// Firestore - metadane
const asset = await cloudinaryService.uploadPostImage(file, userId, postId);
// Następnie w Firestore:
// {
//   postId: '...',
//   imageAssetId: asset.id,
//   imageUrl: asset.secure_url,
//   uploadedAt: '2024-...'
// }
```

### 3. Używaj optymalizowanych URLów

❌ **Źle**:
```javascript
// Pełna resolutcja
<img src={asset.secure_url} />
```

✅ **Dobrze**:
```javascript
// Optymalizowany
<img src={cloudinaryService.getOptimizedImage(asset.public_id, 600, 600)} />
// Lub responsive
<img src={cloudinaryService.getResponsiveImage(asset.public_id)} />
```

## Przyszłe Integracje

System jest przygotowany do:

- ✅ Real-time chat (Firebase Realtime Database)
- ✅ Live streaming (Cloudinary Live Streaming)
- ✅ Push notifications (Firebase Cloud Messaging)
- ✅ Social features (Follow, Like, Comment)
- ✅ Tournaments (Firebase Rules)
- ✅ Marketplace (Stripe integration)
- ✅ Admin panel (Firestore Security Rules)
- ✅ Analytics (Firebase Analytics)

## Troubleshooting

### Błąd: "CORS error"

Cloudinary Upload API nie wymaga CORS dla unsigned uploads.
Jeśli masz problemy:
1. Sprawdź czy Upload Preset jest unsigned
2. Sprawdź czy Cloud Name jest prawidłowy

### Błąd: "Invalid upload preset"

1. Sprawdź `.env.local` - czy preset name jest prawidłowy
2. Przejdź do Cloudinary Console i sprawdź że preset istnieje
3. Upewnij się że preset jest Unsigned

### Firebase nie ładuje się

1. Sprawdź czy dane w `.env.local` są prawidłowe
2. Sprawdź czy projekt Firebase jest aktywny
3. Sprawdź czy Firestore database jest włączona

## Support

Dokumentacja:
- Cloudinary: https://cloudinary.com/documentation
- Firebase: https://firebase.google.com/docs
- MDN Web Docs: https://developer.mozilla.org
