/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — feed.js
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Funkcje:
 *   initFeed()          — inicjalizuje stronę feed.html
 *
 * Architektura:
 *   - Real-time stream postów przez onSnapshot
 *   - Lazy-load komentarzy (tylko gdy otwarte)
 *   - Optimistic UI dla lajków
 *   - Upload zdjęcia przez Firebase Storage CDN
 *   - Paginacja (10 postów, "Załaduj więcej")
 */
// ─────────────────────────────────────
// STATE
// ─────────────────────────────────────

let currentUser = null;
let currentUserData = null;

let selectedImage = null;
let isPosting = false;

let unsubFeed = null;
let lastPostDoc = null;
let hasMorePosts = true;

const POSTS_PER_PAGE = 10;
const MAX_POST_LENGTH = 500;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];
import {
  auth, db, COL, getRank,
} from './firebase.js';

import {
  checkAuth, logout, getCurrentUserData, showToast,
} from './auth.js';

import { awardXP, checkDailyLogin, XP_ACTIONS } from './xp.js';
import { makeAvatarsClickable, openUserProfile } from './social.js';
import { injectNotifBell } from './notifications.js';

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
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { uploadToCloudinary } from './cloudinary.js';

// ======================================
// STATE
// ======================================

let currentUser = null;
let currentUserData = null;

let selectedImage = null;
let isPosting = false;

let unsubFeed = null;
let lastPostDoc = null;
let hasMorePosts = true;

const POSTS_PER_PAGE = 10;
const MAX_POST_LENGTH = 500;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];
// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initFeed() {
  const TAG = '[initFeed]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    currentUser = user;
    console.log(TAG, '✅ User:', user.uid);

    // Pobierz dane profilu
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
    startFeedStream();

    // Sprawdź dzienny bonus XP
    checkDailyLogin(user.uid).catch(() => {});

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', logout);
  });
}


// ════════════════════════════════════════════════════════════
// COMPOSE BOX
// ════════════════════════════════════════════════════════════

function setupComposeBox() {
  const TAG = '[setupComposeBox]';

  // Render avatar w compose
  const composeAvatar = document.getElementById('compose-avatar');
  renderSmallAvatar(composeAvatar, currentUser, currentUserData);

  const textarea    = document.getElementById('post-textarea');
  const charCount   = document.getElementById('char-count');
  const submitBtn   = document.getElementById('post-submit-btn');
  const imageBtn    = document.getElementById('image-upload-btn');
  const imageInput  = document.getElementById('image-input');
  const preview     = document.getElementById('compose-preview');
  const removeImg   = document.getElementById('remove-image-btn');

  if (!textarea) { console.warn(TAG, '⚠️ textarea nie znaleziony'); return; }

  // Char counter
  textarea.addEventListener('input', () => {
    const len  = textarea.value.length;
    const left = MAX_POST_LENGTH - len;
    if (charCount) {
      charCount.textContent = left;
      charCount.className   = 'char-count' +
        (left < 20 ? ' danger' : left < 60 ? ' warn' : '');
    }
    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px';
  });

  // Image button
  imageBtn?.addEventListener('click', () => imageInput?.click());

  // Image selected
  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Dozwolone formaty: JPG, PNG, WebP, GIF', 'error');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showToast('Zdjęcie może mieć max. 5 MB.', 'error');
      return;
    }

    selectedImage = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = preview?.querySelector('img');
      if (img) {
        img.src = ev.target.result;
        preview?.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);

    imageBtn?.classList.add('active');
    console.log(TAG, '📷 Wybrano zdjęcie:', file.name, file.size);
  });

  // Remove image
  removeImg?.addEventListener('click', () => {
    selectedImage = null;
    if (imageInput) imageInput.value = '';
    preview?.classList.add('hidden');
    imageBtn?.classList.remove('active');
  });

  // Submit post
  submitBtn?.addEventListener('click', submitPost);

  // Ctrl+Enter / Cmd+Enter submit
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submitPost();
    }
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

  if (!content && !selectedImage) {
    showToast('Napisz coś lub dodaj zdjęcie! 📝', 'info');
    textarea?.focus();
    return;
  }

  if (content.length > MAX_POST_LENGTH) {
    showToast(`Post może mieć max ${MAX_POST_LENGTH} znaków.`, 'error');
    return;
  }

  isPosting = true;
  if (submitBtn) {
    submitBtn.disabled   = true;
    submitBtn.textContent = 'Publikuję...';
  }

  console.log(TAG, '📝 Publikuję post...');

  try {
    let imageUrl      = '';
    let imageStoragePath = '';

    // Upload zdjęcia jeśli wybrane
    if (selectedImage) {
      console.log(TAG, '⬆️ Upload zdjęcia...');
      const result = await uploadImage(selectedImage);
      imageUrl          = result.url;
      imageStoragePath  = result.path;
      console.log(TAG, '✅ Upload OK:', imageUrl);
    }

    // Dane posta
    const rankObj = getRank(currentUserData?.points ?? 0);
    const postData = {
      authorId:       currentUser.uid,
      authorName:     currentUserData?.displayName || currentUser.displayName || 'Wojownik',
      authorPhoto:    currentUserData?.photoURL    || currentUser.photoURL    || '',
      authorRank:     rankObj.label,
      authorRankEmoji:rankObj.emoji,
      content,
      imageUrl,
      imageStoragePath,
      likes:          [],
      likesCount:     0,
      commentsCount:  0,
      createdAt:      serverTimestamp(),
    };

    await addDoc(collection(db, COL.POSTS), postData);
    console.log(TAG, '✅ Post dodany do Firestore');

    // Reset compose
    if (textarea) {
      textarea.value      = '';
      textarea.style.height = 'auto';
    }
    selectedImage = null;
    if (document.getElementById('image-input'))
      document.getElementById('image-input').value = '';
    document.getElementById('compose-preview')?.classList.add('hidden');
    document.getElementById('image-upload-btn')?.classList.remove('active');
    document.getElementById('char-count') &&
      (document.getElementById('char-count').textContent = MAX_POST_LENGTH);

    showToast('Post opublikowany! ⚔️', 'success');

    // Przyznaj XP za post
    awardXP(currentUser.uid, XP_ACTIONS.POST_CREATED).catch(() => {});

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    if (err.code === 'permission-denied') {
      showToast('Brak uprawnień. Sprawdź reguły Firestore.', 'error');
    } else {
      showToast('Błąd publikowania. Spróbuj ponownie.', 'error');
    }
  } finally {
    isPosting = false;
    if (submitBtn) {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Publikuj';
    }
  }
}


// ════════════════════════════════════════════════════════════
// IMAGE UPLOAD
// ════════════════════════════════════════════════════════════

async function uploadImage(file) {
  const progressEl = document.getElementById('upload-progress');
  const progressBar = document.getElementById('upload-progress-bar');

  try {
    if (progressEl) progressEl.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '10%';

    const result = await uploadToCloudinary(
      file,
      `posts/${currentUser.uid}`
    );

    if (progressBar) progressBar.style.width = '100%';

    return {
      url: result.url,
      path: result.publicId
    };

  } finally {
    setTimeout(() => {
      if (progressEl) progressEl.classList.add('hidden');
      if (progressBar) progressBar.style.width = '0%';
    }, 300);
  }
}


// ════════════════════════════════════════════════════════════
// FEED STREAM (real-time)
// ════════════════════════════════════════════════════════════

function startFeedStream() {
  const TAG = '[startFeedStream]';
  console.log(TAG, '🔄 Uruchamiam stream...');

  const feedList    = document.getElementById('feed-list');
  const feedEmpty   = document.getElementById('feed-empty');
  const feedLoading = document.getElementById('feed-loading');

  // Skeleton podczas ładowania
  if (feedLoading) feedLoading.classList.remove('hidden');

  const q = query(
    collection(db, COL.POSTS),
    orderBy('createdAt', 'desc'),
    limit(POSTS_PER_PAGE),
  );

  // Unsubscribe poprzedni stream
  if (unsubFeed) { unsubFeed(); unsubFeed = null; }

  unsubFeed = onSnapshot(q, (snapshot) => {
    console.log(TAG, `✅ Snapshot: ${snapshot.size} postów`);

    if (feedLoading) feedLoading.classList.add('hidden');

    if (snapshot.empty) {
      if (feedList)  feedList.innerHTML = '';
      if (feedEmpty) feedEmpty.classList.add('show');
      return;
    }

    if (feedEmpty) feedEmpty.classList.remove('show');

    // Zachowaj otwarte komentarze
    const openComments = new Set();
    feedList?.querySelectorAll('.comments-section.open').forEach(el => {
      openComments.add(el.dataset.postId);
    });

    // Render postów
    if (feedList) feedList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const postEl = createPostElement(docSnap.id, docSnap.data());
      feedList?.appendChild(postEl);
    });

    // Przywróć otwarte komentarze
    openComments.forEach(pid => {
      const sec = feedList?.querySelector(`[data-post-id="${pid}"]`);
      if (sec) sec.classList.add('open');
    });

    // Zapamiętaj ostatni dokument dla paginacji
    lastPostDoc  = snapshot.docs[snapshot.docs.length - 1];
    hasMorePosts = snapshot.size === POSTS_PER_PAGE;

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.style.display = hasMorePosts ? 'block' : 'none';

    // Make avatars clickable
    makeAvatarsClickable(feedList);

    // Animacje
    feedList?.querySelectorAll('.post-card').forEach((el, i) => {
      el.style.animationDelay = (i * 0.04) + 's';
    });

  }, (err) => {
    console.error(TAG, '❌ onSnapshot error:', err.code, err.message);
    if (feedLoading) feedLoading.classList.add('hidden');

    if (err.code === 'permission-denied') {
      showToast('Brak dostępu do postów. Sprawdź reguły Firestore.', 'error');
    } else {
      showToast('Błąd ładowania feedu.', 'error');
    }
  });

  // "Załaduj więcej" button
  document.getElementById('load-more-btn')?.addEventListener('click', loadMorePosts);
}


// ════════════════════════════════════════════════════════════
// LOAD MORE POSTS (pagination)
// ════════════════════════════════════════════════════════════

async function loadMorePosts() {
  const TAG = '[loadMorePosts]';
  if (!lastPostDoc || !hasMorePosts) return;

  const btn = document.getElementById('load-more-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Ładowanie...'; }

  console.log(TAG, 'Ładuję więcej postów...');

  try {
    const q    = query(
      collection(db, COL.POSTS),
      orderBy('createdAt', 'desc'),
      startAfter(lastPostDoc),
      limit(POSTS_PER_PAGE),
    );

    const snap = await getDocs(q);
    console.log(TAG, `✅ ${snap.size} dodatkowych postów`);

    const feedList = document.getElementById('feed-list');
    snap.forEach((docSnap) => {
      const postEl = createPostElement(docSnap.id, docSnap.data());
      feedList?.appendChild(postEl);
    });

    lastPostDoc  = snap.docs[snap.docs.length - 1] ?? lastPostDoc;
    hasMorePosts = snap.size === POSTS_PER_PAGE;

  } catch (err) {
    console.error(TAG, '❌', err);
    showToast('Błąd ładowania postów.', 'error');
  } finally {
    if (btn) {
      btn.disabled    = false;
      btn.textContent = 'Załaduj więcej';
      if (!hasMorePosts) btn.style.display = 'none';
    }
  }
}


// ════════════════════════════════════════════════════════════
// CREATE POST ELEMENT
// ════════════════════════════════════════════════════════════

function createPostElement(postId, data) {
  const isOwner  = data.authorId === currentUser?.uid;
  const isLiked  = Array.isArray(data.likes) && data.likes.includes(currentUser?.uid);
  const likesCount    = data.likesCount    ?? data.likes?.length ?? 0;
  const commentsCount = data.commentsCount ?? 0;

  const el = document.createElement('article');
  el.className    = 'post-card';
  el.dataset.postId = postId;

  // Time formatting
  const timeStr = formatTime(data.createdAt);

  // Author avatar initials
  const initials = (data.authorName || 'W')
    .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  // Avatar HTML
  const avatarHTML = data.authorPhoto
    ? `<img src="${escHtml(data.authorPhoto)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.textContent='${escHtml(initials)}'">`
    : escHtml(initials);

  // Image HTML
  const imageHTML = data.imageUrl
    ? `<img src="${escHtml(data.imageUrl)}" alt="Zdjęcie posta" class="post-image" loading="lazy">`
    : '';

  // Rank badge
  const rankBadge = data.authorRankEmoji && data.authorRank
    ? `<span class="post-rank-badge">${escHtml(data.authorRankEmoji)} ${escHtml(data.authorRank)}</span>`
    : '';

  // Delete button (only owner)
  const deleteBtn = isOwner
    ? `<button class="post-menu-btn delete-post-btn" aria-label="Usuń post" title="Usuń post">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>`
    : '';

  el.innerHTML = `
    <!-- Header -->
    <div class="post-header">
      <div class="post-avatar" data-user-uid="${data.authorId}" style="cursor:pointer;">${avatarHTML}</div>
      <div class="post-meta">
        <div class="post-author">${escHtml(data.authorName || 'Wojownik')}</div>
        <div class="post-time">${timeStr}</div>
      </div>
      ${rankBadge}
      ${deleteBtn}
    </div>

    <!-- Content -->
    ${data.content
      ? `<div class="post-content">${escHtml(data.content)}</div>`
      : ''}

    <!-- Image -->
    ${imageHTML}

    <!-- Actions -->
    <div class="post-actions">
      <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${postId}">
        <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        <span class="likes-count">${likesCount > 0 ? likesCount : ''}</span>
      </button>

      <button class="post-action-btn comment-btn" data-post-id="${postId}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span class="comments-count">${commentsCount > 0 ? commentsCount : ''}</span>
      </button>

      <div class="post-action-sep"></div>

      <button class="post-action-btn share-btn" data-post-id="${postId}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
    </div>

    <!-- Comments section -->
    <div class="comments-section" data-post-id="${postId}">
      <div class="comments-list" id="comments-list-${postId}"></div>
      <div class="comment-compose">
        <div class="comment-avatar" id="comment-avatar-${postId}"></div>
        <div class="comment-input-wrap">
          <textarea
            class="comment-input"
            placeholder="Dodaj komentarz..."
            rows="1"
            maxlength="300"
            id="comment-input-${postId}"
          ></textarea>
        </div>
        <button class="comment-send-btn" id="comment-send-${postId}" aria-label="Wyślij komentarz">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // ── Event listeners ──────────────────────────────────────

  // Like
  el.querySelector('.like-btn')?.addEventListener('click', () => toggleLike(postId, data, el));

  // Comment toggle
  el.querySelector('.comment-btn')?.addEventListener('click', () => toggleComments(postId, el));

  // Share
  el.querySelector('.share-btn')?.addEventListener('click', () => sharePost(postId, data));

  // Delete
  el.querySelector('.delete-post-btn')?.addEventListener('click', () => confirmDeletePost(postId, data));

  // Image lightbox
  el.querySelector('.post-image')?.addEventListener('click', (e) => openLightbox(e.target.src));

  // Comment send
  const commentInput = el.querySelector(`#comment-input-${postId}`);
  const commentSend  = el.querySelector(`#comment-send-${postId}`);

  commentInput?.addEventListener('input', () => {
    // Auto-resize
    commentInput.style.height = 'auto';
    commentInput.style.height = Math.min(commentInput.scrollHeight, 120) + 'px';
  });

  commentInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment(postId, el);
    }
  });

  commentSend?.addEventListener('click', () => submitComment(postId, el));

  // Render avatar w comment compose
  const commentAvatarEl = el.querySelector(`#comment-avatar-${postId}`);
  renderSmallAvatar(commentAvatarEl, currentUser, currentUserData, 30);

  return el;
}


// ════════════════════════════════════════════════════════════
// LIKE
// ════════════════════════════════════════════════════════════

async function toggleLike(postId, data, postEl) {
  const TAG = '[toggleLike]';
  if (!currentUser) return;

  const uid        = currentUser.uid;
  const likes      = Array.isArray(data.likes) ? data.likes : [];
  const isLiked    = likes.includes(uid);
  const postRef    = doc(db, COL.POSTS, postId);
  const likeBtn    = postEl.querySelector('.like-btn');
  const countEl    = postEl.querySelector('.likes-count');
  const newCount   = isLiked ? Math.max(0, (data.likesCount ?? likes.length) - 1) : (data.likesCount ?? likes.length) + 1;

  // Optimistic UI
  if (likeBtn) {
    likeBtn.classList.toggle('liked', !isLiked);
    const svgPath = likeBtn.querySelector('path');
    if (svgPath) svgPath.setAttribute('fill', !isLiked ? 'currentColor' : 'none');
  }
  if (countEl) countEl.textContent = newCount > 0 ? newCount : '';

  // Aktualizuj lokalny obiekt data
  data.likes      = isLiked ? likes.filter(id => id !== uid) : [...likes, uid];
  data.likesCount = newCount;

  console.log(TAG, isLiked ? '💔 Unlike' : '❤️ Like', postId);

  // Przyznaj XP autorowi posta za otrzymany lajk
  if (!isLiked && data.authorId && data.authorId !== currentUser?.uid) {
    awardXP(data.authorId, XP_ACTIONS.LIKE_RECEIVED).catch(() => {});
    // Notification for post author
    const { createNotification } = await import('./notifications.js');
    const senderName = currentUser?.displayName || 'Wojownik';
    createNotification(data.authorId, {
      type:  'like',
      title: `${senderName} polubił Twój post ❤️`,
      body:  data.content?.slice(0,60) || 'Ktoś polubił Twój post',
      url:   'feed.html',
    }).catch(() => {});
  }

  try {
    await updateDoc(postRef, {
      likes:      isLiked ? arrayRemove(uid) : arrayUnion(uid),
      likesCount: newCount,
    });
  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    // Rollback
    if (likeBtn) likeBtn.classList.toggle('liked', isLiked);
    if (countEl) countEl.textContent = (data.likesCount ?? 0) > 0 ? (data.likesCount ?? 0) : '';
    if (err.code !== 'permission-denied') {
      showToast('Błąd. Spróbuj ponownie.', 'error');
    }
  }
}


// ════════════════════════════════════════════════════════════
// COMMENTS
// ════════════════════════════════════════════════════════════

function toggleComments(postId, postEl) {
  const section = postEl.querySelector('.comments-section');
  if (!section) return;

  const isOpen = section.classList.toggle('open');
  console.log('[toggleComments]', isOpen ? 'open' : 'close', postId);

  if (isOpen) {
    loadComments(postId, postEl);
    // Focus input
    setTimeout(() => {
      postEl.querySelector(`#comment-input-${postId}`)?.focus();
    }, 150);
  }
}

async function loadComments(postId, postEl) {
  const TAG = '[loadComments]';
  const listEl = postEl.querySelector(`#comments-list-${postId}`);
  if (!listEl) return;

  listEl.innerHTML = `<div style="text-align:center;padding:0.5rem;font-size:0.8rem;color:var(--text-muted);">Ładowanie komentarzy...</div>`;

  try {
    const q    = query(
      collection(db, COL.POSTS, postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(20),
    );
    const snap = await getDocs(q);
    console.log(TAG, `✅ ${snap.size} komentarzy dla`, postId);

    listEl.innerHTML = '';

    if (snap.empty) {
      listEl.innerHTML = `<p style="font-size:0.8125rem;color:var(--text-muted);text-align:center;padding:0.25rem 0 0.5rem;">Bądź pierwszy! Dodaj komentarz.</p>`;
      return;
    }

    snap.forEach((docSnap) => {
      listEl.appendChild(createCommentElement(docSnap.id, docSnap.data()));
    });

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    listEl.innerHTML = `<p style="font-size:0.8125rem;color:var(--error);padding:0.25rem 0;">Błąd ładowania komentarzy.</p>`;
  }
}

function createCommentElement(commentId, data) {
  const el       = document.createElement('div');
  el.className   = 'comment-item';
  el.dataset.commentId = commentId;

  const initials = (data.authorName || 'W')
    .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const avatarHTML = data.authorPhoto
    ? `<img src="${escHtml(data.authorPhoto)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.parentElement.textContent='${escHtml(initials)}'">`
    : escHtml(initials);

  el.innerHTML = `
    <div class="comment-avatar">${avatarHTML}</div>
    <div class="comment-bubble">
      <div class="comment-author">${escHtml(data.authorName || 'Wojownik')}</div>
      <div class="comment-text">${escHtml(data.content)}</div>
      <div class="comment-time">${formatTime(data.createdAt)}</div>
    </div>
  `;

  return el;
}

async function submitComment(postId, postEl) {
  const TAG = '[submitComment]';

  const input   = postEl.querySelector(`#comment-input-${postId}`);
  const sendBtn = postEl.querySelector(`#comment-send-${postId}`);
  const content = input?.value.trim() ?? '';

  if (!content) return;
  if (content.length > 300) {
    showToast('Komentarz może mieć max 300 znaków.', 'error');
    return;
  }

  if (sendBtn) sendBtn.disabled = true;
  console.log(TAG, '💬 Dodaję komentarz do', postId);

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

    // Increment counter
    await updateDoc(doc(db, COL.POSTS, postId), {
      commentsCount: (postEl.querySelector('.comments-count')?.textContent
        ? parseInt(postEl.querySelector('.comments-count').textContent) + 1
        : 1),
    });

    // Aktualizuj counter w UI
    const countEl = postEl.querySelector('.comments-count');
    if (countEl) {
      const prev = parseInt(countEl.textContent) || 0;
      countEl.textContent = prev + 1;
    }

    // Dodaj komentarz do listy
    const listEl = postEl.querySelector(`#comments-list-${postId}`);
    if (listEl) {
      const emptyMsg = listEl.querySelector('p');
      if (emptyMsg) emptyMsg.remove();

      // Fake timestamp dla natychmiastowego wyświetlenia
      const fakeData = { ...commentData, createdAt: { toDate: () => new Date() } };
      listEl.appendChild(createCommentElement('temp_' + Date.now(), fakeData));
      listEl.lastChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Reset input
    if (input) {
      input.value       = '';
      input.style.height = 'auto';
    }

    console.log(TAG, '✅ Komentarz dodany');

    // XP za komentarz (komentujący)
    awardXP(currentUser.uid, XP_ACTIONS.COMMENT_ADDED).catch(() => {});

    // Notify post author about comment
    if (postEl.dataset && postEl.dataset.authorId && postEl.dataset.authorId !== currentUser?.uid) {
      const { createNotification } = await import('./notifications.js');
      const senderName = currentUserData?.displayName || currentUser?.displayName || 'Wojownik';
      createNotification(postEl.dataset.authorId, {
        type:  'comment',
        title: `${senderName} skomentował Twój post 💬`,
        body:  content.slice(0,60),
        url:   'feed.html',
      }).catch(() => {});
    }

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    showToast(
      err.code === 'permission-denied'
        ? 'Brak uprawnień do komentowania.'
        : 'Błąd dodawania komentarza.',
      'error',
    );
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}


// ════════════════════════════════════════════════════════════
// DELETE POST
// ════════════════════════════════════════════════════════════

function confirmDeletePost(postId, data) {
  // Pokaż modal potwierdzenia
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-handle"></div>
      <h3 class="modal-title">Usuń post</h3>
      <p class="modal-text">Czy na pewno chcesz usunąć ten post? Tej operacji nie można cofnąć.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-full" id="modal-cancel">Anuluj</button>
        <button class="btn btn-danger btn-full" id="modal-confirm">Usuń post</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  backdrop.querySelector('#modal-cancel')?.addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#modal-confirm')?.addEventListener('click', async () => {
    backdrop.remove();
    await deletePost(postId, data);
  });

  // Zamknij klikając w tło
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
}

async function deletePost(postId, data) {
  const TAG = '[deletePost]';
  console.log(TAG, '🗑️ Usuwam post:', postId);

  try {
    // Usuń zdjęcie ze Storage jeśli istnieje
 // Cloudinary - na MVP nie usuwamy fizycznie pliku
if (data.imageStoragePath) {
  console.log(TAG, 'ℹ️ Cloudinary asset:', data.imageStoragePath);
}

    // Usuń dokument z Firestore
    await deleteDoc(doc(db, COL.POSTS, postId));
    console.log(TAG, '✅ Post usunięty');
    showToast('Post usunięty.', 'success');

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    showToast('Błąd usuwania posta.', 'error');
  }
}


// ════════════════════════════════════════════════════════════
// SHARE
// ════════════════════════════════════════════════════════════

function sharePost(postId, data) {
  const url   = `${window.location.origin}${window.location.pathname}?post=${postId}`;
  const title = `${data.authorName} na Weekend Warrior Social`;
  const text  = data.content?.slice(0, 100) ?? '';

  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link skopiowany do schowka! 📋', 'success'))
      .catch(() => showToast('Nie można skopiować linku.', 'error'));
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
    <img src="${escHtml(src)}" alt="Powiększone zdjęcie" />
  `;

  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.closest('.lightbox-close')) lb.remove();
  });

  document.body.appendChild(lb);

  // Zamknij Escape
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
    const img     = document.createElement('img');
    img.src       = photoURL;
    img.alt       = 'Avatar';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror   = () => { el.innerHTML = ''; el.textContent = initials; };
    el.appendChild(img);
  } else {
    el.textContent = initials;
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const date = ts instanceof Timestamp ? ts.toDate()
    : ts?.toDate?.() ? ts.toDate()
    : ts?.seconds    ? new Date(ts.seconds * 1000)
    : new Date(ts);

  if (isNaN(date.getTime())) return '';

  const now    = new Date();
  const diffMs = now - date;
  const diffS  = Math.floor(diffMs / 1000);
  const diffM  = Math.floor(diffS / 60);
  const diffH  = Math.floor(diffM / 60);
  const diffD  = Math.floor(diffH / 24);

  if (diffS < 30)  return 'przed chwilą';
  if (diffS < 60)  return `${diffS} sek. temu`;
  if (diffM < 60)  return `${diffM} min. temu`;
  if (diffH < 24)  return `${diffH} godz. temu`;
  if (diffD < 7)   return `${diffD} dni temu`;

  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
