/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — messenger.js
 * Prywatny czat 1:1 (DM)
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * TECHNOLOGIA REALTIME: Firestore onSnapshot
 *   Uzasadnienie: projekt używa już Firebase/Firestore, onSnapshot
 *   daje WebSocket-like push bez dodatkowego backendu. Alternatywa
 *   (dedykowany WebSocket server) wymagałaby Node.js hostingu — zbędne
 *   na GitHub Pages. Firestore daje sub-100ms latency na tej skali.
 *
 * STRUKTURA FIRESTORE:
 *   conversations/{convId}          — metadane rozmowy
 *     participants: [uid1, uid2]
 *     lastMessage: string
 *     lastMessageAt: Timestamp
 *     lastMessageBy: uid
 *     unread_{uid1}: number         — licznik nieprzeczytanych
 *     unread_{uid2}: number
 *
 *   conversations/{convId}/messages/{msgId}
 *     senderId: uid
 *     senderName: string
 *     senderPhoto: string
 *     text: string
 *     imageUrl: string (opcjonalne)
 *     imagePublicId: string
 *     type: 'text' | 'image' | 'embed'
 *     embedUrl: string (YouTube/SoundCloud)
 *     read: boolean
 *     createdAt: Timestamp
 *
 * EKSPORTY:
 *   initMessenger()               — inicjalizuje messenger.html
 *   getOrCreateConversation(uid1, uid2) → convId
 *   openConversation(targetUid)   — shortcut: pobierz/stwórz + otwórz
 *   getUnreadCount(myUid)         → Promise<number>
 *   injectMessengerBadge(uid)     — badge na ikonie w nav
 */

import { auth, db, COL } from './firebase.js';
import { checkAuth, logout, getCurrentUserData, showToast } from './auth.js';
import { uploadToCloudinary } from './cloudinary.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp, increment, writeBatch,
  arrayUnion,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Kolekcje ─────────────────────────────────────────────────
const COL_CONV = 'conversations';
const COL_MSG  = 'messages';

// ── Stan modułu ──────────────────────────────────────────────
let currentUser     = null;
let currentUserData = null;
let activeConvId    = null;
let unsubMessages   = null;    // cleanup onSnapshot wiadomości
let unsubConvList   = null;    // cleanup onSnapshot listy conv
let typingTimer     = null;
const MAX_MSG_LEN   = 1000;
const MAX_IMG_SIZE  = 5 * 1024 * 1024; // 5 MB
const TYPING_TTL    = 3000;   // 3s bez pisania → wyczyść typing


// ════════════════════════════════════════════════════════════
// INIT — messenger.html
// ════════════════════════════════════════════════════════════

export function initMessenger() {
  const TAG = '[initMessenger]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    currentUser = user;
    console.log(TAG, '✅ User:', user.uid);

    try {
      currentUserData = await getCurrentUserData(user.uid, user);
    } catch {
      currentUserData = null;
    }
    if (!currentUserData) {
      currentUserData = {
        uid: user.uid,
        displayName: user.displayName || 'Wojownik',
        photoURL: user.photoURL || '',
        points: 0,
      };
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Wyczyść status typing przy zamknięciu
    window.addEventListener('beforeunload', () => _clearTyping());

    // Sprawdź czy jest ?conv= lub ?uid= w URL
    const params   = new URLSearchParams(window.location.search);
    const convParam = params.get('conv');
    const uidParam  = params.get('uid');

    // Inicjalizuj listę konwersacji
    _startConvListStream();

    if (convParam) {
      _openConvById(convParam);
    } else if (uidParam && uidParam !== user.uid) {
      openConversation(uidParam);
    }

    // Skeleton hide
    document.getElementById('msg-skeleton')?.classList.add('hidden');
    document.getElementById('msg-content')?.classList.remove('hidden');
  });
}


// ════════════════════════════════════════════════════════════
// CONVERSATION ID (deterministyczny — zawsze ten sam dla pary)
// ════════════════════════════════════════════════════════════

/**
 * Generuje deterministyczne ID konwersacji dla dwóch userów.
 * Sortujemy UID aby A_B === B_A.
 */
function _convId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}


// ════════════════════════════════════════════════════════════
// GET OR CREATE CONVERSATION
// ════════════════════════════════════════════════════════════

export async function getOrCreateConversation(myUid, targetUid) {
  const TAG  = '[getOrCreateConv]';
  const cid  = _convId(myUid, targetUid);
  const cRef = doc(db, COL_CONV, cid);

  const snap = await getDoc(cRef);
  if (!snap.exists()) {
    console.log(TAG, '➕ Tworzę nową konwersację:', cid);
    await setDoc(cRef, {
      participants:     [myUid, targetUid],
      lastMessage:      '',
      lastMessageAt:    serverTimestamp(),
      lastMessageBy:    myUid,
      [`unread_${myUid}`]:    0,
      [`unread_${targetUid}`]: 0,
      createdAt:        serverTimestamp(),
    });
  } else {
    console.log(TAG, '✅ Konwersacja istnieje:', cid);
  }

  return cid;
}


// ════════════════════════════════════════════════════════════
// OPEN CONVERSATION — shortcut dla user.html / profilu
// ════════════════════════════════════════════════════════════

export async function openConversation(targetUid) {
  if (!auth.currentUser) return;
  const cid = await getOrCreateConversation(auth.currentUser.uid, targetUid);
  window.location.href = `messenger.html?conv=${cid}`;
}


// ════════════════════════════════════════════════════════════
// CONVERSATION LIST STREAM
// ════════════════════════════════════════════════════════════

function _startConvListStream() {
  const TAG = '[convListStream]';
  if (unsubConvList) { unsubConvList(); }

  const q = query(
    collection(db, COL_CONV),
    where('participants', 'array-contains', currentUser.uid),
    orderBy('lastMessageAt', 'desc'),
    limit(50),
  );

  unsubConvList = onSnapshot(q, async (snap) => {
    console.log(TAG, `✅ ${snap.size} konwersacji`);
    const listEl = document.getElementById('conv-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (snap.empty) {
      listEl.innerHTML = `
        <div class="conv-empty">
          <div style="font-size:2rem;margin-bottom:.5rem;">💬</div>
          <div style="font-family:var(--font-hd);font-size:.875rem;color:var(--text-muted);">
            Brak rozmów.<br>Zacznij od profilu wojownika.
          </div>
        </div>`;
      return;
    }

    for (const docSnap of snap.docs) {
      const data    = docSnap.data();
      const convId  = docSnap.id;
      const otherId = data.participants.find(p => p !== currentUser.uid);
      if (!otherId) continue;

      // Pobierz dane rozmówcy
      let other = { displayName: 'Wojownik', photoURL: '' };
      try {
        const s = await getDoc(doc(db, COL.USERS, otherId));
        if (s.exists()) other = s.data();
      } catch {}

      const unread = data[`unread_${currentUser.uid}`] ?? 0;
      const isActive = convId === activeConvId;
      const item     = _buildConvItem(convId, data, other, unread, isActive);
      listEl.appendChild(item);
    }
}, (err) => {
  _handleError(TAG, err, 'Błąd pobierania listy rozmów. Sprawdź połączenie.');
  // prosty retry (opcjonalnie)
  setTimeout(() => _startConvListStream(), 2000);

function _buildConvItem(convId, data, other, unread, isActive) {
  const item = document.createElement('div');
  item.className = `conv-item${isActive ? ' active' : ''}`;
  item.dataset.convId = convId;

  const ini  = (other.displayName || 'W').charAt(0).toUpperCase();
  const time = _fmtTime(data.lastMessageAt);
  const lastMsg = data.lastMessage
    ? (data.lastMessage.length > 40 ? data.lastMessage.slice(0,40) + '…' : data.lastMessage)
    : '—';

  item.innerHTML = `
    <div class="conv-av">
      ${other.photoURL
        ? `<img src="${_esc(other.photoURL)}" alt="Avatar" onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
           <span style="display:none;">${ini}</span>`
        : `<span>${ini}</span>`}
      <span class="conv-av-dot online" id="dot-${convId}" style="display:none;"></span>
    </div>
    <div class="conv-info">
      <div class="conv-name">${_esc(other.displayName || 'Wojownik')}</div>
      <div class="conv-preview">${_esc(lastMsg)}</div>
    </div>
    <div class="conv-meta">
      <div class="conv-time">${time}</div>
      ${unread > 0 ? `<div class="conv-badge">${unread > 9 ? '9+' : unread}</div>` : ''}
    </div>`;

  item.addEventListener('click', () => _openConvById(convId));
  return item;
}


// ════════════════════════════════════════════════════════════
// OPEN CONVERSATION BY ID
// ════════════════════════════════════════════════════════════

async function _openConvById(convId) {
  const TAG = '[openConvById]';
  if (activeConvId === convId) return;

  // Cleanup poprzedniego
  if (unsubMessages) { unsubMessages(); unsubMessages = null; }
  _clearTyping();
  activeConvId = convId;

  // Highlight w liście
  document.querySelectorAll('.conv-item').forEach(el => {
    el.classList.toggle('active', el.dataset.convId === convId);
  });

  // Pokaż panel czatu
  const chatPanel = document.getElementById('chat-panel');
  const emptyPanel = document.getElementById('chat-empty');
  if (chatPanel)  chatPanel.classList.remove('hidden');
  if (emptyPanel) emptyPanel.classList.add('hidden');

  // Pobierz dane konwersacji
  let convData = {};
  try {
    const snap = await getDoc(doc(db, COL_CONV, convId));
    if (!snap.exists()) { showToast('Konwersacja nie istnieje.', 'error'); return; }
    convData = snap.data();
  } catch { return; }

  // Pobierz dane rozmówcy
  const otherId = convData.participants?.find(p => p !== currentUser.uid);
  let other = { displayName: 'Wojownik', photoURL: '' };
  if (otherId) {
    try {
      const s = await getDoc(doc(db, COL.USERS, otherId));
      if (s.exists()) other = s.data();
    } catch {}
  }

  // Ustaw nagłówek czatu
  _renderChatHeader(convId, other, otherId);

  // Wyczyść wiadomości
  const msgList = document.getElementById('msg-list');
  if (msgList) msgList.innerHTML = '';

  // Oznacz jako przeczytane
  _markConvRead(convId);

  // Start message stream
  _startMessageStream(convId);

  // Podłącz compose
  _setupCompose(convId, other, otherId);

  // URL update
  history.replaceState(null, '', `?conv=${convId}`);

  console.log(TAG, '✅ Otworzyłem konwersację:', convId);
}

function _renderChatHeader(convId, other, otherId) {
  const header = document.getElementById('chat-header');
  if (!header) return;
  const ini = (other.displayName || 'W').charAt(0).toUpperCase();
  header.innerHTML = `
    <button class="chat-back-btn" id="chat-back" aria-label="Wróć">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="chat-hd-av" id="chat-hd-av">
      ${other.photoURL
        ? `<img src="${_esc(other.photoURL)}" alt="Avatar"/>`
        : `<span>${ini}</span>`}
      <span class="chat-status-dot" id="chat-status-dot"></span>
    </div>
    <div class="chat-hd-info">
      <div class="chat-hd-name">${_esc(other.displayName || 'Wojownik')}</div>
      <div class="chat-hd-status" id="chat-hd-status">
        <span id="chat-typing-indicator" style="display:none;">pisze...</span>
        <span id="chat-online-status">offline</span>
      </div>
    </div>
    ${otherId ? `
      <a href="user.html?uid=${_esc(otherId)}" class="chat-profile-link" title="Profil">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </a>` : ''}
  `;

  document.getElementById('chat-back')?.addEventListener('click', () => {
    document.getElementById('chat-panel')?.classList.add('hidden');
    document.getElementById('chat-empty')?.classList.remove('hidden');
    if (unsubMessages) { unsubMessages(); unsubMessages = null; }
    activeConvId = null;
    history.replaceState(null, '', 'messenger.html');
  });

  // Presence/typing listener dla rozmówcy
  if (otherId) _watchPresence(otherId, convId);
}


// ════════════════════════════════════════════════════════════
// PRESENCE — online / typing
// ════════════════════════════════════════════════════════════

/**
 * Obserwuje pole presence w dokumencie rozmówcy.
 * presence: { online: bool, typing: { [convId]: Timestamp } }
 */
function _watchPresence(otherId, convId) {
  let unsubPresence;
  const ref = doc(db, COL.USERS, otherId);

  unsubPresence = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const isOnline = data.presence?.online === true;
    const isTyping = data.presence?.typing?.[convId] &&
      (Date.now() - (data.presence.typing[convId]?.seconds ?? 0) * 1000) < TYPING_TTL;

    const dot      = document.getElementById('chat-status-dot');
    const statusEl = document.getElementById('chat-online-status');
    const typingEl = document.getElementById('chat-typing-indicator');

    if (dot)      dot.className = `chat-status-dot ${isOnline ? 'online' : 'offline'}`;
    if (typingEl) typingEl.style.display = isTyping ? 'inline' : 'none';
    if (statusEl) statusEl.style.display = isTyping ? 'none' : 'inline';
    if (statusEl) statusEl.textContent   = isOnline ? 'online' : 'offline';
  }, () => {});

  // Cleanup gdy zamknięty conv
  const origUnsub = unsubMessages;
  unsubMessages = () => {
    if (origUnsub) origUnsub();
    if (unsubPresence) unsubPresence();
  };
}

/** Ustaw własne presence online */
export async function setOnlinePresence(uid, online = true) {
  if (!uid) return;
  try {
    await updateDoc(doc(db, COL.USERS, uid), {
      'presence.online': online,
      'presence.lastSeen': serverTimestamp(),
    });
  } catch {}
}

/** Ustaw typing indicator */
async function _setTyping(convId) {
  if (!currentUser || !convId) return;
  try {
    await updateDoc(doc(db, COL.USERS, currentUser.uid), {
      [`presence.typing.${convId}`]: serverTimestamp(),
    });
  } catch {}
}

async function _clearTyping() {
  if (!currentUser || !activeConvId) return;
  try {
    await updateDoc(doc(db, COL.USERS, currentUser.uid), {
      [`presence.typing.${activeConvId}`]: null,
    });
  } catch {}
}


// ════════════════════════════════════════════════════════════
// MESSAGE STREAM
// ════════════════════════════════════════════════════════════

function _startMessageStream(convId) {
  const TAG    = '[msgStream]';
  const msgList = document.getElementById('msg-list');

  const q = query(
    collection(db, COL_CONV, convId, COL_MSG),
    orderBy('createdAt', 'asc'),
    limit(100),
  );

  unsubMessages = onSnapshot(q, (snap) => {
    console.log(TAG, `${snap.size} wiadomości`);
    if (!msgList) return;

    const wasAtBottom = _isScrolledToBottom(msgList);
    msgList.innerHTML = '';

    if (snap.empty) {
      msgList.innerHTML = `
        <div style="text-align:center;padding:2rem;font-family:var(--font-hd);
          font-size:.875rem;color:var(--text-muted);">
          Powiedz cześć! 👋
        </div>`;
      return;
    }

    let prevDate = null;
    snap.forEach((docSnap) => {
      const msg  = { id: docSnap.id, ...docSnap.data() };
      const date = msg.createdAt?.toDate?.() ?? new Date();
      const dateStr = date.toLocaleDateString('pl-PL', { day:'numeric', month:'long' });

      if (dateStr !== prevDate) {
        const sep = document.createElement('div');
        sep.className = 'msg-date-sep';
        sep.textContent = dateStr;
        msgList.appendChild(sep);
        prevDate = dateStr;
      }

      msgList.appendChild(_buildMsgBubble(msg));
    });

    if (wasAtBottom) _scrollToBottom(msgList);
  }, (err) => {
    console.error('Messenger error:', err);
    console.error('Code:', err.code);
    console.error('Message:', err.message);
  });
}

function _isScrolledToBottom(el) {
  return el.scrollHeight - el.clientHeight - el.scrollTop < 80;
}

function _scrollToBottom(el) {
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
}


// ════════════════════════════════════════════════════════════
// BUILD MESSAGE BUBBLE
// ════════════════════════════════════════════════════════════

function _buildMsgBubble(msg) {
  const isMine = msg.senderId === currentUser?.uid;
  const wrap   = document.createElement('div');
  wrap.className = `msg-wrap ${isMine ? 'mine' : 'theirs'}`;
  wrap.dataset.msgId = msg.id;

  const time = _fmtTime(msg.createdAt);
  const ini  = (msg.senderName || 'W').charAt(0).toUpperCase();
  const avatarHTML = !isMine
    ? `<div class="msg-av">${msg.senderPhoto
        ? `<img src="${_esc(msg.senderPhoto)}" alt="Avatar" onerror="this.style.display='none';this.nextSibling.style.display='flex'"/><span style="display:none;">${ini}</span>`
        : `<span>${ini}</span>`}</div>`
    : '';

  let bodyHTML = '';

  if (msg.type === 'image' && msg.imageUrl) {
    // Obraz
    bodyHTML = `
      <div class="msg-bubble img-bubble">
        <img src="${_esc(msg.imageUrl)}" class="msg-img" loading="lazy" alt="Zdjęcie"
          onclick="this.requestFullscreen?.()"/>
        ${msg.text ? `<div class="msg-text">${_esc(msg.text)}</div>` : ''}
        <div class="msg-time">${time}</div>
      </div>`;
  } else if (msg.type === 'embed' && msg.embedUrl) {
    // Embed YouTube / SoundCloud
    bodyHTML = `
      <div class="msg-bubble embed-bubble">
        ${_buildEmbedPreview(msg.embedUrl, msg.embedMeta)}
        ${msg.text ? `<div class="msg-text">${_esc(msg.text)}</div>` : ''}
        <div class="msg-time">${time}</div>
      </div>`;
  } else {
    // Tekst z linkami / @mention / #hashtag
    bodyHTML = `
      <div class="msg-bubble text-bubble">
        <div class="msg-text">${_renderMsgText(msg.text || '')}</div>
        <div class="msg-time">${time}${isMine ? ` <span class="msg-read">${msg.read ? '✓✓' : '✓'}</span>` : ''}</div>
      </div>`;
  }

  wrap.innerHTML = `${avatarHTML}${bodyHTML}`;
  return wrap;
}


// ════════════════════════════════════════════════════════════
// TEXT RENDER — @mention, #hashtag, linki
// ════════════════════════════════════════════════════════════

function _renderMsgText(text) {
  if (!text) return '';
  let s = _esc(text);

  // URL → klikalny link
  s = s.replace(
    /(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="msg-link">$1</a>'
  );

  // @mention
  s = s.replace(
    /@([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9_]{2,30})/g,
    '<span class="mention-link">@$1</span>'
  );

  // #hashtag
  s = s.replace(
    /#([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9_]{1,40})/g,
    '<span class="hashtag-link">#$1</span>'
  );

  return s;
}


// ════════════════════════════════════════════════════════════
// EMBED PREVIEW — YouTube + SoundCloud
// ════════════════════════════════════════════════════════════

function _buildEmbedPreview(url, meta = {}) {
  const yt  = _parseYouTube(url);
  const sc  = _parseSoundCloud(url);

  if (yt) {
    return `
      <div class="embed-player yt-player">
        <iframe
          src="https://www.youtube.com/embed/${_esc(yt)}?rel=0&modestbranding=1"
          title="${_esc(meta.title || 'YouTube')}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy">
        </iframe>
        ${meta.title ? `<div class="embed-title">${_esc(meta.title)}</div>` : ''}
      </div>`;
  }

  if (sc) {
    const encoded = encodeURIComponent(url);
    return `
      <div class="embed-player sc-player">
        <iframe
          src="https://w.soundcloud.com/player/?url=${encoded}&color=%23D4AF37&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"
          title="${_esc(meta.title || 'SoundCloud')}"
          frameborder="0"
          scrolling="no"
          allow="autoplay"
          loading="lazy">
        </iframe>
        ${meta.title ? `<div class="embed-title">${_esc(meta.title)}</div>` : ''}
      </div>`;
  }

  // Generic link preview
  return `
    <a href="${_esc(url)}" target="_blank" rel="noopener noreferrer" class="link-preview">
      <div class="link-preview-icon">🔗</div>
      <div class="link-preview-url">${_esc(url.slice(0,60))}${url.length > 60 ? '…' : ''}</div>
    </a>`;
}

function _parseYouTube(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function _parseSoundCloud(url) {
  return url.includes('soundcloud.com/') ? url : null;
}

/**
 * Wykrywa typ linku w wiadomości.
 * Zwraca 'youtube' | 'soundcloud' | 'link' | null
 */
export function detectLinkType(text) {
  if (!text) return null;
  const urls = text.match(/(https?:\/\/[^\s]+)/g);
  if (!urls) return null;
  for (const url of urls) {
    if (_parseYouTube(url)) return { type: 'youtube', url };
    if (_parseSoundCloud(url)) return { type: 'soundcloud', url };
    return { type: 'link', url };
  }
  return null;
}


// ════════════════════════════════════════════════════════════
// COMPOSE BOX
// ════════════════════════════════════════════════════════════

function _setupCompose(convId, other, otherId) {
  const inputEl   = document.getElementById('msg-input');
  const sendBtn   = document.getElementById('msg-send');
  const imgBtn    = document.getElementById('msg-img-btn');
  const imgInput  = document.getElementById('msg-img-input');
  const previewEl = document.getElementById('msg-img-preview');
  const removeBtn = document.getElementById('msg-img-remove');

  let pendingImage = null;   // { file, url, publicId }
  let isSending    = false;

  // Auto-resize textarea
  inputEl?.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';

    // Typing indicator
    _setTyping(convId);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => _clearTyping(), TYPING_TTL);
  });

  // Enter = wyślij (Shift+Enter = nowa linia)
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _sendMsg();
    }
  });

  sendBtn?.addEventListener('click', _sendMsg);

  // Image upload button
  imgBtn?.addEventListener('click', () => imgInput?.click());

  imgInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
      showToast('Dozwolone: JPG, PNG, WebP, GIF', 'error'); return;
    }
    if (file.size > MAX_IMG_SIZE) {
      showToast('Maks. 5 MB.', 'error'); return;
    }

    // Preview lokalny
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (previewEl) {
        previewEl.style.display = 'flex';
        const img = previewEl.querySelector('img');
        if (img) img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);

    // Upload do Cloudinary
    showToast('Przesyłam zdjęcie...', 'info', 2000);
    try {
      const result = await uploadToCloudinary(file, `dm/${currentUser.uid}`);
      pendingImage = { url: result.url, publicId: result.publicId };
      imgBtn?.classList.add('active');
    } catch (err) {
      showToast(err.message || 'Błąd uploadu', 'error');
      pendingImage = null;
      if (previewEl) previewEl.style.display = 'none';
    }
    if (imgInput) imgInput.value = '';
  });

  removeBtn?.addEventListener('click', () => {
    pendingImage = null;
    if (previewEl) previewEl.style.display = 'none';
    imgBtn?.classList.remove('active');
  });


  async function _sendMsg() {
    if (isSending) return;
    const text = inputEl?.value.trim() ?? '';
    if (!text && !pendingImage) return;
    if (text.length > MAX_MSG_LEN) { showToast(`Max ${MAX_MSG_LEN} znaków.`, 'error'); return; }

    isSending = true;
    if (sendBtn) sendBtn.disabled = true;

    // Wykryj embed
    const linkDetect = detectLinkType(text);

    try {
      let msgType = 'text';
      let embedUrl = '';
      if (pendingImage) {
        msgType = 'image';
      } else if (linkDetect && (linkDetect.type === 'youtube' || linkDetect.type === 'soundcloud')) {
        msgType  = 'embed';
        embedUrl = linkDetect.url;
      }

      const msgData = {
        senderId:    currentUser.uid,
        senderName:  currentUserData?.displayName || currentUser.displayName || 'Wojownik',
        senderPhoto: currentUserData?.photoURL    || currentUser.photoURL    || '',
        text:        text,
        type:        msgType,
        imageUrl:    pendingImage?.url       || '',
        imagePublicId: pendingImage?.publicId || '',
        embedUrl:    embedUrl,
        embedMeta:   {},
        read:        false,
        createdAt:   serverTimestamp(),
      };

      // Zapisz wiadomość
      await addDoc(collection(db, COL_CONV, convId, COL_MSG), msgData);

      // Aktualizuj metadane konwersacji
      const convRef = doc(db, COL_CONV, convId);
      const preview = pendingImage
        ? '📷 Zdjęcie'
        : (msgType === 'embed' ? '🎵 Link' : text.slice(0, 80));

      await updateDoc(convRef, {
        lastMessage:    preview,
        lastMessageAt:  serverTimestamp(),
        lastMessageBy:  currentUser.uid,
        // Inkrementuj licznik nieprzeczytanych dla rozmówcy
        ...(otherId ? { [`unread_${otherId}`]: increment(1) } : {}),
      });

      // Powiadomienie
      if (otherId) {
        createNotification(otherId, {
          type:  'message',
          title: `${currentUserData?.displayName || 'Wojownik'} wysłał wiadomość 💬`,
          body:  preview,
          url:   `messenger.html?conv=${convId}`,
        }).catch(() => {});
      }

      // Reset compose
      if (inputEl) { inputEl.value = ''; inputEl.style.height = 'auto'; }
      pendingImage = null;
      if (previewEl) previewEl.style.display = 'none';
      imgBtn?.classList.remove('active');

      _clearTyping();

      // Scroll to bottom
      setTimeout(() => {
        const msgList = document.getElementById('msg-list');
        if (msgList) _scrollToBottom(msgList);
      }, 100);

    } catch (err) {
      console.error('[sendMsg]', err.code, err.message);
      showToast('Błąd wysyłania.', 'error');
    } finally {
      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      inputEl?.focus();
    }
  }
}


// ════════════════════════════════════════════════════════════
// MARK READ
// ════════════════════════════════════════════════════════════

async function _markConvRead(convId) {
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, COL_CONV, convId), {
      [`unread_${currentUser.uid}`]: 0,
    });
  } catch {}
}


// ════════════════════════════════════════════════════════════
// UNREAD COUNT — dla badge w nav
// ════════════════════════════════════════════════════════════

export async function getUnreadCount(myUid) {
  if (!myUid) return 0;
  try {
    const snap = await getDocs(query(
      collection(db, COL_CONV),
      where('participants', 'array-contains', myUid),
    ));
    let total = 0;
    snap.forEach(d => { total += d.data()[`unread_${myUid}`] ?? 0; });
    return total;
  } catch {
    return 0;
  }
}

/**
 * Wstrzykuje badge z liczbą nieprzeczytanych na ikonę messengera w nav.
 * Wywołaj raz po zalogowaniu.
 */
export function injectMessengerBadge(myUid) {
  if (!myUid) return;

  // Nasłuchuj zmian w konwersacjach
  const q = query(
    collection(db, COL_CONV),
    where('participants', 'array-contains', myUid),
  );

  onSnapshot(q, (snap) => {
    let total = 0;
    snap.forEach(d => { total += d.data()[`unread_${myUid}`] ?? 0; });

    const badge = document.getElementById('msg-nav-badge');
    if (badge) {
      badge.textContent  = total > 9 ? '9+' : total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    }
  }, () => {});
}

// centralized error handler
function _handleError(TAG, err, userMessage = null) {
  try {
    // log pełne info do konsoli (dla dev)
    console.error(TAG, err);
    // opcjonalnie: wysyłka do serwisu telemetrycznego, np. fetch('/log', ...)
    // telemetry?.capture?.({ tag: TAG, message: err.message, code: err.code, stack: err.stack });

    // pokaż przyjazny komunikat użytkownikowi, jeśli podano
    if (userMessage) showToast(userMessage, 'error');
  } catch (e) {
    // nic nie rób, by nie wywołać nowego błędu w handlerze błędów
    console.error('[handleError]', e);
  }
}
// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _fmtTime(ts) {
  if (!ts) return '';
  const d = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  if (isNaN(d)) return '';
  const now  = new Date();
  const diff = now - d;
  const m    = Math.floor(diff / 60000);
  if (m < 1)  return 'teraz';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
