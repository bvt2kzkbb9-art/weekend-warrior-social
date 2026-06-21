# Weekend Warrior Social

A premium RPG-themed social platform for weekend warriors, featuring arena challenges, rankings, and community engagement.

## Features

- **Arena** (`index.html`) - Main hub with warrior statistics, active challenges, and rankings
- **Chronicles** (`feed.html`) - Social feed with posts from followed warriors and recent activity
- **Missions** (`challenges.html`) - Challenge board for accepting warrior trials
- **Hall of Fame** (`ranking.html`) - Global leaderboard of top warriors
- **Hero Profile** (`profile.html`) - Personal warrior profile with stats and history
- **Messages** (`messenger.html`) - Direct messaging with other warriors
- **Authentication** (`login.html`) - Secure login and registration

## Design System

The application uses a unified CSS design system with:
- Gold gradient theme (RPG aesthetic)
- Glass morphism components with semi-transparent backgrounds
- Responsive layout (mobile, tablet, desktop)
- Smooth animations and transitions
- Dark mode optimized (#06050A background)

### CSS Structure
- `css/design-system.css` - Core design tokens and variables
- `css/layout.css` - Layout and spacing
- `css/components.css` - Base component styles
- `css/premium-components.css` - Enhanced components
- `css/animations.css` - Animation definitions
- `css/style.css` - Global styles
- `css/arena.css` - Arena-specific styles
- `css/rpg-theme.css` - RPG visual effects
- `css/unified-system.css` - Shared unified components across all pages

## Development

### Local Development
```bash
npm install
npm run dev
```

This starts a local server at `http://localhost:5500`

### File Structure
```
├── *.html              # Page templates
├── css/                # Stylesheets
├── assets/             # Icons and images
│   ├── icons/         # SVG icons (35+)
│   └── buttons/       # PNG button assets
├── sw.js              # Service worker for offline support
├── manifest.json      # PWA manifest
└── firebase.json      # Firebase hosting configuration
```

## Progressive Web App (PWA)

The application includes PWA support with:
- Service worker for offline functionality
- Web app manifest for installability
- Responsive design for all screen sizes
- Cacheable assets for fast loading

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Offline support via Service Worker

## Accessibility

- Semantic HTML structure
- Proper language attributes (`lang="pl"`)
- Responsive navigation
- ARIA labels for interactive elements
- Keyboard-friendly navigation

## Performance

- Optimized CSS (210KB total)
- SVG icons for scalable graphics
- Efficient service worker caching
- Mobile-first responsive design

## Deployment

Deploy to Firebase:
```bash
firebase deploy
```

## Technologies

- HTML5
- CSS3 (with custom properties)
- Progressive Web Apps (PWA)
- Service Workers
- Firebase Hosting

## License

© 2024 Weekend Warrior Social. All rights reserved.
