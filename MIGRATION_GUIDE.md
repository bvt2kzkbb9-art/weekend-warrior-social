# Migration Guide - Firebase & Cloudinary Integration

This guide helps migrate existing code to use the new Firebase & Cloudinary integration system.

## Overview

The project now uses a centralized connection management system with:
- **ConnectionManager** - Unified connection monitoring
- **CloudinaryStorageService** - Centralized media uploads
- **EnvironmentValidator** - Configuration validation
- **IntegrationSetup** - Helper utilities

## Before and After

### Before: Scattered Firebase Usage
```javascript
// Old way - Firebase imported directly in multiple places
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = { /* config */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

### After: Centralized Management
```javascript
// New way - Single import, ready to use
import { app, auth, db } from './lib/firebase.js';
import { connectionManager } from './services/index.js';

// Initialize and check status
await connectionManager.initialize();
const status = connectionManager.getStatus();
```

## Migration Steps

### Step 1: Update Imports

**Before:**
```javascript
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
```

**After:**
```javascript
import { auth, db } from './lib/firebase.js';
```

### Step 2: Remove Manual Firebase Initialization

**Before:**
```javascript
import { initializeApp } from 'firebase/app';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

**After:**
```javascript
// Everything is initialized in src/lib/firebase.js
// Just import what you need
import { app, auth, db } from './lib/firebase.js';
```

### Step 3: Update Cloudinary Usage

**Before:**
```javascript
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'my_preset');
  
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/mycloud/auto/upload',
    { method: 'POST', body: formData }
  );
  return response.json();
};
```

**After:**
```javascript
import { cloudinaryService } from './services/index.js';

const uploadAvatar = async (file, userId) => {
  return cloudinaryService.uploadAvatar(file, userId);
};
```

### Step 4: Add Connection Monitoring

**Before:**
```javascript
// App starts, hope Firebase is configured correctly
console.log('App started');
```

**After:**
```javascript
import { initializeApp } from './lib/init.js';

// App ensures all connections are ready
const success = await initializeApp();
if (!success) {
  console.warn('Some connections are not available');
}
```

## Migration Path for Specific Use Cases

### Uploading Media

**Before:**
```javascript
const uploadFile = async (file, folder) => {
  const preset = process.env.CLOUDINARY_PRESET;
  const cloud = process.env.CLOUDINARY_CLOUD;
  
  const data = new FormData();
  data.append('file', file);
  data.append('folder', folder);
  data.append('upload_preset', preset);
  
  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`,
      { method: 'POST', body: data }
    );
    return res.json();
  } catch (err) {
    console.error('Upload failed:', err);
  }
};
```

**After:**
```javascript
import { cloudinaryService } from './services/index.js';

const uploadFile = async (file, userId, postId) => {
  try {
    const asset = await cloudinaryService.uploadPostImage(file, userId, postId);
    return asset;
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Checking Connection Status

**Before:**
```javascript
// No way to check if services are ready
// Hope for the best
```

**After:**
```javascript
import { connectionManager } from './services/index.js';

// Check if ready
if (connectionManager.isAllConnected()) {
  console.log('Ready to use services');
} else {
  console.warn('Some services unavailable');
}

// Or monitor changes
connectionManager.onStatusChange((status) => {
  if (!status.allConnected) {
    showOfflineNotice();
  }
});
```

### Getting Image URLs

**Before:**
```javascript
const getImageUrl = (publicId) => {
  return `https://res.cloudinary.com/mycloud/image/upload/w_200,h_200,c_fill/${publicId}`;
};
```

**After:**
```javascript
import { cloudinaryService } from './services/index.js';

const getImageUrl = (publicId) => {
  return cloudinaryService.getAvatarUrl(publicId);
};
```

## Configuration Migration

### Old: Firebase Config Scattered

```javascript
// src/firebase.config.js
export const firebaseConfig = { /* ... */ };

// src/index.js
import { firebaseConfig } from './firebase.config.js';
```

### New: Centralized Configuration

```env
# .env.local
VITE_CLOUDINARY_CLOUD_NAME=mycloud
VITE_CLOUDINARY_UPLOAD_PRESET=preset

# Firebase is hardcoded in src/lib/firebase.js
# Or override with VITE_FIREBASE_* variables
```

## API Mapping Reference

### Firebase Operations

| Old Code | New Equivalent |
|----------|-----------------|
| `initializeApp(config)` | Import from `./lib/firebase.js` |
| `getAuth(app)` | Import `auth` from `./lib/firebase.js` |
| `getFirestore(app)` | Import `db` from `./lib/firebase.js` |
| `getDatabase(app)` | Import `database` from `./lib/firebase.js` |

### Cloudinary Operations

| Old Code | New Equivalent |
|----------|-----------------|
| Manual FormData creation | `cloudinaryService.uploadAvatar()` |
| Manual URL construction | `cloudinaryService.getAvatarUrl()` |
| Direct fetch calls | `cloudinaryService.performUpload()` |

## Environment Variables Migration

### Old Approach
```javascript
// Scattered in multiple files
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD;
const PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;
```

### New Approach
```env
# .env.local (single source of truth)
VITE_CLOUDINARY_CLOUD_NAME=mycloud
VITE_CLOUDINARY_UPLOAD_PRESET=preset

# Accessed via
import { CLOUDINARY_CONFIG } from './config/cloudinary.config.js';
```

## Error Handling Migration

### Before: Scattered Error Handling
```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error('Upload failed');
} catch (error) {
  console.error('Error:', error);
  // Generic error - could be anything
}
```

### After: Descriptive Error Messages
```javascript
try {
  const asset = await cloudinaryService.uploadAvatar(file, userId);
} catch (error) {
  if (error.message.includes('Maksymalny rozmiar')) {
    showError('File is too large');
  } else if (error.message.includes('Nieobsługiwany format')) {
    showError('This file format is not supported');
  } else if (error.message.includes('Błąd połączenia')) {
    showError('Network error - please try again');
  } else {
    showError(error.message);
  }
}
```

## Validation Migration

### Before: No Validation
```javascript
// Just hope the .env file is correct
const config = {
  cloud: process.env.CLOUD,
  preset: process.env.PRESET
};
```

### After: Automatic Validation
```javascript
import { envValidator } from './lib/envValidator.js';

// Check configuration at startup
const validation = envValidator.validate();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Testing Migration

### Old: Manual Testing
```javascript
// In console:
// > fetch('...').then(r => r.json()).then(console.log)
```

### New: Structured Testing
```javascript
import { testConnection } from './lib/integrationSetup.js';
import { printConnectionStatus } from './lib/integrationSetup.js';

// Test individual connections
await testConnection('firebase_auth');
await testConnection('cloudinary');

// Print full status
printConnectionStatus();
```

## Gradual Migration Strategy

If you have a large codebase, migrate in phases:

### Phase 1: Add New Code
- Use new system for all new features
- Keep old code working

### Phase 2: Migrate Critical Paths
- Update authentication flows
- Update media upload flows

### Phase 3: Clean Up Old Code
- Remove old Firebase initialization
- Remove duplicate Cloudinary uploads
- Consolidate to new system

### Phase 4: Remove Legacy Code
- Delete old config files
- Delete duplicate services
- Clean up unused imports

## Troubleshooting Migration Issues

### Issue: "Cannot find module './lib/firebase.js'"
**Solution:** Make sure you're importing from correct path. Check your `tsconfig.json` or module resolution.

### Issue: "Cloudinary configuration is missing"
**Solution:** Check `.env.local` has `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`.

### Issue: "Firebase is undefined"
**Solution:** Ensure `initializeApp()` is called during app startup.

### Issue: "EnvironmentValidator is not a class"
**Solution:** Import as `import { envValidator } from './lib/envValidator.js'` (lowercase - it's an instance).

## Support

For detailed API documentation, see: [API Reference](./src/services/API_REFERENCE.md)

For setup instructions, see: [Firebase & Cloudinary Setup](./FIREBASE_CLOUDINARY_SETUP.md)

For quick start, see: [Quick Start Guide](./QUICKSTART.md)
