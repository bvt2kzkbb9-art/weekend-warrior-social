# Layout Restructuring Guide

## New Layout System (FINAL)

### Architecture
```
┌─────────────────────────────┐
│  FIXED TOP HEADER           │ (position: fixed, top: 0, z-index: 1000)
│  - Logo + Name              │ 62px height
│  - Notifications, Messages, Profile
├─────────────────────────────┤
│                             │
│  SCROLLABLE CONTENT AREA    │ (flex: 1, overflow-y: auto)
│  - Main page content        │ Padding-top: 62px + safe-area
│  - Cards, forms, lists      │ Padding-bottom: 80px + safe-area
│  - Never overlaps bars      │
│                             │
├─────────────────────────────┤
│  FIXED BOTTOM NAVIGATION    │ (position: fixed, bottom: 0, z-index: 999)
│  5 TABS:                    │ 80px height
│  Arena • Kroniki • Misje    │
│  Chwała • Bohater           │
└─────────────────────────────┘
```

## HTML Template

Every page should follow this structure:

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#050506" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

<div class="bg-orbs" aria-hidden="true"></div>

<div class="app-layout">

  <!-- FIXED TOP HEADER -->
  <header class="app-header" role="banner">
    <div class="app-header-left">
      <span class="app-header-logo">⚔ WWS</span>
    </div>
    <div class="app-header-right">
      <button class="header-icon-btn" id="notifications-btn"><!-- icon --></button>
      <button class="header-icon-btn" id="messages-btn"><!-- icon --></button>
      <button class="header-icon-btn" id="profile-btn"><!-- icon --></button>
    </div>
  </header>

  <!-- SCROLLABLE CONTENT -->
  <main class="app-content" role="main">
    <div class="content-area page">
      <!-- PAGE-SPECIFIC CONTENT HERE -->
    </div>
  </main>

  <!-- FIXED BOTTOM NAVIGATION -->
  <nav class="app-nav" role="navigation" aria-label="Główna nawigacja">
    <a href="index.html" class="nav-item active">
      <svg><!-- icon --></svg>
      <span>Arena</span>
    </a>
    <a href="feed.html" class="nav-item">
      <svg><!-- icon --></svg>
      <span>Kroniki</span>
    </a>
    <a href="challenges.html" class="nav-item">
      <svg><!-- icon --></svg>
      <span>Misje</span>
    </a>
    <a href="ranking.html" class="nav-item">
      <svg><!-- icon --></svg>
      <span>Chwała</span>
    </a>
    <a href="profile.html" class="nav-item">
      <svg><!-- icon --></svg>
      <span>Bohater</span>
    </a>
  </nav>

</div>

<script type="module">
  // Page-specific scripts
</script>

</body>
</html>
```

## CSS Key Classes

### Layout Classes
- `.app-layout` - Main wrapper (flex column, height: 100vh)
- `.app-header` - Fixed top header (position: fixed, top: 0, z-index: 1000)
- `.app-content` - Scrollable content area (flex: 1, overflow-y: auto)
- `.app-nav` - Fixed bottom navigation (position: fixed, bottom: 0, z-index: 999)

### Header Classes
- `.app-header-left` - Logo section
- `.app-header-right` - Icon buttons (notifications, messages, profile)
- `.header-icon-btn` - Icon button styling

### Content Classes
- `.content-area` - Content wrapper (max-width: 680px, padding with safe-area)
- `.page` - Page content container

### Padding Values
- **Top padding**: `calc(62px + env(safe-area-inset-top) + 1rem)`
- **Bottom padding**: `calc(80px + env(safe-area-inset-bottom) + 1rem)`
- **Safe area**: Automatically handled by `env(safe-area-inset-*)`

## Safe Area (iOS) Support

```css
/* Top header with safe area */
.app-header {
  padding: calc(0.75rem + env(safe-area-inset-top)) 1rem 0.75rem;
}

/* Bottom nav with safe area */
.app-nav {
  padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom));
}

/* Content padding with safe area */
.app-content {
  padding-top: calc(62px + env(safe-area-inset-top) + 1rem);
  padding-bottom: calc(80px + env(safe-area-inset-bottom) + 1rem);
}
```

## Pages to Update

1. **index.html** ✅ DONE
   - Arena/Dashboard page
   - Profile hero + stats

2. **feed.html** - Kroniki (Chronicles/Feed)
   - Post list
   - Compose box

3. **challenges.html** - Misje (Quests/Missions)
   - Challenge list
   - Filters

4. **ranking.html** - Chwała (Glory/Ranking)
   - Podium (top 3)
   - Ranking list

5. **profile.html** - Bohater (Hero/Profile)
   - User profile
   - Stats
   - Settings

6. **messages.html** - Wiadomości (Messages)
   - Conversation list
   - Chat view
   - (Tab not in bottom nav, linked from header)

7. **quizzes.html** - Quizy (Quizzes)
   - Quiz menu
   - Quiz screen
   - Results
   - (Accessible from Arena)

8. **achievements.html** - Osiągnięcia (Achievements)
   - Achievement cards
   - Categories
   - (Accessible from Profile)

9. **notifications.html** - Powiadomienia (Notifications)
   - Notification list
   - Filters
   - (Accessible from header)

## Implementation Checklist

- [x] CSS layout system (.app-layout, .app-header, .app-content, .app-nav)
- [x] Safe area support (env(safe-area-inset-*))
- [x] Header styling (fixed, z-index, safe-area)
- [x] Bottom nav styling (fixed, z-index, safe-area)
- [x] Content padding (top + bottom, safe-area)
- [x] index.html - Complete restructure
- [ ] feed.html - Restructure (Copy index template, adjust content)
- [ ] challenges.html - Restructure
- [ ] ranking.html - Restructure
- [ ] profile.html - Restructure
- [ ] messages.html - Restructure (add as secondary nav link)
- [ ] quizzes.html - Restructure (accessible from content)
- [ ] achievements.html - Restructure (accessible from content)
- [ ] login.html - Update (if auth page needs same header)
- [ ] register.html - Update (if auth page needs same header)

## Responsive Breakpoints

### Mobile (< 768px)
- Header: Full width
- Content: Full width with padding
- Nav: Bottom fixed (5 tabs vertical)
- Safe area: Active

### Tablet/Desktop (≥ 768px)
- Header: Full width
- Content: Max 680px centered
- Nav: Bottom fixed (same layout)
- Safe area: Minimal impact

## Testing Requirements

Each page after restructuring:

✓ Header is fixed at top
✓ Header visible while scrolling
✓ Content scrolls freely
✓ No content hidden by header
✓ Bottom nav fixed at bottom
✓ Bottom nav visible while scrolling
✓ No content hidden by bottom nav
✓ No horizontal scrolling
✓ iPhone notch safe (safe-area working)
✓ Home indicator safe (safe-area working)
✓ Padding correct (no overlapping)

## Performance Notes

- Scroll performance: Smooth (no repaints)
- Z-index hierarchy: Header (1000), Nav (999)
- Fixed positioning: Minimal layout thrashing
- Content scrolling only: Efficient rendering
- Safe area: CSS-native, no JS needed

---

**Version:** 1.0  
**Status:** In Progress (index.html done, others pending)  
**Estimated Completion:** When all 9 pages updated
