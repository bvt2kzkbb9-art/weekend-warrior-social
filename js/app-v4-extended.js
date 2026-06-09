import {
  auth, db, COL,
  collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp,
  arrayUnion, arrayRemove
} from './firebase.js';

import {
  checkAuth, logout, showToast, getCurrentUserData
} from './auth.js';

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED APP STATE
// ═══════════════════════════════════════════════════════════════════════════

export const appStateExtended = {
  currentUser: null,
  currentUserData: null,
  conversations: [],
  currentConversation: null,
  messages: [],
  notifications: [],
  achievements: [],
  unsubscribes: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

export function initializeExtendedApp() {
  checkAuth((user, userData) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    appStateExtended.currentUser = user;
    appStateExtended.currentUserData = userData || {};

    setupRealtimeListeners();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupRealtimeListeners() {
  if (!appStateExtended.currentUser) return;

  // Listen to conversations
  const convQuery = query(
    collection(db, COL.CONVERSATIONS),
    orderBy('lastMessageTime', 'desc')
  );
  const unsubConv = onSnapshot(convQuery, (snap) => {
    appStateExtended.conversations = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(conv =>
        conv.participants?.includes(appStateExtended.currentUser.uid)
      );
    renderChatList();
  }, (err) => console.error('Conversations listener error:', err));

  // Listen to notifications
  const notifRef = doc(db, 'notifications', appStateExtended.currentUser.uid);
  const unsubNotif = onSnapshot(notifRef, (snap) => {
    const notifData = snap.data();
    appStateExtended.notifications = notifData?.items || [];
    updateNotificationBadge();
    renderNotifications();
  }, (err) => console.error('Notifications listener error:', err));

  // Listen to achievements
  const achievRef = collection(db, `user_achievements/${appStateExtended.currentUser.uid}/achievements`);
  const unsubAchiev = onSnapshot(achievRef, (snap) => {
    appStateExtended.achievements = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderAchievements();
  }, (err) => console.error('Achievements listener error:', err));

  appStateExtended.unsubscribes = [unsubConv, unsubNotif, unsubAchiev];
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function renderChatList() {
  const container = document.getElementById('chat-list');
  if (!container || appStateExtended.conversations.length === 0) return;

  container.innerHTML = appStateExtended.conversations.map(conv => `
    <div class="chat-item" onclick="window.appV4Extended.selectConversation('${conv.id}')">
      <div class="chat-item-name">${conv.otherUserName || 'Unknown'}</div>
      <div class="chat-item-preview">${conv.lastMessage || 'Brak wiadomości'}</div>
      ${conv.unreadCount ? `<div class="chat-unread">${conv.unreadCount}</div>` : ''}
    </div>
  `).join('');
}

function renderNotifications() {
  const container = document.getElementById('notifications-list') ||
                   document.querySelector('[id*="notification"]')?.parentElement;
  if (!container) return;

  if (appStateExtended.notifications.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Brak powiadomień</p>';
    return;
  }

  container.innerHTML = appStateExtended.notifications.map(notif => `
    <div class="notification-item">
      <div class="notification-type">${notif.type || '📢'} ${notif.typeLabel || 'Powiadomienie'}</div>
      <div class="notification-text">${notif.message || ''}</div>
      <div class="notification-time">${formatTime(notif.createdAt)}</div>
      ${notif.actionUrl ? `<button class="btn btn-small" onclick="window.location.href='${notif.actionUrl}'">Sprawdź</button>` : ''}
    </div>
  `).join('');
}

function renderAchievements() {
  const container = document.querySelector('.achievements-grid');
  if (!container) return;

  const achievementTemplates = [
    { id: 1, icon: '🎖️', title: 'Pierwszy Krok', desc: 'Ukończ wyzwanie' },
    { id: 2, icon: '🔥', title: '7 Dni Serii', desc: '7 dni bez przerwy' },
    { id: 3, icon: '⭐', title: '5 Zwycięstw', desc: 'Wygraj 5 wyzwań' },
    { id: 4, icon: '👑', title: 'Legenda', desc: 'Osiągnij poziom 30' },
    { id: 5, icon: '💎', title: 'Champion', desc: 'Bądź #1' },
    { id: 6, icon: '🌍', title: 'Światowiec', desc: 'Wszystkie typy' },
  ];

  const unlockedIds = appStateExtended.achievements.map(a => a.id);

  container.innerHTML = achievementTemplates.map(template => {
    const isUnlocked = unlockedIds.includes(template.id);
    const achieved = appStateExtended.achievements.find(a => a.id === template.id);

    return `
      <div class="achievement-card" style="${isUnlocked ? '' : 'opacity: 0.5;'}">
        <div class="achievement-icon">${template.icon}</div>
        <div class="achievement-title">${template.title}</div>
        <div class="achievement-desc">${template.desc}</div>
        <div class="achievement-progress">
          <div class="achievement-bar" style="width: ${isUnlocked ? '100' : '0'}%;"></div>
        </div>
        <div style="color: ${isUnlocked ? 'var(--gold)' : 'var(--text-secondary)'}; font-size: 12px; margin-top: 8px;">
          ${isUnlocked ? '✓ Zdobyte' : 'Zablokowane'}
        </div>
      </div>
    `;
  }).join('');
}

function updateNotificationBadge() {
  const badge = document.querySelector('[data-screen="screen-notifications"] .nav-badge');
  if (badge) {
    const count = appStateExtended.notifications.filter(n => !n.read).length;
    badge.textContent = count > 0 ? count : '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function selectConversation(convId) {
  appStateExtended.currentConversation = convId;

  // Load messages
  const messagesRef = collection(db, `${COL.CONVERSATIONS}/${convId}/messages`);
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));

  const unsubMessages = onSnapshot(messagesQuery, (snap) => {
    appStateExtended.messages = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderMessages();
  });

  appStateExtended.unsubscribes.push(unsubMessages);
}

function renderMessages() {
  const container = document.querySelector('.chat-messages');
  if (!container || !appStateExtended.currentConversation) return;

  container.innerHTML = appStateExtended.messages.map(msg => `
    <div class="message ${msg.senderId === appStateExtended.currentUser.uid ? 'own' : 'other'}">
      ${msg.content}
    </div>
  `).join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

export async function sendMessage(content) {
  if (!content.trim() || !appStateExtended.currentConversation) return;

  try {
    const messagesRef = collection(
      db,
      `${COL.CONVERSATIONS}/${appStateExtended.currentConversation}/messages`
    );

    await addDoc(messagesRef, {
      senderId: appStateExtended.currentUser.uid,
      content: content.trim(),
      timestamp: serverTimestamp(),
      read: false
    });

    // Update conversation lastMessage
    const convRef = doc(db, COL.CONVERSATIONS, appStateExtended.currentConversation);
    await updateDoc(convRef, {
      lastMessage: content.trim(),
      lastMessageTime: serverTimestamp()
    });

    showToast('✓ Wiadomość wysłana', 'success');
  } catch (err) {
    showToast('❌ Błąd przy wysyłaniu', 'error');
    console.error('Send message error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function markNotificationsRead(ids) {
  try {
    const notifRef = doc(db, 'notifications', appStateExtended.currentUser.uid);
    await updateDoc(notifRef, {
      items: appStateExtended.notifications.map(n => ({
        ...n,
        read: ids.includes(n.id) ? true : n.read
      }))
    });
  } catch (err) {
    console.error('Mark read error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function formatTime(timestamp) {
  if (!timestamp) return 'Niedawno';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minut temu`;
  if (hours < 24) return `${hours} godzin temu`;
  if (days < 7) return `${days} dni temu`;

  return date.toLocaleDateString('pl-PL');
}

export function handleLogout() {
  appStateExtended.unsubscribes.forEach(unsub => unsub?.());
  logout();
}

export function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-screen="${screenId}"]`)?.classList.add('active');

  window.scrollTo(0, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

export function cleanupExtendedApp() {
  appStateExtended.unsubscribes.forEach(unsub => unsub?.());
  appStateExtended.unsubscribes = [];
}

// Export for global access
window.appV4Extended = {
  initializeExtendedApp,
  selectConversation,
  sendMessage,
  markNotificationsRead,
  handleLogout,
  switchScreen,
  cleanupExtendedApp,
  getAppState: () => appStateExtended
};
