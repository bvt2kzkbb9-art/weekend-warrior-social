/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — messenger.js (PEŁNY MESSENGER)
 * Lista rozmów · wiadomości realtime · zdjęcia · odczytane ·
 * ostatnia aktywność · badge w nav · powiadomienia
 * Firebase SDK 10.12.2 | Firestore + Storage
 * ============================================================
 *
 * Struktura Firestore:
 *   conversations/{convId}
 *     { participants:[uidA,uidB], lastMessage, lastMessageAt,
 *       lastSenderId, unread:{uid:n}, createdAt }
 *   conversations/{convId}/messages/{msgId}
 *     { senderId, senderName, content, imageUrl, read, createdAt }
 *
 * Eksporty:
 *   injectMessengerBadge(uid)     — badge nieprzeczytanych w nav (każda strona)
 *   setOnlinePresence(uid, bool)  — online / lastSeen na users/{uid}
 *   initMessenger()               — pełne UI messenger.html
 *   openChatWith(targetUid)       — otwiera (lub tworzy) rozmowę
 *   createConversation, sendMessage, loadMessages, loadConversations,
 *   markMessagesAsRead, getConversationOtherUser
 */

import { auth, db, COL, uploadImage } from "./firebase.js";
import {
  collection, addDoc, query, where, getDocs, updateDoc, doc,
  getDoc, onSnapshot, orderBy, limit, serverTimestamp, increment, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showToast } from "./auth.js";
import { createNotification } from "./notifications.js";

// ════════════════════════════════════════════════════════════
// API — KONWERSACJE I WIADOMOŚCI
// ════════════════════════════════════════════════════════════

export async function createConversation(participants) {
  try {
    const sorted = [...participants].sort();
    const existingQ = query(
      collection(db, COL.CONVERSATIONS),
      where("participants", "==", sorted)
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) return existing.docs[0].id;

    const docRef = await addDoc(collection(db, COL.CONVERSATIONS), {
      participants: sorted,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSenderId: "",
      unread: Object.fromEntries(sorted.map((u) => [u, 0])),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Create conversation error:", err);
    return null;
  }
}

export async function sendMessage(conversationId, senderId, senderName, content, imageUrl = "") {
  try {
    const msgRef = await addDoc(collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES), {
      senderId,
      senderName,
      content: content || "",
      imageUrl: imageUrl || "",
      read: false,
      createdAt: serverTimestamp(),
    });

    // Zwiększ licznik nieprzeczytanych u drugiej strony
    const convSnap = await getDoc(doc(db, COL.CONVERSATIONS, conversationId));
    const participants = convSnap.exists() ? convSnap.data().participants || [] : [];
    const otherUid = participants.find((u) => u !== senderId);

    const update = {
      lastMessage: imageUrl && !content ? "📷 Zdjęcie" : (content || "").substring(0, 60),
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
    };
    if (otherUid) update[`unread.${otherUid}`] = increment(1);
    await updateDoc(doc(db, COL.CONVERSATIONS, conversationId), update);

    // Powiadomienie in-app
    if (otherUid) {
      createNotification(otherUid, {
        type: "message",
        title: `${senderName} przesyła wieści ✉️`,
        body: imageUrl && !content ? "📷 Zdjęcie" : (content || "").substring(0, 60),
        url: `messenger.html?conv=${conversationId}`,
        relatedUid: senderId,
      }).catch(() => {});
    }

    return msgRef.id;
  } catch (err) {
    showToast("❌ Błąd wysyłania wiadomości", "error");
    console.error("Send message error:", err);
    return null;
  }
}

export function loadMessages(conversationId, callback) {
  const q = query(
    collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.warn("[loadMessages]", err.code));
}

export function loadConversations(uid, callback) {
  const q = query(
    collection(db, COL.CONVERSATIONS),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.warn("[loadConversations]", err.code));
}

export async function markMessagesAsRead(conversationId, userId) {
  try {
    // Wyzeruj licznik nieprzeczytanych
    await updateDoc(doc(db, COL.CONVERSATIONS, conversationId), {
      [`unread.${userId}`]: 0,
    }).catch(() => {});

    // Oznacz wiadomości jako odczytane
    const q = query(
      collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    const toMark = snap.docs.filter((d) => d.data().senderId !== userId);
    if (!toMark.length) return;
    const batch = writeBatch(db);
    toMark.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (err) {
    console.error("Mark messages as read error:", err);
  }
}

export async function getConversationOtherUser(conversationId, currentUid) {
  try {
    const snap = await getDoc(doc(db, COL.CONVERSATIONS, conversationId));
    if (!snap.exists()) return null;
    const otherUid = (snap.data().participants || []).find((u) => u !== currentUid);
    if (!otherUid) return null;
    const userSnap = await getDoc(doc(db, COL.USERS, otherUid));
    return userSnap.exists() ? { uid: otherUid, ...userSnap.data() } : { uid: otherUid };
  } catch (err) {
    console.error("Get conversation other user error:", err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// PRESENCE — online / lastSeen
// ════════════════════════════════════════════════════════════

export async function setOnlinePresence(uid, online) {
  if (!uid) return;
  try {
    await updateDoc(doc(db, COL.USERS, uid), {
      online: !!online,
      lastSeen: serverTimestamp(),
    });
  } catch (e) {
    console.warn("[presence]", e.code);
  }
}

// ════════════════════════════════════════════════════════════
// BADGE W NAWIGACJI — injectMessengerBadge(uid)
// ════════════════════════════════════════════════════════════

let _badgeUnsub = null;

export function injectMessengerBadge(uid) {
  if (!uid) return;
  const badge = document.getElementById("msg-nav-badge");
  if (!badge) return;
  if (_badgeUnsub) { _badgeUnsub(); _badgeUnsub = null; }

  _badgeUnsub = loadConversations(uid, (convs) => {
    const total = convs.reduce((sum, c) => sum + (c.unread?.[uid] || 0), 0);
    badge.textContent = total > 9 ? "9+" : String(total);
    badge.style.display = total > 0 ? "inline-flex" : "none";
  });
}

// ════════════════════════════════════════════════════════════
// SKRÓT — otwórz czat z użytkownikiem (z user.html / profilu)
// ════════════════════════════════════════════════════════════

export function openChatWith(targetUid) {
  if (!targetUid) return;
  window.location.href = `messenger.html?uid=${encodeURIComponent(targetUid)}`;
}

// ════════════════════════════════════════════════════════════
// PEŁNE UI — initMessenger() (messenger.html)
// ════════════════════════════════════════════════════════════

const _userCache = new Map();
async function _getUser(uid) {
  if (_userCache.has(uid)) return _userCache.get(uid);
  try {
    const snap = await getDoc(doc(db, COL.USERS, uid));
    const data = snap.exists() ? { uid, ...snap.data() } : { uid, displayName: "Wojownik" };
    _userCache.set(uid, data);
    return data;
  } catch {
    return { uid, displayName: "Wojownik" };
  }
}

export function initMessenger() {
  let me = null;
  let activeConvId = null;
  let unsubMsgs = null;
  let unsubConvs = null;
  let pendingImage = null;

  const $ = (id) => document.getElementById(id);

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }
    me = user;

    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      const { logout } = await import("./auth.js");
      logout();
    });

    _listenConversations();
    _wireCompose();

    // Deep-linki: ?uid= (nowa rozmowa) lub ?conv= (istniejąca)
    const params = new URLSearchParams(window.location.search);
    const targetUid = params.get("uid");
    const convParam = params.get("conv");
    if (targetUid && targetUid !== me.uid) {
      const convId = await createConversation([me.uid, targetUid]);
      if (convId) _openConversation(convId);
    } else if (convParam) {
      _openConversation(convParam);
    }
  });

  // ── Lista rozmów ───────────────────────────────────────────
  function _listenConversations() {
    if (unsubConvs) unsubConvs();
    unsubConvs = loadConversations(me.uid, async (convs) => {
      $("conv-skeleton")?.remove();
      const list = $("conv-list");
      if (!list) return;

      if (!convs.length) {
        list.innerHTML = `<div class="conv-empty" style="padding:2rem 1rem;text-align:center;
          font-family:var(--font-heading);font-size:.6rem;color:var(--text-faint);font-style:italic;">
          Brak rozmów.<br>Wejdź na profil wojownika i kliknij „Napisz".</div>`;
        return;
      }

      // Pobierz dane drugiej strony każdej rozmowy
      const results = await Promise.allSettled(convs.map(async (c) => {
        const otherUid = (c.participants || []).find((u) => u !== me.uid);
        const other = otherUid ? await _getUser(otherUid) : null;
        return { ...c, other };
      }));

      const enriched = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      list.innerHTML = "";
      enriched.forEach((c) => {
        const unread = c.unread?.[me.uid] || 0;
        const name = c.other?.displayName || "Wojownik";
        const ini = name.charAt(0).toUpperCase();
        const item = document.createElement("div");
        item.className = "conv-item" + (c.id === activeConvId ? " active" : "");
        item.innerHTML = `
          <div class="conv-av" style="position:relative;">
            ${c.other?.photoURL
              ? `<img src="${_esc(c.other.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.replaceWith(document.createTextNode('${ini}'))">`
              : ini}
            ${c.other?.online ? `<span class="conv-av-dot online-dot"></span>` : ""}
          </div>
          <div class="conv-info">
            <div class="conv-name">${_esc(name)}</div>
            <div class="conv-preview" style="${unread ? "font-weight:700;color:var(--text-parchment,#EEE);" : ""}">
              ${c.lastSenderId === me.uid ? "Ty: " : ""}${_esc(c.lastMessage || "Rozpocznij rozmowę")}</div>
          </div>
          <div class="conv-meta">
            <div class="conv-time">${_fmtShort(c.lastMessageAt)}</div>
            ${unread ? `<div class="conv-badge">${unread > 9 ? "9+" : unread}</div>` : ""}
          </div>`;
        item.addEventListener("click", () => _openConversation(c.id));
        list.appendChild(item);
      });
    });
  }

  // ── Otwórz rozmowę ─────────────────────────────────────────
  async function _openConversation(convId) {
    activeConvId = convId;
    pendingImage = null;
    _hideImagePreview();

    $("chat-empty")?.classList.add("hidden");
    $("chat-panel")?.classList.remove("hidden");
    document.querySelector(".messenger-page")?.classList.add("chat-open");

    const other = await getConversationOtherUser(convId, me.uid);
    _renderHeader(other);

    if (unsubMsgs) unsubMsgs();
    unsubMsgs = loadMessages(convId, (messages) => {
      _renderMessages(messages, other);
      markMessagesAsRead(convId, me.uid);
    });
    markMessagesAsRead(convId, me.uid);
  }

  function _renderHeader(other) {
    const header = $("chat-header");
    if (!header) return;
    const name = other?.displayName || "Wojownik";
    const ini = name.charAt(0).toUpperCase();
    const status = other?.online
      ? `<span class="chat-status-dot" style="background:#16C784;"></span> Online`
      : other?.lastSeen
        ? `Aktywność: ${_fmtTime(other.lastSeen)}`
        : "Offline";
    header.innerHTML = `
      <button class="chat-back-btn" id="chat-back" aria-label="Wróć"
        style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:.25rem;display:flex;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <a class="chat-profile-link" href="user.html?uid=${encodeURIComponent(other?.uid || "")}"
        style="display:flex;align-items:center;gap:.625rem;text-decoration:none;min-width:0;">
        <div class="chat-hd-av">
          ${other?.photoURL
            ? `<img src="${_esc(other.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.replaceWith(document.createTextNode('${ini}'))">`
            : ini}
        </div>
        <div class="chat-hd-info">
          <div class="chat-hd-name">${_esc(name)}</div>
          <div class="chat-hd-status">${status}</div>
        </div>
      </a>`;
    $("chat-back")?.addEventListener("click", () => {
      $("chat-panel")?.classList.add("hidden");
      $("chat-empty")?.classList.remove("hidden");
      document.querySelector(".messenger-page")?.classList.remove("chat-open");
      activeConvId = null;
      if (unsubMsgs) { unsubMsgs(); unsubMsgs = null; }
    });
  }

  function _renderMessages(messages, other) {
    const list = $("msg-list");
    if (!list) return;
    list.innerHTML = "";
    let lastDay = "";
    let lastMineReadShown = false;

    // Znajdź ostatnią moją odczytaną wiadomość (✓✓ tylko przy niej)
    const lastMineRead = [...messages].reverse().find((m) => m.senderId === me.uid && m.read);

    messages.forEach((m) => {
      const d = m.createdAt?.toDate?.() ?? new Date();
      const dayKey = d.toLocaleDateString("pl-PL");
      if (dayKey !== lastDay) {
        lastDay = dayKey;
        const sep = document.createElement("div");
        sep.className = "msg-date-sep";
        sep.textContent = dayKey === new Date().toLocaleDateString("pl-PL") ? "Dzisiaj" : dayKey;
        list.appendChild(sep);
      }

      const mine = m.senderId === me.uid;
      const wrap = document.createElement("div");
      wrap.className = "msg-wrap" + (mine ? " mine" : "");
      wrap.style.cssText = `display:flex;gap:.5rem;padding:.2rem .875rem;align-items:flex-end;${mine ? "flex-direction:row-reverse;" : ""}`;

      const otherName = other?.displayName || "W";
      const av = mine ? "" : `<div class="msg-av">${other?.photoURL
        ? `<img src="${_esc(other.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : otherName.charAt(0).toUpperCase()}</div>`;

      const showRead = mine && lastMineRead && m.id === lastMineRead.id && !lastMineReadShown;
      if (showRead) lastMineReadShown = true;

      wrap.innerHTML = `
        ${av}
        <div style="max-width:74%;display:flex;flex-direction:column;${mine ? "align-items:flex-end;" : ""}">
          ${m.imageUrl ? `<img class="msg-img img-bubble" src="${_esc(m.imageUrl)}" alt="Zdjęcie" loading="lazy"
            style="max-width:100%;border-radius:14px;margin-bottom:${m.content ? ".25rem" : "0"};cursor:pointer;"
            onclick="window.open('${_esc(m.imageUrl)}','_blank')"/>` : ""}
          ${m.content ? `<div class="msg-bubble ${mine ? "mine" : ""}"
            style="${mine ? "background:linear-gradient(135deg,var(--gold-700,#9C7A1E),var(--gold-500,#D4AF37));color:#0A0700;" : "background:var(--bg-elevated,#1E1810);color:var(--text-parchment,#EEE);"}
            padding:.5rem .75rem;border-radius:16px;font-size:.875rem;line-height:1.45;word-break:break-word;">
            ${_linkify(_esc(m.content))}</div>` : ""}
          <div class="msg-time" style="font-size:.575rem;color:var(--text-faint,#777);margin-top:.15rem;">
            ${_fmtClock(m.createdAt)}${showRead ? ` <span class="msg-read" style="color:var(--gold-500,#D4AF37);">✓✓ Odczytano</span>` : ""}
          </div>
        </div>`;
      list.appendChild(wrap);
    });
    list.scrollTop = list.scrollHeight;
  }

  // ── Compose (tekst + zdjęcie) ──────────────────────────────
  function _wireCompose() {
    const input = $("msg-input");
    const sendBtn = $("msg-send");
    const imgBtn = $("msg-img-btn");
    const imgInput = $("msg-img-input");
    const imgRemove = $("msg-img-remove");

    const autosize = () => {
      if (!input) return;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    };
    input?.addEventListener("input", autosize);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); _send(); }
    });
    sendBtn?.addEventListener("click", _send);

    imgBtn?.addEventListener("click", () => imgInput?.click());
    imgInput?.addEventListener("change", () => {
      const file = imgInput.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) { showToast("❌ Zdjęcie max 8 MB", "error"); return; }
      pendingImage = file;
      const preview = $("msg-img-preview");
      if (preview) {
        preview.querySelector("img").src = URL.createObjectURL(file);
        preview.style.display = "flex";
      }
      imgInput.value = "";
    });
    imgRemove?.addEventListener("click", _hideImagePreview);

    async function _send() {
      if (!activeConvId || !me) return;
      const text = input?.value.trim() || "";
      if (!text && !pendingImage) return;

      sendBtn.disabled = true;
      try {
        let imageUrl = "";
        if (pendingImage) {
          showToast("⏳ Przesyłanie zdjęcia...", "info", 2000);
          imageUrl = await uploadImage(pendingImage, `messages/${activeConvId}/${me.uid}_${Date.now()}.jpg`);
        }
        const myData = await _getUser(me.uid);
        if (input) { input.value = ""; autosize(); }
        _hideImagePreview();
        await sendMessage(activeConvId, me.uid, myData.displayName || me.displayName || "Wojownik", text, imageUrl);
      } catch (e) {
        console.error("[send]", e);
        showToast("❌ Błąd wysyłania: " + (e.code || e.message), "error");
      } finally {
        sendBtn.disabled = false;
        input?.focus();
      }
    }
  }

  function _hideImagePreview() {
    pendingImage = null;
    const preview = $("msg-img-preview");
    if (preview) { preview.style.display = "none"; preview.querySelector("img").src = ""; }
  }
}

// ── Helpers ──────────────────────────────────────────────────
function _fmtTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  if (isNaN(d)) return "";
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return "przed chwilą";
  if (m < 60) return `${m} min. temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  return d.toLocaleDateString("pl-PL");
}
function _fmtShort(ts) {
  if (!ts) return "";
  const d = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : null);
  if (!d || isNaN(d)) return "";
  const today = new Date().toLocaleDateString("pl-PL");
  return d.toLocaleDateString("pl-PL") === today
    ? d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}
function _fmtClock(ts) {
  const d = ts?.toDate?.() ?? new Date();
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}
function _linkify(escaped) {
  return escaped.replace(/(https?:\/\/[^\s<]+)/g,
    `<a href="$1" target="_blank" rel="noopener" class="msg-link" style="text-decoration:underline;color:inherit;">$1</a>`);
}
function _esc(s) {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
