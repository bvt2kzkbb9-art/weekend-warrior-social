# ⚡ Weekend Warrior Social v2.0 — Quick Reference Card

## 🎨 Colors at a Glance

| Semantic | Variable | Value | Usage |
|----------|----------|-------|-------|
| **Background** | `--color-dark-0` | `#0A0A0B` | Page background |
| **Surfaces** | `--color-dark-1` | `#12121A` | Cards, navbar |
| **Elevated** | `--color-dark-2` | `#1A1A23` | Hover states |
| **Primary** | `--color-gold` | `#D4AF37` | Buttons, active states |
| **Muted** | `--color-gold-dim` | `#8B7C3A` | Borders, disabled |
| **Text** | `--color-text-primary` | `#FFFFFF` | Main text |
| **Text** | `--color-text-secondary` | `#B0B0B8` | Labels, hints |
| **Success** | `--color-success` | `#4CAF50` | Success messages |
| **Error** | `--color-error` | `#FF6B6B` | Errors, alerts |
| **Warning** | `--color-warning` | `#FFC107` | Warnings |
| **Info** | `--color-info` | `#2196F3` | Information |

## 📐 Spacing Shortcuts

```css
.example {
  padding: var(--space-lg);         /* 16px */
  margin-bottom: var(--space-xl);   /* 24px */
  gap: var(--space-md);             /* 12px */
}
```

| Variable | Size | When to Use |
|----------|------|------------|
| `--space-xs` | 4px | Minimal gaps |
| `--space-sm` | 8px | Component margins |
| `--space-md` | 12px | Internal padding |
| `--space-lg` | 16px | **Default padding** |
| `--space-xl` | 24px | Section spacing |
| `--space-2xl` | 32px | Large sections |

## 🔤 Typography Shortcuts

```css
.example {
  font: var(--text-h2);         /* 24px / 1.25 */
  font-size: var(--text-body);  /* 16px / 1.5 */
}
```

| Variable | Size / Line Height | Usage |
|----------|------------------|-------|
| `--text-h1` | 28px / 1.2 | Page titles |
| `--text-h2` | 24px / 1.25 | Section headers |
| `--text-h3` | 20px / 1.3 | Subsections |
| `--text-body` | 16px / 1.5 | **Main text** |
| `--text-small` | 14px / 1.4 | Secondary text |
| `--text-tiny` | 12px / 1.3 | Labels, badges |

## 🎯 Sizing Constants

```css
.example {
  width: var(--button-height);   /* 44px */
  border-radius: var(--radius-md);  /* 12px */
}
```

| Variable | Size | Purpose |
|----------|------|---------|
| `--icon-size` | 24px | Icons |
| `--button-height` | 44px | Touch buttons |
| `--header-height` | 56px | Top header |
| `--navbar-height` | 60px | Bottom nav |

## 🔲 Border Radius

```css
.example {
  border-radius: var(--radius-full);  /* 9999px = circle */
}
```

| Variable | Size | Shape |
|----------|------|-------|
| `--radius-xs` | 4px | Subtle |
| `--radius-sm` | 8px | Small |
| `--radius-md` | 12px | **Default** |
| `--radius-lg` | 16px | Large |
| `--radius-full` | 9999px | Circle/pill |

## ✨ Animations

```css
.example {
  transition: all var(--transition-normal);  /* 200ms */
}
```

| Variable | Speed | Use When |
|----------|-------|----------|
| `--transition-fast` | 150ms | Hover states |
| `--transition-normal` | 200ms | **Default** |
| `--transition-slow` | 300ms | Modals, complex |

## 🔘 Button Classes

```html
<!-- Primary (Gold) - for main actions -->
<button class="btn btn-primary">Save</button>

<!-- Secondary (Outlined) - for secondary actions -->
<button class="btn btn-secondary">Cancel</button>

<!-- Ghost (Transparent) - for tertiary actions -->
<button class="btn btn-ghost">Dismiss</button>

<!-- Small variant - for compact spaces -->
<button class="btn btn-small btn-primary">OK</button>

<!-- Icon button - for icons only -->
<button class="btn-icon">🔔</button>
```

## 🎨 Component Classes

```html
<!-- Card with header and content -->
<div class="card">
  <div class="card-header">
    <div class="card-avatar">👤</div>
    <div class="card-meta">
      <div class="card-username">Name</div>
      <div class="card-timestamp">2h ago</div>
    </div>
  </div>
  <div class="card-content">Content here</div>
  <img class="card-image" src="image.jpg" />
  <div class="card-footer">Interactions</div>
</div>

<!-- Form group -->
<div class="form-group">
  <label class="form-label">Label</label>
  <input class="form-input" type="text" />
</div>

<!-- Navigation item -->
<a class="nav-item active">
  <svg><!-- Icon --></svg>
  <span>Label</span>
</a>

<!-- Badge -->
<div class="nav-badge">3</div>
```

## 🖼️ Shadow System

```css
.example {
  box-shadow: var(--shadow-md);
}
```

| Variable | Value |
|----------|-------|
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.2)` |
| `--shadow-md` | `0 4px 8px rgba(0,0,0,0.25)` |
| `--shadow-lg` | `0 8px 16px rgba(0,0,0,0.3)` |

## 📱 Screen Navigation

```javascript
// Switch screens
window.showScreen('screen-home');
window.showScreen('screen-challenges');
window.showScreen('screen-create');
window.showScreen('screen-messages');
window.showScreen('screen-profile');
```

## 🚀 Quick Snippets

### Flex Layout
```css
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
}
```

### Grid Layout
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-lg);
}
```

### Scrollable Horizontal
```css
.horizontal-scroll {
  display: flex;
  gap: var(--space-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Full-Width Button
```html
<button class="btn btn-primary" style="width: 100%;">Button</button>
```

### Empty State
```html
<div class="empty-state">
  <div class="empty-icon">📋</div>
  <p>No items found</p>
</div>
```

## ✅ Best Practices

1. **Always use CSS variables** - Never hardcode colors/spacing
2. **Follow spacing scale** - Use `--space-*` not arbitrary values
3. **Use semantic classes** - `.card`, `.btn-primary`, not custom names
4. **Maintain 44px min touch target** - Buttons, links should be at least 44x44px
5. **Test on mobile first** - Design mobile view, then adapt for tablet/desktop
6. **Use transitions** - Always add `transition: all var(--transition-normal)` to interactive elements
7. **Dark theme compliant** - Everything should be readable on dark background
8. **Responsive units** - Use relative units (%), not fixed pixels

## 📚 File Structure

```
weekend-warrior-social/
├── index-new.html              ← Main app (edit this)
├── css/
│   ├── design-system.css       ← Tokens (edit for redesign)
│   └── style.css               ← Legacy (deprecated)
├── js/
│   ├── firebase.js             ← Config (update Cloudinary)
│   ├── feed.js                 ← Feed logic
│   ├── challenge-system.js     ← Challenges logic
│   ├── messenger.js            ← Messages logic
│   └── ... other modules
├── login.html                  ← Auth page
├── register.html               ← Auth page
└── sw.js                        ← Service Worker
```

## 🔄 Common Tasks

### Add New Color Token
Edit `css/design-system.css` `:root` section:
```css
--my-color: #XXXXXX;
```

### Add New Spacing Option
Edit `css/design-system.css` `:root` section:
```css
--space-xl-half: 20px;  /* Custom spacing */
```

### Create New Component Class
Add to `css/design-system.css` after utilities:
```css
.my-component {
  background: var(--color-dark-1);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
}
```

### Change Default Font
Edit `css/design-system.css` `:root` section:
```css
--font-family-sans: 'Your Font Name', sans-serif;
```

### Add Dark Mode Toggle (Future)
```javascript
// Would need to override CSS variables
document.documentElement.style.setProperty('--color-dark-0', '#FFFFFF');
```

## 🎯 Mobile Testing Sizes

| Device | Width | Height | Ratio |
|--------|-------|--------|-------|
| iPhone SE | 375px | 667px | 16:9 |
| iPhone 12/13 | 390px | 844px | 19:9 |
| iPhone 14 Pro | 393px | 852px | 19:9 |
| Galaxy S21 | 360px | 800px | 18:9 |
| iPad | 768px | 1024px | 3:4 |

**Test all 5 screens at these widths!**

## 📊 Performance Targets

- Page load: **< 3 seconds**
- Screen switch: **< 500ms**
- Smooth scrolling: **60 fps**
- TTI (Time to Interactive): **< 2 seconds**

## 🔐 Security Checklist

- [ ] No hardcoded API keys visible in code
- [ ] Cloudinary credentials in `js/firebase.js` only
- [ ] Firebase Security Rules deployed
- [ ] No console.log() with sensitive data in production
- [ ] HTTPS enforced on all pages
- [ ] CORS configured properly

## 📈 Analytics Events to Track (Future)

```javascript
// Example structure
analytics.logEvent('screen_view', { screen_name: 'home' });
analytics.logEvent('button_click', { button_name: 'create_post' });
analytics.logEvent('post_created', { post_type: 'text' });
```

## 🚨 Error Handling Pattern

```javascript
try {
  // Action
} catch (err) {
  console.error('Context:', err);
  // Show user-friendly message
  alert('Something went wrong');
}
```

---

**Created**: 2026-06-16  
**Last Updated**: 2026-06-16  
**Version**: 2.0  

**For full documentation, see:**
- `DESIGN_SYSTEM_MIGRATION.md` - Design tokens and integration guide
- `LAUNCH_GUIDE.md` - Complete deployment walkthrough
- `TESTING_CHECKLIST.md` - Comprehensive testing procedures
