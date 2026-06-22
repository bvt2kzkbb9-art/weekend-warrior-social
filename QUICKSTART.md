# 🚀 Quick Start Guide - Weekend Warrior Social

## Prerequisites
- Node.js 16+ installed
- npm or yarn
- Cloudinary account (for media uploads)

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure Cloudinary:**
   - Copy `.env.example` → `.env.local`
   - Get credentials from [Cloudinary Console](https://cloudinary.com/console)
   - Fill in `VITE_CLOUDINARY_*` variables in `.env.local`

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5500`

## Firebase & Cloudinary Integration

The project includes:
- **ConnectionManager** - Manages Firebase & Cloudinary connections
- **CloudinaryStorageService** - Handles all media uploads
- **Health checks** - Automatic connection verification

### Connection Status

Check console logs during app startup:
```
✓ Firebase Auth connected
✓ Firebase Firestore connected
✓ Firebase Realtime Database connected
✓ Cloudinary connected
```

### Using Services

```javascript
// Import services
import { connectionManager, cloudinaryService } from './services/index.js';

// Upload image
const asset = await cloudinaryService.uploadAvatar(file, userId);

// Get connection status
const status = connectionManager.getStatus();
```

## File Structure

```
src/
├── config/          # Configuration files
├── lib/             # Utilities (Firebase init, validators)
├── services/        # Core services (Auth, Firestore, Cloudinary)
├── models/          # Data models
├── pages/           # Page-specific initialization
└── styles/          # Global styles
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

## Troubleshooting

### Cloudinary not configured
- Check `.env.local` has correct values
- Ensure upload preset is set to "unsigned"

### Firebase connection issues
- Firebase config is built-in (src/lib/firebase.js)
- For custom Firebase, set `VITE_FIREBASE_*` in `.env.local`

### Validation errors
```javascript
import { envValidator } from './lib/envValidator.js';
envValidator.logReport(); // Shows configuration issues
```

## Documentation

- [Firebase & Cloudinary Setup](./FIREBASE_CLOUDINARY_SETUP.md) - Detailed configuration guide
- [Architecture](./ARCHITECTURE.md) - Project structure and design decisions

## Support

For more details, see `FIREBASE_CLOUDINARY_SETUP.md` which includes:
- Complete configuration steps
- Usage examples
- Diagnostics tools
- Troubleshooting guide
