# 🌙 Weekend Warrior Social — Darkness Edition
## Color Palette & Design System

---

## 🎨 Core Philosophy
**Pure Darkness with Purple Gleam & Gold Glow**

- Backgrounds: **#050404** (absolute black)
- Accent elements: **Purple** (#A855F7) glow
- Highlights: **Gold** (#D4AF37) for interactive/status elements
- No grain texture; clean void aesthetic

---

## 📋 Complete Color Definitions

### BACKGROUNDS (Pure Darkness)
```css
--bg-void:        #050404    /* Main background — absolute black */
--bg-deep:        #0A0809    /* Slightly elevated */
--bg-panel:       #0F0D15    /* Panel/card background with purple tint */
--bg-card:        #120E1A    /* Card elements */
--bg-card-hover:  #17131F    /* Card hover state */
--bg-input:       #0B0810    /* Input fields */
```

### GOLD PALETTE (Glow Effects Only)
```css
--gold-900:       #4a3a08    /* Darkest gold (scrollbar) */
--gold-700:       #7A5C10    /* Dark gold (handles, accents) */
--gold-500:       #D4AF37    /* Primary gold (text, glow) */
--gold-400:       #E5C84A    /* Bright gold (highlights) */
--gold-300:       #FFD700    /* Brightest gold (premium) */

--gold-glow:      rgba(212,175,55,.14)   /* Subtle glow */
--gold-glow-md:   rgba(212,175,55,.24)   /* Medium glow */
--gold-glow-lg:   rgba(212,175,55,.40)   /* Large glow */
```

### PURPLE SHINE (New — Gleam Effect)
```css
--purple-dark:    #2D1B4E    /* Deep purple accent */
--purple-glow:    rgba(168,85,247,.10)   /* Subtle purple glow */
--purple-glow-md: rgba(168,85,247,.18)   /* Medium purple glow */
--purple-glow-lg: rgba(168,85,247,.28)   /* Large purple glow */
```

### BORDERS (Ultra-Subtle)
```css
--border-dim:     rgba(180,140,220,.08)   /* Purple border, very dim */
--border-gold:    rgba(212,175,55,.22)    /* Gold border, subtle */
--border-active:  rgba(212,175,55,.50)    /* Active state, gold */
--border-panel:   rgba(180,140,220,.12)   /* Panel border, purple */

/* Aliases */
--border:         rgba(168,85,247,.05)    /* Default border */
--border-mid:     rgba(168,85,247,.08)    /* Medium border */
--border-strong:  rgba(168,85,247,.12)    /* Strong border */
```

### TEXT (Adjusted for Dark Background)
```css
--text-bright:    #E8E0D0    /* Brightest text */
--text-parchment: #D4C8B5    /* Body text */
--text-muted:     rgba(180,160,130,.45)   /* Muted text */
--text-faint:     rgba(180,160,130,.24)   /* Very faint */
--text-label:     rgba(212,175,55,.65)    /* Gold labels */

/* Aliases */
--text-primary:   #E8E0D0    /* Primary text */
--text-secondary: rgba(180,160,130,.65)   /* Secondary text */
```

### ACCENTS
```css
--fire:           #FF6B00    /* Fire orange (reduced opacity in glows) */
--fire-bright:    #FF9500    /* Bright fire */
--fire-glow:      rgba(255,107,0,.20)    /* Fire glow (reduced) */

--silver:         #B0B0B0    /* Podium silver */
--bronze:         #B87A3D    /* Podium bronze */
--blood:          #7A0000    /* Blood red (darkened) */

--magic:          #A855F7    /* Purple magic */
--magic-glow:     rgba(168,85,247,.20)   /* Purple glow */
```

### STATUS COLORS (Vibrant on Dark)
```css
--success:        #10D981    /* Success green */
--error:          #EF4444    /* Error red */
--warning:        #FBBF24    /* Warning amber */
```

### PODIUM COLORS
```css
--podium-1:       #FFD700    /* Gold (1st) */
--podium-2:       #A8A8A8    /* Silver (2nd) — darkened */
--podium-3:       #9A6F3D    /* Bronze (3rd) — darkened */
```

---

## 🌟 Design Changes Summary

### What Changed:
1. **Backgrounds**: Shifted from `#06050A` → `#050404` (90% darker)
2. **Card backgrounds**: `#110F14` → `#120E1A` (subtle purple tint added)
3. **Grain texture**: **REMOVED** — now pure void
4. **Torch flames**: Changed from orange fire to **purple/gold glow**
5. **Background orbs**: Updated to **purple radiance** instead of gold
6. **Particles**: 50% now emit **purple glow** instead of fire
7. **Borders**: Changed from white-based to **purple-based** (much subtler)
8. **Text**: Brightened slightly for contrast on darker backgrounds
9. **Icon (#icon-512.svg)**: Added purple border, gold glow effect, darker overall

### Visual Impact:
- ✅ **Deeper darkness** — premium void aesthetic
- ✅ **Purple gleam** — luxurious undertone
- ✅ **Gold accents only** — glow, text, highlights
- ✅ **Premium feel** — sophisticated, not colorful
- ✅ **Mobile optimized** — less visual noise on small screens

---

## 🔄 CSS Variable Migration

### If you override colors elsewhere:
Replace old values with new ones:

| Old | New | Reason |
|-----|-----|--------|
| `rgba(212,175,55,.18)` | `rgba(212,175,55,.14)` | Reduced gold opacity |
| `rgba(107,79,187,.04)` | `rgba(168,85,247,.10)` | Increased purple, deeper shade |
| `#FF6B00` in glows | `rgba(255,107,0,.20)` | Fire glow reduced 20% |
| `rgba(255,255,255,.07)` | `rgba(168,85,247,.05)` | White borders → purple |
| `#06050A` | `#050404` | Darker main background |

---

## 📱 Usage Examples

### Button with Gold Glow (unchanged pattern)
```css
.btn-primary {
  background: var(--bg-card);
  border: 1px solid var(--border-gold);
  color: var(--gold-400);
  box-shadow: 0 0 24px var(--gold-glow);
}
```

### Panel with Purple Border (new pattern)
```css
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-panel);
  box-shadow: 0 0 16px var(--purple-glow);
}
```

### Text on Dark Background
```css
.text-body {
  color: var(--text-parchment);  /* #D4C8B5 */
  text-shadow: none;  /* No shadows needed anymore */
}
```

---

## 🎭 Theme Files Modified

1. **css/style.css** — CSS variables, global reset, backgrounds
2. **css/rpg-theme.css** — Particles, fog layer, animations, overlays
3. **css/arena.css** — Hardcoded colors updated
4. **css/messenger.css** — Hardcoded colors updated
5. **icon-512.svg** — New darker icon with purple glow

---

## ✨ Next Steps

- Test all pages (login, feed, arena, ranking, profile, messenger)
- Verify text contrast on dark backgrounds
- Check button hover/active states
- Test on iOS (verify purple/gold glows render cleanly)
- Consider removing all `text-shadow` effects (they're redundant now)

---

**Created:** June 2026  
**Version:** Darkness Edition v1.0  
**Theme:** Pure Black + Purple Gleam + Gold Glow
