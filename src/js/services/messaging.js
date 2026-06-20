/**
 * WEEKEND WARRIOR SOCIAL — messenger.js
 * Complete messenger with proper event handling
 */

import { auth, db, COL, uploadImage } from "../core/firebase.js";
import {
  collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc,
  onSnapshot, orderBy, serverTimestamp, increment, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "../core/auth.js";
import { createNotification } from "./notifications.js";

let currentUser = null;
let activeConversationId = null;
let activeOtherUid = null;
let activeOtherName = null;
let allConversations = [];
let onlineUsers = [];
let unsubConversations = null;
let unsubMessages = null;
let unsubOnlineUsers = null;
let pendingImage = null;

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initMessenger(uid) {
  if (!uid) return console.error('[messenger] No UID');
  currentUser = { uid };
  setupEventListeners();
  loadConversations();
  loadOnlineUsers();
}

function setupEventListeners() {
  // Back button
  document.getElementById('back-btn')?.addEventListener('click', closeChat);

  // Profile button
  document.getElementById('profile-btn')?.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });

  // Message input
  const input = document.getElementById('msg-input');
  if (input) {
    input.addEventListener('input', () => {
      autoResizeInput(input);
      updateSendBtnState();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Send button
  document.getElementById('send-btn')?.addEventListener('click', sendMessage);

  // File handling
  const fileBtn = document.getElementById('file-btn');
  const fileInput = document.getElementById('file-input');

  if (fileBtn) fileBtn.addEventListener('click', () => fileInput?.click());
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        showToast('❌ Zdjęcie max 8 MB', 'error');
        return;
      }
      pendingImage = file;
      fileInput.value = '';
      updateSendBtnState();
    });
  }
}

// ════════════════════════════════════════════════════════════
// LOAD ONLINE USERS
// ════════════════════════════════════════════════════════════

function loadOnlineUsers() {
  if (!currentUser?.uid) return;

  const q = query(
    collection(db, COL.USERS),
    where('online', '==', true)
  );

  unsubOnlineUsers = onSnapshot(q, (snap) => {
    onlineUsers = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.uid !== currentUser.uid)
      .slice(0, 10);
    renderOnlineUsers();
  }, (err) => {
    console.error('[loadOnlineUsers]', err);
  });
}

function renderOnlineUsers() {
  const list = document.getElementById('online-list');
  if (!list) return;

  if (onlineUsers.length === 0) {
    list.innerHTML = '<div style="padding:1rem;color:var(--text-muted);font-size:0.875rem;">Brak dostępnych</div>';
    return;
  }

  list.innerHTML = '';

  onlineUsers.forEach(user => {
    const avatar = document.createElement('div');
    avatar.className = 'online-avatar';
    avatar.title = user.username || 'Wojownik';
    avatar.onclick = () => openOrCreateChat(user.uid, user.username);

    const initials = user.username?.charAt(0).toUpperCase() || 'U';
    if (user.avatar) {
      avatar.innerHTML = `<img src="${escapeHtml(user.avatar)}" alt="" />`;
    } else {
      avatar.textContent = initials;
    }

    list.appendChild(avatar);
  });
}

// ════════════════════════════════════════════════════════════
// LOAD CONVERSATIONS
// ════════════════════════════════════════════════════════════

function loadConversations() {
  if (!currentUser?.uid) return;

  if (unsubConversations) unsubConversations();

  const q = query(
    collection(db, COL.CONVERSATIONS),
    where('participants', 'array-contains', currentUser.uid),
    orderBy('lastMessageAt', 'desc')
  );

  unsubConversations = onSnapshot(q, (snap) => {
    allConversations = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderConversations();
  }, (err) => {
    console.error('[loadConversations]', err);
  });
}

async function renderConversations() {
  const list = document.getElementById('chats-list');
  if (!list) return;

  if (allConversations.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div>Brak rozmów</div></div>`;
    return;
  }

  list.innerHTML = '';

  for (const conv of allConversations) {
    const otherUid = (conv.participants || []).find(u => u !== currentUser.uid);
    if (!otherUid) continue;

    try {
      const userSnap = await getDoc(doc(db, COL.USERS, otherUid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      const unreadCount = conv.unread?.[currentUser.uid] || 0;
      const hasUnread = unreadCount > 0;

      const item = document.createElement('div');
      item.className = `chat-item${hasUnread ? ' unread' : ''}`;
      item.dataset.convId = conv.id;
      item.dataset.otherUid = otherUid;
      item.dataset.otherName = userData.username || 'Wojownik';

      const initials = userData.username?.charAt(0).toUpperCase() || 'U';

      item.innerHTML = `
        <div class="chat-avatar">
          ${userData.avatar 
            ? `<img src="${escapeHtml(userData.avatar)}" alt="" />` 
            : initials}
        </div>
        <div class="chat-info">
          <div class="chat-name">${escapeHtml(userData.username || 'Wojownik')}</div>
          <div class="chat-preview">${escapeHtml((conv.lastMessage || '').substring(0, 50))}</div>
        </div>
        <div>
          <div class="chat-time">${formatTime(conv.lastMessageAt)}</div>
          ${hasUnread ? `<div class="unread-badge" style="margin-top:0.5rem;">${unreadCount > 9 ? '9+' : unreadCount}</div>` : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        openChat(conv.id, otherUid, userData.username);
      });

      list.appendChild(item);
    } catch (err) {
      console.error('[renderConversations]', err);
    }
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || timestamp;
  if (!(date instanceof Date) || isNaN(date)) return '';
  
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'teraz';
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
}

// ════════════════════════════════════════════════════════════
// OPEN/CREATE CHAT
// ════════════════════════════════════════════════════════════

async function openOrCreateChat(otherUid, otherName) {
  // Find existing conversation
  const existing = allConversations.find(c => 
    c.participants?.includes(otherUid) && c.participants?.includes(currentUser.uid)
  );

  if (existing) {
    openChat(existing.id, otherUid, otherName);
  } else {
    // Create new conversation
    try {
      const sorted = [currentUser.uid, otherUid].sort();
      const docRef = await addDoc(collection(db, COL.CONVERSATIONS), {
        participants: sorted,
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        lastSenderId: '',
        unread: Object.fromEntries(sorted.map(u => [u, 0])),
        createdAt: serverTimestamp(),
      });
      openChat(docRef.id, otherUid, otherName);
    } catch (err) {
      console.error('[createConversation]', err);
      showToast('❌ Błąd', 'error');
    }
  }
}

async function openChat(convId, otherUid, otherName) {
  activeConversationId = convId;
  activeOtherUid = otherUid;
  activeOtherName = otherName;

  // Show modal
  const modal = document.getElementById('chat-modal');
  if (modal) modal.classList.add('active');

  // Update header
  document.getElementById('modal-name').textContent = otherName || 'Wojownik';
  document.getElementById('modal-status').textContent = 'Ładowanie...';

  // Get user data for status
  try {
    const userSnap = await getDoc(doc(db, COL.USERS, otherUid));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      document.getElementById('modal-status').textContent = userData.online 
        ? '🟢 Online' 
        : 'Offline';
    }
  } catch (err) {
    console.error('[openChat]', err);
  }

  // Load messages
  loadMessages(convId);

  // Mark as read
  markMessagesAsRead(convId);
}

function closeChat() {
  const modal = document.getElementById('chat-modal');
  if (modal) modal.classList.remove('active');
  
  activeConversationId = null;
  activeOtherUid = null;
  
  if (unsubMessages) {
    unsubMessages();
    unsubMessages = null;
  }

  document.getElementById('msg-input').value = '';
  pendingImage = null;
  autoResizeInput(document.getElementById('msg-input'));
  updateSendBtnState();
}

// ════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════

function loadMessages(convId) {
  if (!convId) return;

  if (unsubMessages) unsubMessages();

  const q = query(
    collection(db, COL.CONVERSATIONS, convId, COL.MESSAGES),
    orderBy('createdAt', 'asc')
  );

  unsubMessages = onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderMessages(messages);
  }, (err) => {
    console.error('[loadMessages]', err);
  });
}

function renderMessages(messages) {
  const container = document.getElementById('messages-container');
  if (!container) return;

  container.innerHTML = '';

  messages.forEach(msg => {
    const isMine = msg.senderId === currentUser.uid;

    const msgEl = document.createElement('div');
    msgEl.className = `message${isMine ? ' mine' : ''}`;

    let content = '';
    
    if (msg.imageUrl) {
      content += `<img src="${escapeHtml(msg.imageUrl)}" alt="Zdjęcie" class="message-image" onclick="window.open('${escapeHtml(msg.imageUrl)}','_blank')">`;
    }
    
    if (msg.content) {
      content += `<div class="message-bubble">${escapeHtml(msg.content)}</div>`;
    }

    msgEl.innerHTML = content;
    container.appendChild(msgEl);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// ════════════════════════════════════════════════════════════
// SEND MESSAGE
// ════════════════════════════════════════════════════════════

async function sendMessage() {
  if (!activeConversationId || !currentUser) return;

  const input = document.getElementById('msg-input');
  const text = input?.value.trim() || '';
  
  if (!text && !pendingImage) return;

  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = true;

  try {
    let imageUrl = '';
    
    if (pendingImage) {
      showToast('⏳ Przesyłanie...', 'info');
      try {
        imageUrl = await uploadImage(pendingImage, `messages/${activeConversationId}/${currentUser.uid}_${Date.now()}.jpg`);
      } catch (err) {
        showToast('❌ Błąd zdjęcia', 'error');
        throw err;
      }
    }

    // Get user data
    const userSnap = await getDoc(doc(db, COL.USERS, currentUser.uid));
    const userName = userSnap.exists() ? userSnap.data().username || 'Wojownik' : 'Wojownik';

    // Send message
    await addDoc(collection(db, COL.CONVERSATIONS, activeConversationId, COL.MESSAGES), {
      senderId: currentUser.uid,
      senderName: userName,
      content: text || '',
      imageUrl: imageUrl || '',
      read: false,
      createdAt: serverTimestamp(),
    });

    // Update conversation
    const conv = await getDoc(doc(db, COL.CONVERSATIONS, activeConversationId));
    if (conv.exists()) {
      const participants = conv.data().participants || [];
      const otherUid = participants.find(u => u !== currentUser.uid);

      const updates = {
        lastMessage: imageUrl && !text ? '📷 Zdjęcie' : (text || '').substring(0, 60),
        lastMessageAt: serverTimestamp(),
        lastSenderId: currentUser.uid,
      };

      if (otherUid) {
        updates[`unread.${otherUid}`] = increment(1);
      }

      await updateDoc(doc(db, COL.CONVERSATIONS, activeConversationId), updates);

      // Notification
      if (otherUid) {
        try {
          createNotification(otherUid, {
            type: 'message',
            title: `${userName} przesyła wieści ✉️`,
            body: imageUrl && !text ? '📷 Zdjęcie' : (text || '').substring(0, 60),
            url: `messenger.html`,
            relatedUid: currentUser.uid,
          });
        } catch (err) {
          console.error('[notification]', err);
        }
      }
    }

    // Clear
    if (input) input.value = '';
    autoResizeInput(input);
    pendingImage = null;
    updateSendBtnState();

  } catch (err) {
    console.error('[sendMessage]', err);
    showToast('❌ Błąd', 'error');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

async function markMessagesAsRead(convId) {
  if (!convId || !currentUser) return;

  try {
    await updateDoc(doc(db, COL.CONVERSATIONS, convId), {
      [`unread.${currentUser.uid}`]: 0,
    });

    const q = query(
      collection(db, COL.CONVERSATIONS, convId, COL.MESSAGES),
      where('read', '==', false)
    );
    
    const snap = await getDocs(q);
    const toMark = snap.docs.filter(d => d.data().senderId !== currentUser.uid);
    
    if (toMark.length > 0) {
      const batch = writeBatch(db);
      toMark.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    }
  } catch (err) {
    console.error('[markMessagesAsRead]', err);
  }
}

// ════════════════════════════════════════════════════════════
// PRESENCE & EXPORTS
// ════════════════════════════════════════════════════════════

export async function setOnlinePresence(uid, online) {
  if (!uid) return;
  try {
    await updateDoc(doc(db, COL.USERS, uid), {
      online: !!online,
      lastSeen: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[presence]', err.code);
  }
}

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

function autoResizeInput(input) {
  if (!input) return;
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 100) + 'px';
}

function updateSendBtnState() {
  const input = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const hasText = input?.value.trim().length > 0;
  const hasImage = !!pendingImage;
  
  if (sendBtn) {
    sendBtn.disabled = !hasText && !hasImage;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
