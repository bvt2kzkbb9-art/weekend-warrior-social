# NAPRAWA FIREBASE AUTH DLA GITHUB PAGES

## DIAGNOZA BŁĘDU

**Błąd:** `auth/requests-from-referer-https://bvt2kzkbb9-art.github.io-are-blocked`

### ROOT CAUSE ✓ ZIDENTYFIKOWANY
Domena GitHub Pages `bvt2kzkbb9-art.github.io` jest **NIEAUTORYZOWANA** w Firebase Console

## ROZWIĄZANIE

### KROK 1: Dodaj GitHub Pages domenę do Firebase Console

1. Przejdź do [Firebase Console](https://console.firebase.google.com)
2. Wybierz projekt: `weekend-warrior-social-ed3d0`
3. Idź do: **Authentication** > **Settings** > **Authorized domains**
4. Kliknij **Add domain**
5. Wpisz: `bvt2kzkbb9-art.github.io`
6. Kliknij **Add**

### KROK 2: Dodaj localhost dla testowania lokalnego

Jeśli testujesz lokalnie:

1. W tym samym miejscu kliknij **Add domain**
2. Wpisz: `localhost:8000` (lub inny port)
3. Kliknij **Add**

## WERYFIKACJA KONFIGURACJI

✓ **Firebase Config** - PRAWIDŁOWA
```javascript
const firebaseConfig = {
  projectId: "weekend-warrior-social-ed3d0",
  authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com",
  apiKey: "AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98",
  appId: "1:487311448505:web:ffbe035b92efa8fc193e68",
};
```

✓ **Singleton Pattern** - PRAWIDŁOWY
- Jedna inicjalizacja `initializeApp()` w `src/js/core/firebase.js`
- Jedno `getAuth()` 
- Jedno `getFirestore()`

✓ **OAuth Setup** - PRAWIDŁOWY
```javascript
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
```

✓ **Sign In Method** - PRAWIDŁOWY
```javascript
const { user } = await signInWithPopup(auth, googleProvider);
```

✓ **Security Headers** - PRAWIDŁOWE
- `Referrer-Policy: strict-origin-when-cross-origin` ✓

## NAPRAWY WYKONANE

### 1. Usunieto nieużywany kod
- **Plik:** `src/pages/screens/arena.html`
- **Zmiana:** Usunięto nieużywany import `initializeApp`
- **Status:** ✓ Naprawione

### 2. Weryfikacja inicjalizacji Firebase
- **Tylko jedno miejsce:** `src/js/core/firebase.js`
- **Status:** ✓ OK

### 3. Sprawdzenie duplikatów konfiguracji
- **Brak duplikatów firebaseConfig**
- **Status:** ✓ OK

## TESTY PO NAPRAWIE

Po dodaniu domeny w Firebase Console:

1. **Test Rejestracji Email/Hasło**
```
Oczekiwany rezultat: Nowy użytkownik w Firestore
```

2. **Test Logowania Email/Hasło**
```
Oczekiwany rezultat: Logowanie bez błędu auth/requests-from-referer
```

3. **Test Google Login**
```
Oczekiwany rezultat: Pop-up otwiera się i logowanie działa
```

4. **Test Reset Hasła**
```
Oczekiwany rezultat: Email ze linkiem resetu
```

## STRUKTURA WDRAŻANIA

### Actualne:
- **Web App:** GitHub Pages (`bvt2kzkbb9-art.github.io`)
- **Firestore:** Firebase Project (`weekend-warrior-social-ed3d0`)
- **Auth:** Firebase Auth z OAuth Google

### GitHub Actions:
- `deploy-firestore-rules.yml` — wdraża reguły Firestore
- Brak workflow dla web app (używa GitHub Pages)

## AUTHORIZED DOMAINS - CO JEST GDZIE

| Domena | Typ | Status |
|--------|-----|--------|
| `weekend-warrior-social-ed3d0.firebaseapp.com` | Firebase Hosting | ✓ Autoryzowana (domyślnie) |
| `bvt2kzkbb9-art.github.io` | GitHub Pages | **← DODAJ TUTAJ** |
| `localhost:8000` | Lokalne testowanie | Opcjonalnie |

## CSP & CORS

### Content-Security-Policy
- **Brak:** Nie ma CSP nagłówków w kodzie
- **Firebase Hosting:** CSP ustawiony w `firebase.json`
- **GitHub Pages:** Domyślnie permisywny

### CORS
- **Firebase Auth:** Obsługiwane automatycznie
- **Referrer-Policy:** `strict-origin-when-cross-origin` ✓

## ŚCIEŻKA DEBUGOWANIA

Jeśli błąd się powtarza:

1. Otwórz DevTools Console (F12)
2. Sprawdź `window.location.href` — czy to GitHub Pages URL?
3. Sprawdź `document.referrer` — czy zawiera poprawną domenę?
4. Czekaj 5-10 minut po dodaniu domeny (cache)
5. Wyczyść cookies i localStorage

## NOTATKI

- Firebase Config jest **PRAWIDŁOWA**
- Kod inicjalizacji jest **PRAWIDŁOWY**
- Jedynym problemem jest **BRAK DOMENY W CONSOLE**
- Po dodaniu domeny: błąd znika natychmiast

---

**Status Diagnozy:** ✓ KOMPLETNA
**Status Naprawy:** ✓ GOTOWA
**Następny Krok:** Dodaj domenę w Firebase Console
