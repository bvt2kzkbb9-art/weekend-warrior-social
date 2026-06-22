# Firebase & Cloudinary Integration Guide

This guide explains how to set up and use Firebase and Cloudinary connections in the Weekend Warrior Social application.

## Overview

The application integrates with:
- **Firebase**: For authentication, Firestore database, and realtime database
- **Cloudinary**: For image and video hosting, optimization, and delivery

## Configuration

### Firebase Setup

Firebase is pre-configured for production use with hardcoded credentials in `src/lib/firebase.js`.

**Production Configuration:**
- Project ID: `weekend-warrior-social-c23ae`
- Database: Firestore + Realtime Database
- Region: europe-west1

To override Firebase configuration with environment variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Cloudinary Setup

Cloudinary requires configuration via environment variables.

1. **Get Cloudinary Credentials:**
   - Visit [Cloudinary Console](https://cloudinary.com/console)
   - Copy your Cloud Name and API Key

2. **Create an Upload Preset:**
   - Go to Settings → Upload
   - Create a new unsigned upload preset
   - Note the preset name

3. **Set Environment Variables in `.env.local`:**

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

## Project Structure

### Configuration Files
- `src/config/firebase.config.js` - Firestore collections and constraints
- `src/config/cloudinary.config.js` - Cloudinary settings, folders, and transformations

### Services
- `src/services/ConnectionManager.js` - Manages Firebase and Cloudinary connections
- `src/services/CloudinaryStorageService.js` - File uploads and optimization
- `src/services/FirestoreService.js` - Firestore operations
- `src/services/AuthService.js` - Authentication

### Utilities
- `src/lib/firebase.js` - Firebase initialization
- `src/lib/init.js` - Application initialization
- `src/lib/envValidator.js` - Environment variable validation
- `src/lib/integrationSetup.js` - Integration helpers and diagnostics

## Connection Management

### Initialize Connections

The application automatically initializes connections during startup via `src/lib/init.js`:

```javascript
import { initializeApp } from './lib/init.js';

// Call during app startup
await initializeApp();
```

### Check Connection Status

```javascript
import { connectionManager } from './services/ConnectionManager.js';

// Get current status
const status = connectionManager.getStatus();
console.log(status);
// {
//   initialized: true,
//   connections: {
//     firebase_auth: true,
//     firebase_firestore: true,
//     firebase_realtime_db: true,
//     cloudinary: true
//   },
//   allConnected: true
// }
```

### Monitor Connection Changes

```javascript
import { connectionManager } from './services/ConnectionManager.js';

// Register listener for status changes
const unsubscribe = connectionManager.onStatusChange((status) => {
  console.log('Connection status changed:', status);
});

// Clean up when needed
unsubscribe();
```

## Usage Examples

### Upload Image to Cloudinary

```javascript
import { cloudinaryService } from './services/index.js';

const file = event.target.files[0];
const userId = 'user123';

try {
  const asset = await cloudinaryService.uploadAvatar(file, userId);
  console.log('Avatar uploaded:', asset.secure_url);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Get Optimized Image URL

```javascript
import { cloudinaryService } from './services/index.js';

const publicId = 'weekend-warrior-social/avatars/avatar-user123';
const avatarUrl = cloudinaryService.getAvatarUrl(publicId);
```

### Access Firestore

```javascript
import { firestoreService } from './services/index.js';

const users = await firestoreService.query('users');
```

### Check Authentication

```javascript
import { authService } from './services/index.js';

authService.initializeAuthListener((user) => {
  if (user) {
    console.log('Logged in as:', user.email);
  } else {
    console.log('Not authenticated');
  }
});
```

## Diagnostics & Troubleshooting

### Validate Configuration

```javascript
import { envValidator } from './lib/envValidator.js';

envValidator.logReport();
```

### Get Full Diagnostics

```javascript
import { connectionManager } from './services/ConnectionManager.js';

const diagnostics = await connectionManager.getDiagnostics();
console.log(diagnostics);
```

### Test Individual Connections

```javascript
import { testConnection } from './lib/integrationSetup.js';

await testConnection('firebase_auth');
await testConnection('cloudinary');
```

### Reconnect to Services

```javascript
import { reconnectAll } from './lib/integrationSetup.js';

// Attempt to reconnect if connections are lost
await reconnectAll();
```

### Print Status Summary

```javascript
import { printConnectionStatus } from './lib/integrationSetup.js';

printConnectionStatus();
// 📡 Connection Status:
//   Firebase Auth:          ✓
//   Firebase Firestore:     ✓
//   Firebase Realtime DB:   ✓
//   Cloudinary:             ✓
//   Overall Status:         ✓ All Connected
```

## Cloudinary Storage Structure

Files are organized in folders by type:

```
weekend-warrior-social/
├── avatars/          - User profile pictures
├── posts/            - Post images
├── stories/          - Story images
├── comments/         - Comment attachments
├── challenges/       - Challenge images
├── challenge-chat/   - Challenge chat media
├── missions/         - Mission images
├── achievements/     - Achievement badges
├── banners/          - Banner images
├── logos/            - Logo images
├── gallery/          - Gallery videos
└── temp/             - Temporary uploads
```

## Image Transformations

Pre-configured transformations are available:

- **AVATAR**: 200x200, face-focused
- **THUMBNAIL**: 150x150, optimized
- **POST_IMAGE**: 600x600, optimized
- **STORY**: 1080x1920 (story format)
- **RESPONSIVE**: Auto-scaling with DPR
- **OPTIMIZATION**: Auto quality and format

Example:
```javascript
const optimizedUrl = cloudinaryService.getPostImageUrl(publicId);
```

## Upload Constraints

- **Max Image Size**: 10MB
- **Max Video Size**: 50MB
- **Max General File Size**: 50MB
- **Allowed Image Formats**: jpg, jpeg, png, gif, webp, svg, avif
- **Allowed Video Formats**: mp4, webm, mov, avi, mkv

## Common Issues

### "Cloudinary configuration is missing"
- Check that `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are set in `.env.local`

### "Firebase configuration is missing"
- Firebase configuration is built-in, but can be overridden with environment variables
- Ensure Firebase project is properly set up

### Upload fails with 401
- Check that upload preset is set to "unsigned" in Cloudinary
- Verify cloud name is correct

### Images not displaying
- Check that the Cloudinary URL is accessible
- Verify the public ID exists in Cloudinary
- Check CORS settings in browser console

## Environment Variables

### Required
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

### Optional
- `VITE_CLOUDINARY_API_KEY` - For asset deletion
- `VITE_CLOUDINARY_API_SECRET` - For asset deletion
- Firebase overrides (see Firebase Setup section)

### Application
- `VITE_APP_NAME` - Default: "Weekend Warrior Social"
- `VITE_APP_VERSION` - Default: "1.0.0"
- `VITE_APP_ENV` - Default: "development"

## Development Tips

1. **Use .env.local** for development credentials, never commit sensitive data
2. **Monitor connections** in browser console during development
3. **Test uploads** with small files first
4. **Use health checks** to verify services are available
5. **Subscribe to status changes** for real-time monitoring

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Cloudinary Upload Widget](https://cloudinary.com/documentation/upload_widget)
