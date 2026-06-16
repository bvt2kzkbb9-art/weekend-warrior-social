# Visual Verification Guide - Screenshot Capture Instructions

**Environment Limitation**: This remote environment cannot render browsers due to network restrictions.  
**Solution**: Use the provided Node.js script to capture screenshots on any machine with Chrome/Firefox.

## Quick Start

### Option 1: Use Provided Node Script (Recommended)

```bash
# 1. Ensure you're in the project root
cd /home/user/weekend-warrior-social

# 2. Install dependencies
npm install puppeteer

# 3. Start local server
python3 -m http.server 8000 &

# 4. Run screenshot generator
node screenshot-generator.js

# 5. Screenshots will be saved to ./screenshots/
```

### Option 2: Manual Testing in Browser

Open each URL on mobile view (390x844px):
- http://localhost:8000/index.html (Arena)
- http://localhost:8000/feed.html (Kroniki)
- http://localhost:8000/challenges.html (Misje)
- http://localhost:8000/ranking.html (Chwała)
- http://localhost:8000/profile.html (Bohater)
- http://localhost:8000/messages.html (Wiadomości)
- http://localhost:8000/quizzes.html (Quizy)
- http://localhost:8000/achievements.html (Osiągnięcia)

## Visual Verification Checklist

### All Pages (8/8)

#### Layout Structure
- [ ] **Fixed Header (56px)** at top with:
  - ⚔ WWS logo in gold (#D4AF37)
  - 3 icon buttons (notifications, messages, profile)
  - Dark background (#0A0A0B or #050506)
  
- [ ] **Scrollable Content Area** between header and nav:
  - Proper padding from header (don't overlap)
  - Dark background
  - Content visible
  
- [ ] **Fixed Bottom Navigation (60px)** with:
  - 5 tabs: Arena, Kroniki, Misje, Chwała, Bohater
  - Active tab highlighted in gold
  - Proper padding for safe-area-inset (iOS)

#### Colors
- [ ] Dark backgrounds: #0A0A0B (primary), #12121A (cards), #1A1A23 (elevated)
- [ ] Text: #FFFFFF (primary), #B0B0B8 (secondary), #6B6B73 (muted)
- [ ] Gold accents: #D4AF37 (primary), #E8D89C (bright)
- [ ] No bright/light backgrounds anywhere
- [ ] Sufficient contrast (WCAG AA)

---

## Page-Specific Checks

### 1. Arena (index.html)

**Visual Requirements:**
- [ ] Large centered ⚔ sword emoji
- [ ] "WEEKEND WARRIOR" heading in center
- [ ] "Social Arena" subtitle below
- [ ] 3-column stats grid below text:
  - XP (gold)
  - Level (blue)
  - Streak (green)
- [ ] 4-column action grid below stats:
  - 📝 Post
  - 📸 Photo
  - ⚔ Challenge
  - 💬 Chat
- [ ] Cards have subtle borders, no bright backgrounds
- [ ] Proper spacing (no elements overlapping header/nav)

**Expected Appearance:**
- Dark background filling entire screen
- Gold accents on interactive elements
- Clean, organized layout
- Skeletons appear briefly then fade to actual content

---

### 2. Kroniki (feed.html)

**Visual Requirements:**
- [ ] "📰 Kroniki" title at top
- [ ] Compose card with:
  - User avatar placeholder
  - "Co słychać na arenie, wojowniku? ⚔️" placeholder text
  - Image upload button
  - Publish button (gold)
- [ ] Feed posts displayed as cards:
  - Avatar + username + timestamp at top
  - Post content text
  - Optional post image
  - Like/comment/share buttons at bottom
- [ ] Dark cards with subtle borders
- [ ] Smooth scrolling

**Expected Appearance:**
- Social media feed layout
- Clean card-based design
- Gold accent buttons
- Light text on dark background

---

### 3. Misje (challenges.html)

**Visual Requirements:**
- [ ] "⚔ Misje" title/header
- [ ] Filter/tab buttons (optional):
  - All, Trending, New, Easy
- [ ] Challenge grid layout:
  - 2x2 or responsive grid
  - Each challenge is a card with:
    - Emoji/icon
    - Challenge name
    - Difficulty badge
    - XP reward
- [ ] Cards have hover states
- [ ] Proper spacing

**Expected Appearance:**
- RPG-themed challenge cards
- Dark background
- Gold accents on interactive elements
- Grid layout adapts to content

---

### 4. Chwała (ranking.html)

**Visual Requirements:**
- [ ] "🏆 Chwała" title
- [ ] Filter tabs (optional):
  - Wszechczasy, Ten miesiąc, Ten tydzień
- [ ] Podium section (if applicable):
  - 2nd place (left), 1st place (center), 3rd place (right)
  - Different heights representing ranking
  - Warrior names/avatars
- [ ] Rankings table:
  - Column headers: #, Warrior, Points, Level
  - Rows with warrior data
  - Proper alignment
- [ ] Cards with borders

**Expected Appearance:**
- Leaderboard layout
- Podium visual hierarchy
- Dark cards with gold accents
- Readable ranking table

---

### 5. Bohater (profile.html)

**Visual Requirements:**
- [ ] Profile header section with:
  - Avatar/profile picture
  - Username
  - Level and XP info
- [ ] Stats cards (3 columns):
  - Total XP
  - Level
  - Streak
- [ ] Tab navigation (optional):
  - Posts, Challenges, Achievements, Friends
- [ ] Action buttons:
  - Edit Profile
  - Logout
- [ ] Dark cards

**Expected Appearance:**
- User profile layout
- Clear stats display
- Organized information hierarchy
- Gold accents on buttons

---

### 6. Wiadomości (messages.html)

**Visual Requirements:**
- [ ] "💬 Wiadomości" title
- [ ] Search bar for warriors
- [ ] Conversation list with:
  - Avatar
  - Username
  - Last message preview (truncated)
  - Timestamp
  - Optional unread badge
- [ ] New conversation button (+)
- [ ] Messages/chat view (if conversation opened):
  - Chat header with warrior name
  - Message bubbles
  - Message input at bottom
  - Send button

**Expected Appearance:**
- Messenger-like interface
- Dark message bubbles
- Gold accent buttons
- Clean conversation list

---

### 7. Quizy (quizzes.html)

**Visual Requirements:**
- [ ] "🧠 Quizy" title
- [ ] Quiz grid or list:
  - Each quiz as a card with:
    - Quiz title
    - Description
    - Difficulty level
    - XP reward
    - Start button
- [ ] Quiz content (if started):
  - Question display
  - Answer options
  - Progress indicator
  - Submit button

**Expected Appearance:**
- Quiz list layout
- Dark cards
- Gold accent buttons
- Clear question/answer display

---

### 8. Osiągnięcia (achievements.html)

**Visual Requirements:**
- [ ] "🏆 Osiągnięcia" title
- [ ] Achievement count:
  - "X / Y Odblokowanych osiągnięć"
  - Progress bar
  - Percentage
- [ ] Achievements grid (2-3 columns):
  - Each achievement as a card with:
    - Badge/icon/emoji
    - Achievement name
    - Description (optional)
    - Unlock status (locked/unlocked)
  - Locked achievements appear dimmed
- [ ] Achievement categories (optional)

**Expected Appearance:**
- Achievement showcase
- Dark cards
- Gold accents for unlocked items
- Dimmed styling for locked items
- Clear progress indication

---

## Responsive Design Check (390x844px)

- [ ] No horizontal scrolling
- [ ] All text readable
- [ ] Touch targets ≥ 44px
- [ ] Header stays at top
- [ ] Nav stays at bottom
- [ ] Content centered and padded properly
- [ ] Images scale appropriately
- [ ] Cards don't overflow

---

## CSS/Color Verification

Run this in browser console to verify colors:

```javascript
const computed = getComputedStyle(document.body);
console.log('Background:', computed.backgroundColor);
console.log('Text Color:', computed.color);

// Check gold accents
const buttons = document.querySelectorAll('.btn-primary');
buttons.forEach(btn => {
  const style = getComputedStyle(btn);
  console.log('Button BG:', style.backgroundColor);
  console.log('Button Text:', style.color);
});
```

Expected values:
- Body BG: rgb(10, 10, 11) or similar dark
- Body text: rgb(255, 255, 255) or similar light
- Gold buttons: rgb(212, 175, 55)

---

## Final Audit

Once you've visually verified all 8 pages:

1. **Screenshot each page** at 390x844px
2. **Compare with reference designs** provided
3. **List any differences**:
   - Color mismatches
   - Layout/spacing issues
   - Missing elements
   - Typography issues
   - Component styling

4. **Report findings** with specific issues

---

## Troubleshooting

### Pages appear blank
- Check browser console for JavaScript errors
- Verify server is running: `python3 -m http.server 8000`
- Clear browser cache

### Dark colors not showing
- Check CSS is loaded: Right-click → Inspect → Network → look for design-system.css
- Verify CSS file exists: `ls css/design-system.css`
- Check browser supports CSS variables

### Nav overlapping content
- This indicates CSS not loaded properly
- Padding should account for fixed nav height (60px)
- Check console for CSS errors

### Gold accents not visible
- Verify --gold variable is #D4AF37
- Check element has `color: var(--gold)`
- Inspect element to see computed style

---

**Status**: Ready for visual verification  
**Format**: 390x844px mobile screenshots  
**Reference**: Compare with provided design mockups
