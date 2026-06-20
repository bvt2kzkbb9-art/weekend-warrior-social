# Weekend Warrior Social - Przewodnik Diagnostyki Autentykacji

**Data:** 2026-06-20  
**Status:** 🔍 Pełna diagnostyka logowania i rejestracji  
**Cel:** Zidentyfikowanie i naprawa problemów z auth/login/register

---

## 🚀 Co zostało zmienione

### 1. Firebase Initialization Logging
**Plik:** `src/js/core/firebase.js`

✅ Dodane logi inicjalizacji Firebase z weryfikacją konfiguracji:
```javascript
console.log('[Firebase] Initializing with config:')
console.log('[Firebase] App initialized:')
console.log('[Firebase] Auth initialized:')
console.log('[Firebase] Firestore initialized:')
console.log('[Firebase] Google Provider initialized:')
```

**Czego szukać w konsoli:**
- Powinny pojawić się 5 linijek logów potwierdzających inicjalizację
- `authDomain` powinny być `weekend-warrior-social-ed3d0.firebaseapp.com`
- `projectId` powinny być `weekend-warrior-social-ed3d0`

---

## 2. Registration Logging (`registerWithEmail`)
**Plik:** `src/js/core/auth.js`

✅ Dodane szczegółowe logi etapów rejestracji:

```javascript
[registerWithEmail] START: { email, displayName }
[registerWithEmail] Firebase Auth instance: { authDomain, projectId }
[registerWithEmail] User created: { uid, email }
[registerWithEmail] Profile updated: { uid, displayName }
[registerWithEmail] User doc created in Firestore: { uid }
```

**W przypadku błędu:**
```javascript
[registerWithEmail] FULL ERROR: [Error object]
[registerWithEmail] Error Code: auth/...
[registerWithEmail] Error Message: Pełna wiadomość
[registerWithEmail] Error Stack: Stack trace
```

---

## 3. Login Logging (`loginWithEmail`)
**Plik:** `src/js/core/auth.js`

✅ Dodane szczegółowe logi etapów logowania:

```javascript
[loginWithEmail] START: { email }
[loginWithEmail] Firebase Auth instance: { authDomain, projectId }
[loginWithEmail] User signed in: { uid, email }
[loginWithEmail] User doc migrated: { uid }
[loginWithEmail] Last seen updated: { uid }
```

**W przypadku błędu:**
```javascript
[loginWithEmail] FULL ERROR: [Error object]
[loginWithEmail] Error Code: auth/...
[loginWithEmail] Error Message: Pełna wiadomość
```

---

## 4. Form Handler Logging
**Rejestracja:** `initRegisterForm()`
**Logowanie:** `initLoginForm()`

✅ Dodane logi sprawdzające:
- Znalezienie elementów formularza
- Walidacja input fields
- Wywołanie funkcji Firebase
- Obsługa błędów z szczegółami

---

## 5. Firestore Operations (`ensureUserDoc`)
**Plik:** `src/js/core/auth.js`

✅ Dodane logi operacji Firestore:
```javascript
[ensureUserDoc] START: { uid, email }
[ensureUserDoc] Firestore ref created: { collection, docId }
[ensureUserDoc] User doc found: { exists }
[ensureUserDoc] Creating new user doc...
[ensureUserDoc] User data prepared: { uid, email, username, xp }
[ensureUserDoc] User doc created successfully in Firestore
```

**W przypadku błędu:**
```javascript
[ensureUserDoc] Error creating user doc: [Error]
[ensureUserDoc] Error Code: [code]
[ensureUserDoc] Error Message: [message]
```

---

## 🔍 Jak testować

### 1. Otwórz Developer Console
- **Chrome:** F12 → Console
- **Firefox:** F12 → Console
- **Safari:** Cmd+Option+I → Console

### 2. Przejdź do aplikacji
```
https://weekend-warrior-social-ed3d0.web.app
```

### 3. Kliknij "Stwórz konto" (Rejestracja)

### 4. Obserwuj logi w Console
Powinny pojawić się logi w takiej kolejności:

```
[Firebase] Initializing with config: {...}
[Firebase] App initialized: {...}
[Firebase] Auth initialized: {...}
[Firebase] Firestore initialized: {...}
[Firebase] Google Provider initialized

[initRegisterForm] Initializing register form...
[initRegisterForm] Form elements found: {...}

// Po wypełnieniu formularza i kliknięciu "Stwórz konto":
[initRegisterForm] Form submitted
[initRegisterForm] Input values: {...}
[initRegisterForm] Calling registerWithEmail...
[registerWithEmail] START: {...}
[registerWithEmail] Firebase Auth instance: {...}
[registerWithEmail] User created: {...}
[registerWithEmail] Profile updated: {...}
[registerWithEmail] User doc created in Firestore: {...}
```

### 5. Szukaj błędów
Jeśli pojawią się błędy, będą wyglądać tak:

```
[registerWithEmail] FULL ERROR: Error: ...
[registerWithEmail] Error Code: auth/email-already-in-use
[registerWithEmail] Error Message: Firebase: Error (auth/email-already-in-use).
```

---

## 📋 Możliwe błędy i rozwiązania

### `auth/email-already-in-use`
```
Przyczyna: Email jest już zarejestrowany
Rozwiązanie: Użyj innego emailu lub zaloguj się na istniejące konto
```

### `auth/weak-password`
```
Przyczyna: Hasło musi mieć min. 6 znaków
Rozwiązanie: Użyj silniejszego hasła
```

### `auth/invalid-email`
```
Przyczyna: Format emaila jest niepoprawny
Rozwiązanie: Sprawdź czy email jest poprawnie sformatowany (xx@xx.xx)
```

### `auth/network-request-failed`
```
Przyczyna: Problem z połączeniem sieciowym
Rozwiązanie: Sprawdź połączenie internetowe
```

### `auth/operation-not-allowed`
```
Przyczyna: Rejestracja jest wyłączona w Firebase Console
Rozwiązanie: 
1. Przejdź do Firebase Console
2. Authentication → Sign-in method
3. Włącz Email/Password
```

### `auth/operation-not-supported-in-this-environment`
```
Przyczyna: Problem z zabezpieczeniami przeglądarki (CORS)
Rozwiązanie:
1. Sprawdź czy domena jest w Authorized Domains
2. Sprawdź czy jest HTTPS (Hosting)
3. Wyczyść cache przeglądarki
```

### `permission-denied` (Firestore)
```
Przyczyna: Firestore Rules blokują zapis
Rozwiązanie:
1. Sprawdź czy Firestore Rules są poprawnie wdrożone
2. Sprawdź czy użytkownik jest zalogowany (request.auth != null)
3. Sprawdź czy isOwner(uid) zwraca true
```

---

## 🔧 Firestore Rules - Weryfikacja

Reguły dla użytkowników wymagają:

```firestore
match /users/{uid} {
  allow create: if isOwner(uid) && isValidUser(request.resource.data);
}
```

Gdzie:
- `isOwner(uid)` → `request.auth.uid == uid` (użytkownik tworzy swój dokument)
- `isValidUser()` → weryfikuje uid, email, username

Dokument musi zawierać minimum:
```javascript
{
  uid: string,           // musi być request.auth.uid
  email: string,         // nie może być puste
  username: string,      // nie może być puste
  xp: 0,
  level: 1,
  rank: "Nowicjusz",
  streak: 0,
  online: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastSeen: serverTimestamp(),
}
```

---

## 📊 Checklist Diagnostyki

Sprawdź w Developer Console:

- [ ] Logi Firebase inicjalizacji (5 linijek)
- [ ] Poprawny projectId: `weekend-warrior-social-ed3d0`
- [ ] Poprawny authDomain: `weekend-warrior-social-ed3d0.firebaseapp.com`
- [ ] Logi inicjalizacji formularza
- [ ] Wszystkie elementy formularza znalezione (form, input, button)
- [ ] Po submicie pojawią się logi `[initRegisterForm] Form submitted`
- [ ] Logi walidacji input fields
- [ ] Logi `[registerWithEmail] START`
- [ ] Logi Firebase Auth instance
- [ ] Logi user creation
- [ ] Logi profile update
- [ ] Logi Firestore doc creation
- [ ] Brak błędów `[registerWithEmail] FULL ERROR`

---

## 🐛 Debugging Tips

### 1. Pełne logowanie błędu
Jeśli pojawi się `FULL ERROR`, skopiuj cały tekst błędu:
```
[registerWithEmail] FULL ERROR: ...
[registerWithEmail] Error Code: ...
[registerWithEmail] Error Message: ...
[registerWithEmail] Error Stack: ...
```

### 2. Sprawdzenie konfiguracji
W Console uruchom:
```javascript
import { auth } from './src/js/core/firebase.js';
console.log(auth.config);
```

### 3. Sprawdzenie stanu auth
```javascript
import { auth } from './src/js/core/firebase.js';
auth.onAuthStateChanged(user => console.log('Current user:', user));
```

### 4. Test Firestore Rules
W Firebase Console:
1. Firestore Database → Rules
2. Rules playground (prawym guzik)
3. Simulator: Create → users/{uid}
4. Sprawdź czy allow czy deny

---

## 📝 Raportowanie Problemów

Jeśli nadal są problemy, zbierz:

1. **Error Code** z konsoli
2. **Error Message** pełny tekst
3. **Stack Trace** jeśli dostępny
4. **Kroki do reprodukcji**
5. **Screenshots** Developer Console

I porównaj z tabelą błędów wyżej.

---

## 🎯 Oczekiwany Przepływ

### Rejestracja (Success)
```
1. Użytkownik wpisuje email, hasło, imię
2. Formularyz wysyła dane do registerWithEmail()
3. Firebase Auth tworzy użytkownika
4. Profile update zapisuje displayName
5. ensureUserDoc() tworzy dokument w Firestore
6. Toast: "✅ Konto utworzone!"
7. Redirect do home page (/)
```

### Logowanie (Success)
```
1. Użytkownik wpisuje email i hasło
2. Formularz wysyła dane do loginWithEmail()
3. Firebase Auth loguje użytkownika
4. migrateUserDoc() aktualizuje dokument
5. updateLastSeen() zapisuje czas
6. Toast: "✅ Zalogowano!"
7. Redirect do home page (/)
```

---

## 📞 Następne kroki

1. **Wdróż zmiany** - git push origin claude/weekend-warrior-foundation-wh8nxn
2. **Testuj w przeglądarce** - Otwórz app i przejrzyj Console
3. **Przeanalizuj logi** - Szukaj błędów w logach
4. **Dostosuj rozwiązanie** - Na podstawie znalezionych błędów

Wszystkie logi zostaną wyświetlone w Developer Console. To powinno dać dokładną informację gdzie jest problem!

