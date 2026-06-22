# Weekend Warrior Social - Architektura Produkcyjna

## Przegląd Systemu

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (HTML/CSS/JS)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components (HTML/CSS)                                      │
│      ↓                                                       │
│  Services Layer (JavaScript)                                │
│      ↓              ↓              ↓                        │
│  Cloudinary    Firebase      External APIs                 │
│  (CDN/Upload)  (Database)    (Future: Stripe, etc)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Warstwy Architektury

### 1. Warstwa UI (HTML/CSS)
- Statyczne pliki HTML (`*.html`)
- Stylowanie CSS (`css/`)
- DOM manipulation w JavaScript
- Nigdy nie komunikuje się bezpośrednio z API

### 2. Warstwa Komponentów
- Będą dodane w przyszłości
- Web Components lub własne komponenty
- Reusable UI elements

### 3. Warstwa Usług (Services)
- `CloudinaryStorageService` - upload i optymalizacja
- `FirestoreService` - baza danych
- Domain Services - `ChallengeService`, `UserService`, itp.
- Singleton pattern - jedna instancja na aplikację

### 4. Warstwa Modeli
- `CloudinaryAsset` - model zasobu
- Będą dodane inne modele

### 5. Warstwa Konfiguracji
- `cloudinary.config.js` - Cloudinary
- `firebase.config.js` - Firebase
- Zmienne środowiskowe

### 6. Warstwa Repozytoriów (będzie dodana)
- Data access layer
- Abstrakcja nad FirestoreService
- Caching logic

## Przepływ Danych

### Upload Zdjęcia

```
Użytkownik wybiera plik (HTML input)
      ↓
Component obsługuje event
      ↓
Component wołuje CloudinaryStorageService.uploadPostImage()
      ↓
CloudinaryStorageService wysyła do Cloudinary
      ↓
Cloudinary zwraca CloudinaryAsset (metadane)
      ↓
Component wołuje ChallengeService.createChallenge()
      ↓
ChallengeService:
  1. Zapisuje asset metadane w Firestore
  2. Zwraca challenge object
      ↓
Component wyświetla rezultat użytkownikowi
```

### Pobieranie Danych

```
Użytkownik przechodzi na stronę
      ↓
Component wołuje ChallengeService.getUserChallenges()
      ↓
ChallengeService wołuje FirestoreService.getCollection()
      ↓
FirestoreService:
  1. Łączy się z Firestore
  2. Zwraca dokumenty
      ↓
Component wyświetla dane
```

## Struktura Projektu

```
weekend-warrior-social/
├── src/
│   ├── config/
│   │   ├── cloudinary.config.js      # Konfiguracja Cloudinary
│   │   └── firebase.config.js        # Konfiguracja Firebase
│   ├── models/
│   │   └── CloudinaryAsset.js        # Model zasobu
│   ├── services/
│   │   ├── CloudinaryStorageService.js  # Upload & CDN
│   │   ├── FirestoreService.js          # Baza danych
│   │   ├── ChallengeService.js          # Logika wyzwań
│   │   ├── UserService.js               # Logika użytkowników
│   │   ├── PostService.js               # Logika postów
│   │   ├── StoryService.js              # Logika storiesów
│   │   ├── MissionService.js            # Logika misji
│   │   ├── AchievementService.js        # Logika osiągnięć
│   │   ├── RankingService.js            # Logika rankingu
│   │   ├── NotificationService.js       # Logika powiadomień
│   │   ├── index.js                     # Eksport wszystkich serwisów
│   │   └── README.md                    # Dokumentacja
│   ├── repositories/                 # (Będą dodane)
│   ├── utils/                        # (Będą dodane)
│   └── test-cloudinary.html          # Test integracji
├── css/                              # Style
├── assets/                           # Logotypy, ikony, itp
├── index.html
├── challenges-create.html
├── challenges.html
├── challenge-detail.html
├── profile.html
├── ranking.html
├── feed.html
├── SETUP.md                          # Instrukcje konfiguracji
├── ARCHITECTURE.md                   # Ten plik
├── .env.example                      # Zmienne środowiskowe (template)
└── .gitignore                        # Excludes .env.local
```

## Konfiguracja

### Zmienne Środowiskowe

Stwórz `.env.local`:
```bash
cp .env.example .env.local
```

Edytuj `.env.local` z twoimi danymi:
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_secret

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project_id
...
```

### Cloudinary Setup

1. Utwórz konto: https://cloudinary.com/users/register/free
2. Pobierz: Cloud Name, API Key, API Secret
3. Utwórz Upload Preset (Unsigned)
4. Przechowuj dane w `.env.local`

### Firebase Setup

1. Utwórz projekt: https://console.firebase.google.com
2. Włącz Firestore Database
3. Włącz Authentication (Email/Password, Google)
4. Skopiuj config
5. Przechowuj dane w `.env.local`

Więcej szczegółów w pliku `SETUP.md`.

## Bezpieczeństwo

### Dostęp do Sekretów

❌ **NIGDY** w frontend:
```javascript
// Źle - Secret ujawniony w przeglądze
const secret = 'sk_live_abc123...';
```

✅ **Prawidłowo**:
- API Secret → Backend only
- API Key → Frontend (unsigned operations)
- Upload Preset → Frontend (pre-configured in Cloudinary)

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tylko zalogowani mogą czytać i pisać
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Użytkownik może edytować tylko swój dokument
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Cloudinary Signed Uploads

Dla operacji wrażliwych (delete, transform sensitive data):
1. Upload Preset powinien być Signed
2. Signature generowana na backend
3. Backend validates i execute

## Best Practices

### 1. Separation of Concerns

```
UI Components     → Obsługuje eventy, renderuje
    ↓
Services         → Obsługuje logikę
    ↓
External APIs    → Zwraca surowe dane
```

### 2. Error Handling

```javascript
try {
  const asset = await cloudinaryService.uploadAvatar(file, userId);
  // Sukces
} catch (error) {
  console.error('Upload failed:', error.message);
  // Pokaż user-friendly message
}
```

### 3. Asynchronous Operations

Wszystko jest asynchroniczne. Zawsze używaj `await` lub `.then()`:

```javascript
// Dobrze
const result = await service.someAsyncMethod();

// Dobrze
service.someAsyncMethod().then(result => {
  // handle result
});

// Źle - nie czekamy na rezultat
service.someAsyncMethod();
```

### 4. Singleton Pattern

Każdy serwis jest singletonem - jedna instancja:

```javascript
// src/services/CloudinaryStorageService.js
class CloudinaryStorageService { ... }
const cloudinaryService = new CloudinaryStorageService();
export { cloudinaryService };

// Import na końcu
import { cloudinaryService } from '../services/index.js';
```

### 5. Dokumentacja

Każdy serwis powinien mieć JSDoc comments:

```javascript
/**
 * Uploaduje avatar użytkownika
 * @param {File} file - Plik do uploadowania
 * @param {string} userId - ID użytkownika
 * @returns {Promise<CloudinaryAsset>} Asset metadane
 */
async uploadAvatar(file, userId) { ... }
```

## Przyszłe Integracje

System jest przygotowany do:

### Real-time Communication
- Firebase Realtime Database
- WebSocket dla live chat
- Push notifications (FCM)

### Media
- Cloudinary Live Streaming
- Video encoding
- Thumbnail generation

### Payments
- Stripe API
- Order management
- Receipt storage

### Analytics
- Firebase Analytics
- Custom events
- User funnel tracking

### Admin Panel
- Firestore Rules
- Data management
- User moderation

### Performance
- CDN caching headers
- Image lazy loading
- Service Worker caching

## Testing

### Unit Tests (będą dodane)
- Services testing
- Mock Cloudinary/Firebase
- Test error handling

### Integration Tests (będą dodane)
- End-to-end flows
- Real Cloudinary/Firebase
- Performance benchmarks

### Manual Testing
Otwórz: `/src/test-cloudinary.html`
- Sprawdź Cloudinary health
- Testuj uploads
- Testuj optymalizacje

## Monitorowanie

### Cloudinary
- Dashboard: https://cloudinary.com/console
- Storage usage
- API usage
- Performance metrics

### Firebase
- Console: https://console.firebase.google.com
- Database usage
- Authentication metrics
- Performance insights

## Troubleshooting

### CORS Issues
- Cloudinary unsigned uploads nie wymagają CORS
- Firebase ma automatyczną konfigurację CORS
- Backend proxy jeśli potrzebne

### Slow Uploads
- Sprawdź network speed
- Użyj chunked uploads dla dużych plików
- Cloudinary ma wbudowany retry logic

### Firebase Errors
- Check security rules
- Verify authentication
- Check Firestore quota

## Roadmap

- [ ] Wydzielić komponenty do Web Components
- [ ] Dodać error boundary components
- [ ] Implementować offline caching
- [ ] Dodać service worker
- [ ] Real-time chat z Firebase
- [ ] Live streaming
- [ ] Marketplace
- [ ] Admin panel
- [ ] Analytics dashboard
- [ ] Mobile app (React Native / Flutter)

## Dokumentacja

- `SETUP.md` - Instrukcje konfiguracji
- `ARCHITECTURE.md` - Ten plik
- `src/services/README.md` - Dokumentacja serwisów
- `src/config/*.config.js` - Komentarze w konfiguracji
- Inline JSDoc comments w kodzie

## Support

Dokumentacja:
- Cloudinary: https://cloudinary.com/documentation
- Firebase: https://firebase.google.com/docs
- MDN: https://developer.mozilla.org
- JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

## License

MIT License - patrz LICENSE file
