/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — feed.js (KRONIKI ARENY)
 * edycja · usuwanie · udostępnianie · zakładki · XP · powiadomienia
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Struktura Firestore:
 *   posts/{postId}
 *     { authorId, authorName, authorAvatar, content, imageUrl,
 *       likes:[uid], commentsCount, edited, createdAt }
 *   posts/{postId}/comments/{commentId}
 *     { authorId, authorName, content, parentId, createdAt }
 *
 * Eksporty:
 *   initFeed()  — pełne UI feed.html
 *   createPost, loadFeed, likePost, unlikePost, deletePost, updatePost,
 *   addComment, loadComments, deleteComment, getPost
 */

import { auth, db, COL, uploadImage, deleteImageByURL, getRank } from "./firebase.js";
import {
  collection, addDoc, query, orderBy, limit, onSnapshot, updateDoc, doc,
  deleteDoc, getDoc, getDocs, where, startAfter, arrayUnion, arrayRemove,
  serverTimestamp, increment,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showToast } from "./auth.js";
import { createNotification } from "./notifications.js";
import { awardXP, XP_ACTIONS } from "./xp.js";

// ════════════════════════════════════════════════════════════
// API
// ════════════════════════════════════════════════════════════

export async function createPost(authorId, authorName, authorAvatar, content, imageUrl = "") {
  try {
    const docRef = await addDoc(collection(db, COL.POSTS), {
      authorId,
      authorName,
      authorAvatar: authorAvatar || "",
      content: content || "",
      imageUrl: imageUrl || "",
      likes: [],
      commentsCount: 0,
      edited: false,
      createdAt: serverTimestamp(),
    });
    showToast("✅ Post opublikowany", "success");
    awardXP(authorId, XP_ACTIONS.POST_CREATED).catch(() => {});
    return docRef.id;
  } catch (err) {
    showToast("❌ Błąd publikacji: " + (err.code || ""), "error");
    console.error("Create post error:", err);
    return null;
  }
}

export function loadFeed(callback) {
  const q = query(collection(db, COL.POSTS), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.warn("[loadFeed]", err.code));
}

export async function likePost(postId, uid) {
  try {
    await updateDoc(doc(db, COL.POSTS, postId), { likes: arrayUnion(uid) });
  } catch (err) {
    console.error("Like post error:", err);
  }
}

export async function unlikePost(postId, uid) {
  try {
    await updateDoc(doc(db, COL.POSTS, postId), { likes: arrayRemove(uid) });
  } catch (err) {
    console.error("Unlike post error:", err);
  }
}

export async function updatePost(postId, uid, newContent) {
  try {
    const snap = await getDoc(doc(db, COL.POSTS, postId));
    if (!snap.exists() || snap.data().authorId !== uid) {
      showToast("❌ Nie możesz edytować tego posta", "error");
      return false;
    }
    await updateDoc(doc(db, COL.POSTS, postId), { content: newContent, edited: true });
    showToast("✅ Post zaktualizowany", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd edycji", "error");
    console.error("Update post error:", err);
    return false;
  }
}

export async function deletePost(postId, uid) {
  try {
    const postSnap = await getDoc(doc(db, COL.POSTS, postId));
    if (!postSnap.exists()) { showToast("❌ Post nie istnieje", "error"); return false; }
    if (postSnap.data().authorId !== uid) { showToast("❌ Nie możesz usunąć tego posta", "error"); return false; }

    if (postSnap.data().imageUrl) deleteImageByURL(postSnap.data().imageUrl);

    await deleteDoc(doc(db, COL.POSTS, postId));
    showToast("✅ Post usunięty", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd usuwania", "error");
    console.error("Delete post error:", err);
    return false;
  }
}

export async function addComment(postId, authorId, authorName, content, parentId = "") {
  try {
    const commentRef = await addDoc(collection(db, COL.POSTS, postId, COL.COMMENTS), {
      authorId,
      authorName,
      content,
      parentId: parentId || "",
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, COL.POSTS, postId), { commentsCount: increment(1) });
    awardXP(authorId, XP_ACTIONS.COMMENT_ADDED).catch(() => {});
    return commentRef.id;
  } catch (err) {
    showToast("❌ Błąd dodawania komentarza", "error");
    console.error("Add comment error:", err);
    return null;
  }
}

export function loadComments(postId, callback) {
  const q = query(collection(db, COL.POSTS, postId, COL.COMMENTS), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.warn("[loadComments]", err.code));
}

export async function deleteComment(postId, commentId, uid) {
  try {
    const snap = await getDoc(doc(db, COL.POSTS, postId, COL.COMMENTS, commentId));
    if (!snap.exists() || snap.data().authorId !== uid) {
      showToast("❌ Nie możesz usunąć tego komentarza", "error");
      return false;
    }
    await deleteDoc(doc(db, COL.POSTS, postId, COL.COMMENTS, commentId));
    await updateDoc(doc(db, COL.POSTS, postId), { commentsCount: increment(-1) });
    return true;
  } catch (err) {
    showToast("❌ Błąd usuwania", "error");
    console.error("Delete comment error:", err);
    return false;
  }
}

export async function getPost(postId) {
  try {
    const snap = await getDoc(doc(db, COL.POSTS, postId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error("Get post error:", err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// PEŁNE UI — initFeed() (feed.html)
// ════════════════════════════════════════════════════════════

export function initFeed() {
  let me = null;
  let myData = { displayName: "Wojownik", photoURL: "" };
  let currentTab = "forYou";
  let followingIds = [];
  let unsubFeed = null;
  let pendingImage = null;
  let lastVisible = null;
  let feedGeneration = 0;
  const PAGE = 20;
  const openComments = new Set();   // posty z rozwiniętymi komentarzami
  const commentUnsubs = new Map();

  const $ = (id) => document.getElementById(id);

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }
    me = user;

    $("logout-btn")?.addEventListener("click", async () => {
      const { logout } = await import("./auth.js");
      logout();
    });

    try {
      const snap = await getDoc(doc(db, COL.USERS, user.uid));
      if (snap.exists()) myData = snap.data();
    } catch {}

    _renderComposeAvatar();
    _wireCompose();
    _wireTabs();
    await _loadFollowing();
    _startFeed();
  });

  // ── Compose ────────────────────────────────────────────────
  function _renderComposeAvatar() {
    const av = $("compose-avatar");
    if (!av) return;
    const name = myData.displayName || me.displayName || "W";
    if (myData.photoURL) {
      av.innerHTML = `<img src="${_esc(myData.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      av.textContent = name.charAt(0).toUpperCase();
    }
  }

  function _wireCompose() {
    const ta = $("post-textarea");
    const count = $("char-count");
    const submitBtn = $("post-submit-btn");
    const imgBtn = $("image-upload-btn");
    const imgInput = $("image-input");
    const preview = $("compose-preview");
    const removeBtn = $("remove-image-btn");

    ta?.addEventListener("input", () => {
      if (count) count.textContent = String(500 - ta.value.length);
    });

    imgBtn?.addEventListener("click", () => imgInput?.click());
    imgInput?.addEventListener("change", () => {
      const file = imgInput.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) { showToast("❌ Zdjęcie max 8 MB", "error"); return; }
      pendingImage = file;
      if (preview) {
        preview.querySelector("img").src = URL.createObjectURL(file);
        preview.classList.remove("hidden");
      }
      imgInput.value = "";
    });
    removeBtn?.addEventListener("click", () => {
      pendingImage = null;
      preview?.classList.add("hidden");
    });

    submitBtn?.addEventListener("click", async () => {
      const content = ta?.value.trim() || "";
      if (!content && !pendingImage) { showToast("⚠️ Napisz coś lub dodaj zdjęcie", "info"); return; }
      submitBtn.disabled = true;
      try {
        let imageUrl = "";
        if (pendingImage) {
          const progWrap = $("upload-progress");
          const progBar = $("upload-progress-bar");
          progWrap?.classList.remove("hidden");
          imageUrl = await uploadImage(
            pendingImage,
            `posts/${me.uid}/${Date.now()}.jpg`,
            (pct) => { if (progBar) progBar.style.width = pct + "%"; }
          );
          progWrap?.classList.add("hidden");
          if (progBar) progBar.style.width = "0%";
        }
        const id = await createPost(
          me.uid,
          myData.displayName || me.displayName || "Wojownik",
          myData.photoURL || "",
          content,
          imageUrl
        );
        if (id) {
          if (ta) { ta.value = ""; if (count) count.textContent = "500"; }
          pendingImage = null;
          preview?.classList.add("hidden");
        }
      } catch (e) {
        console.error("[compose]", e);
        showToast("❌ Błąd: " + (e.code || e.message), "error");
        $("upload-progress")?.classList.add("hidden");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ── Zakładki ───────────────────────────────────────────────
  function _wireTabs() {
    document.querySelectorAll(".feed-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".feed-tab-btn").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        currentTab = btn.dataset.tab || "forYou";
        _startFeed();
      });
    });
  }

  async function _loadFollowing() {
    try {
      const snap = await getDocs(query(
        collection(db, COL.FOLLOWERS), where("followerId", "==", me.uid)
      ));
      followingIds = snap.docs.map((d) => d.data().followingId);
    } catch (e) {
      console.warn("[following]", e.code);
      followingIds = [];
    }
  }

  // ── Feed realtime ──────────────────────────────────────────
  function _startFeed() {
    if (unsubFeed) { unsubFeed(); unsubFeed = null; }
    commentUnsubs.forEach((u) => u());
    commentUnsubs.clear();

    const list = $("feed-list");
    if (list) list.innerHTML = "";
    $("feed-empty") && ($("feed-empty").style.display = "none");
    $("load-more-btn") && ($("load-more-btn").style.display = "none");

    feedGeneration++;
    const gen = feedGeneration;

    const q = query(collection(db, COL.POSTS), orderBy("createdAt", "desc"), limit(PAGE));
    unsubFeed = onSnapshot(q, (snap) => {
      if (gen !== feedGeneration) return;
      window._clearFeedSkeleton?.();
      lastVisible = snap.docs[snap.docs.length - 1] || null;
      let posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (currentTab === "following") {
        posts = posts.filter((p) => followingIds.includes(p.authorId) || p.authorId === me.uid);
      }
      _renderPosts(posts, false);
      const more = $("load-more-btn");
      if (more) more.style.display = snap.docs.length === PAGE && currentTab !== "following" ? "block" : "none";
    }, (err) => {
      if (gen !== feedGeneration) return;
      window._clearFeedSkeleton?.();
      console.warn("[feed]", err.code);
      showToast("❌ Błąd ładowania kronik: " + err.code, "error");
    });

    const loadMoreBtn = $("load-more-btn");
    if (loadMoreBtn) {
      loadMoreBtn.removeEventListener("click", _loadMore);
      loadMoreBtn.addEventListener("click", _loadMore);
    }
  }

  let _loadingMore = false;
  async function _loadMore() {
    if (_loadingMore || !lastVisible) return;
    const currentGen = feedGeneration;
    _loadingMore = true;
    try {
      const snap = await getDocs(query(
        collection(db, COL.POSTS), orderBy("createdAt", "desc"),
        startAfter(lastVisible), limit(PAGE)
      ));
      if (currentGen !== feedGeneration) return;
      lastVisible = snap.docs[snap.docs.length - 1] || lastVisible;
      const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      _renderPosts(posts, true);
      const more = $("load-more-btn");
      if (more && snap.docs.length < PAGE) more.style.display = "none";
    } catch (e) { console.warn("[loadMore]", e.code); }
    _loadingMore = false;
  }

  // ── Render ─────────────────────────────────────────────────
  function _renderPosts(posts, append) {
    const list = $("feed-list");
    const empty = $("feed-empty");
    if (!list) return;
    if (!append) list.innerHTML = "";

    if (!posts.length && !append) {
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";

    posts.forEach((p) => {
      const existing = document.getElementById("post-" + p.id);
      const card = _buildPostCard(p);
      if (existing && !append) existing.replaceWith(card);
      else list.appendChild(card);
      if (openComments.has(p.id)) _toggleComments(p, card, true);
    });
  }

  function _buildPostCard(p) {
    const card = document.createElement("article");
    card.className = "post-card";
    card.id = "post-" + p.id;
    const mine = p.authorId === me.uid;
    const liked = (p.likes || []).includes(me.uid);
    const ini = (p.authorName || "?").charAt(0).toUpperCase();
    const rank = getRank(0); // ranga autora nieznana w dokumencie posta — neutralnie

    card.innerHTML = `
      <div class="post-header">
        <div class="post-avatar" data-user-uid="${_esc(p.authorId)}" style="cursor:pointer;">
          ${p.authorAvatar
            ? `<img src="${_esc(p.authorAvatar)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.replaceWith(document.createTextNode('${ini}'))">`
            : ini}
        </div>
        <div class="post-meta" style="flex:1;min-width:0;">
          <div class="post-name" data-user-uid="${_esc(p.authorId)}" style="cursor:pointer;">${_esc(p.authorName || "Wojownik")}</div>
          <div class="post-time">${_fmtTime(p.createdAt)}${p.edited ? " · edytowano" : ""}</div>
        </div>
        ${mine ? `
        <button class="post-menu-btn" data-act="menu" aria-label="Opcje posta"
          style="background:none;border:none;color:var(--text-faint);cursor:pointer;padding:.375rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </button>` : ""}
      </div>

      ${p.content ? `<div class="post-body" data-role="content">${_linkify(_esc(p.content))}</div>` : ""}
      <div data-role="edit-area" style="display:none;padding:.25rem .875rem .625rem;">
        <textarea class="compose-textarea" data-role="edit-ta" maxlength="500" rows="3"
          style="width:100%;">${_esc(p.content || "")}</textarea>
        <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.375rem;">
          <button class="btn btn-outline btn-sm" data-act="edit-cancel">Anuluj</button>
          <button class="btn btn-primary btn-sm" data-act="edit-save">Zapisz</button>
        </div>
      </div>

      ${p.imageUrl ? `<div class="post-image-wrap"><img src="${_esc(p.imageUrl)}" alt="Zdjęcie posta" loading="lazy"
        style="width:100%;display:block;cursor:pointer;" onclick="window.open('${_esc(p.imageUrl)}','_blank')"></div>` : ""}

      <div class="post-actions">
        <button class="post-action-btn reaction-btn ${liked ? "reacted" : ""}" data-act="like">
          <span class="reaction-emoji">${liked ? "⚔️" : "🗡"}</span>
          <span data-role="like-count">${(p.likes || []).length || ""}</span>
          <span class="reaction-label">${liked ? "Uznane" : "Uznaj"}</span>
        </button>
        <button class="post-action-btn" data-act="comments">
          💬 <span data-role="comment-count">${p.commentsCount || ""}</span>
          <span class="reaction-label">Komentarze</span>
        </button>
        <button class="post-action-btn share-btn" data-act="share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg><span>Udostępnij</span>
        </button>
      </div>

      <div class="post-comments" data-role="comments" style="display:none;"></div>`;

    // Avatar / nazwa → profil
    card.querySelectorAll("[data-user-uid]").forEach((el) => {
      el.addEventListener("click", () => {
        const uid = el.dataset.userUid;
        window.location.href = uid === me.uid ? "profile.html" : `user.html?uid=${encodeURIComponent(uid)}`;
      });
    });

    // Lajk
    card.querySelector('[data-act="like"]').addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const wasLiked = btn.classList.contains("reacted");
      try {
        if (wasLiked) {
          await unlikePost(p.id, me.uid);
        } else {
          await likePost(p.id, me.uid);
          if (p.authorId !== me.uid) {
            awardXP(p.authorId, XP_ACTIONS.LIKE_RECEIVED).catch(() => {});
            createNotification(p.authorId, {
              type: "like",
              title: `${myData.displayName || "Wojownik"} uznał Twój wpis ⚔️`,
              body: (p.content || "📷 Zdjęcie").substring(0, 50),
              url: "feed.html",
              relatedUid: me.uid,
            }).catch(() => {});
          }
        }
      } finally { btn.disabled = false; }
    });

    // Komentarze
    card.querySelector('[data-act="comments"]').addEventListener("click", () => _toggleComments(p, card));

    // Udostępnianie
    card.querySelector('[data-act="share"]').addEventListener("click", async () => {
      const url = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}feed.html?post=${p.id}`;
      const text = `⚔️ ${p.authorName}: ${(p.content || "").substring(0, 80)}`;
      if (navigator.share) {
        try { await navigator.share({ title: "Weekend Warrior Social", text, url }); return; } catch {}
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast("🔗 Link do posta skopiowany!", "success");
      } catch { prompt("Skopiuj link:", url); }
    });

    // Menu właściciela (edytuj / usuń)
    if (mine) {
      card.querySelector('[data-act="menu"]').addEventListener("click", () => {
        const choice = confirm("OK = Edytuj post\nAnuluj = pokaż opcję usunięcia");
        if (choice) {
          card.querySelector('[data-role="content"]')?.style.setProperty("display", "none");
          card.querySelector('[data-role="edit-area"]').style.display = "block";
        } else if (confirm("Usunąć ten post bezpowrotnie?")) {
          deletePost(p.id, me.uid);
        }
      });
      card.querySelector('[data-act="edit-cancel"]')?.addEventListener("click", () => {
        card.querySelector('[data-role="edit-area"]').style.display = "none";
        card.querySelector('[data-role="content"]')?.style.removeProperty("display");
      });
      card.querySelector('[data-act="edit-save"]')?.addEventListener("click", async () => {
        const ta = card.querySelector('[data-role="edit-ta"]');
        const val = ta.value.trim();
        if (!val && !p.imageUrl) { showToast("⚠️ Post nie może być pusty", "info"); return; }
        await updatePost(p.id, me.uid, val);
      });
    }

    return card;
  }

  // ── Komentarze + odpowiedzi ────────────────────────────────
  function _toggleComments(p, card, forceOpen = false) {
    const box = card.querySelector('[data-role="comments"]');
    if (!box) return;
    const isOpen = box.style.display !== "none";
    if (isOpen && !forceOpen) {
      box.style.display = "none";
      openComments.delete(p.id);
      commentUnsubs.get(p.id)?.();
      commentUnsubs.delete(p.id);
      return;
    }
    box.style.display = "block";
    openComments.add(p.id);
    if (commentUnsubs.has(p.id)) return;

    box.innerHTML = `<div style="padding:.625rem .875rem;font-family:var(--font-heading);
      font-size:.55rem;color:var(--text-faint);font-style:italic;">Ładowanie głosów...</div>`;

    const unsub = loadComments(p.id, (comments) => _renderComments(p, box, comments));
    commentUnsubs.set(p.id, unsub);
  }

  function _renderComments(p, box, comments) {
    const roots = comments.filter((c) => !c.parentId);
    const repliesOf = (id) => comments.filter((c) => c.parentId === id);

    box.innerHTML = "";

    const renderOne = (c, depth) => {
      const ini = (c.authorName || "?").charAt(0).toUpperCase();
      const mine = c.authorId === me.uid;
      const item = document.createElement("div");
      item.className = "comment-item";
      item.style.cssText = `display:flex;gap:.5rem;padding:.45rem .875rem;${depth ? `padding-left:${0.875 + depth * 1.75}rem;` : ""}`;
      item.innerHTML = `
        <div class="comment-avatar" style="cursor:pointer;" data-user-uid="${_esc(c.authorId)}">${ini}</div>
        <div class="comment-body" style="flex:1;min-width:0;">
          <span class="comment-name">${_esc(c.authorName || "Wojownik")}</span>
          <span class="comment-text">${_esc(c.content)}</span>
          <div style="display:flex;gap:.75rem;margin-top:.125rem;">
            <span style="font-size:.575rem;color:var(--text-faint);">${_fmtTime(c.createdAt)}</span>
            ${depth === 0 ? `<button data-act="reply" style="background:none;border:none;cursor:pointer;
              font-family:var(--font-heading);font-size:.5rem;letter-spacing:.06em;
              color:var(--gold-500,#D4AF37);text-transform:uppercase;">Odpowiedz</button>` : ""}
            ${mine ? `<button data-act="del" style="background:none;border:none;cursor:pointer;
              font-family:var(--font-heading);font-size:.5rem;letter-spacing:.06em;
              color:#EF4444;text-transform:uppercase;">Usuń</button>` : ""}
          </div>
          <div data-role="reply-box" style="display:none;margin-top:.375rem;"></div>
        </div>`;

      item.querySelector("[data-user-uid]").addEventListener("click", () => {
        const uid = c.authorId;
        window.location.href = uid === me.uid ? "profile.html" : `user.html?uid=${encodeURIComponent(uid)}`;
      });
      item.querySelector('[data-act="del"]')?.addEventListener("click", () => {
        if (confirm("Usunąć komentarz?")) deleteComment(p.id, c.id, me.uid);
      });
      item.querySelector('[data-act="reply"]')?.addEventListener("click", () => {
        const rb = item.querySelector('[data-role="reply-box"]');
        if (rb.style.display === "none") {
          rb.style.display = "block";
          rb.innerHTML = `<div class="comment-compose" style="display:flex;gap:.5rem;">
            <input class="comment-input" type="text" maxlength="300" placeholder="Odpowiedz wojownikowi..." style="flex:1;"/>
            <button class="btn btn-primary btn-sm">➤</button></div>`;
          const input = rb.querySelector("input");
          const send = async () => {
            const v = input.value.trim();
            if (!v) return;
            input.value = "";
            await addComment(p.id, me.uid, myData.displayName || "Wojownik", v, c.id);
            _notifyComment(p, v, c.authorId);
          };
          rb.querySelector("button").addEventListener("click", send);
          input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
          input.focus();
        } else rb.style.display = "none";
      });

      box.appendChild(item);
      repliesOf(c.id).forEach((r) => renderOne(r, depth + 1));
    };

    roots.forEach((c) => renderOne(c, 0));

    // Compose głównego komentarza
    const compose = document.createElement("div");
    compose.className = "comment-compose";
    compose.style.cssText = "display:flex;gap:.5rem;padding:.5rem .875rem .75rem;";
    compose.innerHTML = `
      <input class="comment-input" type="text" maxlength="300" placeholder="Zabierz głos w kronikach..." style="flex:1;"/>
      <button class="btn btn-primary btn-sm">➤</button>`;
    const input = compose.querySelector("input");
    const send = async () => {
      const v = input.value.trim();
      if (!v) return;
      input.value = "";
      await addComment(p.id, me.uid, myData.displayName || "Wojownik", v);
      _notifyComment(p, v, p.authorId);
    };
    compose.querySelector("button").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    box.appendChild(compose);
  }

  function _notifyComment(p, text, targetUid) {
    if (!targetUid || targetUid === me.uid) return;
    awardXP(targetUid, XP_ACTIONS.COMMENT_RECEIVED).catch(() => {});
    createNotification(targetUid, {
      type: "comment",
      title: `${myData.displayName || "Wojownik"} komentuje 💬`,
      body: text.substring(0, 60),
      url: "feed.html",
      relatedUid: me.uid,
    }).catch(() => {});
  }
}

// ── Helpers ──────────────────────────────────────────────────
function _fmtTime(ts) {
  if (!ts) return "przed chwilą";
  const d = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  if (isNaN(d)) return "";
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return "przed chwilą";
  if (m < 60) return `${m} min. temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
}
function _linkify(escaped) {
  return escaped
    .replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" target="_blank" rel="noopener" class="mention-link">$1</a>`)
    .replace(/(^|\s)#([\p{L}\d_]+)/gu, `$1<span class="hashtag-link">#$2</span>`)
    .replace(/(^|\s)@([\p{L}\d_]+)/gu, `$1<span class="mention-link">@$2</span>`);
}
function _esc(s) {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
