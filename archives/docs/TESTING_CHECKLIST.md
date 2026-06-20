# Weekend Warrior Social - Comprehensive Testing Checklist

**Date**: June 15, 2026  
**Status**: ✅ Ready for QA/Testing  
**Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)

---

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [User Profiles](#user-profiles)
3. [Social Features](#social-features)
4. [Challenge System](#challenge-system)
5. [Messaging](#messaging)
6. [Gamification](#gamification)
7. [Rankings & Leaderboards](#rankings--leaderboards)
8. [Notifications](#notifications)
9. [Mobile & PWA](#mobile--pwa)
10. [Error Handling](#error-handling)
11. [Performance](#performance)

---

## Authentication & Authorization

### Email/Password Registration
- [ ] Navigate to `/register`
- [ ] Fill valid email
- [ ] Fill valid password (8+ chars)
- [ ] Submit form
- [ ] Verify redirect to login
- [ ] Verify user document created in Firestore (`users/{uid}`)
- [ ] Verify initial stats created: `points=0, level=1, postsCount=0`

### Email/Password Login
- [ ] Navigate to `/login`
- [ ] Enter registered email
- [ ] Enter correct password
- [ ] Submit form
- [ ] Verify redirect to `/index.html`
- [ ] Verify user profile loads
- [ ] Check localStorage has auth token

### Google OAuth Login
- [ ] Click "Zaloguj się przez Google"
- [ ] Complete Google authentication
- [ ] Verify redirect to `/index.html`
- [ ] Verify user profile loads with Google data (photo, name)
- [ ] Check user document created with `photoURL` field

### Password Reset
- [ ] Click "Zapomniałem hasła" on login page
- [ ] Enter registered email
- [ ] Check browser console or email for reset link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Verify can login with new password

### Session Persistence
- [ ] Login to app
- [ ] Close browser completely
- [ ] Reopen to same URL
- [ ] Verify user is still logged in
- [ ] Verify no re-login required

### Logout
- [ ] Click user avatar in top right
- [ ] Click "Wyloguj" option
- [ ] Verify redirect to `/login`
- [ ] Verify localStorage cleared
- [ ] Verify cannot access protected pages

---

## User Profiles

### View Own Profile
- [ ] Navigate to `/profile.html`
- [ ] Verify displays:
  - [ ] User's display name
  - [ ] User's avatar/photo
  - [ ] Current XP and level
  - [ ] Current rank (Rookie/Warrior/Champion/Legend)
  - [ ] Total posts count
  - [ ] Total comments count
  - [ ] Followers count
  - [ ] Following count
  - [ ] Achievements/badges

### Edit Profile
- [ ] On own profile, click "Edytuj Profil"
- [ ] Change display name
- [ ] Upload new avatar (image < 8MB)
- [ ] Edit bio/description
- [ ] Save changes
- [ ] Verify changes persist in Firestore
- [ ] Refresh page and verify still there

### View Other User Profile
- [ ] Find another user (via mentions, followers, etc.)
- [ ] Click on their profile link
- [ ] Verify displays their stats
- [ ] Verify shows "Follow" button if not following
- [ ] Verify shows "Message" button
- [ ] Verify cannot edit their profile

### Avatar Upload
- [ ] Click avatar to upload
- [ ] Select image < 8MB
- [ ] Verify upload progress shown
- [ ] Verify image displays after upload
- [ ] Check image stored in Firebase Storage: `profiles/{uid}/avatar`

---

## Social Features

### Create Post
- [ ] Navigate to feed
- [ ] Click compose box
- [ ] Type post content (< 500 chars)
- [ ] Click post button
- [ ] Verify post appears in feed immediately
- [ ] Verify XP awarded (POST_CREATED = +10 XP)
- [ ] Verify post stored in Firestore: `posts/{postId}`
- [ ] Fields verified:
  - [ ] `authorId` = current user
  - [ ] `authorName` = user's display name
  - [ ] `content` = post text
  - [ ] `likes` = empty array
  - [ ] `commentsCount` = 0
  - [ ] `createdAt` = server timestamp

### Create Post with Image
- [ ] Click "Add Image" in compose
- [ ] Select image < 8MB
- [ ] Verify image preview shows
- [ ] Type post content
- [ ] Post
- [ ] Verify image displays in feed
- [ ] Verify image stored in Storage: `posts/{uid}/{timestamp}.jpg`
- [ ] Verify `imageUrl` in Firestore points to Storage URL

### Like Post
- [ ] Find a post
- [ ] Click like/heart button
- [ ] Verify button highlights (usually red)
- [ ] Verify like count increments
- [ ] Verify user ID added to post's `likes` array
- [ ] Verify post author gets XP (LIKE_RECEIVED = +5 XP)
- [ ] Verify notification created for post author

### Unlike Post
- [ ] Like a post
- [ ] Click like button again
- [ ] Verify button unhighlights
- [ ] Verify like count decrements
- [ ] Verify user ID removed from `likes` array

### Comment on Post
- [ ] Find a post
- [ ] Click comment button
- [ ] Type comment (< 500 chars)
- [ ] Submit
- [ ] Verify comment appears under post
- [ ] Verify XP awarded (COMMENT_ADDED = +5 XP)
- [ ] Verify comment stored in Firestore: `posts/{postId}/comments/{commentId}`
- [ ] Verify `commentsCount` on post incremented

### Delete Post
- [ ] Create a post
- [ ] Click three-dot menu on your own post
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Verify post removed from feed
- [ ] Verify post document deleted from Firestore
- [ ] Verify post image deleted from Storage

### Follow User
- [ ] Navigate to another user's profile
- [ ] Click "Follow" button
- [ ] Verify button changes to "Following"
- [ ] Verify follower relationship stored in Firestore: `followers/{docId}`
- [ ] Verify notification sent to followed user
- [ ] Verify user appears in "Following" list

### Unfollow User
- [ ] On a user you're following, click "Following"
- [ ] Click "Unfollow" confirmation
- [ ] Verify button changes to "Follow"
- [ ] Verify relationship removed from Firestore

### Block User
- [ ] On a user's profile, click options menu
- [ ] Click "Block User"
- [ ] Verify relationship stored in Firestore: `blocks/{docId}`
- [ ] Verify future posts from blocked user don't appear in feed

### Unblock User
- [ ] Go to settings/blocked users
- [ ] Find blocked user
- [ ] Click "Unblock"
- [ ] Verify they can now see each other's posts

---

## Challenge System

### Browse Challenges
- [ ] Navigate to `/challenges.html`
- [ ] Verify 20+ challenges listed
- [ ] Each challenge shows:
  - [ ] Challenge order/number
  - [ ] Challenge title
  - [ ] Challenge description
  - [ ] Challenge badge/icon
  - [ ] Difficulty indicator
  - [ ] XP reward

### Start Challenge
- [ ] Click on a challenge
- [ ] Verify challenge details load
- [ ] Click "Start Challenge"
- [ ] Verify quiz questions appear (3-5 questions)

### Answer Challenge Quiz
- [ ] Read question
- [ ] Select answer from multiple choices
- [ ] Click "Next" or "Submit"
- [ ] Answer all questions
- [ ] Click "Submit Answers"
- [ ] Verify quiz validation
- [ ] If correct: Show "Passed! +[X]XP"
- [ ] If incorrect: Show "Failed" with explanation

### Challenge Completion
- [ ] After passing quiz, click "Mark as Complete"
- [ ] Verify XP awarded immediately
- [ ] Verify `challenge_completions` document created with:
  - [ ] `userId` = current user
  - [ ] `challengeId` = challenge ID
  - [ ] `xpEarned` = XP amount
  - [ ] `completedAt` = timestamp
- [ ] Verify challenge status updates in UI
- [ ] Verify achievement checked for completion

### Challenge Invitation System
- [ ] On a challenge, click "Invite Friend"
- [ ] Select a friend to challenge
- [ ] Click "Send Invite"
- [ ] Verify `challenge_invites` document created
- [ ] Verify challenged friend gets notification
- [ ] Verify challenged friend can access invite in invitations tab

### Accept Challenge Invite
- [ ] Friend receives notification "Challenged: [User] challenged you"
- [ ] Friend clicks notification or goes to invitations
- [ ] Verify challenge details shown
- [ ] Friend completes challenge
- [ ] Verify completion recorded
- [ ] Verify both users get XP

### Duel System
- [ ] On a user's profile, click "Challenge to Duel"
- [ ] Select challenge for duel
- [ ] Send invite
- [ ] Other user receives duel invite
- [ ] Both complete challenge
- [ ] Verify winner determined and awarded bonus XP
- [ ] Verify duel record stored in Firestore: `duels/{docId}`

---

## Messaging

### Start Conversation
- [ ] Navigate to `/messenger.html`
- [ ] Click "New Message" or find user to message
- [ ] Click "Message" on their profile
- [ ] Verify conversation created in Firestore: `conversations/{convId}`
- [ ] Verify participants array contains both user IDs

### Send Message
- [ ] In conversation, type message
- [ ] Click send button
- [ ] Verify message appears immediately
- [ ] Verify message stored in Firestore: `conversations/{convId}/messages/{msgId}`
- [ ] Fields verified:
  - [ ] `senderId` = sender ID
  - [ ] `senderName` = sender name
  - [ ] `content` = message text
  - [ ] `createdAt` = timestamp
  - [ ] `read` = false

### Send Message with Image
- [ ] Click attach image button
- [ ] Select image < 8MB
- [ ] Message auto-sends with image
- [ ] Verify image displays inline
- [ ] Verify image stored in Storage: `messages/{convId}/{uid}_{timestamp}`

### Mark Message as Read
- [ ] Receive a message
- [ ] Verify message shows as unread
- [ ] Click message or conversation
- [ ] Message marked as read automatically
- [ ] Verify `read` field updates to true in Firestore
- [ ] Verify unread badge disappears

### Conversation List
- [ ] Navigate to messenger
- [ ] Verify all conversations listed
- [ ] Each shows:
  - [ ] Other user's name and avatar
  - [ ] Last message preview
  - [ ] Timestamp of last message
  - [ ] Unread count (if any)

---

## Gamification

### XP System
- [ ] Complete an action (post, comment, like, challenge)
- [ ] Verify XP awarded
- [ ] Check user document in Firestore: `points` field incremented
- [ ] Verify XP appears in profile
- [ ] Verify total XP accumulates correctly

### XP Actions (Verify Each):
- [ ] Post Created: +10 XP
- [ ] Comment Added: +5 XP
- [ ] Like Received: +5 XP
- [ ] Challenge Completed: +50-200 XP
- [ ] Challenge Invitation Accepted: +25 XP
- [ ] Duel Won: +75 XP
- [ ] Duel Loss: 0 XP

### Rank System
- [ ] Start with Rookie rank (0 XP)
- [ ] Earn XP to reach 500 points
- [ ] Verify rank changes to Warrior
- [ ] Continue to 2,000 XP: Champion
- [ ] Continue to 10,000 XP: Legend
- [ ] Check Firestore `rank` field updates
- [ ] Verify rank display updates in profile
- [ ] Verify rank emoji displays correctly (🥉 → 🥈 → 🥇 → 👑)

### Level System
- [ ] Verify level = floor(points / 500) + 1
- [ ] At 0 XP: Level 1
- [ ] At 500 XP: Level 2
- [ ] At 1000 XP: Level 3
- [ ] Check `level` field in Firestore

### Achievements
- [ ] Verify achievements display in profile
- [ ] Verify 15+ achievements available
- [ ] Complete conditions for each achievement
  - [ ] First Post: post 1 post
  - [ ] Five Posts: post 5 posts
  - [ ] First Comment: comment on 1 post
  - [ ] Warrior: reach 500 XP
  - [ ] Champion: reach 2000 XP
  - [ ] Legend: reach 10000 XP
  - [ ] etc.
- [ ] Verify achievement badge unlocks
- [ ] Verify notification sent for unlock
- [ ] Verify stored in Firestore: `users/{uid}/achievements`

### Daily Streak
- [ ] Login to app one day
- [ ] Verify `streak` = 1 in user profile
- [ ] Login next day
- [ ] Verify `streak` = 2
- [ ] Miss a day
- [ ] Verify `streak` resets to 0

---

## Rankings & Leaderboards

### Weekly Leaderboard
- [ ] Navigate to `/ranking.html`
- [ ] Verify "This Week" tab shown
- [ ] Verify users sorted by XP earned this week
- [ ] Top user highlighted
- [ ] Check Firestore: `weeklyScores/{weekId}/scores/{uid}`
- [ ] Verify `xpThisWeek` field accumulates

### All-Time Leaderboard
- [ ] Click "All Time" tab
- [ ] Verify users sorted by total points
- [ ] Verify correct rankings shown
- [ ] Verify rank emoji displayed
- [ ] Verify level shown

### Leaderboard Updates
- [ ] Earn XP
- [ ] Check leaderboard updates within seconds
- [ ] Verify position changes if applicable
- [ ] Verify scores are real-time

### Week Reset
- [ ] At start of week (Monday)
- [ ] Verify `weeklyScores` reset for new week
- [ ] Verify `xpThisWeek` starts at 0 again

---

## Notifications

### Notification Types

#### Follow Notification
- [ ] User A follows User B
- [ ] User B should see notification: "User A started following you ⚔️"
- [ ] Verify stored in Firestore: `notifications/{uid}/items/{notifId}`
- [ ] Type should be "follow"

#### Like Notification
- [ ] User A likes User B's post
- [ ] User B gets notification: "User A recognized your post ❤️"
- [ ] Click notification goes to post

#### Comment Notification
- [ ] User A comments on User B's post
- [ ] User B gets notification: "User A commented on your post 💬"
- [ ] Click notification goes to post

#### Challenge Notification
- [ ] User A sends challenge invite to User B
- [ ] User B gets notification: "You've been challenged! ⚔️"
- [ ] Click notification opens challenge

#### Message Notification
- [ ] User A sends message to User B
- [ ] User B gets notification: "New message from User A 💬"
- [ ] Click notification opens conversation

### Notification Actions
- [ ] Click notification in bell icon
- [ ] Verify navigates to relevant page
- [ ] Verify marked as read in Firestore

### Notification Settings
- [ ] Go to Settings page
- [ ] Verify notification toggles exist
- [ ] Toggle off a notification type
- [ ] Verify no longer receive that type

---

## Mobile & PWA

### Responsive Design
- [ ] Test on mobile (iPhone/Android)
- [ ] All buttons touch-friendly (44x44px minimum)
- [ ] Text readable at mobile size
- [ ] Images responsive
- [ ] No horizontal scrolling
- [ ] Forms properly sized

### PWA Installation

#### Android (Chrome)
- [ ] Open app in Chrome
- [ ] Menu → "Install app"
- [ ] Verify installs to home screen
- [ ] Open from home screen
- [ ] Verify opens in standalone mode
- [ ] Verify top chrome hidden

#### iOS (Safari)
- [ ] Open app in Safari
- [ ] Share → "Add to Home Screen"
- [ ] Verify adds to home screen
- [ ] Open from home screen
- [ ] Verify opens in fullscreen

### Offline Functionality
- [ ] Install as PWA
- [ ] Enable Airplane Mode
- [ ] Navigate between cached pages
- [ ] Verify pages load from cache
- [ ] Verify Service Worker active
- [ ] Go online
- [ ] Verify new data syncs

### Push Notifications (if configured)
- [ ] Grant notification permission
- [ ] Have another user send challenge/message
- [ ] Verify push notification appears
- [ ] Click notification
- [ ] Verify navigates to relevant page

---

## Error Handling

### Network Error Handling
- [ ] Simulate network error (DevTools > Offline)
- [ ] Try to create post
- [ ] Verify graceful error message
- [ ] Restore network
- [ ] Verify retry works

### Firebase Auth Errors
- [ ] Try login with invalid email format
- [ ] Verify error message shown
- [ ] Try login with wrong password
- [ ] Verify "Invalid credentials" message

### File Upload Errors
- [ ] Try upload file > 8MB
- [ ] Verify error: "File must be less than 8MB"
- [ ] Try upload non-image file
- [ ] Verify error message shown

### Firestore Permission Errors
- [ ] (Requires testing with rules)
- [ ] Verify graceful error handling
- [ ] Verify no crash, proper message shown

---

## Performance

### Page Load Time
- [ ] Open index.html
- [ ] Measure time to first paint (< 2 seconds on LTE)
- [ ] Measure time to interactive (< 4 seconds on LTE)

### JavaScript Execution
- [ ] Open DevTools Performance tab
- [ ] Record page load
- [ ] Verify no long tasks (> 50ms)
- [ ] Verify main thread not blocked

### Network Waterfall
- [ ] Open DevTools Network tab
- [ ] Verify assets load in parallel
- [ ] Verify no render-blocking scripts
- [ ] Verify CSS/JS cached after first load

### Memory Usage
- [ ] Open DevTools Memory tab
- [ ] Load app and navigate around
- [ ] Verify memory doesn't continuously grow
- [ ] Verify no memory leaks

### Large Feed Performance
- [ ] Scroll through feed with 100+ posts
- [ ] Verify smooth scrolling (60fps)
- [ ] Verify lazy-loading of images
- [ ] Verify no jank or freezing

---

## Accessibility

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus visible on all elements
- [ ] Verify Enter key works on buttons
- [ ] Verify Escape closes modals

### Screen Reader Support
- [ ] Use screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify page structure announced correctly
- [ ] Verify button labels announced
- [ ] Verify image alt text read

### Color Contrast
- [ ] Check color contrast ratios
- [ ] Verify white text on dark background
- [ ] Verify no contrast issues in DevTools

---

## Data Integrity

### Firestore Documents
- [ ] Verify all user documents have required fields
- [ ] Verify timestamps are server-generated
- [ ] Verify references use document IDs
- [ ] Verify no missing subcollections

### Storage Files
- [ ] Verify all uploaded images exist
- [ ] Verify image URLs are valid
- [ ] Verify file sizes reasonable
- [ ] Verify broken links don't occur

### Consistency
- [ ] Create post → feed updates immediately
- [ ] Like post → like count increments
- [ ] XP earned → balance updates
- [ ] All operations are consistent

---

## Browser Compatibility

- [ ] Chrome 90+ ✅
- [ ] Firefox 88+ ✅
- [ ] Safari 14+ ✅
- [ ] Edge 90+ ✅
- [ ] Mobile Chrome ✅
- [ ] Mobile Safari ✅
- [ ] Samsung Internet ✅

---

## Sign-Off

- [ ] All tests passed
- [ ] No critical issues found
- [ ] No P0 bugs blocking release
- [ ] Ready for production deployment

**Tested By**: _________________  
**Date**: _________________  
**Sign-Off**: _________________

---

**END OF TESTING CHECKLIST**
