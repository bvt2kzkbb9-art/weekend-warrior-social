# 🚀 Szybkie Rozwiązywanie Problemów z Auth

**Problem:** Rejestracja lub logowanie nie działają  
**Czas rozwiązania:** 5-15 minut  
**Ostatnia aktualizacja:** 2026-06-20

---

## ⚡ 30-sekundowa Diagnostyka

### Krok 1: Otwórz Developer Console
```
Chrome/Edge: F12 → Console
Firefox: F12 → Console  
Safari: Cmd+Option+I → Console
```

### Krok 2: Przejdź do aplikacji
```
https://weekend-warrior-social-ed3d0.web.app
```

### Krok 3: Kliknij "Stwórz konto"

### Krok 4: Obserwuj Console
Szukaj linii:
```
[Firebase] Initializing with config:
```

**Jeśli BRAK tej linii:** Problem z ładowaniem Firebase (`src/js/core/firebase.js`)  
**Jeśli JEST ta linia:** Przejdź do kroku 5

### Krok 5: Wypełnij formularz i kliknij Submit

**Szukaj linu:**
```
[registerWithEmail] User created: { uid: ... }
```

**Jeśli pojawia się ERROR zamiast SUCCESS:** Przejdź do sekcji "Error Codes" poniżej

---

## 🔍 Error Code Quick Reference

| Error Code | Przyczyna | Rozwiązanie |
|-----------|-----------|-----------|
| `auth/email-already-in-use` | Email jest zarejestrowany | Użyj innego emailu |
| `auth/weak-password` | Hasło < 6 znaków | Użyj silniejszego hasła |
| `auth/invalid-email` | Zły format emaila | Sprawdź email (xxx@xxx.xxx) |
| `auth/network-request-failed` | Brak internetu | Sprawdź połączenie |
| `auth/operation-not-allowed` | Auth wyłączona w Firebase | Patrz: FIREBASE_SETUP_CHECKLIST.md → Enable Email/Password |
| `auth/requests-from-referer-blocked` | Domena nie autoryzowana | Patrz: FIREBASE_SETUP_CHECKLIST.md → Authorized Domains |
| `permission-denied` | Firestore Rules blokują | Patrz: FIREBASE_SETUP_CHECKLIST.md → Firestore Rules |

---

## 🎯 Scenariusz 1: Błąd rejestracji

### Symptomy:
- Klikniesz "Stwórz konto"
- Toast pokazuje: "❌ Błąd rejestracji"
- Brak szczegółów na temat przyczyny

### Diagnoza:

**Step 1:** Otwórz Console (F12)

**Step 2:** Szukaj: `[registerWithEmail] FULL ERROR`

```
[registerWithEmail] FULL ERROR: Error: ...
[registerWithEmail] Error Code: auth/...
[registerWithEmail] Error Message: ...
```

**Step 3:** Porównaj Error Code z tabelą wyżej

**Step 4:** Jeśli brak logu `[registerWithEmail]`

To oznacza, że kod nie dotarł do funkcji registerWithEmail(). Sprawdź:

1. Czy formularz się submituje (szukaj: `[initRegisterForm] Form submitted`)
2. Czy formularyz waliduje dane (szukaj: `[initRegisterForm] Input values`)
3. Czy Firefox/Chrome pokazuje jakieś error objawów (możliwe CORS)

---

## 🎯 Scenariusz 2: Błąd logowania

### Symptomy:
- Klikniesz "Zaloguj się"
- Toast pokazuje: "❌ Błąd logowania"
- Nie wiesz dlaczego

### Diagnoza:

**Step 1:** Otwórz Console (F12)

**Step 2:** Szukaj: `[loginWithEmail] FULL ERROR`

```
[loginWithEmail] FULL ERROR: Error: ...
[loginWithEmail] Error Code: auth/...
[loginWithEmail] Error Message: ...
```

**Step 3:** Porównaj Error Code:

| Error Code | Prawdopodobnie |
|-----------|----------|
| `auth/user-not-found` | Email nie istnieje - zarejestruj się |
| `auth/wrong-password` | Niepoprawne hasło |
| `auth/invalid-email` | Zły format emaila |
| `auth/too-many-requests` | Za dużo prób - czekaj godzinę |

---

## 🎯 Scenariusz 3: Brak żadnych logów

### Symptomy:
- Otwierasz Console
- Brak jakichkolwiek logów Firebase
- Formularz się nie submituje lub nie robi nic

### Diagnoza:

**Problem 1: Firebase się nie ładuje**

Sprawdzenie:
```javascript
// W Console (F12):
typeof firebase
// Powinno być: object
// Jeśli: undefined → Firebase się nie załadował
```

Rozwiązanie:
1. Sprawdź czy jest error w Console (czerwone X)
2. Sprawdź czy URL jest HTTPS (patrz aplikacja live)
3. Wyczyść cache: Ctrl+Shift+Delete
4. Przeładuj: Ctrl+Shift+R

**Problem 2: Script se nie ładuje**

Sprawdzenie:
```javascript
import { auth } from './src/js/core/firebase.js';
// Jeśli error 404 → brak pliku
// Jeśli error CORS → problem z domeną
```

Rozwiązanie:
1. Sprawdzić czy plik istnieje
2. Sprawdzić HTTPS
3. Sprawdzić czy deployment zakończył się SUCCESS

---

## 🎯 Scenariusz 4: Formularz się submituje ale nic się nie dzieje

### Symptomy:
- Klikniesz "Stwórz konto" lub "Zaloguj się"
- Button wyłącza się (loading state)
- Ale nic się nie dzieje dalej
- Po 30 sekundach button się włącza
- Brak toastu ani błędu

### Diagnoza:

To oznacza że request do Firebase "wisi" - timeout. Sprawdzenia:

1. **Połączenie sieciowe:**
```javascript
// W Console:
navigator.onLine
// Powinno: true
```

2. **Która funkcja wysyła się:**
```javascript
// W Console szukaj:
[loginWithEmail] START
// Jeśli pojawia się po kliknięciu - fetch się wysyła
// Jeśli NIE pojawia się - problem z formularzem
```

3. **Czy Firebase Auth się komunikuje:**
```javascript
// W Console szukaj:
[loginWithEmail] User signed in
// Jeśli pojawia się - auth OK, problem gdzieś indziej
// Jeśli NIE pojawia się - auth nie odpowiada
```

Rozwiązania:
- Sprawdzenie internetu
- Wyczyść cache
- Poczekaj minutę
- Jeśli trwa > 60 sec, to timeout - problem z Firebase

---

## 🔧 Debug Commands

Wpisz w Console (F12) aby diagnostykować:

### 1. Sprawdzenie Firebase Config
```javascript
import { auth, db } from './src/js/core/firebase.js';
console.log('Auth config:', auth.config);
console.log('Firestore project:', db.projectId);
```

Powinno pokazać:
```
Auth config: {
  apiKey: "AIzaSyA...",
  authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com",
  projectId: "weekend-warrior-social-ed3d0",
  ...
}
Firestore project: weekend-warrior-social-ed3d0
```

### 2. Test Rejestracji (Bez UI)
```javascript
import { registerWithEmail } from './src/js/core/auth.js';

await registerWithEmail('test@example.com', 'password123', 'Test User');
// Obserwuj Console na logi
```

### 3. Test Logowania (Bez UI)
```javascript
import { loginWithEmail } from './src/js/core/auth.js';

await loginWithEmail('test@example.com', 'password123');
// Obserwuj Console na logi
```

### 4. Sprawdzenie Current User
```javascript
import { auth } from './src/js/core/firebase.js';
console.log('Current user:', auth.currentUser);
```

Powinno pokazać user object jeśli zalogowany, null jeśli nie

### 5. Enable Firebase Debug Logs
```javascript
localStorage.debug = 'firebase-*';
location.reload();
```

To pokaże wewnętrzne logi Firebase (bardzo szczegółowe)

---

## 📋 Checklist Przed Kontaktem ze Supportem

Jeśli nie możesz sam rozwiązać problemu, przygotuj:

- [ ] Error Code z Console (np. `auth/email-already-in-use`)
- [ ] Error Message pełny tekst
- [ ] Stack Trace jeśli dostępny
- [ ] Kroki do reprodukcji (co robiłeś)
- [ ] Screenshot Console z logami
- [ ] URL gdzie problem się pojawia
- [ ] Przeglądarka i wersja (Chrome 125, Firefox 124, itp)
- [ ] Czy VPN/proxy jest włączony

---

## 🚀 Szybkie Testy

### Test 1: Czy domena jest autoryzowana?
W Console:
```javascript
fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test123', returnSecureToken: true })
}).then(r => r.json()).then(d => console.log(d));
```

Jeśli error o `referer` → domena nie jest autoryzowana

### Test 2: Czy Firestore Rules zezwalają?
W Firebase Console:
1. Firestore → Rules
2. Rules Playground (prawy górny guzik)
3. Operation: Create
4. Collection: users
5. Document: {uid}
6. Wpisz test data:
```json
{
  "uid": "test-uid",
  "email": "test@example.com",
  "username": "testuser",
  "xp": 0
}
```
7. Kliknij "Simulate"
8. Powinna być zielona "✓ Allow"

### Test 3: Czy Hosting działa?
```bash
curl -I https://weekend-warrior-social-ed3d0.web.app
```

Powinno zwrócić:
```
HTTP/2 200
```

---

## 🎯 Priority Order Checks

Jeśli wszystko nie działa, sprawdzaj w tej kolejności:

1. **[FIRST]** Console logi - szukaj `FULL ERROR`
2. **[SECOND]** Error Code z logu - porównaj z tabelą
3. **[THIRD]** Czy Firebase się załadował (szukaj logów inicjalizacji)
4. **[FOURTH]** Czy Authorized Domains zawierają aplikację
5. **[FIFTH]** Czy Email/Password jest ENABLED w Firebase
6. **[SIXTH]** Czy Firestore Rules są opublikowane
7. **[LAST]** Wyczyść cache + poczekaj + spróbuj ponownie

---

## 📞 Gdzie Szukać Pomocy

1. **Dla błędów Auth:** AUTH_DIAGNOSTIC_GUIDE.md
2. **Dla Firebase config:** FIREBASE_SETUP_CHECKLIST.md  
3. **Dla Firestore Rules:** firestore.rules (w repozytorium)
4. **Dla GitHub Actions:** DEPLOYMENT_STATUS.md
5. **Dla general issues:** README.md

---

## ✅ Jeśli Wszystko Działa

Gratulacje! 🎉

Oznaki że wszystko OK:
- [x] Rejestracja tworzy konto
- [x] Logowanie zalogowuje użytkownika
- [x] Przeskok do home page (/)
- [x] Console czysty (brak czerwonych errors)
- [x] App działa bez opóźnień

Jeśli coś dalej nie działa, sprawdź:
1. Czy dane są zapisane w Firestore (Firebase Console → Firestore → collections → users)
2. Czy user pojawia się w Firebase Auth (Firebase Console → Authentication → Users)
3. Czy session sie utrzymuje po przeładowaniu strony

