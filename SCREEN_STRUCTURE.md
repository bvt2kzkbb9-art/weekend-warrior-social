# 🎨 Weekend Warrior Social v2.0 — Struktura Ekranów

## 📐 Wireframe Poziom Generalny

```
┌──────────────────────────────────────────┐
│ HEADER (56px)                            │
│ Logo | Search | 🔔 | 💬                 │
├──────────────────────────────────────────┤
│                                          │
│                                          │
│           SCREEN CONTENT                 │
│         (Flexible / Dynamic)             │
│                                          │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│ NAVBAR (60px, fixed bottom)              │
│ 🏠 | ⚔️ | ➕ | 💬 | 👤                   │
└──────────────────────────────────────────┘
```

---

## 🏠 SCREEN 1: HOME

### Visual Structure

```
┌────────────────────────────────────────────────┐
│ Header: Logo + Search + Icons                  │
├────────────────────────────────────────────────┤
│                                                │
│ 📊 STORIES BAR (Horizontal Scroll)            │
│  [+] [👥] [⚡] [🎬] [📸]                      │
│                                                │
│ 🚀 QUICK ACTIONS (4 Icon Grid)                │
│  ┌──────┐  ┌──────┐                           │
│  │📝    │  │📸    │                           │
│  │Post  │  │Photo │                           │
│  └──────┘  └──────┘                           │
│  ┌──────┐  ┌──────┐                           │
│  │⚔️    │  │💬    │                           │
│  │Chall.│  │Chat  │                           │
│  └──────┘  └──────┘                           │
│                                                │
│ 📰 FEED SECTION (Scrollable)                  │
│  ┌─────────────────────────────┐             │
│  │ [Avatar] Name  ⏰ 2h ago     │             │
│  │ ─────────────────────────   │             │
│  │ Post content text...        │             │
│  │ ─────────────────────────   │             │
│  │ [Image/Video]               │             │
│  │ ─────────────────────────   │             │
│  │ ❤️ 234 | 💬 45 | ↗️ 12     │             │
│  └─────────────────────────────┘             │
│                                                │
│  ┌─────────────────────────────┐             │
│  │ [Avatar] Name  ⏰ 4h ago     │             │
│  │ ─────────────────────────   │             │
│  │ Another post content...     │             │
│  │ ─────────────────────────   │             │
│  │ ❤️ 156 | 💬 28 | ↗️ 9      │             │
│  └─────────────────────────────┘             │
│                                                │
└────────────────────────────────────────────────┘
```

### Components

| Element | Size | Type | Data Source |
|---------|------|------|-------------|
| Stories Bar | Flex, scroll-x | Carousel | Firebase users |
| Quick Actions | 4-column grid | Button Grid | Static/Hardcoded |
| Post Card | 100% width | Card | posts collection |
| Avatar | 40px | Image | User profile |
| Post Content | Dynamic | Text | Post doc |
| Post Image | Max 400px height | Image | Cloudinary |
| Like Count | Dynamic | Text | Post.likes |

---

## ⚔️ SCREEN 2: CHALLENGES

### Visual Structure

```
┌────────────────────────────────────────────────┐
│ Header: Logo + Search + Icons                  │
├────────────────────────────────────────────────┤
│                                                │
│ 📊 SCREEN HEADER                              │
│ "Wyzwania"                                     │
│                                                │
│ 🔘 FILTER BUTTONS (Horizontal)                │
│ [Wszystkie ✓] [Trending] [Nowe] [Łatwe]      │
│                                                │
│ 🎮 CHALLENGES GRID (Responsive)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   ⚔️     │  │   🎯     │  │   🏆    │    │
│  │          │  │          │  │         │    │
│  │"100      │  │"Quiz     │  │"Running │    │
│  │Push-ups" │  │Master"   │  │Race"    │    │
│  │          │  │          │  │         │    │
│  │Easy      │  │Medium    │  │Hard     │    │
│  │+50 XP    │  │+100 XP   │  │+200 XP  │    │
│  │145 users │  │234 users │  │89 users │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│                                                │
│  ┌──────────┐  ┌──────────┐                   │
│  │   💪     │  │   🧠    │                    │
│  │...       │  │...      │                    │
│  └──────────┘  └──────────┘                   │
│                                                │
└────────────────────────────────────────────────┘
```

### Challenge Card Detail

```
Card Structure:
┌─────────────────┐
│    [Emoji]      │  (emoji or bg-image)
│                 │
│   "Title"       │  (challenge name)
│                 │
│  [Badge] ⏫    │  (difficulty + status)
│   Hard          │
│                 │
│ +150 XP  👥432 │  (reward + participants)
└─────────────────┘

Click → Opens challenge details/join modal
```

### Components

| Element | Size | Type | Data Source |
|---------|------|------|-------------|
| Filter Buttons | Flex, scroll-x | Button Group | Static |
| Challenge Card | 160px min | Card Grid | challenges collection |
| Card Image | 1:1 aspect | Emoji/Image | challenge.emoji |
| Card Title | 2 lines max | Text | challenge.title |
| Difficulty Badge | Small | Chip | challenge.difficulty |
| XP Reward | Dynamic | Text | challenge.reward |
| Participant Count | Dynamic | Text | challenge.participants |

---

## ➕ SCREEN 3: CREATE

### Visual Structure

```
┌────────────────────────────────────────────────┐
│ Header: Logo + Search + Icons                  │
├────────────────────────────────────────────────┤
│                                                │
│ 📝 SCREEN HEADER                              │
│ "Co chcesz zrobić?"                            │
│                                                │
│ 🎮 CREATE MENU (2x2 Grid)                     │
│  ┌──────────────┐  ┌──────────────┐           │
│  │      📝      │  │      📸      │           │
│  │              │  │              │           │
│  │ Napisz coś   │  │ Dodaj zdjęcie│           │
│  │              │  │              │           │
│  └──────────────┘  └──────────────┘           │
│                                                │
│  ┌──────────────┐  ┌──────────────┐           │
│  │      ⚔️      │  │      📅      │           │
│  │              │  │              │           │
│  │  Wyzwanie    │  │  Wydarzenie  │           │
│  │              │  │              │           │
│  └──────────────┘  └──────────────┘           │
│                                                │
└────────────────────────────────────────────────┘
```

### Create Card

```
On Click:
1. 📝 Post → Modal with text input + publish button
2. 📸 Photo → File picker + crop/resize + publish
3. ⚔️ Challenge → Form with title, desc, difficulty, reward
4. 📅 Event → Form with date, time, location, description
```

### Components

| Element | Size | Type | Action |
|---------|------|------|--------|
| Create Option | 2-column grid | Card Button | Click → Action |
| Icon | 32px | Emoji | Display only |
| Label | Dynamic | Text | Display only |

---

## 💬 SCREEN 4: MESSAGES

### Visual Structure

```
┌────────────────────────────────────────────────┐
│ Header: Logo + Search + Icons                  │
├────────────────────────────────────────────────┤
│                                                │
│ 💬 SCREEN HEADER                              │
│ "Wiadomości"                                   │
│                                                │
│ 📋 CONVERSATIONS LIST (Scrollable)            │
│  ┌──────────────────────────────────┐         │
│  │ [Avatar] Name                ⏰2h │         │
│  │ "Last message preview text..." │         │
│  └──────────────────────────────────┘         │
│                                                │
│  ┌──────────────────────────────────┐         │
│  │ [Avatar] Name 2           🟢 Now  │         │
│  │ "Another message preview..."   │         │
│  └──────────────────────────────────┘         │
│                                                │
│  ┌──────────────────────────────────┐         │
│  │ [Avatar] Name 3              ⏰5h │         │
│  │ "Older message..."            │         │
│  └──────────────────────────────────┘         │
│                                                │
│  ┌──────────────────────────────────┐         │
│  │ [Avatar] Name 4             ⏰1d  │         │
│  │ "Message from yesterday..."   │         │
│  └──────────────────────────────────┘         │
│                                                │
└────────────────────────────────────────────────┘
```

### Conversation Item

```
┌─────────────────────────────────────────┐
│ [48px Avatar]  Name                 ⏰  │
│                "Last message..."    Time │
└─────────────────────────────────────────┘

On Click → Opens chat view (in-app chat modal or detail screen)
```

### Components

| Element | Size | Type | Data Source |
|---------|------|------|-------------|
| Conversation Item | 100% width | List Item | conversations |
| Avatar | 48px | Image | User profile |
| Name | Dynamic | Text | User displayName |
| Message Preview | 2 lines | Text | Last message |
| Timestamp | Dynamic | Text | Last message time |
| Online Indicator | 8px | Badge | User status |

---

## 👤 SCREEN 5: PROFILE

### Visual Structure

```
┌────────────────────────────────────────────────┐
│ Header: Logo + Search + Icons                  │
├────────────────────────────────────────────────┤
│                                                │
│ 📊 PROFILE HEADER                             │
│  ┌────────────────────────────────┐           │
│  │ [Gradient Banner]               │           │
│  │         [Avatar 80px overlap]   │           │
│  └────────────────────────────────┘           │
│                                                │
│ 👤 PROFILE INFO                               │
│ "Michał Kulig"              (name)            │
│ "🥈 Warrior"                (rank)            │
│                                                │
│ 📈 STATS GRID (3 columns)                     │
│  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ 5250   │  │  10    │  │  15    │          │
│  │ XP     │  │ Level  │  │ Streak │          │
│  └────────┘  └────────┘  └────────┘          │
│                                                │
│ 🎯 ACTIONS                                    │
│ [Edytuj Profil] [Wyloguj]                    │
│                                                │
│ 📑 TABS (Horizontal)                          │
│ [Posty] [Wyzwania] [Osiągnięcia] [Znajomi]  │
│                                                │
│ 📋 TAB CONTENT (Dynamic)                      │
│  ┌──────────────────────────┐                │
│  │ Content based on tab...   │                │
│  │                           │                │
│  │ (Posts / Challenges /     │                │
│  │  Achievements / Friends)  │                │
│  └──────────────────────────┘                │
│                                                │
└────────────────────────────────────────────────┘
```

### Profile Sections

```
1. HEADER
   ├─ Banner (gradient, 120px height)
   ├─ Avatar (80px, overlap = -40px)
   └─ Background: --color-dark-1

2. INFO
   ├─ Name (h2 size, 24px)
   ├─ Rank (color-gold, body size)
   └─ Padding: space-lg

3. STATS
   ├─ XP (number, gold color)
   ├─ Level (number, gold color)
   └─ Streak (number, gold color)
   └─ Layout: 3-column grid

4. ACTIONS
   ├─ Edit Profile (btn-secondary, 100% width)
   └─ Logout (btn-ghost, 100% width)
   └─ Margin-bottom: space-lg

5. TABS
   ├─ Flex, horizontal scroll
   ├─ Border-bottom: 1px
   ├─ Active underline: color-gold (3px)
   └─ Click → switchProfileTab(tab, name)

6. TAB CONTENT
   ├─ Posts (post cards grid)
   ├─ Challenges (challenge cards grid)
   ├─ Achievements (badges/items)
   └─ Friends (user list)
```

### Components

| Element | Size | Type | Data Source |
|---------|------|------|-------------|
| Banner | 100% x 120px | Gradient | Static |
| Avatar | 80px | Image | User profile |
| Name | Dynamic | Text | user.displayName |
| Rank | Dynamic | Badge | getRank(xp) |
| XP | Dynamic | Number | user.points |
| Level | Dynamic | Number | getLevel(xp) |
| Streak | Dynamic | Number | user.streakDays |
| Tabs | Dynamic | Tab Group | Static list |
| Tab Content | Dynamic | Variable | Selected tab |

---

## 📐 Design System CSS Classes

### Buttons
```html
<!-- Primary (Gold) -->
<button class="btn btn-primary">Action</button>

<!-- Secondary (Outlined) -->
<button class="btn btn-secondary">Action</button>

<!-- Ghost (Transparent) -->
<button class="btn btn-ghost">Action</button>

<!-- Small variant -->
<button class="btn btn-small btn-primary">Compact</button>

<!-- Icon button -->
<button class="btn-icon">🔔</button>
```

### Cards
```html
<div class="card">
  <div class="card-header">
    <div class="card-avatar">👤</div>
    <div class="card-meta">
      <div class="card-username">Username</div>
      <div class="card-timestamp">2h ago</div>
    </div>
  </div>
  <div class="card-content">Content</div>
  <img class="card-image" src="..." />
  <div class="card-footer">Interactions</div>
</div>
```

### Navigation
```html
<nav class="navbar">
  <a class="nav-item active" href="#">
    <svg>...</svg>
    <span>Label</span>
  </a>
</nav>
```

---

## 🎯 Interactions & Animations

| Action | Animation | Duration |
|--------|-----------|----------|
| Screen switch | Fade | 200ms |
| Button press | Scale 0.98 | 150ms |
| Hover (desktop) | Color change | 200ms |
| Scroll | Smooth | - |
| Post load | Slide up | 300ms |

---

## 📊 Sizing Reference

```
Header:     56px
Navbar:     60px
Avatar:     40px (cards), 80px (profile)
Button:     44px (standard), 32px (small)
Icon:       24px
Card:       100% width, padding 16px
Spacing:    4px, 8px, 12px, 16px, 24px, 32px
Radius:     4px (xs), 8px (sm), 12px (md), 16px (lg)
```

---

## ✅ Production Checklist

- [x] All 5 screens designed
- [x] CSS design tokens defined
- [x] Components documented
- [x] Responsive layouts planned
- [x] Touch interactions specified
- [x] Animation timings set
- [x] Accessibility considered
- [x] File structure organized

---

**Version:** 2.0.0  
**Status:** Production Ready  
**Last Updated:** June 16, 2026

All screens are implemented in `index.html` with corresponding CSS in `css/design-system.css`.
