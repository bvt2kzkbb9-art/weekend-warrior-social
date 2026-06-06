/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — friends.js
 * System Znajomych (oddzielny od Follow)
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * FIRESTORE:
 *   friend_requests/{requestId}
 *     senderId:      uid
 *     senderName:    string
 *     senderPhoto:   string
 *     receiverId:    uid
 *     status:        'pending' | 'accepted' | 'rejected'
 *     createdAt:     Timestamp
 *     respondedAt:   Timestamp | null
 *
 *   friends/{uid1_uid2}   — deterministyczne ID
 *     uid1:      string
 *     uid2:      string
 *     since:     Timestamp
 *
 * EKSPORTY:
 *   sendFriendRequest(myUid, myData, targetUid)
 *   cancelFriendRequest(requestId)
 *   acceptFriendRequest(requestId, myUid, myData)
 *   rejectFriendRequest(requestId)
 *   removeFriend(myUid, targetUid)
 *   getFriendStatus(myUid, targetUid) → 'none'|'pending_sent'|'pending_received'|'friends'
 *   getFriends(uid)                   → uid[]
 *   getFriendCount(uid)               → number
 *   injectFriendButton(el, myUid, myData, targetUid, targetData)
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, addDoc, setDoc, deleteDoc,
  getDoc, getDocs, updateDoc,
  query, where, limit, orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COL_REQ     = COL.FRIEND_REQUESTS;
const COL_FRIENDS = COL.FRIENDS;

// Deterministyczne ID dla pary przyjaciół
function _friendId(a, b) { return [a, b].sort().join('_'); }


// ════════════════════════════════════════════════════════════
// STATUS
// ════════════════════════════════════════════════════════════

/**
 * Sprawdź status znajomości między myUid a targetUid.
 * @returns {Promise<{ status: string, requestId?: string }>}
 */
export async function getFriendStatus(myUid, targetUid) {
  if (!myUid || !targetUid || myUid === targetUid) {
    return { status: 'self' };
  }

  try {
    // Sprawdź czy są znajomymi
    const friendSnap = await getDoc(doc(db, COL_FRIENDS, _friendId(myUid, targetUid)));
    if (friendSnap.exists()) return { status: 'friends' };

    // Sprawdź czy jest zaproszenie wysłane przeze mnie
    const sentSnap = await getDocs(query(
      collection(db, COL_REQ),
      where('senderId',   '==', myUid),
      where('receiverId', '==', targetUid),
      where('status',     '==', 'pending'),
      limit(1),
    ));
    if (!sentSnap.empty) return { status: 'pending_sent', requestId: sentSnap.docs[0].id };

    // Sprawdź czy jest zaproszenie od target do mnie
    const rcvSnap = await getDocs(query(
      collection(db, COL_REQ),
      where('senderId',   '==', targetUid),
      where('receiverId', '==', myUid),
      where('status',     '==', 'pending'),
      limit(1),
    ));
    if (!rcvSnap.empty) return { status: 'pending_received', requestId: rcvSnap.docs[0].id };

    return { status: 'none' };
  } catch(e) {
    console.warn('[getFriendStatus]', e.code);
    return { status: 'none' };
  }
}


// ════════════════════════════════════════════════════════════
// SEND REQUEST
// ════════════════════════════════════════════════════════════

export async function sendFriendRequest(myUid, myData = {}, targetUid) {
  if (!myUid || !targetUid || myUid === targetUid) return null;

  const ref = await addDoc(collection(db, COL_REQ), {
    senderId:    myUid,
    senderName:  myData.displayName || 'Wojownik',
    senderPhoto: myData.photoURL    || '',
    receiverId:  targetUid,
    status:      'pending',
    createdAt:   serverTimestamp(),
    respondedAt: null,
  });

  createNotification(targetUid, {
    type:  'friend_request',
    title: `${myData.displayName || 'Wojownik'} chce być Twoim znajomym 🤝`,
    body:  'Kliknij aby zaakceptować lub odrzucić',
    url:   `user.html?uid=${myUid}`,
  }).catch(() => {});

  showToast('Zaproszenie wysłane! 🤝', 'success', 3000);
  return ref.id;
}


// ════════════════════════════════════════════════════════════
// CANCEL REQUEST
// ════════════════════════════════════════════════════════════

export async function cancelFriendRequest(requestId) {
  if (!requestId) return;
  await deleteDoc(doc(db, COL_REQ, requestId));
  showToast('Zaproszenie anulowane.', 'info');
}


// ════════════════════════════════════════════════════════════
// ACCEPT REQUEST
// ════════════════════════════════════════════════════════════

export async function acceptFriendRequest(requestId, myUid, myData = {}) {
  if (!requestId || !myUid) return;

  // Pobierz zaproszenie
  const reqSnap = await getDoc(doc(db, COL_REQ, requestId));
  if (!reqSnap.exists()) throw new Error('Zaproszenie nie istnieje');

  const req = reqSnap.data();
  if (req.receiverId !== myUid) throw new Error('Brak uprawnień');

  // Zaktualizuj status
  await updateDoc(doc(db, COL_REQ, requestId), {
    status:      'accepted',
    respondedAt: serverTimestamp(),
  });

  // Stwórz dokument znajomości
  const fid = _friendId(myUid, req.senderId);
  await setDoc(doc(db, COL_FRIENDS, fid), {
    uid1:  [myUid, req.senderId].sort()[0],
    uid2:  [myUid, req.senderId].sort()[1],
    since: serverTimestamp(),
  });

  // Powiadom nadawcę
  createNotification(req.senderId, {
    type:  'friend_accepted',
    title: `${myData.displayName || 'Wojownik'} zaakceptował Twoje zaproszenie! 🎉`,
    body:  'Jesteście teraz znajomymi',
    url:   `user.html?uid=${myUid}`,
  }).catch(() => {});

  showToast('Jesteście teraz znajomymi! 🎉', 'success', 3000);
}


// ════════════════════════════════════════════════════════════
// REJECT REQUEST
// ════════════════════════════════════════════════════════════

export async function rejectFriendRequest(requestId) {
  if (!requestId) return;
  await updateDoc(doc(db, COL_REQ, requestId), {
    status:      'rejected',
    respondedAt: serverTimestamp(),
  });
  showToast('Zaproszenie odrzucone.', 'info');
}


// ════════════════════════════════════════════════════════════
// REMOVE FRIEND
// ════════════════════════════════════════════════════════════

export async function removeFriend(myUid, targetUid) {
  if (!myUid || !targetUid) return;
  const fid = _friendId(myUid, targetUid);
  await deleteDoc(doc(db, COL_FRIENDS, fid));
  showToast('Znajomy usunięty.', 'info');
}


// ════════════════════════════════════════════════════════════
// GET FRIENDS
// ════════════════════════════════════════════════════════════

export async function getFriends(uid) {
  if (!uid) return [];
  try {
    const [a, b] = await Promise.all([
      getDocs(query(collection(db, COL_FRIENDS), where('uid1', '==', uid))),
      getDocs(query(collection(db, COL_FRIENDS), where('uid2', '==', uid))),
    ]);
    const friends = [];
    a.forEach(d => friends.push(d.data().uid2));
    b.forEach(d => friends.push(d.data().uid1));
    return [...new Set(friends)];
  } catch(e) {
    console.warn('[getFriends]', e.code);
    return [];
  }
}

export async function getFriendCount(uid) {
  const f = await getFriends(uid);
  return f.length;
}


// ════════════════════════════════════════════════════════════
// INJECT FRIEND BUTTON
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje przycisk znajomych do kontenera.
 * Obsługuje wszystkie stany: none → pending_sent → friends → remove
 */
export async function injectFriendButton(containerEl, myUid, myData, targetUid, targetData = {}) {
  if (!containerEl || !myUid || !targetUid || myUid === targetUid) return;

  _injectFriendStyles();

  const btn = document.createElement('button');
  btn.className = 'friend-btn';
  btn.disabled  = true;

  let currentStatus = await getFriendStatus(myUid, targetUid);
  _updateFriendBtn(btn, currentStatus.status);
  btn.disabled = false;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;

    try {
      const { status, requestId } = currentStatus;

      if (status === 'none') {
        const rid = await sendFriendRequest(myUid, myData, targetUid);
        currentStatus = { status: 'pending_sent', requestId: rid };

      } else if (status === 'pending_sent') {
        await cancelFriendRequest(requestId);
        currentStatus = { status: 'none' };

      } else if (status === 'pending_received') {
        await acceptFriendRequest(requestId, myUid, myData);
        currentStatus = { status: 'friends' };

      } else if (status === 'friends') {
        if (!confirm(`Czy na pewno chcesz usunąć ${targetData.displayName || 'Wojownika'} ze znajomych?`)) {
          btn.disabled = false;
          return;
        }
        await removeFriend(myUid, targetUid);
        currentStatus = { status: 'none' };
      }

      _updateFriendBtn(btn, currentStatus.status);
    } catch(e) {
      showToast(e.message || 'Błąd', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  containerEl.appendChild(btn);
}

function _updateFriendBtn(btn, status) {
  const config = {
    none:             { text: '+ Dodaj znajomego',      cls: 'friend-btn-add'     },
    pending_sent:     { text: '⏳ Wysłano zaproszenie', cls: 'friend-btn-pending' },
    pending_received: { text: '✓ Zaakceptuj',           cls: 'friend-btn-accept'  },
    friends:          { text: '✓ Znajomi',              cls: 'friend-btn-friends' },
    self:             { text: '',                        cls: ''                   },
  };
  const c = config[status] || config.none;
  btn.textContent = c.text;
  btn.className   = `friend-btn ${c.cls}`;
  btn.style.display = status === 'self' ? 'none' : '';
}

function _injectFriendStyles() {
  if (document.getElementById('friend-styles')) return;
  const s = document.createElement('style');
  s.id = 'friend-styles';
  s.textContent = `
    .friend-btn {
      display: inline-flex; align-items: center; gap: .375rem;
      padding: .5rem 1rem;
      border-radius: var(--r-full, 9999px);
      font-family: var(--font-ui, 'Inter', sans-serif);
      font-size: .8125rem; font-weight: 600;
      cursor: pointer; transition: all .15s ease;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    .friend-btn:disabled { opacity: .6; pointer-events: none; }
    .friend-btn-add {
      background: rgba(79,124,255,.12);
      border-color: rgba(79,124,255,.3);
      color: #4F7CFF;
    }
    .friend-btn-add:hover { background: rgba(79,124,255,.2); }
    .friend-btn-pending {
      background: transparent;
      border-color: var(--border-light, #353E50);
      color: var(--text-muted, #6B7688);
    }
    .friend-btn-accept {
      background: rgba(34,197,94,.12);
      border-color: rgba(34,197,94,.3);
      color: #22C55E;
    }
    .friend-btn-accept:hover { background: rgba(34,197,94,.2); }
    .friend-btn-friends {
      background: transparent;
      border-color: var(--border-light, #353E50);
      color: var(--text-muted, #6B7688);
    }
    .friend-btn-friends:hover { border-color: #EF4444; color: #EF4444; }
  `;
  document.head.appendChild(s);
}
