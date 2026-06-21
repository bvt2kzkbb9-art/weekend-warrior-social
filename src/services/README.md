# Services Layer

Warstwa usług (`services/`) stanowi abstrakcję między UI a zewnętrznymi serwisami (Cloudinary, Firebase).

## Architektura

```
┌─────────────────────────────────────────┐
│         UI Components / Pages            │
├─────────────────────────────────────────┤
│         Services Layer (Services/)       │
│  - Nigdy nie mów bezpośrednio o        │
│    Cloudinary lub Firebase              │
├─────────────────────────────────────────┤
│         External Services                │
│  - Cloudinary CDN                       │
│  - Firebase Firestore                   │
│  - Firebase Auth                        │
└─────────────────────────────────────────┘
```

## CloudinaryStorageService

Główny serwis do zarządzania wszystkimi uploadami i optymalizacją zasobów.

### Metody:

```javascript
// Upload
uploadAvatar(file, userId)
uploadPostImage(file, userId, postId)
uploadChallengeImage(file, challengeId)
uploadStory(file, userId, storyId)
uploadVideo(file, userId, videoId)
uploadAttachment(file, type)

// Optymalizacja
getOptimizedImage(publicId, width, height)
getThumbnail(publicId, width, height)
getResponsiveImage(publicId, options)
getAvatarUrl(publicId)
getPostImageUrl(publicId)
getStoryUrl(publicId)

// Zarządzanie
deleteAsset(publicId)
healthCheck()
```

### Użycie:

```javascript
import { cloudinaryService } from '../services/CloudinaryStorageService.js';

// Upload
const asset = await cloudinaryService.uploadPostImage(file, userId, postId);
console.log(asset.secure_url); // https://res.cloudinary.com/...

// Optymalizacja
const optimizedUrl = cloudinaryService.getPostImageUrl(asset.public_id);
```

## FirestoreService

Abstrakcja dla Firestore. Obsługuje wszystkie operacje na bazie danych.

### Metody:

```javascript
initialize(firebaseApp)
getDocument(collection, docId)
getCollection(collection, queryConstraints)
addDocument(collection, data)
updateDocument(collection, docId, data)
deleteDocument(collection, docId)
batchWrite(operations)
onDocumentChange(collection, docId, callback)
onCollectionChange(collection, queryConstraints, callback)
transaction(updateFunction)
```

### Użycie:

```javascript
import { firestoreService } from '../services/FirestoreService.js';

// Przechowywanie metadanych
const postDoc = {
  userId: 'user-123',
  content: 'Mój post',
  imageAssetId: asset.id,
  imageUrl: asset.secure_url,
  createdAt: new Date().toISOString(),
};

// const docId = await firestoreService.addDocument('posts', postDoc);
```

## ChallengeService

Logika wyzwań. Integruje CloudinaryStorageService i FirestoreService.

```javascript
import { challengeService } from '../services/ChallengeService.js';

// Tworzenie wyzwania ze zdjęciem
const challenge = await challengeService.createChallenge(
  {
    id: 'challenge-123',
    title: 'Moje wyzwanie',
    category: 'combat',
    xpStake: 500,
  },
  imageFile // opcjonalne
);
```

## UserService

Operacje związane z użytkownikami.

```javascript
import { userService } from '../services/UserService.js';

// Update avatara
const avatarAsset = await userService.updateUserAvatar(userId, avatarFile);

// Profile
const profile = await userService.getUserProfile(userId);
```

## PostService

Operacje związane z postami.

```javascript
import { postService } from '../services/PostService.js';

// Tworzenie posta
const post = await postService.createPost(userId, content, imageFile);

// Feed
const posts = await postService.getFeedPosts(userId);
```

## StoryService

Operacje związane ze storiami.

```javascript
import { storyService } from '../services/StoryService.js';

// Tworzenie story
const story = await storyService.createStory(userId, storyFile);

// Pobieranie
const stories = await storyService.getStories();
```

## MissionService

Operacje związane z misjami.

```javascript
import { missionService } from '../services/MissionService.js';

// Pobieranie misji
const missions = await missionService.getMissions();

// Postęp
const progress = await missionService.getUserMissionProgress(userId, missionId);
```

## RankingService

Operacje związane z rankingiem.

```javascript
import { rankingService } from '../services/RankingService.js';

// Top ranking
const top100 = await rankingService.getTopRanking(100);

// User XP
await rankingService.updateUserXP(userId, 500);
```

## AchievementService

Operacje związane z osiągnięciami.

```javascript
import { achievementService } from '../services/AchievementService.js';

// Odblokowywanie
await achievementService.unlockAchievement(userId, achievementId);

// Sprawdzanie
const isUnlocked = await achievementService.isAchievementUnlocked(userId, achievementId);
```

## NotificationService

Operacje związane z powiadomieniami.

```javascript
import { notificationService } from '../services/NotificationService.js';

// Wysyłanie
await notificationService.sendNotification(userId, 'challenge_invite', {
  challengeId: 'challenge-123',
  fromUser: 'user-456',
});

// Pobieranie
const notifications = await notificationService.getUserNotifications(userId);
```

## Best Practices

### 1. Import z index.js

✅ **Dobrze**:
```javascript
import { cloudinaryService, userService } from '../services/index.js';
```

❌ **Źle**:
```javascript
import { cloudinaryService } from '../services/CloudinaryStorageService.js';
import { userService } from '../services/UserService.js';
```

### 2. Error handling

```javascript
try {
  const asset = await cloudinaryService.uploadAvatar(file, userId);
  console.log('Upload successful:', asset.secure_url);
} catch (error) {
  console.error('Upload failed:', error.message);
  // Pokaż error użytkownikowi
}
```

### 3. Asynchronous operations

Wszystkie serwisy zwracają Promise. Używaj `await`:

```javascript
// Dobrze
const asset = await cloudinaryService.uploadPostImage(file, userId, postId);

// Złe - nie czekaj na rezultat
cloudinaryService.uploadPostImage(file, userId, postId);
```

### 4. Nie eksponuj wewnętrznych szczegółów

❌ **Źle** - nie używaj bezpośrednio Cloudinary API:
```javascript
const response = await fetch('https://api.cloudinary.com/...');
```

✅ **Dobrze** - używaj serwisu:
```javascript
const asset = await cloudinaryService.uploadPostImage(file, userId, postId);
```

## Rozszerzanie

Aby dodać nowy serwis:

1. Utwórz nowy plik w `services/`
2. Eksportuj singleton instancję
3. Dodaj eksport do `services/index.js`
4. Dokumentuj metody

Przykład:

```javascript
// src/services/CommentsService.js

class CommentsService {
  async getPostComments(postId) {
    // Implementation
  }

  async addComment(postId, userId, content, attachmentFile = null) {
    // Implementation
  }
}

const commentService = new CommentsService();
export { commentService, CommentsService };
```

Następnie w `index.js`:
```javascript
export { commentService, CommentsService } from './CommentsService.js';
```

## Testing

Test Cloudinary integration:
```
Otwórz: /src/test-cloudinary.html
```
