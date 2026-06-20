# Messenger — Szybki Poradnik Wdrażania

## 🎯 Co Zostało Naprawione

### Problemy (Przed)

- ❌ Messenger miał dwie ekrany ale były niekontrolowane
- ❌ “Wiadomości” tab wyglądał jak broken feature
- ❌ Wysyłanie nie działało prawidłowo
- ❌ Brakował UI wdrażania dla przycisków
- ❌ Online status nie był widoczny
- ❌ Unread badges były w złym miejscu

### Rozwiązania (Teraz)

- ✅ Facebook-style messenger z conversation list + chat view
- ✅ Działające wysyłanie tekstu i zdjęć
- ✅ Online status (zielona kropka)
- ✅ Unread badges (liczniki)
- ✅ Real-time synchronizacja
- ✅ Mobile-optimized
- ✅ Search rozmów
- ✅ Notifications

-----

## 📋 Co Zmieniłem

### 1. `messenger.html` — CAŁKOWICIE NOWY

- **580 linii** czystego, działającego HTML/CSS
- Unified layout: lista + chat (responsywny)
- Inline CSS (wszystko w jednym pliku)
- Top bar z logiem, buttons
- Bottom navigation z linkami na inne strony
- Search bar
- Message bubbles (gold dla mnie, dark dla nich)
- Image preview
- Online status indicator

### 2. `js/messenger.js` — CAŁKOWICIE NOWY

- **500 linii** czystego, działającego kodu
- Pojedynczy entry point: `initMessenger(uid)`
- Firestore real-time listeners (onSnapshot)
- Obsługa wysyłania tekstu + zdjęć
- Search filter
- Online presence sync
- Unread badge injection
- Error handling z user feedback

-----

## 🚀 Jak Wdrażać

### Opcja 1: Automatycznie (Rekomendowane)

1. Pobierz `messenger.html` z `/outputs/`
1. Zamień swój `messenger.html`
1. Pobierz `messenger.js` z `/outputs/`
1. Zamień swój `js/messenger.js`
1. Commit i push do GitHub
1. Otwórz w przeglądarce:
   
   ```
   https://bvt2kzkbb9-art.github.io/weekend-warrior-social/messenger.html
   ```

### Opcja 2: Ręcznie

Kopia-paste zawartość z outputów do Twoich plików.

-----

## ✅ Checklist po Wdrażaniu

Otwórz messenger i sprawdź:

- [ ] Widzę listę rozmów
- [ ] Mogę kliknąć rozmowę i zobaczyć wiadomości
- [ ] Mogę wysłać wiadomość (Enter lub przycisk)
- [ ] Mogę wysłać zdjęcie (kliknij ikonę)
- [ ] Online użytkownika pokazuje zielona kropka
- [ ] Unread count pokazuje się w badge
- [ ] Mobile: działa na iPhone w pełni (landscape + portrait)

-----

## 📱 UI Layout

```
╔════════════════════════════════════════════╗
║ 💬 Messenger    [🔔] [👤]                  ║ ← Top Bar
╠════════════════════════════════════════════╣
║                                            ║
║  Rozmowy      │   Chat                     ║
║  ┌──────────┐ │ ┌─────────────────────┐   ║
║  │ 🟢 User A │ │ User A        Online  │   ║
║  │ Hey!     │ │ ┌─────────────────┐   │   ║
║  │ 2 min.   │ │ │ My message      │   │   ║
║  ├──────────┤ │ ├─────────────────┤   │   ║
║  │ User B   │ │ │ Their message   │   │   ║
║  │ Ok, bye  │ │ └─────────────────┘   │   ║
║  │ 1 hour   │ │                        │   ║
║  └──────────┘ │ Input: [📷] Aa [Send] │   ║
║               │                        │   ║
║               └─────────────────────────┘   ║
╠════════════════════════════════════════════╣
║ [🏠] [📖] [⚔️] [🏆] [👤] [⏏️]              ║ ← Bottom Nav
╚════════════════════════════════════════════╝
```

-----

## 🔧 Techniczne Szczegóły

### Struktura Firestore (używana)

```
conversations/{convId}
  ├─ participants: [uid1, uid2]
  ├─ lastMessage: "Hey!"
  ├─ lastMessageAt: timestamp
  ├─ lastSenderId: "uid1"
  ├─ unread: {uid1: 0, uid2: 1}
  └─ createdAt: timestamp

conversations/{convId}/messages/{msgId}
  ├─ senderId: "uid1"
  ├─ senderName: "John"
  ├─ content: "Hello!"
  ├─ imageUrl: "https://res.cloudinary.com/..." (optional)
  ├─ read: true
  └─ createdAt: timestamp
```

### Real-time Sync

- `onSnapshot` na conversations → live list
- `onSnapshot` na messages w chat → live messages
- `updateDoc` na online/lastSeen → live presence
- `updateDoc` na unread → live badge count

-----

## 🛠️ Troubleshooting

### “Nic się nie ładuje”

→ Sprawdź Firebase rules (see MESSENGER_REBUILD_GUIDE.md)

### “Nie mogę wysłać wiadomości”

→ Sprawdź console (F12) czy są errory
→ Sprawdź czy `sendMessage()` się odpala

### “Zdjęcia nie wysyłają”

→ Sprawdź czy Cloudinary credentiale są OK w `firebase.js`
→ Sprawdź czy image < 8 MB

### “Online status nie aktualizuje”

→ Sprawdź czy `setOnlinePresence()` jest wywoływane
→ Sprawdź czy Firestore rules pozwalają update na users

-----

## 📝 Notes

- **CSS**: Wszystkie style inline w HTML (łatwiej zarządzać)
- **Responsywne**: Media queries dla mobile
- **Image Compression**: Client-side przed uploadem (max 1280px)
- **Unsubscribe**: Listeners prawidłowo cleanup
- **Error Handling**: Toasts feedback dla użytkownika

-----

## 🎉 Ready to Deploy

Files are in `/outputs/`:

- `messenger.html` — Copy to root
- `messenger.js` — Copy to js/
- `MESSENGER_REBUILD_GUIDE.md` — Reference

Good luck! 🚀