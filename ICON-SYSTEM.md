<!-- Icon System Integration Guide -->

# 🎨 Icon System - Dokumentacja

Premium Dark Fantasy Icon System dla Weekend Warrior Social (23 ikony)

## Szybki Start

### 1. Importuj pliki

W `<head>`:
```html
<link rel="stylesheet" href="/css/icons.css">
<script src="/js/icon-system.js"></script>
```

### 2. Podstawowe użycie

```html
<!-- Metoda 1: Custom Element (rekomendowane) -->
<icon name="notification"></icon>
<icon name="arena"></icon>
<icon name="missions"></icon>

<!-- Metoda 2: Z klasami CSS -->
<icon name="profile" class="icon-large active"></icon>
<icon name="messages" class="icon-gold"></icon>
```

---

## Dostępne Ikony (23)

### Nawigacja (9)
- `notification` — Dzwon (powiadomienia)
- `messages` — Zwój pergaminu (wiadomości)
- `profile` — Popiersie wojownika (profil)
- `logout` — Portal (wylogowanie)
- `arena` — Tarcza ze mieczami (arena)
- `chronicles` — Pergamin na rolerach (kroniki)
- `missions` — Skrzyżowane miecze (misje)
- `glory` — Korona (chwała)
- `hero` — Hełm (bohater)

### Pomocnicze (14)
- `eye` — Oko (obserwacja)
- `fire` — Płomień (moc)
- `xp` — Orb (doświadczenie)
- `photo` — Rama (zdjęcie)
- `comment` — Bąbel (komentarz)
- `share` — Sieć (udostępnianie)
- `like` — Serce (polubienie)
- `search` — Lupa (szukanie)
- `filter` — Lejek (filtr)
- `menu` — Hamburger (menu)
- `close` — X (zamknięcie)
- `back` — Strzałka (wstecz)
- `edit` — Ołówek (edycja)
- `delete` — Kosz (usunięcie)
- `stats` — Wykres (statystyki)
- `ranking` — Podium (ranking)
- `cup` — Puchar (trofeum)
- `add` — Plus (dodanie)
- `more` — Trzy kropki (więcej)

---

## Rozmiary

### CSS Classes
```html
<icon name="notification" class="icon-xs"></icon>      <!-- 16px -->
<icon name="notification" class="icon-sm"></icon>      <!-- 20px -->
<icon name="notification" class="icon-md"></icon>      <!-- 24px -->
<icon name="notification" class="icon-lg"></icon>      <!-- 32px -->
<icon name="notification" class="icon-xl"></icon>      <!-- 40px -->
<icon name="notification" class="icon-2xl"></icon>     <!-- 48px -->
```

### Custom Size (atrybuty)
```html
<icon name="arena" size="28"></icon>
<icon name="missions" size="36"></icon>
```

---

## Stany Ikony

### Aktywna
```html
<icon name="arena" class="active"></icon>
<!-- Kolor: #D4AF37 (złoto) -->
<!-- Efekt: drop-shadow glow -->
```

### Hover
```html
<icon name="missions"></icon>
<!-- scale(0.98) + glow effect -->
```

### Disabled
```html
<icon name="profile" class="disabled"></icon>
<!-- opacity: 0.6, cursor: not-allowed -->
```

### Muted
```html
<icon name="messages" class="icon-muted"></icon>
<!-- opacity: 0.5 -->
```

---

## Kolory

### Domyślne
- Nieaktywne: `#A8A8A8` (jasno szary)
- Aktywne: `#D4AF37` (złoto)

### Warianty CSS
```html
<icon name="fire" class="icon-gold"></icon>      <!-- Złoto -->
<icon name="close" class="icon-danger"></icon>   <!-- Czerwony -->
<icon name="shield" class="icon-success"></icon> <!-- Zielony -->
<icon name="eye" class="icon-muted"></icon>      <!-- Przytłumiony -->
```

---

## Animacje

### Pulse (mruganie)
```html
<icon name="notification" class="icon-pulse"></icon>
```

### Spin (obracanie)
```html
<icon name="loading" class="icon-spin"></icon>
```

### Glow (świecenie)
```html
<icon name="glory" class="icon-glow"></icon>
```

---

## Badge (Notyfikacja)

```html
<icon name="notification" class="icon-badge" data-badge="3"></icon>
<!-- Wyświetli złotą kulkę z liczbą 3 -->
```

---

## JavaScript API

### Programowe tworzenie ikon

```javascript
// Dodaj ikonę do elementu
const container = document.getElementById('my-container');
const icon = await IconSystem.create('arena', 24, 'icon-gold');
container.appendChild(icon);
```

### Lista dostępnych ikon

```javascript
IconSystem.available.navigation  // 9 ikon nawigacyjnych
IconSystem.available.helpers     // 14 ikon pomocniczych
```

---

## Przykłady w HTML

### Navigation Bar
```html
<header class="top-nav">
  <icon name="notification" class="icon-lg"></icon>
  <icon name="messages" class="icon-lg"></icon>
  <icon name="profile" class="icon-lg"></icon>
  <icon name="logout" class="icon-lg"></icon>
</header>
```

### Bottom Navigation
```html
<footer class="bottom-nav">
  <icon name="arena" class="icon-lg active"></icon>
  <icon name="chronicles" class="icon-lg"></icon>
  <icon name="missions" class="icon-lg"></icon>
  <icon name="glory" class="icon-lg"></icon>
  <icon name="hero" class="icon-lg"></icon>
</footer>
```

### Button with Icon
```html
<button class="icon-button">
  <icon name="edit" class="icon-md"></icon>
  <span>Edytuj</span>
</button>

<button class="icon-button">
  <icon name="delete" class="icon-md icon-danger"></icon>
</button>
```

### Card with Icons
```html
<div class="card">
  <div class="card-header">
    <icon name="trophy" class="icon-lg icon-gold"></icon>
    <h3>Ranking</h3>
  </div>
  <div class="card-body">
    <icon name="ranking" class="icon-md"></icon>
    <p>Twoja pozycja: #42</p>
  </div>
</div>
```

---

## CSS Dostosowanie

### Zmiana domyślnego koloru

```css
/* Override domyślnego koloru */
icon {
  color: #FFD700;
}

/* Dla konkretnego typu */
.nav-icon {
  color: #D4AF37;
}
```

### Custom Animacja

```css
@keyframes my-glow {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5)); }
  50% { filter: drop-shadow(0 0 16px rgba(212, 175, 55, 1)); }
}

.icon-custom-glow {
  animation: my-glow 2s ease-in-out infinite;
}
```

---

## Performance

✅ Czysty SVG — lekkie, skalowalne
✅ currentColor — brak duplikacji kolorów
✅ Lazy loading — ikony ładują się na żądanie
✅ Bez bitmap — ostra na każdym DPI
✅ Responsywne — skaluje się 16-48px bez artefaktów

---

## Accessibility

✅ Wsparcie `prefers-reduced-motion`
✅ Focus states dla keyboard navigation
✅ ARIA kompatybilne
✅ Wysoki kontrast (#A8A8A8 na #090810)
✅ Czytalne na małych ekranach (iPhone SE 20px+)

---

## Spec

- **ViewBox:** 32×32px
- **Padding:** 2px
- **Stroke:** 2.4px, round joins/caps
- **Kolory:** currentColor
- **Format:** Pure SVG (no bitmap)
- **Animacje:** CSS transitions

---

_Generated for Weekend Warrior Social_
_Premium Dark Fantasy Icon System v1.0_
