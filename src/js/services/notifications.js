/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — notifications.js
 * Powiadomienia in-app: tworzenie, odczyt, dzwonek w nav
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Struktura Firestore:
 *   notifications/{uid}/items/{notifId}
 *     { type, title, body, url, relatedUid, read, createdAt }
 *
 * Typy: like | comment | follow | friend_request | friend_accept
 *       | message | duel | challenge | achievement | xp | system
 *
 * Eksporty:
 *   createNotification(toUid, payloadObj)            — NOWA sygnatura
 *   createNotification(toUid, type, message, ...)    — STARA sygnatura (kompatybilność)
 *   loadNotifications(uid, cb)
 *   markNotificationAsRead(uid, notifId)
 *   markAllAsRead(uid)
 *   deleteNotification(uid, notifId)
 *   getUnreadCount(uid)
 *   injectNotifBell(uid)   — dzwonek + dropdown w nawigacji (index.html)
 */

import { db, COL, serverTimestamp } from "./firebase.js";
import {
  collection, addDoc, query, where, getDocs, updateDoc, doc,
  onSnapshot, orderBy, limit, deleteDoc, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ════════════════════════════════════════════════════════════
// CREATE — obsługuje OBA formaty wywołań w kodzie
// ════════════════════════════════════════════════════════════

export async function createNotification(toUid, typeOrPayload, message = "", relatedUid = "", relatedData = {}) {
  if (!toUid) return false;
  try {
    let data;
    if (typeOrPayload && typeof typeOrPayload === "object") {
      // Nowy format: createNotification(uid, { type, title, body, url, relatedUid })
      data = {
        type: typeOrPayload.type || "system",
        title: typeOrPayload.title || "",
        body: typeOrPayload.body || "",
        url: typeOrPayload.url || "",
        relatedUid: typeOrPayload.relatedUid || "",
        relatedData: typeOrPayload.relatedData || {},
      };
    } else {
      // Stary format: createNotification(uid, type, message, relatedUid, relatedData)
      data = {
        type: typeOrPayload || "system",
        title: message || "",
        body: "",
        url: "",
        relatedUid: relatedUid || "",
        relatedData: relatedData || {},
      };
    }
    await addDoc(collection(db, COL.NOTIFICATIONS, toUid, "items"), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("Create notification error:", err);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// READ / UPDATE / DELETE
// ════════════════════════════════════════════════════════════

export function loadNotifications(uid, callback) {
  const q = query(
    collection(db, COL.NOTIFICATIONS, uid, "items"),
    orderBy("createdAt", "desc"),
    limit(40)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.warn("[loadNotifications]", err.code));
}

export async function markNotificationAsRead(uid, notifId) {
  try {
    await updateDoc(doc(db, COL.NOTIFICATIONS, uid, "items", notifId), { read: true });
  } catch (err) {
    console.error("Mark notification as read error:", err);
  }
}

export async function markAllAsRead(uid) {
  try {
    const q = query(collection(db, COL.NOTIFICATIONS, uid, "items"), where("read", "==", false));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (err) {
    console.error("Mark all as read error:", err);
  }
}

export async function deleteNotification(uid, notifId) {
  try {
    await deleteDoc(doc(db, COL.NOTIFICATIONS, uid, "items", notifId));
  } catch (err) {
    console.error("Delete notification error:", err);
  }
}

export async function getUnreadCount(uid) {
  try {
    const q = query(collection(db, COL.NOTIFICATIONS, uid, "items"), where("read", "==", false));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error("Get unread count error:", err);
    return 0;
  }
}

// ════════════════════════════════════════════════════════════
// DZWONEK W NAWIGACJI — injectNotifBell(uid)
// ════════════════════════════════════════════════════════════

const ICON_MAP = {
  like: "❤️", comment: "💬", follow: "👁️", friend_request: "🤝",
  friend_accept: "🛡️", message: "✉️", duel: "⚔️", challenge: "⚔️",
  achievement: "🏆", xp: "⭐", system: "📣",
};

export function injectNotifBell(uid) {
  if (!uid || document.getElementById("wws-bell")) return;
  const anchor = document.getElementById("nav-notif-anchor") || document.querySelector(".nav-actions");
  if (!anchor) return;

  // ── Bell button ────────────────────────────────────────────
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;display:inline-flex;";
  wrap.innerHTML = `
    <button id="wws-bell" class="btn btn-ghost btn-sm" aria-label="Powiadomienia"
      style="padding:.5rem;color:var(--text-faint);position:relative;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span id="wws-bell-badge" style="display:none;position:absolute;top:0;right:0;
        min-width:15px;height:15px;border-radius:9999px;background:var(--gold-500,#D4AF37);
        color:#000;font-size:.5rem;font-weight:800;align-items:center;justify-content:center;
        font-family:var(--font-heading);line-height:1;">0</span>
    </button>`;
  anchor.prepend(wrap);

  // ── Dropdown ───────────────────────────────────────────────
  const drop = document.createElement("div");
  drop.id = "wws-bell-drop";
  drop.style.cssText = `
    position:fixed;right:.5rem;bottom:64px;width:min(340px,calc(100vw - 1rem));
    max-height:60vh;overflow-y:auto;background:var(--bg-panel,#15110A);
    border:1px solid var(--border-gold,rgba(212,175,55,.3));border-radius:14px;
    box-shadow:0 12px 48px rgba(0,0,0,.8);z-index:900;display:none;`;
  document.body.appendChild(drop);

  const toggle = (force) => {
    const willShow = force !== undefined ? force : drop.style.display === "none";
    drop.style.display = willShow ? "block" : "none";
    if (willShow) markAllAsRead(uid);
  };

  wrap.querySelector("#wws-bell").addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });
  document.getElementById("see-all-notifs")?.addEventListener("click", (e) => {
    e.preventDefault();
    toggle(true);
  });
  document.addEventListener("click", (e) => {
    if (!drop.contains(e.target) && !wrap.contains(e.target)) drop.style.display = "none";
  });

  // ── Realtime render ────────────────────────────────────────
  loadNotifications(uid, (items) => {
    const badge = document.getElementById("wws-bell-badge");
    const unread = items.filter((n) => !n.read).length;
    if (badge) {
      badge.textContent = unread > 9 ? "9+" : String(unread);
      badge.style.display = unread > 0 ? "inline-flex" : "none";
    }

    drop.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:.75rem 1rem;border-bottom:1px solid var(--border-dim,rgba(255,255,255,.08));">
        <span style="font-family:var(--font-heading);font-size:.6rem;font-weight:700;
          letter-spacing:.12em;text-transform:uppercase;color:var(--gold-500,#D4AF37);">
          💌 Posłańcy Areny</span>
        <button id="wws-bell-readall" style="background:none;border:none;cursor:pointer;
          font-family:var(--font-heading);font-size:.5rem;letter-spacing:.08em;
          color:var(--text-faint,#777);text-transform:uppercase;">Odczytaj wszystkie</button>
      </div>`;
    drop.querySelector("#wws-bell-readall").addEventListener("click", () => markAllAsRead(uid));

    if (!items.length) {
      drop.innerHTML += `<div style="padding:2rem 1rem;text-align:center;
        font-family:var(--font-heading);font-size:.6rem;color:var(--text-faint,#777);
        font-style:italic;">Brak posłańców</div>`;
      return;
    }

    items.forEach((n) => {
      const row = document.createElement("div");
      row.style.cssText = `display:flex;gap:.625rem;padding:.625rem 1rem;cursor:${n.url ? "pointer" : "default"};
        border-bottom:1px solid var(--border-dim,rgba(255,255,255,.06));
        background:${n.read ? "transparent" : "rgba(212,175,55,.05)"};align-items:flex-start;`;
      row.innerHTML = `
        <div style="font-size:1.125rem;flex-shrink:0;">${ICON_MAP[n.type] || "📣"}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.8125rem;font-weight:600;color:var(--text-parchment,#EEE);">${_esc(n.title || "")}</div>
          ${n.body ? `<div style="font-size:.75rem;color:var(--text-muted,#999);">${_esc(n.body)}</div>` : ""}
          <div style="font-size:.625rem;color:var(--text-faint,#777);margin-top:.125rem;">${_fmtTime(n.createdAt)}</div>
        </div>
        ${!n.read ? `<div style="width:7px;height:7px;border-radius:50%;background:var(--gold-500,#D4AF37);flex-shrink:0;margin-top:.375rem;"></div>` : ""}`;
      row.addEventListener("click", () => {
        markNotificationAsRead(uid, n.id);
        if (n.url) window.location.href = n.url;
      });
      drop.appendChild(row);
    });
  });
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
  return `${Math.floor(h / 24)} dni temu`;
}

function _esc(s) {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
