import { auth, db, COL } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp, onSnapshot, updateDoc, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { formatTime, getInitials } from './utils.js';
import { getOptimizedUrl } from './profile-service.js';

let currentUser = null;
let currentConversationId = null;
let currentChatPartnerId = null;
let conversationUnsubscribe = null;
let messagesUnsubscribe = null;
let onlineUsersUnsubscribe = null;
let onlineUsers = new Set();
let unreadCounts = {};

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════

export function initMessagesPage() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    currentUser = user;
    setupEventListeners();
    loadConversations();
    setupOnlineStatusListener();
    setupLogout();
  });
}

function setupEventListeners() {
  document.getElementById('new-chat-btn').addEventListener('click', openNewChatModal);
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('back-btn').addEventListener('click', backToList);
  document.getElementById('message-input').addEventListener('input', handleMessageInput);
  document.getElementById('message-input').addEventListener('keydown', handleMessageKeydown);
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('new-chat-search').addEventListener('input', handleNewChatSearch);
  document.getElementById('new-chat-modal').addEventListener('click', handleModalClose);

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.replace('login.html');
  });
}

// ═══════════════════════════════════════════════════════
// CONVERSATION LIST
// ═══════════════════════════════════════════════════════

async function loadConversations() {
  if (!currentUser) return;

  const conversationsRef = collection(db, COL.CONVERSATIONS);
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUser.uid),
    orderBy('lastMessageAt', 'desc')
  );

  if (conversationUnsubscribe) conversationUnsubscribe();

  conversationUnsubscribe = onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (conversations.length === 0) {
      document.getElementById('empty-state').classList.remove('hidden');
      document.getElementById('conversations-list').innerHTML = '';
    } else {
      document.getElementById('empty-state').classList.add('hidden');
      renderConversations(conversations);
    }

    updateUnreadBadge();
  });
}

async function renderConversations(conversations) {
  const listEl = document.getElementById('conversations-list');

  // Fetch user data for all conversations
  const userCache = {};
  const userIds = new Set();

  conversations.forEach(conv => {
    conv.participants?.forEach(id => {
      if (id !== currentUser.uid) userIds.add(id);
    });
  });

  for (const userId of userIds) {
    try {
      const userDoc = await getDoc(doc(db, COL.USERS, userId));
      if (userDoc.exists()) {
        userCache[userId] = userDoc.data();
      } else {
        userCache[userId] = { displayName: 'Wojownik', avatar: null };
      }
    } catch (err) {
      console.error(`Error loading user ${userId}:`, err);
      userCache[userId] = { displayName: 'Wojownik', avatar: null };
    }
  }

  listEl.innerHTML = conversations.map(conv => {
    const otherUserId = conv.participants?.find(id => id !== currentUser.uid);
    const userData = userCache[otherUserId] || { displayName: 'Wojownik', avatar: null };
    const unreadCount = unreadCounts[conv.id] || 0;
    const isOnline = onlineUsers.has(otherUserId);

    return `
      <div class="conversation-item" data-id="${conv.id}" data-user="${otherUserId}">
        <div class="conversation-avatar">
          ${renderAvatar(userData.displayName, userData.avatar)}
          ${isOnline ? '<span class="online-indicator"></span>' : ''}
        </div>

        <div class="conversation-content">
          <div class="conversation-header">
            <h3 class="conversation-name">${userData.displayName || 'Wojownik'}</h3>
            <span class="conversation-time">${formatTime(conv.lastMessageAt?.toDate() || new Date())}</span>
          </div>
          <p class="conversation-message">${escapeHtml(conv.lastMessage || 'Brak wiadomości')}</p>
        </div>

        ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
      </div>
    `;
  }).join('');

  // Add click listeners
  document.querySelectorAll('.conversation-item').forEach(el => {
    el.addEventListener('click', () => {
      const convId = el.dataset.id;
      const userId = el.dataset.user;
      openChat(convId, userId);
    });
  });
}

async function loadActiveWarriors() {
  try {
    const usersRef = collection(db, COL.USERS);
    const q = query(
      usersRef,
      where('lastActive', '>', new Date(Date.now() - 5 * 60 * 1000))
    );

    const snapshot = await getDocs(q);
    const warriors = snapshot.docs
      .filter(doc => doc.id !== currentUser.uid)
      .slice(0, 6)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || 'Wojownik',
          avatar: data.avatar,
        };
      });

    if (warriors.length > 0) {
      renderActiveWarriors(warriors);
      document.getElementById('active-warriors').classList.remove('hidden');
    }
  } catch (error) {
    console.error('[Messages] Error loading active warriors:', error);
  }
}

function renderActiveWarriors(warriors) {
  const listEl = document.getElementById('active-warriors-list');
  listEl.innerHTML = warriors.map(warrior => `
    <div class="active-warrior" data-id="${warrior.id}">
      <div class="active-warrior-avatar">
        ${renderAvatar(warrior.displayName, warrior.avatar)}
        <span class="online-indicator-small"></span>
      </div>
      <span class="active-warrior-name">${warrior.displayName.split(' ')[0]}</span>
    </div>
  `).join('');

  document.querySelectorAll('.active-warrior').forEach(el => {
    el.addEventListener('click', () => {
      const userId = el.dataset.id;
      startNewConversation(userId);
    });
  });
}

// ═══════════════════════════════════════════════════════
// CHAT LOGIC
// ═══════════════════════════════════════════════════════

async function openChat(conversationId, otherUserId) {
  currentConversationId = conversationId;
  currentChatPartnerId = otherUserId;

  // Hide list, show chat
  document.getElementById('messages-list').classList.add('hidden');
  document.getElementById('chat-view').classList.remove('hidden');

  // Load other user's data
  try {
    const userDoc = await getDoc(doc(db, COL.USERS, otherUserId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      document.getElementById('chat-name').textContent = userData.displayName || 'Wojownik';
      const avatar = userData.avatar;
      if (avatar) {
        document.getElementById('chat-avatar').src = getOptimizedUrl(avatar, { width: 56, height: 56 });
      } else {
        document.getElementById('chat-avatar').src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#0B0D10"/><text x="50%" y="50%" dy=".3em" text-anchor="middle" fill="#B8B0A0" font-family="Arial" font-size="16" font-weight="700">${getInitials(userData.displayName || 'W')}</text></svg>`;
      }
    }
  } catch (err) {
    console.error('[Messages] Error loading chat user:', err);
  }

  updateChatStatus(otherUserId);

  // Load and listen to messages
  loadMessages(conversationId);
  loadActiveWarriors();

  // Mark conversation as read
  await markConversationAsRead(conversationId);
}

function loadMessages(conversationId) {
  const messagesRef = collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES);
  const q = query(
    messagesRef,
    orderBy('createdAt', 'asc'),
    limit(50)
  );

  if (messagesUnsubscribe) messagesUnsubscribe();

  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderMessages(messages);
    scrollToBottom();
  });
}

function renderMessages(messages) {
  const areaEl = document.getElementById('messages-area');
  areaEl.innerHTML = messages.map(msg => {
    const isOwn = msg.senderId === currentUser.uid;
    const timestamp = msg.createdAt?.toDate() || new Date();

    return `
      <div class="message ${isOwn ? 'message-own' : 'message-other'}">
        <div class="message-content">
          <div class="message-bubble">
            ${escapeHtml(msg.text)}
          </div>
          <span class="message-time">${formatTime(timestamp)}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function sendMessage() {
  if (!currentConversationId) return;

  const text = document.getElementById('message-input').value.trim();
  if (!text) return;

  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;

  try {
    const messagesRef = collection(db, COL.CONVERSATIONS, currentConversationId, COL.MESSAGES);

    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      text: text,
      createdAt: serverTimestamp(),
      read: false
    });

    // Update conversation
    const convRef = doc(db, COL.CONVERSATIONS, currentConversationId);
    await updateDoc(convRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp()
    });

    // Clear input
    document.getElementById('message-input').value = '';
    sendBtn.disabled = true;

    scrollToBottom();
  } catch (error) {
    console.error('[Messages] Error sending message:', error);
  }
}

function scrollToBottom() {
  const areaEl = document.getElementById('messages-area');
  setTimeout(() => {
    areaEl.scrollTop = areaEl.scrollHeight;
  }, 0);
}

// ═══════════════════════════════════════════════════════
// NEW CONVERSATION
// ═══════════════════════════════════════════════════════

function openNewChatModal() {
  document.getElementById('new-chat-modal').classList.remove('hidden');
  document.getElementById('new-chat-search').focus();
}

async function handleNewChatSearch(e) {
  const searchQuery = e.target.value.trim().toLowerCase();
  if (!searchQuery) {
    document.getElementById('new-chat-results').innerHTML = '';
    return;
  }

  try {
    const usersRef = collection(db, COL.USERS);
    const snapshot = await getDocs(usersRef);

    const results = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const name = (data.displayName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        return doc.id !== currentUser.uid && (
          name.includes(searchQuery) || email.includes(searchQuery)
        );
      })
      .slice(0, 10)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || 'Wojownik',
          avatar: data.avatar
        };
      });

    renderNewChatResults(results);
  } catch (error) {
    console.error('[Messages] Error searching users:', error);
  }
}

function renderNewChatResults(results) {
  const resultsEl = document.getElementById('new-chat-results');
  if (results.length === 0) {
    resultsEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Brak wyników</p>';
    return;
  }

  resultsEl.innerHTML = results.map(user => `
    <div class="user-result" data-id="${user.id}">
      ${renderAvatar(user.displayName, user.avatar)}
      <span>${user.displayName}</span>
    </div>
  `).join('');

  document.querySelectorAll('.user-result').forEach(el => {
    el.addEventListener('click', async () => {
      const userId = el.dataset.id;
      await startNewConversation(userId);
      document.getElementById('new-chat-modal').classList.add('hidden');
      document.getElementById('new-chat-search').value = '';
    });
  });
}

async function startNewConversation(otherUserId) {
  try {
    // Check if conversation exists
    const conversationsRef = collection(db, COL.CONVERSATIONS);
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const snapshot = await getDocs(q);
    let conversationId = null;

    snapshot.docs.forEach(convDoc => {
      const data = convDoc.data();
      if (data.participants?.includes(otherUserId)) {
        conversationId = convDoc.id;
      }
    });

    // If conversation exists, open it
    if (conversationId) {
      await openChat(conversationId, otherUserId);
      return;
    }

    // Create new conversation with standard schema (matching messenger.js)
    const newConv = await addDoc(conversationsRef, {
      participants: [currentUser.uid, otherUserId],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: '',
      unread: {
        [currentUser.uid]: 0,
        [otherUserId]: 0
      },
      createdAt: serverTimestamp()
    });

    await openChat(newConv.id, otherUserId);
  } catch (error) {
    console.error('[Messages] Error creating conversation:', error);
  }
}

// ═══════════════════════════════════════════════════════
// ONLINE STATUS & PRESENCE
// ═══════════════════════════════════════════════════════

function setupOnlineStatusListener() {
  const usersRef = collection(db, COL.USERS);
  const q = query(usersRef, limit(1000));

  onlineUsersUnsubscribe = onSnapshot(q, (snapshot) => {
    onlineUsers.clear();
    const now = Date.now();

    snapshot.docs.forEach(userDoc => {
      const data = userDoc.data();
      const lastActive = data.lastActive?.toDate?.()?.getTime() || 0;

      if (now - lastActive < 5 * 60 * 1000) {
        onlineUsers.add(userDoc.id);
      }
    });

    if (currentConversationId) {
      updateChatStatus(currentChatPartnerId);
    }

    // Update visible conversations
    document.querySelectorAll('.conversation-item').forEach(el => {
      const userId = el.dataset.user;
      const indicator = el.querySelector('.online-indicator');

      if (onlineUsers.has(userId)) {
        if (!indicator) {
          el.querySelector('.conversation-avatar').innerHTML += '<span class="online-indicator"></span>';
        }
      } else if (indicator) {
        indicator.remove();
      }
    });
  });

  // Update lastActive every minute
  updateUserPresence();
  setInterval(updateUserPresence, 60000);
}

async function updateUserPresence() {
  try {
    await updateDoc(doc(db, COL.USERS, currentUser.uid), {
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('[Messages] Error updating presence:', error);
  }
}

async function updateChatStatus(otherUserId) {
  if (!onlineUsers.has(otherUserId)) {
    try {
      const userDoc = await getDoc(doc(db, COL.USERS, otherUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastActive = userData.lastActive?.toDate?.() || new Date();
        document.getElementById('chat-status').textContent = `Ostatnio: ${formatTime(lastActive)}`;
      }
    } catch (error) {
      console.error('[Messages] Error loading user status:', error);
    }
  } else {
    document.getElementById('chat-status').textContent = 'online';
  }
}

// ═══════════════════════════════════════════════════════
// UNREAD MANAGEMENT
// ═══════════════════════════════════════════════════════

async function markConversationAsRead(conversationId) {
  try {
    const convRef = doc(db, COL.CONVERSATIONS, conversationId);
    const pathRef = `unread.${currentUser.uid}`;

    await updateDoc(convRef, {
      [pathRef]: 0
    });

    unreadCounts[conversationId] = 0;
    updateUnreadBadge();
  } catch (error) {
    console.error('[Messages] Error marking as read:', error);
  }
}

function updateUnreadBadge() {
  const total = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const badge = document.getElementById('unread-badge');

  if (total > 0) {
    badge.textContent = total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════
// SEARCH & FILTERING
// ═══════════════════════════════════════════════════════

function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();

  document.querySelectorAll('.conversation-item').forEach(el => {
    const name = el.querySelector('.conversation-name').textContent.toLowerCase();
    const message = el.querySelector('.conversation-message').textContent.toLowerCase();

    if (name.includes(query) || message.includes(query)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

// ═══════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════

function backToList() {
  document.getElementById('messages-list').classList.remove('hidden');
  document.getElementById('chat-view').classList.add('hidden');

  currentConversationId = null;
  currentChatPartnerId = null;

  if (messagesUnsubscribe) messagesUnsubscribe();
}

function handleMessageInput(e) {
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = !e.target.value.trim();

  // Auto-expand textarea
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
}

function handleMessageKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function handleModalClose(e) {
  if (e.target.id === 'new-chat-modal') {
    document.getElementById('new-chat-modal').classList.add('hidden');
  }
}

function renderAvatar(name, imageUrl) {
  if (imageUrl) {
    return `<img src="${getOptimizedUrl(imageUrl, { width: 44, height: 44 })}" alt="${name}" class="avatar av-sm" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 44 44%22><circle cx=%2222%22 cy=%2222%22 r=%2222%22 fill=%22%230B0D10%22/><text x=%2250%25%22 y=%2250%25%22 dy=%22.3em%22 text-anchor=%22middle%22 fill=%22%23B8B0A0%22 font-family=%22Arial%22 font-size=%2214%22 font-weight=%22700%22>${getInitials(name)}</text></svg>'"/>`;
  }
  return `<div class="avatar-placeholder av-sm" style="font-size:0.75rem;">${getInitials(name)}</div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.replace('login.html');
  });
}
