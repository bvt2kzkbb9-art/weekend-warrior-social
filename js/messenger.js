/**
 * WEEKEND WARRIOR SOCIAL — messenger.js
 * Working messenger with proper event handling
 */

import { auth, db, COL, uploadImage } from "./firebase.js";
import {
  collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc,
  onSnapshot, orderBy, serverTimestamp, increment, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";
import { createNotification } from "./notifications.js";

let currentUser = null;
let activeConversationId = null;
let activeOtherUid = null;
let allConversations = [];
let unsubConversations = null;
let unsubMessages = null;
let pendingImage = null;

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initMessenger(uid) {
  if (!uid) return console.error('[messenger] No UID');
  currentUser = { uid };
  setupEventListeners();
  loadConversations();
}

function setupEventListeners() {
  // Back button
  const backBtn = document.getElementById('chat-back-btn');
  if (backBtn) backBtn.addEventListener('click', goBackToConversations);

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
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);

  // Image handling
  const fileBtn = document.getElementById('file-btn');
  const fileInput = document.getElementById('file-input');
  const imgRemoveBtn = document.getElementById('img-remove-btn');

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
      const preview = document.getElementById('img-preview');
      if (preview) {
        preview.querySelector('img').src = URL.createObjectURL(file);
        preview.classList.add('show');
      }
      fileInput.value = '';
      updateSendBtnState();
    });
  }

  if (imgRemoveBtn) imgRemoveBtn.addEventListener('click', clearImagePreview);

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterConversations(query);
    });
  }
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
    renderConversations(allConversations);
  }, (err) => {
    console.error('[loadConversations]', err);
  });
}

async function renderConversations(conversations) {
  const list = document.getElementById('conv-list');
  if (!list) return;

  if (conversations.length === 0) {
    list.innerHTML = `<div style="padding:2rem 1rem;text-align:center;color:var(--text-muted);font-size:0.875rem;">Brak rozmów</div>`;
    return;
  }

  list.innerHTML = '';

  for (const conv of conversations) {
    const otherUid = (conv.participants || []).find(u => u !== currentUser.uid);
    if (!otherUid) continue;

    try {
      const userSnap = await getDoc(doc(db, COL.USERS, otherUid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      const unreadCount = conv.unread?.[currentUser.uid] || 0;
      const hasUnread = unreadCount > 0;
      
      const item = document.createElement('div');
      item.className = `conv-item${activeConversationId === conv.id ? ' active' : ''}${hasUnread ? ' unread' : ''}`;
      
      // IMPORTANT: Store convId and otherUid as data attributes for click handling
      item.dataset.convId = conv.id;
      item.dataset.otherUid = otherUid;

      const avatarText = userData.displayName?.charAt(0).toUpperCase() || 'U';
      const onlineClass = userData.online ? 'online' : '';
      
      item.innerHTML = `
        <div class="conv-avatar ${onlineClass}">
          ${userData.photoURL 
            ? `<img src="${escapeHtml(userData.photoURL)}" alt="" />` 
            : avatarText}
        </div>
        <div class="conv-info">
          <div class="conv-name">${escapeHtml(userData.displayName || 'Wojownik')}</div>
          <div class="conv-preview">${escapeHtml((conv.lastMessage || '').substring(0, 50))}</div>
        </div>
        <div class="conv-meta">
          <div class="conv-time">${formatTime(conv.lastMessageAt)}</div>
          ${hasUnread ? `<div class="conv-unread-badge">${unreadCount > 9 ? '9+' : unreadCount}</div>` : ''}
        </div>
      `;

      // Add click listener
      item.addEventListener('click', () => {
        openConversation(conv.id, otherUid);
      });

      list.appendChild(item);
    } catch (err) {
      console.error('[renderConversations] error:', err);
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

function filterConversations(query) {
  if (!query) {
    renderConversations(allConversations);
    return;
  }

  // TODO: Better filtering with user data cache
  renderConversations(allConversations);
}

// ════════════════════════════════════════════════════════════
// OPEN CONVERSATION
// ════════════════════════════════════════════════════════════

async function openConversation(convId, otherUid) {
  activeConversationId = convId;
  activeOtherUid = otherUid;
  
  // Mobile: hide list, show chat
  const sidebar = document.getElementById('conv-sidebar');
  const chatPanel = document.getElementById('chat-panel');
  
  if (window.innerWidth <= 768) {
    if (sidebar) sidebar.classList.add('hidden');
  }
  if (chatPanel) chatPanel.classList.remove('hidden');

  // Update active state in list
  document.querySelectorAll('.conv-item').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelector(`[data-conv-id="${convId}"]`)?.classList.add('active');

  // Load user info
  try {
    const userSnap = await getDoc(doc(db, COL.USERS, otherUid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    updateChatHeader(userData, otherUid);
  } catch (err) {
    console.error('[openConversation]', err);
  }

  // Load messages
  loadMessages(convId);

  // Mark as read
  markMessagesAsRead(convId);
}

function updateChatHeader(userData, otherUid) {
  const avatar = document.getElementById('chat-avatar');
  const name = document.getElementById('chat-name');
  const status = document.getElementById('chat-status');

  const avatarText = userData.displayName?.charAt(0).toUpperCase() || 'U';

  if (avatar) {
    if (userData.photoURL) {
      avatar.innerHTML = `<img src="${escapeHtml(userData.photoURL)}" alt="" />`;
    } else {
      avatar.textContent = avatarText;
    }
  }

  if (name) name.textContent = userData.displayName || 'Wojownik';

  if (status) {
    if (userData.online) {
      status.innerHTML = '<span class="online-dot"></span> Online';
    } else {
      status.textContent = 'Offline';
    }
  }
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
  const area = document.getElementById('messages-area');
  if (!area) return;

  if (messages.length === 0) {
    area.innerHTML = '<div class="messages-area-empty">Zacznij rozmowę!</div>';
    return;
  }

  area.innerHTML = '';

  messages.forEach(msg => {
    const date = msg.createdAt?.toDate?.() || new Date();
    const isMine = msg.senderId === currentUser.uid;

    const group = document.createElement('div');
    group.className = `msg-group${isMine ? ' mine' : ''}`;

    if (!isMine) {
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.textContent = msg.senderName?.charAt(0).toUpperCase() || 'U';
      group.appendChild(avatar);
    }

    const wrap = document.createElement('div');
    wrap.className = 'msg-bubble-wrap';

    if (msg.imageUrl) {
      const img = document.createElement('img');
      img.src = escapeHtml(msg.imageUrl);
      img.alt = 'Zdjęcie';
      img.className = 'msg-image';
      img.onclick = () => window.open(msg.imageUrl, '_blank');
      wrap.appendChild(img);
    }

    if (msg.content) {
      const bubble = document.createElement('div');
      bubble.className = `msg-bubble ${isMine ? 'mine' : 'other'}`;
      bubble.innerHTML = linkify(escapeHtml(msg.content));
      wrap.appendChild(bubble);
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'msg-time';
    const time = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    timeDiv.textContent = time;
    wrap.appendChild(timeDiv);

    if (isMine) {
      group.appendChild(wrap);
    } else {
      group.appendChild(wrap);
    }

    area.appendChild(group);
  });

  // Scroll to bottom
  area.scrollTop = area.scrollHeight;
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
      showToast('⏳ Przesyłanie...', 'info', 2000);
      try {
        imageUrl = await uploadImage(pendingImage, `messages/${activeConversationId}/${currentUser.uid}_${Date.now()}.jpg`);
      } catch (err) {
        showToast('❌ Błąd zdjęcia', 'error');
        console.error('[uploadImage]', err);
        throw err;
      }
    }

    // Get user data
    const userSnap = await getDoc(doc(db, COL.USERS, currentUser.uid));
    const userName = userSnap.exists() ? userSnap.data().displayName || 'Wojownik' : 'Wojownik';

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
    clearImagePreview();
    updateSendBtnState();
    showToast('✓ Wysłano', 'success', 1000);

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
// UI HELPERS
// ════════════════════════════════════════════════════════════

function goBackToConversations() {
  const sidebar = document.getElementById('conv-sidebar');
  const chatPanel = document.getElementById('chat-panel');
  
  if (sidebar) sidebar.classList.remove('hidden');
  if (chatPanel) chatPanel.classList.add('hidden');
  
  activeConversationId = null;
  activeOtherUid = null;
  
  if (unsubMessages) {
    unsubMessages();
    unsubMessages = null;
  }
}

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

function clearImagePreview() {
  pendingImage = null;
  const preview = document.getElementById('img-preview');
  if (preview) {
    preview.classList.remove('show');
    preview.querySelector('img').src = '';
  }
  updateSendBtnState();
}

// ════════════════════════════════════════════════════════════
// PRESENCE
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

export function injectMessengerBadge(uid) {
  if (!uid) return;
  
  const badge = document.querySelector('[id*="msg-badge"]');
  if (!badge) return;

  const q = query(
    collection(db, COL.CONVERSATIONS),
    where('participants', 'array-contains', uid)
  );

  onSnapshot(q, (snap) => {
    let total = 0;
    snap.docs.forEach(doc => {
      const data = doc.data();
      total += data.unread?.[uid] || 0;
    });
    
    badge.textContent = total > 9 ? '9+' : String(total);
    badge.style.display = total > 0 ? 'inline-flex' : 'none';
  });
}

export async function createConversation(participants) {
  try {
    const sorted = [...participants].sort();
    const existingQ = query(
      collection(db, COL.CONVERSATIONS),
      where('participants', '==', sorted)
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) return existing.docs[0].id;

    const docRef = await addDoc(collection(db, COL.CONVERSATIONS), {
      participants: sorted,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: '',
      unread: Object.fromEntries(sorted.map(u => [u, 0])),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('[createConversation]', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

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

function linkify(text) {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener" style="text-decoration:underline;color:inherit;">$1</a>'
  );
}
