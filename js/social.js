/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — social.js v2
 * Profile publiczne + Follow/Unfollow + Zaproszenia
 * ============================================================
 *
 * Kolekcja Firestore:
 *   followers/{autoId}  →  { followerId, followingId, createdAt }
 *
 * Eksporty:
 *   openUserProfile(uid)
 *   followUser(myUid, targetUid, myDisplayName)
 *   unfollowUser(myUid, targetUid)
 *   isFollowing(myUid, targetUid)      → boolean
 *   getFollowCounts(uid)               → { followers, following }
 *   getInviteLink(uid?)
 *   copyInviteLink(uid?)
 *   initInviteButton(btnEl, uid)
 *   makeAvatarsClickable(container?)
 *   injectInviteBanner(containerEl, uid)
 */

import { auth, db } from './firebase.js';
import { showToast } from './auth.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, addDoc, deleteDoc,
  query, where, getDocs, limit,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ── Base URL ─────────────────────────────────────────────────
function getBase() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
}


// ════════════════════════════════════════════════════════════
// OTWIERANIE PROFILU
// ════════════════════════════════════════════════════════════

export function openUserProfile(uid) {
  if (!uid) return;
  const me = auth.currentUser;
  if (uid === me?.uid) {
    window.location.href = 'profile.html';
  } else {
    window.location.href = `user.html?uid=${encodeURIComponent(uid)}`;
  }
}


// ════════════════════════════════════════════════════════════
// FOLLOW / UNFOLLOW
// ════════════════════════════════════════════════════════════

const COL_FOLLOWERS = 'followers';

/**
 * Sprawdza czy myUid obserwuje targetUid.
 * @returns {Promise<{ following: boolean, docId: string|null }>}
 */
export async function isFollowing(myUid, targetUid) {
  if (!myUid || !targetUid || myUid === targetUid) return { following: false, docId: null };
  try {
    const snap = await getDocs(query(
      collection(db, COL_FOLLOWERS),
      where('followerId',  '==', myUid),
      where('followingId', '==', targetUid),
      limit(1),
    ));
    if (snap.empty) return { following: false, docId: null };
    return { following: true, docId: snap.docs[0].id };
  } catch(e) {
    console.warn('[isFollowing]', e.code);
    return { following: false, docId: null };
  }
}


/**
 * Obserwuje użytkownika.
 * Tworzy dokument w followers i wysyła powiadomienie.
 *
 * @param {string} myUid
 * @param {string} targetUid
 * @param {string} myDisplayName  — do powiadomienia
 * @returns {Promise<string>}  — docId
 */
export async function followUser(myUid, targetUid, myDisplayName = 'Wojownik') {
  const TAG = '[followUser]';

  if (!myUid || !targetUid) throw new Error('Brak uid');
  if (myUid === targetUid)  throw new Error('Nie można obserwować siebie');

  console.log(TAG, `${myUid} → follow → ${targetUid}`);

  const ref = await addDoc(collection(db, COL_FOLLOWERS), {
    followerId:  myUid,
    followingId: targetUid,
    createdAt:   serverTimestamp(),
  });

  console.log(TAG, '✅ follow doc:', ref.id);

  // Powiadomienie dla obserwowanego
  createNotification(targetUid, {
    type:  'follow',
    title: `${myDisplayName} obserwuje Cię ⚔️`,
    body:  'Nowy obserwujący na Arenie!',
    url:   `user.html?uid=${encodeURIComponent(myUid)}`,
  }).catch(() => {});

  return ref.id;
}


/**
 * Przestaje obserwować użytkownika.
 *
 * @param {string} myUid
 * @param {string} targetUid
 */
export async function unfollowUser(myUid, targetUid) {
  const TAG = '[unfollowUser]';

  if (!myUid || !targetUid) throw new Error('Brak uid');

  console.log(TAG, `${myUid} → unfollow → ${targetUid}`);

  const snap = await getDocs(query(
    collection(db, COL_FOLLOWERS),
    where('followerId',  '==', myUid),
    where('followingId', '==', targetUid),
    limit(1),
  ));

  if (snap.empty) {
    console.warn(TAG, '⚠️ Nie znaleziono dokumentu follow');
    return;
  }

  await deleteDoc(doc(db, COL_FOLLOWERS, snap.docs[0].id));
  console.log(TAG, '✅ unfollowed');
}


/**
 * Pobiera liczniki obserwujących i obserwowanych.
 *
 * @param {string} uid
 * @returns {Promise<{ followers: number, following: number }>}
 */
export async function getFollowCounts(uid) {
  if (!uid) return { followers: 0, following: 0 };
  try {
    const [followersSnap, followingSnap] = await Promise.all([
      getDocs(query(collection(db, COL_FOLLOWERS), where('followingId', '==', uid))),
      getDocs(query(collection(db, COL_FOLLOWERS), where('followerId',  '==', uid))),
    ]);
    return {
      followers: followersSnap.size,
      following: followingSnap.size,
    };
  } catch(e) {
    console.warn('[getFollowCounts]', e.code);
    return { followers: 0, following: 0 };
  }
}


/**
 * Wstrzykuje widget follow button do podanego kontenera.
 * Zarządza stanem (follow/unfollow) wewnętrznie.
 *
 * @param {HTMLElement} containerEl
 * @param {string} myUid
 * @param {string} targetUid
 * @param {string} myDisplayName
 */
export async function injectFollowWidget(containerEl, myUid, targetUid, myDisplayName = 'Wojownik') {
  if (!containerEl || !myUid || !targetUid || myUid === targetUid) return;

  const btn = document.createElement('button');
  btn.style.cssText = `
    display:inline-flex;align-items:center;gap:.4rem;
    padding:.5rem 1.25rem;border-radius:9999px;
    font-family:var(--font-heading);font-size:.575rem;font-weight:700;
    letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
    transition:all .2s ease;border:none;white-space:nowrap;
  `;

  let followDocId = null;

  const setFollow = () => {
    btn.style.background = 'linear-gradient(135deg,var(--gold-700),var(--gold-500))';
    btn.style.color       = '#0A0700';
    btn.style.boxShadow   = '0 4px 16px rgba(212,175,55,.25)';
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg> Obserwuj`;
  };
  const setUnfollow = () => {
    btn.style.background = 'transparent';
    btn.style.color       = 'var(--text-muted)';
    btn.style.boxShadow   = 'none';
    btn.style.border      = '1px solid var(--border-dim)';
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg> Obserwujesz`;
  };

  // Check initial state
  const { following, docId } = await isFollowing(myUid, targetUid);
  followDocId = docId;
  following ? setUnfollow() : setFollow();

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      if (followDocId) {
        await unfollowUser(myUid, targetUid);
        followDocId = null;
        setFollow();
        btn.style.border = 'none';
      } else {
        followDocId = await followUser(myUid, targetUid, myDisplayName);
        setUnfollow();
      }
    } catch(e) {
      showToast(e.message || 'Błąd', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  containerEl.appendChild(btn);
}


// ════════════════════════════════════════════════════════════
// KLIKALNE AVATARY
// ════════════════════════════════════════════════════════════

export function makeAvatarsClickable(container = document) {
  container.querySelectorAll('[data-user-uid]').forEach(el => {
    if (el.dataset.clickableProfile) return;
    el.dataset.clickableProfile = '1';
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserProfile(el.dataset.userUid);
    });
  });
}


// ════════════════════════════════════════════════════════════
// LINK ZAPROSZENIA
// ════════════════════════════════════════════════════════════

export function getInviteLink(uid) {
  const base = getBase();
  const ref  = uid ?? auth.currentUser?.uid ?? '';
  return `${base}register.html${ref ? '?ref=' + encodeURIComponent(ref) : ''}`;
}

export async function copyInviteLink(uid) {
  const link  = getInviteLink(uid ?? auth.currentUser?.uid);
  const title = 'Weekend Warrior Social ⚔️';
  const text  = 'Dołącz na Arenę! Wyzwania, ranking i osiągnięcia czekają.';

  if (navigator.share) {
    try { await navigator.share({ title, text, url: link }); return; }
    catch { /* user cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(link);
    showToast('Link zaproszenia skopiowany! 📋', 'success', 3500);
  } catch {
    prompt('Skopiuj link zaproszenia:', link);
  }
}

export function initInviteButton(btnEl, uid) {
  if (!btnEl) return;
  btnEl.addEventListener('click', () => copyInviteLink(uid));
}


// ════════════════════════════════════════════════════════════
// INVITE BANNER (index.html)
// ════════════════════════════════════════════════════════════

export function injectInviteBanner(containerEl, uid) {
  if (!containerEl) return;

  const div = document.createElement('div');
  div.style.cssText = `
    background: linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.02) 100%);
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1.125rem;
  `;
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <div style="font-size:1.375rem;flex-shrink:0;">🛡️</div>
      <div>
        <div style="font-family:var(--font-heading);font-size:0.75rem;font-weight:700;
                    color:var(--gold-500);letter-spacing:0.08em;text-transform:uppercase;">
          Zaproś wojownika
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">Podeślij link znajomemu</div>
      </div>
    </div>
    <button id="inject-invite-btn" style="
      display:flex;align-items:center;gap:0.5rem;
      padding:0.5rem 1rem;
      background:linear-gradient(135deg,var(--gold-700),var(--gold-500));
      border:none;border-radius:9999px;color:#0A0700;
      font-family:var(--font-heading);font-size:0.625rem;font-weight:700;
      letter-spacing:0.08em;text-transform:uppercase;
      cursor:pointer;transition:all .2s ease;white-space:nowrap;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Kopiuj link
    </button>
  `;
  containerEl.appendChild(div);
  div.querySelector('#inject-invite-btn')?.addEventListener('click', () => copyInviteLink(uid));
}


// ════════════════════════════════════════════════════════════
// SYSTEM ZNAJOMYCH (ETAP 4)
// ════════════════════════════════════════════════════════════
//
// Kolekcje:
//   friend_requests/{id} → { senderId, senderName, receiverId, status, createdAt }
//     status: 'pending' | 'accepted' | 'rejected'
//   friends/{id} → { uid1, uid2, users:[uid1,uid2], createdAt }

import { getDoc, orderBy, updateDoc as _updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COL_FRIEND_REQUESTS = 'friend_requests';
const COL_FRIENDS = 'friends';

/** Wyszukuje użytkowników po nazwie (prefix, case-insensitive po stronie klienta). */
export async function searchUsers(term, myUid = '', max = 12) {
  const t = (term || '').trim();
  if (t.length < 2) return [];
  try {
    // Pobierz pulę po prefiksie displayName + dociągnij szerzej i filtruj lokalnie
    const snap = await getDocs(query(
      collection(db, 'users'),
      orderBy('displayName'),
      limit(60),
    ));
    const lower = t.toLowerCase();
    return snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.uid !== myUid && (
        (u.displayName || '').toLowerCase().includes(lower) ||
        (u.username || '').toLowerCase().includes(lower)
      ))
      .slice(0, max);
  } catch (e) {
    console.warn('[searchUsers]', e.code);
    return [];
  }
}

/** Status relacji: 'none' | 'pending_sent' | 'pending_received' | 'friends' */
export async function getFriendshipStatus(myUid, targetUid) {
  if (!myUid || !targetUid || myUid === targetUid) return { status: 'none', docId: null };
  try {
    // Znajomi?
    const fSnap = await getDocs(query(
      collection(db, COL_FRIENDS),
      where('users', 'array-contains', myUid),
    ));
    const fr = fSnap.docs.find(d => (d.data().users || []).includes(targetUid));
    if (fr) return { status: 'friends', docId: fr.id };

    // Wysłane zaproszenie?
    const sentSnap = await getDocs(query(
      collection(db, COL_FRIEND_REQUESTS),
      where('senderId', '==', myUid),
      where('receiverId', '==', targetUid),
      where('status', '==', 'pending'),
      limit(1),
    ));
    if (!sentSnap.empty) return { status: 'pending_sent', docId: sentSnap.docs[0].id };

    // Otrzymane zaproszenie?
    const recvSnap = await getDocs(query(
      collection(db, COL_FRIEND_REQUESTS),
      where('senderId', '==', targetUid),
      where('receiverId', '==', myUid),
      where('status', '==', 'pending'),
      limit(1),
    ));
    if (!recvSnap.empty) return { status: 'pending_received', docId: recvSnap.docs[0].id };

    return { status: 'none', docId: null };
  } catch (e) {
    console.warn('[getFriendshipStatus]', e.code);
    return { status: 'none', docId: null };
  }
}

/** Wysyła zaproszenie do znajomych + powiadomienie. */
export async function sendFriendRequest(myUid, myName, targetUid) {
  if (!myUid || !targetUid || myUid === targetUid) throw new Error('Nieprawidłowy cel');
  const { status } = await getFriendshipStatus(myUid, targetUid);
  if (status === 'friends') throw new Error('Już jesteście towarzyszami broni');
  if (status === 'pending_sent') throw new Error('Zaproszenie już wysłane');

  const ref = await addDoc(collection(db, COL_FRIEND_REQUESTS), {
    senderId: myUid,
    senderName: myName || 'Wojownik',
    receiverId: targetUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  createNotification(targetUid, {
    type: 'friend_request',
    title: `${myName || 'Wojownik'} chce być Twoim towarzyszem 🤝`,
    body: 'Przyjmij lub odrzuć zaproszenie na swojej Karcie Bohatera.',
    url: 'profile.html',
    relatedUid: myUid,
  }).catch(() => {});

  return ref.id;
}

/** Akceptuje zaproszenie — tworzy dokument znajomości. */
export async function acceptFriendRequest(requestId, myUid, myName = 'Wojownik') {
  const reqRef = doc(db, COL_FRIEND_REQUESTS, requestId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) throw new Error('Zaproszenie nie istnieje');
  const req = snap.data();
  if (req.receiverId !== myUid) throw new Error('To nie Twoje zaproszenie');

  const [uid1, uid2] = [req.senderId, req.receiverId].sort();
  await addDoc(collection(db, COL_FRIENDS), {
    uid1, uid2,
    users: [uid1, uid2],
    createdAt: serverTimestamp(),
  });
  await _updateDoc(reqRef, { status: 'accepted' });

  createNotification(req.senderId, {
    type: 'friend_accept',
    title: `${myName} przyjął Twoje zaproszenie 🛡️`,
    body: 'Jesteście teraz towarzyszami broni!',
    url: `user.html?uid=${encodeURIComponent(myUid)}`,
    relatedUid: myUid,
  }).catch(() => {});

  return true;
}

/** Odrzuca zaproszenie. */
export async function rejectFriendRequest(requestId, myUid) {
  const reqRef = doc(db, COL_FRIEND_REQUESTS, requestId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) return;
  if (snap.data().receiverId !== myUid) throw new Error('To nie Twoje zaproszenie');
  await _updateDoc(reqRef, { status: 'rejected' });
}

/** Lista oczekujących zaproszeń DO mnie. */
export async function getPendingRequests(myUid) {
  if (!myUid) return [];
  try {
    const snap = await getDocs(query(
      collection(db, COL_FRIEND_REQUESTS),
      where('receiverId', '==', myUid),
      where('status', '==', 'pending'),
    ));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[getPendingRequests]', e.code);
    return [];
  }
}

/** Lista znajomych (z danymi użytkowników). */
export async function getFriends(myUid) {
  if (!myUid) return [];
  try {
    const snap = await getDocs(query(
      collection(db, COL_FRIENDS),
      where('users', 'array-contains', myUid),
    ));
    const results = await Promise.all(snap.docs.map(async d => {
      const otherUid = (d.data().users || []).find(u => u !== myUid);
      let userData = { displayName: 'Wojownik' };
      try {
        const uSnap = await getDoc(doc(db, 'users', otherUid));
        if (uSnap.exists()) userData = uSnap.data();
      } catch {}
      return { friendDocId: d.id, uid: otherUid, ...userData };
    }));
    return results;
  } catch (e) {
    console.warn('[getFriends]', e.code);
    return [];
  }
}

/** Liczba znajomych. */
export async function getFriendCount(uid) {
  try {
    const snap = await getDocs(query(
      collection(db, COL_FRIENDS),
      where('users', 'array-contains', uid),
    ));
    return snap.size;
  } catch { return 0; }
}

/** Usuwa znajomość. */
export async function removeFriend(friendDocId) {
  if (!friendDocId) return;
  await deleteDoc(doc(db, COL_FRIENDS, friendDocId));
}
