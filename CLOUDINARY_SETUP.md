# ☁️ Cloudinary Configuration
## Weekend Warrior Social - Image Storage Setup

**Status**: ✅ REPLACING Firebase Cloud Storage with Cloudinary  
**Date**: 15 June 2026

---

## 1. CREATE CLOUDINARY ACCOUNT

### Krok 1.1: Przejdź na Cloudinary
```
https://cloudinary.com/users/register/free
```

### Krok 1.2: Zaloguj się lub utwórz konto
- Wpisz email
- Wpisz hasło
- Kliknij "Sign Up"

### Krok 1.3: Potwierdź email
- Cloudinary wyśle email potwierdzający
- Kliknij link w emailu

---

## 2. GET CLOUDINARY CREDENTIALS

### Krok 2.1: Przejdź do Dashboard
```
https://cloudinary.com/console
```

### Krok 2.2: Zdobądź Cloud Name
Na stronie Dashboard zobaczysz:
```
Cloud Name: your-cloud-name-xxxxx
```

**Skopiuj to!** Będzie Ci potrzebne.

### Krok 2.3: Zdobądź API Key (opcjonalnie)
W Account Settings > API Keys
- Skopiuj: "API Key"
- Skopiuj: "API Secret"

(Będą potrzebne tylko jeśli chcesz upload z backendu)

---

## 3. CLOUDINARY UPLOAD PRESET

### Krok 3.1: Utwórz Upload Preset
W Dashboard:
1. Settings > Upload (tab)
2. Upload presets
3. Kliknij "Add upload preset"

### Krok 3.2: Konfiguruj Preset
```
Name: weekend-warrior-social
Signing Mode: Unsigned
Allowed formats: jpg, jpeg, png, gif, webp, bmp
Max file size: 10 MB (8000000 bytes)
```

### Krok 3.3: Zaawansowane ustawienia
Folder: `weekend-warrior-social/posts` (automatyczne organizowanie)
Transformations:
  - Width: 1280
  - Height: 1280
  - Crop: limit
  - Quality: auto

### Krok 3.4: Skopiuj nazwę Preset
```
Preset Name: weekend-warrior-social
```

---

## 4. JAVASCRIPT INTEGRATION

### Plik do zmiany: `js/firebase.js`

Zastąp funkcję `uploadImage` następującym kodem:

```javascript
// ════════════════════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ════════════════════════════════════════════════════════════════════════════

const CLOUDINARY_CLOUD_NAME = "your-cloud-name-xxxxx";  // ← ZMIEŃ NA SWOJĄ
const CLOUDINARY_UPLOAD_PRESET = "weekend-warrior-social";  // ← ZMIEŃ JEŚLI INNA

/**
 * Wgraj obraz na Cloudinary
 * @param {File|Blob} file
 * @param {string} folder - np. 'posts' lub 'profiles'
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<string>} - Cloudinary URL
 */
export async function uploadImage(file, folder = 'posts', onProgress) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Plik musi być obrazem');
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Obraz nie może być większy niż 8 MB');
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `weekend-warrior-social/${folder}`);
    formData.append('resource_type', 'auto');

    const xhr = new XMLHttpRequest();

    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (onProgress) onProgress(percent);
      }
    });

    // Success
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);  // Użyj HTTPS URL
        } catch (e) {
          reject(new Error('Błąd parsowania odpowiedzi Cloudinary'));
        }
      } else {
        reject(new Error(`Błąd uploadu: ${xhr.status}`));
      }
    });

    // Error
    xhr.addEventListener('error', () => {
      reject(new Error('Błąd połączenia z Cloudinary'));
    });

    // Send
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.send(formData);
  });
}

/**
 * Usuń obraz z Cloudinary (wymaga API Key)
 * Alternatywnie: można nie implementować, obrazy wygasają automatycznie
 */
export async function deleteImageByURL(url) {
  // Cloudinary: usuń manualnie z dashboardu lub czekaj na auto-delete
  // Dla MVP: nie implementujemy
  console.log('Image deletion not implemented for Cloudinary');
}
```

### Plik do aktualizacji: `js/firebase.js` - TOP

```javascript
// ZMIEŃ TE WARTOŚCI NA SWOJE CREDENTIALS
const CLOUDINARY_CLOUD_NAME = "your-cloud-name-xxxxx";
const CLOUDINARY_UPLOAD_PRESET = "weekend-warrior-social";

// Jeśli chcesz, możesz je też przenieść do oddzielnego pliku:
// export const CLOUDINARY_CONFIG = {
//   cloudName: "your-cloud-name-xxxxx",
//   uploadPreset: "weekend-warrior-social"
// };
```

---

## 5. AKTUALIZACJA FIREBASE.JSON

### Plik: `firebase.json`

Zmień deployment aby **pominąć storage**:

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "config.js",
      "PATCH_NOTES.txt",
      "README.md",
      "README.txt",
      "seed.html",
      "admin.html",
      "irestore.indexes.json"
    ],
    "cleanUrls": false,
    "trailingSlash": false,
    "rewrites": [
      {
        "source": "/search",
        "destination": "/search.html"
      },
      {
        "source": "/pajac",
        "destination": "/pajac.html"
      },
      {
        "source": "/messenger",
        "destination": "/messenger.html"
      },
      {
        "source": "/feed",
        "destination": "/feed.html"
      },
      {
        "source": "/ranking",
        "destination": "/ranking.html"
      },
      {
        "source": "/challenges",
        "destination": "/challenges.html"
      },
      {
        "source": "/achievements",
        "destination": "/achievements.html"
      },
      {
        "source": "/profile",
        "destination": "/profile.html"
      },
      {
        "source": "/login",
        "destination": "/login.html"
      },
      {
        "source": "/register",
        "destination": "/register.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|mjs)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=3600" },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      },
      {
        "source": "**/*.@(css)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=3600" }
        ]
      },
      {
        "source": "**/*.@(png|jpg|jpeg|gif|svg|ico|webp)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=86400" }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" },
          { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
          { "key": "Service-Worker-Allowed", "value": "/" }
        ]
      },
      {
        "source": "manifest.json",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" },
          { "key": "Content-Type", "value": "application/manifest+json" }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

**WAŻNE**: Usunęliśmy sekcję `"storage"` - nie będziemy deployować storage rules

---

## 6. AKTUALIZACJA STORAGE.RULES (OPCJONALNE)

### Jeśli chcesz zachować Firebase Storage rules (dla czegoś innego):
Możesz je zostawić, ale nie będą deployowane.

### Jeśli chcesz usunąć:
```bash
rm storage.rules
```

A następnie w `firebase.json` nie ma już linii `"storage"`.

---

## 7. AKTUALIZACJA DEPLOYMENT SKRYPTU

### Plik: `deploy.sh`

Zmień linię deploymentu:

```bash
# PRZED:
firebase deploy --only storage

# PO: (Usuń tę linię lub zakomentuj)
# firebase deploy --only storage
```

Lub uruchom bez storage:

```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

---

## 8. CLOUDINARY FEATURES

### Automatyczne transformacje
```javascript
// Cloudinary automatycznie:
// ✅ Kompresuje obrazy
// ✅ Zmienia rozdzielczość
// ✅ Konwertuje do WebP
// ✅ Cachuje na CDN
// ✅ Optymalizuje dla urządzeń mobilnych
```

### URL przykład:
```
https://res.cloudinary.com/your-cloud-name/image/upload/w_1280,h_1280,c_limit,q_auto/weekend-warrior-social/posts/abc123.jpg
```

### Transformacje w URLu:
```
w_800,h_600,c_fill,q_auto  → Szerokość 800, wysokość 600, jakość auto
w_1280,h_1280,c_limit       → Max 1280x1280
f_auto                      → Automatyczny format (WebP dla Chrome, itp)
q_auto                      → Automatyczna jakość
```

---

## 9. FIRESTORE STORAGE RULES (JUŻ NIE POTRZEBNE)

Następujące reguły są już **nie potrzebne**:

```firestore
// ❌ USUŃ te sekcje z firestore.rules jeśli dodałeś je tam:
match /posts/{uid}/{fileName} { ... }
match /profiles/{uid}/{fileName} { ... }
match /messages/{convId}/{fileName} { ... }
```

Cloudinary obsługuje bezpieczeństwo po swojej stronie.

---

## 10. SECURITY WITH CLOUDINARY

### Unsigned Preset (bieżąca konfiguracja)
```
✅ Bezpieczny dla publicznych uploadów
✅ Nie wymaga API Key na kliencie
✅ Cloudinary limituje: typ, rozmiar, format
✅ Idealne dla aplikacji społecznościowej
```

### Signed Uploads (zaawansowane)
Jeśli potrzebujesz bardziej restrykcyjnych reguł:
```javascript
// Wygeneruj signature na backendzie
// (wymaga API Secret)
const signature = cloudinary.utils.api_sign_request(
  { timestamp: Math.floor(Date.now() / 1000), ... },
  apiSecret
);

// Dodaj do FormData na kliencie
formData.append('signature', signature);
formData.append('api_key', apiKey);
```

---

## 11. ENVIRONMENT VARIABLES (OPTIONAL)

Jeśli chcesz bezpieczeństwo:

### Plik: `.env`
```
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name-xxxxx
VITE_CLOUDINARY_UPLOAD_PRESET=weekend-warrior-social
```

### W kodzie:
```javascript
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
```

### W `.gitignore`:
```
.env
.env.local
.env.*.local
```

---

## 12. CLOUDINARY VS FIREBASE STORAGE

| Aspekt | Cloudinary | Firebase Storage |
|--------|-----------|------------------|
| **Cena** | Free tier: 25 GB/rok | Pay as you go |
| **CDN** | ✅ Wbudowany globalny CDN | Słabszy |
| **Transformacje** | ✅ URL-based (bezpłatne) | Nie wbudowane |
| **Kompresja** | ✅ Automatyczna (WebP, itp) | Nie wbudowana |
| **Setup** | ✅ Prostszy (bez rules) | Wymaga rules |
| **Szybkość** | ✅ Szybszy (CDN) | Wolniejszy |
| **Integracja** | ✅ Lepsza dla frontend | Mejor dla backend |

**Werdykt**: Cloudinary jest lepszy dla MVP! ✅

---

## 13. DEPLOYMENT Z CLOUDINARY

### Nowy proces:

```bash
# 1. Zaloguj się w Firebase
firebase login

# 2. Ustaw projekt
firebase use weekend-warrior-social-ed3d0

# 3. Deploy (BEZ storage)
firebase deploy --only firestore:rules,firestore:indexes,hosting

# Lub:
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only hosting
```

**Brak deployment storage!** ⏱️ Szybciej!

---

## 14. CHECKLIST CLOUDINARY

- [ ] Utwórz konto na https://cloudinary.com
- [ ] Skopiuj Cloud Name z dashboarda
- [ ] Utwórz Upload Preset: `weekend-warrior-social`
- [ ] Zaktualizuj `js/firebase.js` z Cloud Name
- [ ] Zaktualizuj `firebase.json` (usuń storage sekcję)
- [ ] Usuń `storage.rules` lub zakomentuj deployment
- [ ] Zaktualizuj `deploy.sh` (usuń storage deployment)
- [ ] Testuj upload obrazu
- [ ] Sprawdź czy obrazy się wyświetlają z Cloudinary

---

## 15. TESTING IMAGE UPLOAD

### Test w aplikacji:
```
1. Zaloguj się
2. Utwórz post
3. Kliknij "Add Image"
4. Wybierz obraz (< 8 MB)
5. Poczekaj na upload
6. Sprawdź czy obraz się wyświetla
```

### Gdzie zobaczyć obrazy:
```
Cloudinary Dashboard > Media Library
Folder: weekend-warrior-social/posts/
```

### URL format:
```
https://res.cloudinary.com/your-cloud-name/image/upload/...
```

---

## 16. TROUBLESHOOTING

### ❌ "Upload failed"
- Sprawdź Cloud Name
- Sprawdź Upload Preset
- Sprawdzka Connection (internet)
- Sprawdzka rozmiar pliku (< 8 MB)

### ❌ "Image not showing"
- Sprawdzka URL w Firestore
- Sprawdzka czy URL jest HTTPS
- Sprawdzka CORS settings na Cloudinary

### ❌ "Cloudinary credentials missing"
- Sprawdzka `CLOUDINARY_CLOUD_NAME` w `js/firebase.js`
- Sprawdzka `CLOUDINARY_UPLOAD_PRESET`

---

## 17. DOKUMENTACJA CLOUDINARY

```
API: https://cloudinary.com/documentation/image_upload_api_reference
Dashboard: https://cloudinary.com/console
Help: https://support.cloudinary.com/
```

---

## 18. PODSUMOWANIE

### Co się zmienia:
| Było | Teraz |
|-----|-------|
| Firebase Cloud Storage | Cloudinary |
| storage.rules | Upload Preset |
| Firebase SDK | Cloudinary API |
| Wolniejsze | Szybsze (CDN) |
| Więcej konfiguracji | Mniej konfiguracji |

### Co zostaje:
```
✅ Firestore Database (bez zmian)
✅ Firestore Rules (bez zmian)
✅ Firebase Auth (bez zmian)
✅ Firebase Hosting (bez zmian)
```

### Korzyści:
```
✅ Szybsze uploady (Cloudinary CDN)
✅ Lepsze kompresje (Cloudinary)
✅ Mniej konfiguracji
✅ Darmowy tier wystarczy na MVP
✅ Profesjonalne transformacje URL
```

---

## 🚀 NEXT STEPS

1. **Stwórz konto Cloudinary** → https://cloudinary.com
2. **Skopiuj Cloud Name** → Z dashboarda
3. **Utwórz Upload Preset** → `weekend-warrior-social`
4. **Zaktualizuj kod** → `js/firebase.js` (Cloud Name)
5. **Zmień deployment** → `firebase.json` (usuń storage)
6. **Deploy** → `./deploy.sh` (bez storage)
7. **Testuj** → Upload obrazu w aplikacji

---

**Data**: 15 czerwca 2026  
**Status**: ✅ Gotowo do deploymentu z Cloudinary  
**Alternativa**: Firebase Cloud Storage (nie zalecane dla MVP)

