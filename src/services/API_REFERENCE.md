# Services API Reference

## ConnectionManager

Centralized service for managing connections to Firebase and Cloudinary.

### Initialization

```javascript
import { connectionManager } from './index.js';

// Initialize all connections
await connectionManager.initialize();

// Check if all connections are ready
if (connectionManager.isAllConnected()) {
  console.log('All services ready');
}
```

### API Methods

#### `initialize(): Promise<boolean>`
Initializes all connections (Firebase Auth, Firestore, Realtime DB, Cloudinary).

**Returns:** `true` if all connections initialized successfully, `false` otherwise.

```javascript
const success = await connectionManager.initialize();
```

#### `getStatus(): Object`
Returns current connection status.

**Returns:**
```javascript
{
  initialized: boolean,
  connections: {
    firebase_auth: boolean,
    firebase_firestore: boolean,
    firebase_realtime_db: boolean,
    cloudinary: boolean
  },
  allConnected: boolean,
  timestamp: string // ISO 8601
}
```

#### `isAllConnected(): boolean`
Checks if all connections are active.

```javascript
const allReady = connectionManager.isAllConnected();
```

#### `isConnected(connectionName: string): boolean`
Checks if specific connection is active.

```javascript
const hasAuth = connectionManager.isConnected('firebase_auth');
const hasCloudinary = connectionManager.isConnected('cloudinary');
```

#### `onStatusChange(callback: Function): Function`
Registers listener for connection status changes.

**Returns:** Unsubscribe function.

```javascript
const unsubscribe = connectionManager.onStatusChange((status) => {
  console.log('Connection status changed:', status);
});

// To unsubscribe
unsubscribe();
```

#### `getDiagnostics(): Promise<Object>`
Gets detailed diagnostics about all connections.

```javascript
const diagnostics = await connectionManager.getDiagnostics();
// Returns: { status, firebase, cloudinary }
```

#### `reconnect(): Promise<boolean>`
Attempts to reconnect to all services.

```javascript
const success = await connectionManager.reconnect();
```

---

## CloudinaryStorageService

Handles all media uploads, optimization, and delivery from Cloudinary.

### Uploads

#### `uploadAvatar(file: File, userId: string, onProgress?: Function): Promise<CloudinaryAsset>`
Uploads user avatar image.

```javascript
const file = event.target.files[0];
try {
  const asset = await cloudinaryService.uploadAvatar(file, userId, (percent) => {
    console.log(`Upload: ${percent}%`);
  });
  console.log('Avatar URL:', asset.secure_url);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

#### `uploadPostImage(file: File, userId: string, postId: string, onProgress?: Function): Promise<CloudinaryAsset>`
Uploads post image.

#### `uploadStory(file: File, userId: string, storyId: string, onProgress?: Function): Promise<CloudinaryAsset>`
Uploads story image.

#### `uploadVideo(file: File, userId: string, videoId: string, onProgress?: Function): Promise<CloudinaryAsset>`
Uploads video.

#### `uploadChallengeImage(file: File, challengeId: string, onProgress?: Function): Promise<CloudinaryAsset>`
Uploads challenge image.

#### `uploadAttachment(file: File, type?: string, onProgress?: Function): Promise<CloudinaryAsset>`
Uploads generic attachment.

### Image URLs

#### `getAvatarUrl(publicId: string): string`
Returns optimized avatar URL (200x200).

```javascript
const url = cloudinaryService.getAvatarUrl(publicId);
// Example: https://res.cloudinary.com/mycloud/image/upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/...
```

#### `getPostImageUrl(publicId: string): string`
Returns optimized post image URL (600x600).

#### `getStoryUrl(publicId: string): string`
Returns story-optimized URL (1080x1920).

#### `getThumbnail(publicId: string, width?: number, height?: number): string`
Returns thumbnail URL with custom dimensions.

```javascript
const thumb = cloudinaryService.getThumbnail(publicId, 150, 150);
```

#### `getResponsiveImage(publicId: string, options?: Object): string`
Returns responsive image URL.

```javascript
const url = cloudinaryService.getResponsiveImage(publicId, {
  maxWidth: 800,
  quality: 'auto',
  format: 'auto'
});
```

#### `getOptimizedImage(publicId: string, width?: number, height?: number): string`
Returns auto-optimized image URL.

### Utilities

#### `deleteAsset(publicId: string): Promise<boolean>`
Deletes asset from Cloudinary.

**Requires:** API credentials in environment variables.

```javascript
const success = await cloudinaryService.deleteAsset(publicId);
```

#### `healthCheck(): Promise<boolean>`
Checks Cloudinary availability.

```javascript
const isAvailable = await cloudinaryService.healthCheck();
```

#### `validateFile(file: File, maxSize?: number): boolean`
Validates file before upload.

```javascript
try {
  cloudinaryService.validateFile(file);
  // File is valid
} catch (error) {
  console.error('File validation failed:', error.message);
}
```

---

## EnvironmentValidator

Validates environment variables for Firebase and Cloudinary.

### API

#### `validate(): Object`
Validates all environment variables.

**Returns:**
```javascript
{
  isValid: boolean,
  errors: string[],
  warnings: string[]
}
```

#### `logReport(): void`
Logs validation report to console.

```javascript
envValidator.logReport();
```

#### `getReport(): string`
Returns validation report as formatted string.

```javascript
const report = envValidator.getReport();
console.log(report);
```

---

## Integration Setup

Helper functions for setting up and monitoring connections.

### Functions

#### `setupConnections(): Promise<boolean>`
Sets up all connections with validation.

```javascript
import { setupConnections } from './lib/integrationSetup.js';

const initialized = await setupConnections();
```

#### `printConnectionStatus(): void`
Prints connection status to console.

```javascript
import { printConnectionStatus } from './lib/integrationSetup.js';

printConnectionStatus();
// Output:
// 📡 Connection Status:
//   Firebase Auth:          ✓
//   Firebase Firestore:     ✓
//   Firebase Realtime DB:   ✓
//   Cloudinary:             ✓
```

#### `testConnection(connectionName: string): Promise<boolean>`
Tests specific connection.

```javascript
import { testConnection } from './lib/integrationSetup.js';

await testConnection('firebase_auth');
await testConnection('cloudinary');
```

#### `reconnectAll(): Promise<boolean>`
Reconnects to all services.

```javascript
import { reconnectAll } from './lib/integrationSetup.js';

await reconnectAll();
```

#### `getConnectionDiagnostics(): Object`
Gets full diagnostics.

```javascript
import { getConnectionDiagnostics } from './lib/integrationSetup.js';

const diag = getConnectionDiagnostics();
```

---

## Data Models

### CloudinaryAsset

Represents a file uploaded to Cloudinary.

```javascript
{
  public_id: string,          // Cloudinary public ID
  secure_url: string,         // HTTPS URL
  display_name: string,       // User-friendly name
  folder: string,             // Storage folder
  width: number,              // Image width in pixels
  height: number,             // Image height in pixels
  format: string,             // File format (jpg, png, etc.)
  bytes: number,              // File size in bytes
  resource_type: string,      // Type (image, video, etc.)
  created_at: string,         // ISO 8601 timestamp
  uploaded_by: string,        // User ID who uploaded
  metadata: Object            // Custom metadata
}
```

---

## Best Practices

1. **Always wait for initialization:**
   ```javascript
   await initializeApp();
   ```

2. **Check connection before operations:**
   ```javascript
   if (!connectionManager.isConnected('cloudinary')) {
     // Handle offline mode
   }
   ```

3. **Handle upload failures gracefully:**
   ```javascript
   try {
     const asset = await cloudinaryService.uploadAvatar(file, userId);
   } catch (error) {
     showUserError(error.message);
   }
   ```

4. **Monitor connection changes:**
   ```javascript
   connectionManager.onStatusChange((status) => {
     if (!status.allConnected) {
       notifyUserOfOffline();
     }
   });
   ```

5. **Use responsive images in web:**
   ```javascript
   const url = cloudinaryService.getResponsiveImage(publicId);
   ```

---

## Error Handling

All services throw descriptive errors:

```javascript
try {
  await cloudinaryService.uploadAvatar(file, userId);
} catch (error) {
  if (error.message.includes('Maksymalny rozmiar')) {
    // File too large
  } else if (error.message.includes('Nieobsługiwany format')) {
    // Invalid format
  } else {
    // Network or other error
  }
}
```

---

## Environment Variables

### Required
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

### Optional
- `VITE_CLOUDINARY_API_KEY` - For asset deletion
- `VITE_CLOUDINARY_API_SECRET` - For asset deletion

### Firebase (built-in, can override)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
