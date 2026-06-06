/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — feed.js v2 (Feed 2.0)
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Nowe funkcje v2:
 *   - Reakcje: 👍⚔️🔥👑💀 (zachowuje kompatybilność z likes[])
 *   - Zakładki feedu: Dla Ciebie / Obserwowani / Najnowsze
 *   - Udostępnianie: Web Share API + clipboard fallback
 *   - @mention renderowanie z linkiem do profilu
 *   - #hashtag renderowanie (klikalny filtr)
 */

import {
  auth, db, COL, getRank,
} from './firebase.js';

import {
  checkAuth, logout, getCurrentUserData, showToast,
} from './auth.js';

import { awardXP, checkDailyLogin, XP_ACTIONS } from './xp.js';
import { makeAvatarsClickable, openUserProfile } from './social.js';
import { lookupByUsername } from './search.js';
import { injectNotifBell, createNotification } from './notifications.js';

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { uploadToCloudinary } from './cloudinary.js';
import { getBlockedIds, filterBlockedPosts, injectReportButton } from './blocks.js';


// ════════════════════════════════════════════════════════════
// MODULE STATE
// ════════════════════════════════════════════════════════════

const POSTS_PER_PAGE  = 10;
const MAX_POST_LENGTH = 500;
const MAX_IMAGE_SIZE  = 5 * 1024 * 1024;
const ALLOWED_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

let currentUser     = null;
let currentUserData = null;
let lastPostDoc     = null;
let hasMorePosts    = false;
let unsubFeed       = null;
let selectedImage   = null;
let isPosting       = false;
let activeTab       = 'forYou';   // 'forYou' | 'following' | 'latest'
let followingIds    = [];          // UIDs obserwowanych — dla zakładki "Obserwowani"


// ════════════════════════════════════════════════════════════
// REAKCJE — definicje
// ════════════════════════════════════════════════════════════

const REACTIONS = [
  { id: 'like',    emoji: '👍', label: 'Szacunek' },
  { id: 'fire',    emoji: '🔥', label: 'Kozak'    },
  { id: 'warrior', emoji: '⚔️', label: 'Wojownik' },
  { id: 'dead',    emoji: '💀', label: 'Poległem' },
  { id: 'lol',     emoji: '😂', label: 'Bekowe'   },
];

// Suma wszystkich reakcji na poście
function getTotalReactions(data) {
  // Kompatybilność wsteczna: stare posty mają tylko likes[]
  if (data.reactions && typeof data.reactions === 'object') {
    return Object.values(data.reactions).reduce((sum, arr) =>
      sum + (Array.isArray(arr) ? arr.length : 0), 0
    );
  }
  // fallback na stare likes
  return Array.isArray(data.likes) ? data.likes.length : (data.likesCount ?? 0);
}

// Znajdź reakcję danego usera na poście
function getUserReaction(data, uid) {
  if (data.reactions && typeof data.reactions === 'object') {
    for (const [type, uids] of Object.entries(data.reactions)) {
      if (Array.isArray(uids) && uids.includes(uid)) return type;
    }
  }
  // fallback: stare likes
  if (Array.isArray(data.likes) && data.likes.includes(uid)) return 'like';
  return null;
}

// Top reakcja (najczęstsza) do wyświetlenia na przycisku
function getTopReaction(data) {
  if (data.reactions && typeof data.reactions === 'object') {
    let top = null, max = 0;
    for (const [type, uids] of Object.entries(data.reactions)) {
      const n = Array.isArray(uids) ? uids.length : 0;
      if (n > max) { max = n; top = type; }
    }
    if (top) return REACTIONS.find(r => r.id === top) ?? REACTIONS[0];
  }
  return REACTIONS[0]; // default: 👍
}


// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initFeed() {
  const TAG = '[initFeed]';
  console.log(TAG, '🚀 Start Feed 2.0');

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
        uid:         user.uid,
        displayName: user.displayName || 'Wojownik',
        photoURL:    user.photoURL    || '',
        rank:        'Rookie',
        points:      0,
      };
    }

    injectNotifBell(user.uid);
    setupComposeBox();
    await _loadFollowingIds(user.uid);
    setupTabs();
    startFeedStream();

    checkDailyLogin(user.uid).catch(() => {});
    // Załaduj zablokowanych użytkowników
    getBlockedIds(user.uid).catch(() => []);
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Signal skeleton can hide
    window._clearFeedSkeleton?.();
  });
}


// ════════════════════════════════════════════════════════════
// FOLLOWING IDs (dla zakładki Obserwowani)
// ════════════════════════════════════════════════════════════

async function _loadFollowingIds(uid) {
  try {
    const snap = await getDocs(query(
      collection(db, 'followers'),
      where('followerId', '==', uid),
    ));
    followingIds = [];
    snap.forEach(d => followingIds.push(d.data().followingId));
    console.log('[feed] Obserwuje:', followingIds.length, 'użytkowników');
  } catch(e) {
    console.warn('[loadFollowingIds]', e.code);
    followingIds = [];
  }
}


// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════

function setupTabs() {
  document.querySelectorAll('.feed-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;

      // UI update
      document.querySelectorAll('.feed-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeTab   = tab;
      lastPostDoc = null;

      // Restart stream
      if (unsubFeed) { unsubFeed(); unsubFeed = null; }
      const feedList = document.getElementById('feed-list');
      if (feedList) feedList.innerHTML = '';
      startFeedStream();
    });
  });
}


// ════════════════════════════════════════════════════════════
// COMPOSE BOX
// ════════════════════════════════════════════════════════════

function setupComposeBox() {
  const TAG = '[setupComposeBox]';

  const composeAvatar = document.getElementById('compose-avatar');
  renderSmallAvatar(composeAvatar, currentUser, currentUserData);

  const textarea   = document.getElementById('post-textarea');
  const charCount  = document.getElementById('char-count');
  const submitBtn  = document.getElementById('post-submit-btn');
  const imageBtn   = document.getElementById('image-upload-btn');
  const imageInput = document.getElementById('image-input');
  const preview    = document.getElementById('compose-preview');
  const removeImg  = document.getElementById('remove-image-btn');

  if (!textarea) { console.warn(TAG, '⚠️ textarea nie znaleziony'); return; }

  // Char counter + @mention / #hashtag hint
  textarea.addEventListener('input', () => {
    const len  = textarea.value.length;
    const left = MAX_POST_LENGTH - len;
    if (charCount) {
      charCount.textContent = left;
      charCount.className   = 'char-count' +
        (left < 20 ? ' danger' : left < 60 ? ' warn' : '');
    }
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px';
  });

  imageBtn?.addEventListener('click', () => imageInput?.click());

  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { showToast('Dozwolone: JPG, PNG, WebP, GIF', 'error'); return; }
    if (file.size > MAX_IMAGE_SIZE) { showToast('Maks. 5 MB.', 'error'); return; }
    selectedImage = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = preview?.querySelector('img');
      if (img) { img.src = ev.target.result; preview?.classList.remove('hidden'); }
    };
    reader.readAsDataURL(file);
    imageBtn?.classList.add('active');
  });

  removeImg?.addEventListener('click', () => {
    selectedImage = null;
    if (imageInput) imageInput.value = '';
    preview?.classList.add('hidden');
    imageBtn?.classList.remove('active');
  });

  submitBtn?.addEventListener('click', submitPost);

  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submitPost(); }
  });
}


// ════════════════════════════════════════════════════════════
// SUBMIT POST
// ════════════════════════════════════════════════════════════

async function submitPost() {
  const TAG = '[submitPost]';
  if (isPosting) return;

  const textarea  = document.getElementById('post-textarea');
  const submitBtn = document.getElementById('post-submit-btn');
  const content   = textarea?.value.trim() ?? '';

  if (!content && !selectedImage) { showToast('Napisz coś lub dodaj zdjęcie! 📝', 'info'); textarea?.focus(); return; }
  if (content.length > MAX_POST_LENGTH) { showToast(`Max ${MAX_POST_LENGTH} znaków.`, 'error'); return; }

  isPosting = true;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Publikuję...'; }

  console.log(TAG, '📝 Publikuję...');

  try {
    let imageUrl         = '';
    let imageStoragePath = '';

    if (selectedImage) {
      const result     = await uploadImage(selectedImage);
      imageUrl         = result.url;
      imageStoragePath = result.path;
    }

    // Wyciągnij hashtagi z treści do indeksowania
    const hashtags = [...new Set((content.match(/#[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]+/g) || [])
      .map(t => t.slice(1).toLowerCase()))];

    const rankObj  = getRank(currentUserData?.points ?? 0);
    const postData = {
      authorId:        currentUser.uid,
      authorName:      currentUserData?.displayName || currentUser.displayName || 'Wojownik',
      authorPhoto:     currentUserData?.photoURL    || currentUser.photoURL    || '',
      authorRank:      rankObj.label,
      authorRankEmoji: rankObj.emoji,
      content,
      imageUrl,
      imageStoragePath,
      likes:           [],   // zachowane dla kompatybilności wstecznej
      likesCount:      0,    // zachowane
      reactions:       {},   // nowy system: { like: [], warrior: [], fire: [], legend: [], brutal: [] }
      reactionsCount:  0,
      commentsCount:   0,
      hashtags,              // indeks hashtagów
      createdAt:       serverTimestamp(),
    };

    await addDoc(collection(db, COL.POSTS), postData);
    console.log(TAG, '✅ Post dodany');

    // Reset compose
    if (textarea) { textarea.value = ''; textarea.style.height = 'auto'; }
    selectedImage = null;
    if (document.getElementById('image-input')) document.getElementById('image-input').value = '';
    document.getElementById('compose-preview')?.classList.add('hidden');
    document.getElementById('image-upload-btn')?.classList.remove('active');
    if (document.getElementById('char-count')) document.getElementById('char-count').textContent = MAX_POST_LENGTH;

    showToast('Post opublikowany! ⚔️', 'success');
    awardXP(currentUser.uid, XP_ACTIONS.POST_CREATED).catch(() => {});

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    showToast(err.code === 'permission-denied' ? 'Brak uprawnień.' : 'Błąd publikowania.', 'error');
  } finally {
    isPosting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '⚔ Ogłoś'; }
  }
}


// ════════════════════════════════════════════════════════════
// IMAGE UPLOAD
// ════════════════════════════════════════════════════════════

async function uploadImage(file) {
  const progressEl  = document.getElementById('upload-progress');
  const progressBar = document.getElementById('upload-progress-bar');
  try {
    if (progressEl)  progressEl.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';
    const result = await uploadToCloudinary(file, `posts/${currentUser.uid}`);
    if (progressBar) progressBar.style.width = '100%';
    return { url: result.url, path: result.publicId };
  } finally {
    setTimeout(() => {
      if (progressEl)  progressEl.classList.add('hidden');
      if (progressBar) progressBar.style.width = '0%';
    }, 300);
  }
}


// ════════════════════════════════════════════════════════════
// FEED STREAM
// ════════════════════════════════════════════════════════════

function startFeedStream() {
  const TAG      = '[startFeedStream]';
  const feedList = document.getElementById('feed-list');
  const feedEmpty   = document.getElementById('feed-empty');
  const feedLoading = document.getElementById('feed-loading');

  if (feedLoading) feedLoading.classList.remove('hidden');

  // Build query based on active tab
  let q;
  if (activeTab === 'following' && followingIds.length > 0) {
    // Firestore 'in' max 30 items — wytnij
    const ids = followingIds.slice(0, 30);
    q = query(
      collection(db, COL.POSTS),
      where('authorId', 'in', ids),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE),
    );
  } else if (activeTab === 'following' && followingIds.length === 0) {
    // Nikogo nie obserwuje
    if (feedLoading) feedLoading.classList.add('hidden');
    if (feedList) feedList.innerHTML = '';
    if (feedEmpty) {
      feedEmpty.style.display = 'block';
      const emptyIcon = feedEmpty.querySelector('.feed-empty-icon');
      const emptyTitle = feedEmpty.querySelector('.feed-empty-title');
      const emptyText = feedEmpty.querySelector('.feed-empty-text');
      if (emptyIcon)  emptyIcon.textContent  = '👁️';
      if (emptyTitle) emptyTitle.textContent = 'Nikogo nie obserwujesz';
      if (emptyText)  emptyText.innerHTML    = 'Kliknij w avatar wojownika<br>i naciśnij „Obserwuj"';
    }
    return;
  } else {
    // 'forYou' i 'latest' — wszystkie posty
    q = query(
      collection(db, COL.POSTS),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE),
    );
  }

  if (unsubFeed) { unsubFeed(); unsubFeed = null; }

  unsubFeed = onSnapshot(q, (snapshot) => {
    console.log(TAG, `✅ ${snapshot.size} postów (tab: ${activeTab})`);

    if (feedLoading) feedLoading.classList.add('hidden');

    if (snapshot.empty) {
      if (feedList)  feedList.innerHTML = '';
      if (feedEmpty) { feedEmpty.style.display = 'block'; }
      return;
    }
    if (feedEmpty) feedEmpty.style.display = 'none';

    const openComments = new Set();
    feedList?.querySelectorAll('.comments-section.open').forEach(el => {
      openComments.add(el.dataset.postId);
    });

    if (feedList) feedList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const postEl = createPostElement(docSnap.id, docSnap.data());
      feedList?.appendChild(postEl);
    });

    openComments.forEach(pid => {
      feedList?.querySelector(`.comments-section[data-post-id="${pid}"]`)?.classList.add('open');
    });

    lastPostDoc  = snapshot.docs[snapshot.docs.length - 1];
    hasMorePosts = snapshot.size === POSTS_PER_PAGE;

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.style.display = hasMorePosts ? 'block' : 'none';

    makeAvatarsClickable(feedList);
    feedList?.querySelectorAll('.post-card').forEach((el, i) => {
      el.style.animationDelay = (i * 0.04) + 's';
    });

  }, (err) => {
    console.error(TAG, '❌', err.code, err.message);
    if (feedLoading) feedLoading.classList.add('hidden');
    showToast(err.code === 'permission-denied' ? 'Brak dostępu do postów.' : 'Błąd ładowania.', 'error');
  });

  document.getElementById('load-more-btn')?.addEventListener('click', loadMorePosts);
}


// ════════════════════════════════════════════════════════════
// LOAD MORE
// ════════════════════════════════════════════════════════════

async function loadMorePosts() {
  if (!lastPostDoc || !hasMorePosts) return;
  const btn = document.getElementById('load-more-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Ładowanie...'; }

  try {
    const q = query(
      collection(db, COL.POSTS),
      orderBy('createdAt', 'desc'),
      startAfter(lastPostDoc),
      limit(POSTS_PER_PAGE),
    );
    const snap = await getDocs(q);
    const feedList = document.getElementById('feed-list');
    snap.forEach((docSnap) => {
      feedList?.appendChild(createPostElement(docSnap.id, docSnap.data()));
    });
    lastPostDoc  = snap.docs[snap.docs.length - 1] ?? lastPostDoc;
    hasMorePosts = snap.size === POSTS_PER_PAGE;
  } catch (err) {
    console.error('[loadMorePosts]', err);
    showToast('Błąd ładowania postów.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Załaduj więcej'; if (!hasMorePosts) btn.style.display = 'none'; }
  }
}


// ════════════════════════════════════════════════════════════
// CREATE POST ELEMENT
// ════════════════════════════════════════════════════════════

function createPostElement(postId, data) {
  const isOwner       = data.authorId === currentUser?.uid;
  const myReaction    = getUserReaction(data, currentUser?.uid);
  const totalCount    = getTotalReactions(data);
  const topReaction   = getTopReaction(data);
  const commentsCount = data.commentsCount ?? 0;

  const el = document.createElement('article');
  el.className     = 'post-card';
  el.dataset.postId  = postId;
  el.dataset.authorId = data.authorId || '';

  const timeStr    = formatTime(data.createdAt);
  const initials   = (data.authorName || 'W').split(' ').map(w => w[0] ?? '').join('').slice(0,2).toUpperCase();
  const avatarHTML = data.authorPhoto
    ? `<img src="${escHtml(data.authorPhoto)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.textContent='${escHtml(initials)}'">`
    : escHtml(initials);

  const imageHTML  = data.imageUrl
    ? `<img src="${escHtml(data.imageUrl)}" alt="Zdjęcie posta" class="post-image" loading="lazy">`
    : '';

  const rankBadge  = data.authorRankEmoji && data.authorRank
    ? `<span class="post-rank-badge">${escHtml(data.authorRankEmoji)} ${escHtml(data.authorRank)}</span>`
    : '';

  const deleteBtn  = isOwner
    ? `<button class="post-menu-btn delete-post-btn" aria-label="Usuń post" title="Usuń post">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>`
    : `<button class="post-menu-btn report-post-btn" aria-label="Zgłoś post" title="Zgłoś post" data-post-id="${postId}" data-author-id="${data.authorId || ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </button>`;

  // Render content z @mention i #hashtag
  const contentHTML = data.content ? renderContent(data.content) : '';

  // Reakcja button
  const reactionEmoji = myReaction
    ? (REACTIONS.find(r => r.id === myReaction)?.emoji ?? '👍')
    : topReaction.emoji;
  const reactionClass = myReaction ? 'post-action-btn reaction-btn reacted' : 'post-action-btn reaction-btn';

  el.innerHTML = `
    <!-- Header -->
    <div class="post-header">
      <div class="post-avatar" data-user-uid="${escHtml(data.authorId)}" style="cursor:pointer;">${avatarHTML}</div>
      <div class="post-meta">
        <div class="post-author">${escHtml(data.authorName || 'Wojownik')}</div>
        <div class="post-time">${timeStr}</div>
      </div>
      ${rankBadge}
      ${deleteBtn}
    </div>

    <!-- Content with @mentions and #hashtags -->
    ${contentHTML ? `<div class="post-content">${contentHTML}</div>` : ''}

    <!-- Image -->
    ${imageHTML}

    <!-- Reactions summary (if any) -->
    <div class="post-reactions-summary" id="reactions-summary-${postId}" style="${totalCount > 0 ? '' : 'display:none;'}">
      <span class="reactions-emoji-row" id="reactions-emoji-${postId}">${_buildReactionsSummary(data)}</span>
      <span class="reactions-count" id="reactions-total-${postId}">${totalCount > 0 ? totalCount : ''}</span>
    </div>

    <!-- Actions -->
    <div class="post-actions">
      <!-- Reaction button with picker -->
      <div class="reaction-wrap" style="position:relative;">
        <button class="${reactionClass}" data-post-id="${postId}" data-my-reaction="${myReaction || ''}" aria-label="Reakcja">
          <span class="reaction-emoji">${reactionEmoji}</span>
          <span class="reaction-label">${myReaction ? (REACTIONS.find(r=>r.id===myReaction)?.label ?? 'Szacunek') : 'Szacunek'}</span>
        </button>
        <!-- Reaction picker (hidden) -->
        <div class="reaction-picker" id="picker-${postId}" role="toolbar" aria-label="Wybierz reakcję">
          ${REACTIONS.map(r => `
            <button class="reaction-picker-btn ${myReaction === r.id ? 'active' : ''}"
              data-reaction="${r.id}" data-post-id="${postId}"
              title="${r.label}" aria-label="${r.label}">
              ${r.emoji}
            </button>`).join('')}
        </div>
      </div>

      <button class="post-action-btn comment-btn" data-post-id="${postId}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span class="comments-count">${commentsCount > 0 ? commentsCount : ''}</span>
      </button>

      <div class="post-action-sep"></div>

      <button class="post-action-btn share-btn" data-post-id="${postId}" title="Udostępnij">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        <span>Udostępnij</span>
      </button>
    </div>

    <!-- Comments section -->
    <div class="comments-section" data-post-id="${postId}">
      <div class="comments-list" id="comments-list-${postId}"></div>
      <div class="comment-compose">
        <div class="comment-avatar" id="comment-avatar-${postId}"></div>
        <div class="comment-input-wrap">
          <textarea class="comment-input" placeholder="Dodaj komentarz..." rows="1" maxlength="300" id="comment-input-${postId}"></textarea>
        </div>
        <button class="comment-send-btn" id="comment-send-${postId}" aria-label="Wyślij">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // ── Event listeners ──────────────────────────────────────

  // Reaction button — long press or hover shows picker, click toggles like
  const reactionBtn  = el.querySelector('.reaction-btn');
  const picker       = el.querySelector(`#picker-${postId}`);
  let pickerTimer    = null;

  const showPicker   = () => { picker?.classList.add('visible'); };
  const hidePicker   = () => { setTimeout(() => picker?.classList.remove('visible'), 250); };

  // Desktop: hover
  reactionBtn?.addEventListener('mouseenter', showPicker);
  el.querySelector('.reaction-wrap')?.addEventListener('mouseleave', hidePicker);

  // Mobile: long press
  reactionBtn?.addEventListener('touchstart', (e) => {
    pickerTimer = setTimeout(() => { showPicker(); }, 400);
  }, { passive: true });
  reactionBtn?.addEventListener('touchend', () => {
    if (pickerTimer) { clearTimeout(pickerTimer); pickerTimer = null; }
  });

  // Tap/click reaction button (quick) — toggle like
  reactionBtn?.addEventListener('click', (e) => {
    if (picker?.classList.contains('visible')) return; // already open
    toggleReaction(postId, data, el, myReaction ? myReaction : 'like');
  });

  // Picker buttons
  el.querySelectorAll('.reaction-picker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const reactionId = btn.dataset.reaction;
      picker?.classList.remove('visible');
      toggleReaction(postId, data, el, reactionId);
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      const reactionId = btn.dataset.reaction;
      picker?.classList.remove('visible');
      toggleReaction(postId, data, el, reactionId);
    });
  });

  // Close picker on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.reaction-wrap')) picker?.classList.remove('visible');
  }, { once: false });

  // Comment toggle
  el.querySelector('.comment-btn')?.addEventListener('click', () => toggleComments(postId, el));

  // Share
  el.querySelector('.share-btn')?.addEventListener('click', () => sharePost(postId, data));

  // Delete
  el.querySelector('.delete-post-btn')?.addEventListener('click', () => confirmDeletePost(postId, data));

  // Report (non-owner)
  el.querySelector('.report-post-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) {
      injectReportButton(null, currentUser.uid, 'post', postId, data.authorId);
      // Wywołaj modal bezpośrednio
      import('./blocks.js').then(({ injectReportButton: rb }) => {
        const container = document.createElement('div');
        rb(container, currentUser.uid, 'post', postId, data.authorId || '');
        container.querySelector('.report-btn')?.click();
      });
    }
  });

  // Image lightbox
  el.querySelector('.post-image')?.addEventListener('click', (e) => openLightbox(e.target.src));

  // @mention click
  el.querySelectorAll('.mention-link').forEach(m => {
    m.addEventListener('click', async (e) => {
      e.preventDefault();
      // Jeśli mamy uid bezpośrednio (stary format)
      if (m.dataset.uid) { openUserProfile(m.dataset.uid); return; }
      // Lookup przez username → uid (nowy format z kolekcji usernames)
      const nick = m.dataset.mention;
      if (!nick) return;
      const btn = m;
      btn.style.opacity = '.5';
      try {
        const uid = await lookupByUsername(nick);
        if (uid) openUserProfile(uid);
        else showToast(`Nie znaleziono @${nick}`, 'info', 2000);
      } catch { showToast('Błąd wyszukiwania.', 'error'); }
      finally { btn.style.opacity = '1'; }
    });
  });

  // #hashtag click
  el.querySelectorAll('.hashtag-link').forEach(h => {
    h.addEventListener('click', (e) => {
      e.preventDefault();
      const tag = h.dataset.tag;
      if (tag) filterByHashtag(tag);
    });
  });

  // Comment
  const commentInput = el.querySelector(`#comment-input-${postId}`);
  const commentSend  = el.querySelector(`#comment-send-${postId}`);
  commentInput?.addEventListener('input', () => {
    commentInput.style.height = 'auto';
    commentInput.style.height = Math.min(commentInput.scrollHeight, 120) + 'px';
  });
  commentInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(postId, el); }
  });
  commentSend?.addEventListener('click', () => submitComment(postId, el));
  renderSmallAvatar(el.querySelector(`#comment-avatar-${postId}`), currentUser, currentUserData, 30);

  return el;
}


// ════════════════════════════════════════════════════════════
// RENDER CONTENT — @mention + #hashtag
// ════════════════════════════════════════════════════════════

/**
 * Zamienia @nick i #tag na klikalne HTML.
 * UWAGA: używa innerHTML — content jest wcześniej escapeowany
 * a następnie tylko @/# są opakowywane w tagi.
 */
function renderContent(text) {
  if (!text) return '';

  // Najpierw escape
  let escaped = escHtml(text);

  // @mention — match @słowo (litery, cyfry, podkreślenie)
  // Nie mamy indeksu @uid→uid, więc otwieramy profile search
  escaped = escaped.replace(
    /@([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9_]{2,30})/g,
    '<a href="#" class="mention-link" data-mention="$1" style="color:var(--gold-400);font-weight:600;cursor:pointer;text-decoration:none;">@$1</a>'
  );

  // #hashtag
  escaped = escaped.replace(
    /#([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9_]{1,40})/g,
    '<a href="#" class="hashtag-link" data-tag="$1" style="color:var(--gold-500);cursor:pointer;text-decoration:none;">#$1</a>'
  );

  return escaped;
}


// ════════════════════════════════════════════════════════════
// HASHTAG FILTER
// ════════════════════════════════════════════════════════════

function filterByHashtag(tag) {
  showToast(`🔍 #${tag}`, 'info', 2000);
  // Scrolluj do góry i pokaż posty z tym tagiem w widoku
  // Pełny filtr wymagałby osobnego streamu — na MVP: toast + info
  // TODO etap następny: stream z where('hashtags', 'array-contains', tag)
  console.log('[hashtag filter]', tag);
}


// ════════════════════════════════════════════════════════════
// REACTIONS — helper do emoji summary
// ════════════════════════════════════════════════════════════

function _buildReactionsSummary(data) {
  if (!data.reactions || typeof data.reactions !== 'object') {
    // stary format
    return Array.isArray(data.likes) && data.likes.length > 0 ? '👍' : '';
  }
  const present = REACTIONS
    .filter(r => Array.isArray(data.reactions[r.id]) && data.reactions[r.id].length > 0)
    .slice(0, 3);
  return present.map(r => r.emoji).join('');
}


// ════════════════════════════════════════════════════════════
// TOGGLE REACTION
// ════════════════════════════════════════════════════════════

async function toggleReaction(postId, data, postEl, reactionId) {
  const TAG = '[toggleReaction]';
  if (!currentUser) return;

  const uid      = currentUser.uid;
  const postRef  = doc(db, COL.POSTS, postId);
  const current  = getUserReaction(data, uid);
  const isSame   = current === reactionId;

  console.log(TAG, `uid:${uid} current:${current} new:${reactionId} same:${isSame}`);

  // ── Optimistic UI update ────────────────────────────────
  const reactionBtn  = postEl.querySelector('.reaction-btn');
  const reactionEmoji= postEl.querySelector('.reaction-emoji');
  const reactionLbl  = postEl.querySelector('.reaction-label');
  const summaryEl    = postEl.querySelector(`#reactions-summary-${postId}`);
  const emojiRowEl   = postEl.querySelector(`#reactions-emoji-${postId}`);
  const totalEl      = postEl.querySelector(`#reactions-total-${postId}`);

  // Remove old reaction from data
  if (current) {
    if (!data.reactions) data.reactions = {};
    if (!Array.isArray(data.reactions[current])) data.reactions[current] = [];
    data.reactions[current] = data.reactions[current].filter(id => id !== uid);
    // Also clean legacy likes
    if (Array.isArray(data.likes)) data.likes = data.likes.filter(id => id !== uid);
  }

  if (!isSame) {
    // Add new reaction
    if (!data.reactions) data.reactions = {};
    if (!Array.isArray(data.reactions[reactionId])) data.reactions[reactionId] = [];
    data.reactions[reactionId] = [...data.reactions[reactionId], uid];
  }

  // Update UI
  const newMyReaction = isSame ? null : reactionId;
  const newTotal      = getTotalReactions(data);
  const newReactionDef = newMyReaction ? REACTIONS.find(r => r.id === newMyReaction) : getTopReaction(data);

  if (reactionBtn)  { reactionBtn.classList.toggle('reacted', !!newMyReaction); reactionBtn.dataset.myReaction = newMyReaction || ''; }
  if (reactionEmoji) reactionEmoji.textContent = newReactionDef?.emoji ?? '👍';
  if (reactionLbl)   reactionLbl.textContent   = newMyReaction ? (newReactionDef?.label ?? '') : 'Szacunek';
  if (emojiRowEl)    emojiRowEl.textContent     = _buildReactionsSummary(data);
  if (totalEl)       totalEl.textContent        = newTotal > 0 ? newTotal : '';
  if (summaryEl)     summaryEl.style.display    = newTotal > 0 ? '' : 'none';

  // Update picker active state
  postEl.querySelectorAll('.reaction-picker-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.reaction === newMyReaction);
  });

  // ── Firestore update ─────────────────────────────────────
  try {
    const firestoreUpdate = {};

    // Remove from old reaction array
    if (current) {
      firestoreUpdate[`reactions.${current}`] = arrayRemove(uid);
      // Clean legacy likes too
      firestoreUpdate.likes = arrayRemove(uid);
    }

    // Add to new reaction array (if not toggling off)
    if (!isSame) {
      firestoreUpdate[`reactions.${reactionId}`] = arrayUnion(uid);
      // Mirror like in legacy field for compatibility
      if (reactionId === 'like') firestoreUpdate.likes = arrayUnion(uid);
    }

    firestoreUpdate.reactionsCount = newTotal;
    // Keep legacy likesCount in sync
    const likeCount = Array.isArray(data.reactions?.like) ? data.reactions.like.length : 0;
    firestoreUpdate.likesCount = likeCount;

    await updateDoc(postRef, firestoreUpdate);
    console.log(TAG, '✅ Reakcja zapisana');

    // XP + notification dla autora (tylko nowa reakcja)
    if (!isSame && data.authorId && data.authorId !== uid) {
      awardXP(data.authorId, XP_ACTIONS.LIKE_RECEIVED).catch(() => {});
      const def = REACTIONS.find(r => r.id === reactionId);
      createNotification(data.authorId, {
        type:  'like',
        title: `${currentUserData?.displayName || 'Wojownik'} zareagował ${def?.emoji ?? '👍'}`,
        body:  data.content?.slice(0,60) || 'Reakcja na Twój post',
        url:   'feed.html',
      }).catch(() => {});
    }

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    // Rollback — wymuś odświeżenie posta ze Firestore
    try {
      const snap = await getDoc(postRef);
      if (snap.exists()) {
        const fresh = snap.data();
        const freshReaction = getUserReaction(fresh, uid);
        const freshTotal    = getTotalReactions(fresh);
        const freshDef      = freshReaction ? REACTIONS.find(r=>r.id===freshReaction) : getTopReaction(fresh);
        if (reactionBtn)   reactionBtn.classList.toggle('reacted', !!freshReaction);
        if (reactionEmoji) reactionEmoji.textContent = freshDef?.emoji ?? '👍';
        if (reactionLbl)   reactionLbl.textContent   = freshReaction ? (freshDef?.label ?? '') : 'Szacunek';
        if (totalEl)       totalEl.textContent       = freshTotal > 0 ? freshTotal : '';
      }
    } catch {}
  }
}


// ════════════════════════════════════════════════════════════
// COMMENTS
// ════════════════════════════════════════════════════════════

function toggleComments(postId, postEl) {
  const section = postEl.querySelector('.comments-section');
  if (!section) return;
  const isOpen = section.classList.toggle('open');
  if (isOpen) {
    loadComments(postId, postEl);
    setTimeout(() => postEl.querySelector(`#comment-input-${postId}`)?.focus(), 150);
  }
}

async function loadComments(postId, postEl) {
  const listEl = postEl.querySelector(`#comments-list-${postId}`);
  if (!listEl) return;
  listEl.innerHTML = `<div style="text-align:center;padding:0.5rem;font-size:0.8rem;color:var(--text-muted);">Ładowanie...</div>`;
  try {
    const snap = await getDocs(query(
      collection(db, COL.POSTS, postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(20),
    ));
    listEl.innerHTML = '';
    if (snap.empty) {
      listEl.innerHTML = `<p style="font-size:0.8125rem;color:var(--text-muted);text-align:center;padding:0.25rem 0 0.5rem;">Bądź pierwszy!</p>`;
      return;
    }
    snap.forEach((docSnap) => listEl.appendChild(createCommentElement(docSnap.id, docSnap.data())));
  } catch (err) {
    console.error('[loadComments]', err.code);
    listEl.innerHTML = `<p style="font-size:0.8125rem;color:var(--error);padding:0.25rem 0;">Błąd ładowania.</p>`;
  }
}

function createCommentElement(commentId, data) {
  const el       = document.createElement('div');
  el.className   = 'comment-item';
  el.dataset.commentId = commentId;
  const initials = (data.authorName || 'W').split(' ').map(w => w[0]??'').join('').slice(0,2).toUpperCase();
  const avatarHTML = data.authorPhoto
    ? `<img src="${escHtml(data.authorPhoto)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.textContent='${escHtml(initials)}'">`
    : escHtml(initials);
  el.innerHTML = `
    <div class="comment-avatar">${avatarHTML}</div>
    <div class="comment-bubble">
      <div class="comment-author">${escHtml(data.authorName || 'Wojownik')}</div>
      <div class="comment-text">${renderContent(data.content)}</div>
      <div class="comment-time">${formatTime(data.createdAt)}</div>
    </div>`;
  // @mention clicks in comments
  el.querySelectorAll('.mention-link').forEach(m => {
    m.addEventListener('click', (e) => { e.preventDefault(); openUserProfile(m.dataset.uid); });
  });
  return el;
}

async function submitComment(postId, postEl) {
  const input   = postEl.querySelector(`#comment-input-${postId}`);
  const sendBtn = postEl.querySelector(`#comment-send-${postId}`);
  const content = input?.value.trim() ?? '';
  if (!content) return;
  if (content.length > 300) { showToast('Max 300 znaków.', 'error'); return; }
  if (sendBtn) sendBtn.disabled = true;

  try {
    const rankObj = getRank(currentUserData?.points ?? 0);
    const commentData = {
      authorId:    currentUser.uid,
      authorName:  currentUserData?.displayName || currentUser.displayName || 'Wojownik',
      authorPhoto: currentUserData?.photoURL    || currentUser.photoURL    || '',
      authorRank:  rankObj.label,
      content,
      createdAt:   serverTimestamp(),
    };
    await addDoc(collection(db, COL.POSTS, postId, 'comments'), commentData);
    await updateDoc(doc(db, COL.POSTS, postId), {
      commentsCount: (parseInt(postEl.querySelector('.comments-count')?.textContent) || 0) + 1,
    });
    const countEl = postEl.querySelector('.comments-count');
    if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
    const listEl = postEl.querySelector(`#comments-list-${postId}`);
    if (listEl) {
      listEl.querySelector('p')?.remove();
      const fakeData = { ...commentData, createdAt: { toDate: () => new Date() } };
      listEl.appendChild(createCommentElement('temp_' + Date.now(), fakeData));
      listEl.lastChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (input) { input.value = ''; input.style.height = 'auto'; }
    awardXP(currentUser.uid, XP_ACTIONS.COMMENT_ADDED).catch(() => {});
    if (postEl.dataset.authorId && postEl.dataset.authorId !== currentUser?.uid) {
      createNotification(postEl.dataset.authorId, {
        type: 'comment', title: `${currentUserData?.displayName || 'Wojownik'} skomentował Twój post 💬`,
        body: content.slice(0,60), url: 'feed.html',
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[submitComment]', err.code);
    showToast(err.code === 'permission-denied' ? 'Brak uprawnień.' : 'Błąd komentarza.', 'error');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}


// ════════════════════════════════════════════════════════════
// DELETE POST
// ════════════════════════════════════════════════════════════

function confirmDeletePost(postId, data) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-handle"></div>
      <h3 class="modal-title">Usuń post</h3>
      <p class="modal-text">Czy na pewno chcesz usunąć ten post?</p>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-full" id="modal-cancel">Anuluj</button>
        <button class="btn btn-danger btn-full" id="modal-confirm">Usuń post</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#modal-cancel')?.addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#modal-confirm')?.addEventListener('click', async () => { backdrop.remove(); await deletePost(postId, data); });
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
}

async function deletePost(postId, data) {
  try {
    if (data.imageStoragePath) console.log('[deletePost] Cloudinary publicId:', data.imageStoragePath);
    await deleteDoc(doc(db, COL.POSTS, postId));
    showToast('Post usunięty.', 'success');
  } catch (err) {
    showToast('Błąd usuwania.', 'error');
  }
}


// ════════════════════════════════════════════════════════════
// SHARE
// ════════════════════════════════════════════════════════════

function sharePost(postId, data) {
  const url   = `${window.location.origin}${window.location.pathname.replace(/feed\.html.*/, '')}feed.html?post=${postId}`;
  const title = `${data.authorName || 'Wojownik'} na Weekend Warrior Social ⚔️`;
  const text  = data.content?.slice(0, 100) ?? '';

  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url)
      .then(() => showToast('Link skopiowany! 📋', 'success', 3000))
      .catch(() => {
        // Final fallback
        const inp = document.createElement('input');
        inp.value = url;
        document.body.appendChild(inp);
        inp.select();
        document.execCommand('copy');
        inp.remove();
        showToast('Link skopiowany! 📋', 'success', 3000);
      });
  }
}


// ════════════════════════════════════════════════════════════
// LIGHTBOX
// ════════════════════════════════════════════════════════════

function openLightbox(src) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Zamknij">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <img src="${escHtml(src)}" alt="Powiększone zdjęcie"/>`;
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lightbox-close')) lb.remove(); });
  document.body.appendChild(lb);
  const onKey = (e) => { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function renderSmallAvatar(el, user, data, size = 40) {
  if (!el) return;
  const photoURL = data?.photoURL || user?.photoURL || '';
  const name     = data?.displayName || user?.displayName || 'W';
  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  el.style.width  = size + 'px';
  el.style.height = size + 'px';
  if (photoURL) {
    el.innerHTML = '';
    const img = document.createElement('img');
    img.src = photoURL; img.alt = 'Avatar';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => { el.innerHTML = ''; el.textContent = initials; };
    el.appendChild(img);
  } else { el.textContent = initials; }
}

function formatTime(ts) {
  if (!ts) return '';
  const date = ts instanceof Timestamp ? ts.toDate()
    : ts?.toDate?.() ? ts.toDate()
    : ts?.seconds    ? new Date(ts.seconds * 1000)
    : new Date(ts);
  if (isNaN(date.getTime())) return '';
  const now = new Date(), diff = now - date;
  const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), d = Math.floor(h/24);
  if (s < 30)  return 'przed chwilą';
  if (s < 60)  return `${s} sek. temu`;
  if (m < 60)  return `${m} min. temu`;
  if (h < 24)  return `${h} godz. temu`;
  if (d < 7)   return `${d} dni temu`;
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
