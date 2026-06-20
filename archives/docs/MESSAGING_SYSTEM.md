# Weekend Warrior Social — System Wiadomości V2 (Messaging System)

## Overview

Complete Messenger-inspired messaging system for Weekend Warrior Social with real-time synchronization, online status, and unread badges.

## Files Modified/Created

### New Files
- **messages.html** - Main messaging page with conversation list and chat view
- **js/messages.js** - Complete messaging backend logic
- **js/utils.js** - Helper utility functions (formatTime, getInitials, etc.)
- **MESSAGING_SYSTEM.md** - This documentation

### Modified Files
- **css/style.css** - Added 400+ lines of messaging UI styling
- **js/sw.js** - Updated service worker cache with messaging files

## Firestore Structure

### Collections

#### conversations
```
conversations/
├── {conversationId}
│   ├── participants: [userId1, userId2]
│   ├── participantNames: {userId1: "Nick1", userId2: "Nick2"}
│   ├── participantAvatars: {userId1: "avatarUrl1", userId2: "avatarUrl2"}
│   ├── lastMessage: "Last message text"
│   ├── lastMessageAt: Timestamp(2026-06-16)
│   ├── createdAt: Timestamp(2026-06-15)
│   ├── unreadCounts: {userId1: 0, userId2: 2}
│   │
│   └── messages/ (subcollection)
│       └── {messageId}
│           ├── senderId: "userId1"
│           ├── text: "Hello!"
│           ├── createdAt: Timestamp(2026-06-16 16:30:00)
│           └── read: false
```

### users (Extended Schema)
```
users/{userId}
├── displayName: "Warrior Nick"
├── email: "warrior@example.com"
├── avatar: "cloudinary_public_id"
├── lastActive: Timestamp (updated every minute)
├── xp: 1500
├── level: 15
├── rank: "Champion"
└── ...other fields
```

## Real-Time Features

### Online Status
- Users are considered online if `lastActive` is within 5 minutes
- Green dot indicator next to online users
- "Ostatnio: {time}" shows last activity for offline users
- `lastActive` is updated every 60 seconds

### Unread Messages
- Tracked in `conversations.unreadCounts.{userId}`
- Automatically set to 0 when conversation is opened
- Badge appears on:
  - Individual conversations (number)
  - Navigation "Moje" tab (total count)
  - Updates in real-time

### Message Timestamps
- All messages include `createdAt` Timestamp
- Smart formatting:
  - Today: Show time (16:30)
  - Yesterday: "Wczoraj"
  - This week: Day name (Pon, Wto, etc.)
  - Older: Date (15 cze)

## Core Features

### 1. Conversation List
**Location:** Messages page main view

Features:
- Real-time conversation list sorted by last message
- Avatar + nickname + last message + time
- Online status indicator (green dot)
- Unread badge with count
- Search across nicknames and messages
- Active warriors carousel (horizontal scroll)
- Empty state with helpful message

### 2. Chat View
**Location:** Opens when user clicks a conversation

Features:
- Back button returns to list
- Header with avatar, name, and online status
- Message list with auto-scroll to bottom
- Messages grouped by sender (left/right layout)
- Timestamps on each message
- Message input with auto-expanding textarea
- Send button (disabled when empty)

### 3. New Conversation
**Location:** "+" button in messages header

Features:
- Search for users by nickname or email
- Real-time search results
- Click to create/open conversation
- Opens chat immediately after creation
- Modal closes automatically

### 4. Online Status
- Live presence tracking
- 5-minute idle window
- Green indicators on active warriors
- "online" or "Ostatnio: {time}" in chat header
- Updates every 60 seconds per user

## Implementation Details

### Firestore Security Rules

Add these rules to your Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Conversations: Can read/write if you're a participant
    match /conversations/{conversationId} {
      allow read, update: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid in request.resource.data.participants;
    }

    // Messages: Can read/write if you're a conversation participant
    match /conversations/{conversationId}/messages/{messageId} {
      allow read, create: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }

    // Other collections
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Real-Time Listeners

The system uses Firestore's `onSnapshot()` for real-time updates:

```javascript
// Conversations listener
onSnapshot(query, (snapshot) => {
  // Updates whenever conversations change
});

// Messages listener
onSnapshot(query, (snapshot) => {
  // Updates whenever messages arrive
});

// Online users listener
onSnapshot(query, (snapshot) => {
  // Updates lastActive timestamps
});
```

## User Experience Flow

### Sending a Message
1. User types in message input
2. Send button becomes active
3. Click send (or press Enter)
4. Message appears in chat immediately
5. `lastMessage` and `lastMessageAt` update for conversation
6. Conversation moves to top of list
7. Recipient sees message in real-time

### Receiving a Message
1. Recipient's messages area updates in real-time
2. Auto-scrolls to new message
3. Chat header updates timestamp if online
4. Conversation moves to top of list
5. Unread badge increments if chat isn't open
6. Badge appears on navigation if new unread exists

### Opening Conversation
1. Click conversation item
2. Chat view opens
3. Previous messages load (limit 50)
4. New messages arrive in real-time
5. Conversation marked as read (unread count = 0)
6. Online status updates in header

## Styling & Theme

### Colors (Dark RPG Theme)
- **Sent messages:** Dark gold gradient (#7D5F23 to #5C4618)
- **Received messages:** Dark panel with subtle border
- **Active online:** Success green (#2DB86D) with glow
- **Text:** Premium gold-tinted (#E8E0CF)
- **Backgrounds:** Deep darks with metallic inset highlights

### Animations
- Fade in on load
- Slide up for messages
- Smooth transitions on hover
- Scale on active warrior hover

### Responsive Design
- Mobile-first (390-430px)
- No horizontal scrolling (except active warriors)
- Touch-friendly buttons (40px minimum)
- Auto-expanding textarea
- Full-width layout on small screens

## Testing Scenarios

### Test 1: Send and Receive Message
```
1. Open messages in two browsers (or two accounts)
2. User A opens conversation with User B
3. User A sends: "Cześć!"
4. User B sees message appear in real-time
5. Message includes timestamp
6. Conversation moves to top of User B's list
```

### Test 2: Unread Badge
```
1. User A and User B have conversation
2. User B closes the conversation
3. User A sends: "Nowa wiadomość"
4. User B sees:
   - "1" badge on conversation
   - "1" badge on navigation "Moje" tab
5. User B opens conversation
6. Badges disappear (marked as read)
```

### Test 3: Online Status
```
1. User A and User B both online
2. Open chat between them
3. User B's header shows "online"
4. Green dot visible next to User B in list
5. User B closes app (goes offline)
6. After 5 minutes, User A sees "Ostatnio: 5 min temu"
7. Green dot disappears
```

### Test 4: New Conversation
```
1. Click "+" button
2. Search for user by typing nickname
3. Results appear in real-time
4. Click a user
5. Chat opens immediately
6. Can start typing message
```

### Test 5: Search Conversations
```
1. Have multiple conversations
2. Type in search box "Arn" 
3. Only conversations with "Arn" in name or message appear
4. Clear search to show all
```

### Test 6: Active Warriors
```
1. Open messages page
2. See "Aktywni" section with recent active users
3. Avatars show online status
4. Click a warrior to start chat
5. Creates new conversation if needed
```

## Performance Considerations

- **Message Limit:** First 50 messages loaded (pagination can be added)
- **Active Warriors:** Limited to 6 results
- **Presence Updates:** Every 60 seconds (not on every interaction)
- **Listener Cleanup:** Unsubscribers properly managed
- **Debouncing:** Search is real-time (can add debounce if needed)

## Future Enhancements

1. **Typing Indicators** - Show "User is typing..."
2. **Message Reactions** - Like/emoji reactions on messages
3. **Read Receipts** - "Seen at 16:30"
4. **Voice Messages** - Record and send audio
5. **Group Conversations** - Support 3+ participants
6. **Message Editing** - Edit sent messages
7. **Message Deletion** - Delete for me/everyone
8. **Pinned Messages** - Important message highlights
9. **Pagination** - Load more messages on scroll up
10. **Chat Archives** - Archive conversations
11. **Notifications** - Push notifications for new messages
12. **Rich Text** - Bold, italic, code formatting

## Mobile-First Design Details

### Viewport Optimization
- Safe area insets for notches
- 100% width conversation items
- Full-screen chat view
- No side-by-side layouts
- Bottom-aligned input (keyboard doesn't overlap)

### Touch Targets
- Minimum 40px height for buttons
- 44px avatar circles
- Adequate padding around tap targets
- No hover-required interactions

### Performance on Mobile
- Lazy-load avatars with Cloudinary
- Minimal animations on low-end devices
- Debounced input handlers
- Optimized image sizes

## File Sizes & Performance

- **messages.html**: ~4KB (minified)
- **messages.js**: ~14KB (features: listeners, search, presence)
- **style.css additions**: ~22KB (all messaging UI)
- **utils.js**: ~2KB (date/time helpers)

Total added: ~42KB (with imports)

## Debugging Tips

### Console Logs
The system includes console.log statements for debugging:
- User authentication: `[Firebase] ✅ Auth ready`
- Message sent: Check messages area updates
- Listeners: Monitor real-time updates
- Presence: Check online user tracking

### Common Issues

**Messages not appearing?**
- Check Firestore security rules
- Verify conversation participants list
- Check browser console for errors
- Ensure timestamps are serverTimestamp()

**Online status not updating?**
- Check lastActive field is updating
- Verify onSnapshot listener is active
- Check 5-minute window calculation
- Clear browser cache

**Search not working?**
- Ensure displayName field is set for users
- Check search input event listeners
- Verify conversation item visibility toggle

## Integration with Existing System

### User Fields Required
- `displayName` (string) - Warrior nickname
- `avatar` (string) - Cloudinary public ID
- `lastActive` (Timestamp) - Updated by presence system
- `uid` (string) - Firebase Auth ID

### Existing Features Used
- Firebase Authentication
- Firestore real-time listeners
- Cloudinary image optimization
- Dark RPG theme & colors
- Navigation structure
- Service Worker caching

## Deployment Checklist

- [ ] Firestore security rules updated
- [ ] Database indexes created (auto-generated on first query)
- [ ] messages.html linked in navigation
- [ ] users.lastActive field populating
- [ ] Test on mobile (390-430px)
- [ ] Test with two logged-in users simultaneously
- [ ] Verify offline behavior (Service Worker)
- [ ] Check Cloudinary images load
- [ ] Monitor Firestore read/write operations
- [ ] Test unread badge persistence

## Contact & Support

For issues or questions about the messaging system:
1. Check console logs for errors
2. Verify Firestore rules and structure
3. Test with sample data
4. Check browser DevTools Network tab
5. Review Firestore usage dashboard

---

**Version:** 1.0  
**Last Updated:** June 16, 2026  
**Theme:** Dark RPG (Diablo IV/Elden Ring inspired)  
**Status:** Production Ready
