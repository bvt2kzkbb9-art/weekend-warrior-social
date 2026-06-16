# 🎯 Weekend Warrior Social v2.0 — Mapa Nawigacji

## 📊 Struktura SPA (Single Page Application)

```
┌─────────────────────────────────────────────────────────┐
│                     HEADER                              │
│  Logo WWS  │  Wyszukiwarka  │  🔔 Powiadomienia  💬   │
└─────────────────────────────────────────────────────────┘
                                                            
┌─────────────────────────────────────────────────────────┐
│                                                           │
│               GŁÓWNY EKRAN (SCREENS)                     │
│                                                           │
│  screen-home          (aktywny domyślnie)               │
│  screen-challenges    (lista wyzwań)                    │
│  screen-create        (tworzenie)                       │
│  screen-messages      (wiadomości)                      │
│  screen-profile       (profil użytkownika)              │
│                                                           │
│  (Переключаются poprzez showScreen() JS function)      │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│        DOLNA NAWIGACJA (5 IKON)                         │
│  🏠        ⚔️        ➕        💬        👤             │
│  Home  │ Chall. │ Create │ Msgs  │ Profile              │
└─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Mapa Ekranów (Screen Map)

### **1. HOME SCREEN** (`screen-home`)
```
Home
├─ Stories Bar (poziomy scroll)
│  ├─ Dodaj historię (+)
│  ├─ Historia Przyjaciela 1
│  ├─ Historia Przyjaciela 2
│  └─ Historia Przyjaciela 3
│
├─ Quick Actions (4 ikony)
│  ├─ 📝 Post (createPost('text'))
│  ├─ 📸 Photo (createPost('photo'))
│  ├─ ⚔️ Challenge (showScreen('screen-challenges'))
│  └─ 💬 Chat (showScreen('screen-messages'))
│
└─ Feed (lista postów)
   ├─ Post Card 1
   │  ├─ Avatar + Username + Data
   │  ├─ Treść
   │  ├─ Zdjęcie
   │  └─ Akcje (❤️ Like | 💬 Comment | ↗️ Share)
   ├─ Post Card 2
   └─ ... więcej postów
```

**Funkcje:**
- `loadHomeScreen()` - załaduj feed
- `loadFeed()` - pobierz posty z Firebase
- `createPost(type)` - utwórz post

---

### **2. CHALLENGES SCREEN** (`screen-challenges`)
```
Challenges
├─ Nagłówek: "Wyzwania"
│
├─ Filtry (inline buttons)
│  ├─ [Wszystkie] (active)
│  ├─ [Trending]
│  ├─ [Nowe]
│  └─ [Łatwe]
│
└─ Grid Wyzwań (responsive)
   ├─ Challenge Card 1
   │  ├─ Emoji/Grafika
   │  ├─ Tytuł
   │  ├─ Trudność badge
   │  └─ +XP reward
   ├─ Challenge Card 2
   └─ ... więcej wyzwań
```

**Funkcje:**
- `loadChallengesScreen()` - załaduj ekran
- `getChallenges()` - pobierz wyzwania
- `filterChallenges(type)` - filtruj (all/trending/new/easy)

---

### **3. CREATE SCREEN** (`screen-create`)
```
Create
├─ Nagłówek: "Co chcesz zrobić?"
│
└─ Menu (2x2 grid)
   ├─ 📝 Napisz coś (createPost('text'))
   ├─ 📸 Dodaj zdjęcie (createPost('photo'))
   ├─ ⚔️ Wyzwanie (createChallenge())
   └─ 📅 Wydarzenie (createEvent())
```

**Funkcje:**
- `createPost(type)` - utwórz post
- `createChallenge()` - utwórz wyzwanie
- `createEvent()` - utwórz wydarzenie

---

### **4. MESSAGES SCREEN** (`screen-messages`)
```
Messages
├─ Nagłówek: "Wiadomości"
│
└─ Lista Rozmów
   ├─ Conversation Item 1
   │  ├─ Avatar
   │  ├─ Nazwa + Last Message Preview
   │  └─ Data/czas
   ├─ Conversation Item 2
   └─ ... więcej rozmów
```

**Funkcje:**
- `loadMessagesScreen()` - załaduj ekran
- `loadMessages()` - pobierz rozmowy
- `sendMessage(text)` - wyślij wiadomość

---

### **5. PROFILE SCREEN** (`screen-profile`)
```
Profile
├─ Header
│  ├─ Banner (gradient)
│  ├─ Avatar (overlap)
│  ├─ Nazwa
│  └─ Rank (🥉 Rookie, 🥈 Warrior, itd.)
│
├─ Stats Grid (3 kolumny)
│  ├─ XP (liczba)
│  ├─ Level (liczba)
│  └─ Streak (liczba)
│
├─ Akcje
│  ├─ [Edytuj Profil] (primary)
│  └─ [Wyloguj] (ghost)
│
├─ Tabs
│  ├─ Posty (tab 1)
│  ├─ Wyzwania (tab 2)
│  ├─ Osiągnięcia (tab 3)
│  └─ Znajomi (tab 4)
│
└─ Tab Content
   └─ (dynamicznie zmienia się przy kliknięciu)
```

**Funkcje:**
- `loadProfileScreen()` - załaduj profil
- `switchProfileTab(tab, tabName)` - przełącz tab
- Wyświetl statystyki użytkownika z Firebase

---

## 🎯 User Flow (Przebieg Interakcji)

```
┌─────────────────┐
│   Zalogowanie   │
│  (Firebase Auth) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     Ekran Główny (Home)                 │
│  ├─ Feed z postami                      │
│  ├─ Stories slider                      │
│  ├─ Quick actions                       │
│  └─ Bottom nav (5 ikon)                │
└────┬────────────┬────────────┬──────────┘
     │            │            │
     ▼            ▼            ▼
 ┌────────┐  ┌──────────┐  ┌────────┐
 │Create  │  │Challenge │  │Messages│
 │  Post  │  │Discovery │  │  Chat  │
 └────────┘  └──────────┘  └────────┘
     │            │            │
     ▼            ▼            ▼
 [Feed]      [Grid]       [Rozmowa]
     │            │            │
     └────────────┴────────────┘
            │
            ▼
       ┌─────────┐
       │ Profile │
       │ Stats   │
       └─────────┘
```

---

## 🔄 Nawigacja Między Ekranami

**Metoda: JavaScript `showScreen()` function**

```javascript
// Przełączanie ekranów
window.showScreen('screen-home');       // Home
window.showScreen('screen-challenges'); // Challenges
window.showScreen('screen-create');     // Create
window.showScreen('screen-messages');   // Messages
window.showScreen('screen-profile');    // Profile
```

**Triggery:**
- Kliknięcie na ikony dolnego menu (nav-item)
- Kliknięcie na "Quick Actions" w Home
- Przycisk wstecz (jeśli implementujemy history)

---

## 📱 Responsive Breakpoints

```
Mobile (< 768px)
├─ Full width layout
├─ Bottom navbar fixed
├─ Touch-optimized (44px min buttons)
└─ All screens 100% width

Tablet (768px - 1023px)
├─ Slightly wider padding
├─ Center navbar (600px max)
└─ Improved spacing

Desktop (> 1024px)
├─ Sidebar optional
├─ Wider content areas
└─ Extra spacing for readability
```

---

## 🎨 Design System Integration

**Wszystkie komponenty używają:**
- `css/design-system.css` (CSS variables)
- `css/messenger.css` (messaging UI)

**Color Variables:**
```css
--color-dark-0: #0A0A0B         /* Background */
--color-dark-1: #12121A         /* Cards */
--color-dark-2: #1A1A23         /* Elevated */
--color-gold: #D4AF37           /* Primary */
--color-text-primary: #FFFFFF   /* Main text */
--color-text-secondary: #B0B0B8 /* Secondary */
```

---

## 📁 File Structure

```
weekend-warrior-social/
├── index.html                 ← Main SPA entry point
├── offline.html              ← Offline fallback
├── terms.html                ← Terms & Conditions
│
├── css/
│  ├── design-system.css      ← Design tokens (primary)
│  └── messenger.css          ← Messaging styles
│
├── js/
│  ├── firebase.js            ← Firebase config
│  ├── feed.js                ← Feed logic
│  ├── messenger.js           ← Messages logic
│  ├── challenge-system.js    ← Challenges logic
│  ├── auth.js                ← Authentication
│  ├── notifications.js       ← Notifications
│  ├── xp.js                  ← XP/Leveling
│  └── social.js              ← Social features
│
├── assets/
│  └── icons/
│      ├── icon-192.png
│      ├── icon-512.png
│      └── icon-512.svg
│
├── manifest.json             ← PWA config
├── sw.js                     ← Service Worker
│
└── firebase.json             ← Hosting config
```

---

## ⚙️ Key Functions

### Navigation
```javascript
window.showScreen(screenId)        // Switch screens
window.loadHomeScreen()            // Load home
window.loadChallengesScreen()      // Load challenges
window.loadMessagesScreen()        // Load messages
window.loadProfileScreen()         // Load profile
```

### Create
```javascript
window.createPost(type)            // Create text/photo post
window.createChallenge()           // Create challenge
window.createEvent()               // Create event
```

### Challenges
```javascript
window.filterChallenges(type)      // Filter by type
```

### Profile
```javascript
window.switchProfileTab(tab, name) // Switch tabs
```

---

## 🎯 Navigation Priority

**Accessibility (max 2 clicks):**
- Home Feed: 1 click (default)
- Create Post: 1 click (Quick Action or nav)
- Challenges: 1 click (nav icon)
- Messages: 1 click (nav icon)
- Profile: 1 click (nav icon)

**Search/Find:**
- Wyszukiwarka: Header (always visible)

---

## 📊 Activity Flow

```
User Opens App
    ↓
authenticate() [Firebase Auth]
    ↓
    ✓ Logged in → Show Home Screen
    ✗ Not logged → Redirect to login.html
    ↓
loadHomeScreen()
    ├─ loadFeed() → Display posts
    └─ Bottom nav ready
    ↓
User clicks nav icon
    └─ showScreen('screen-xxx')
       ├─ Hide all screens
       ├─ Show selected screen
       ├─ Load content if needed
       └─ Update active nav item
```

---

## 🚀 Production Ready

✅ **Architecture:** SPA with 5-screen navigation  
✅ **Design:** Modern minimalist system v2.0  
✅ **Mobile:** Touch-optimized, responsive  
✅ **Performance:** Lazy loading, caching via Service Worker  
✅ **Offline:** offline.html fallback  
✅ **PWA:** Installable (manifest.json)  
✅ **Documentation:** Complete with guides  

---

**Version:** 2.0.0  
**Status:** Production Ready  
**Last Updated:** June 16, 2026

Navigate to `index.html` to start the application.
