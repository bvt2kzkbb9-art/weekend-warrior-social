/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — pajac.js
 * System "Zrób Lagę Pajacu™"
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * FIRESTORE:
 *   pajacChallenges/{autoId}
 *     initiatorId, initiatorName, initiatorPhoto
 *     targetId, targetName, targetPhoto
 *     action: 'laga_pajaca' | 'ognisko'
 *     customText: string
 *     status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired'
 *     xpReward: number
 *     winner: uid | null
 *     expiresAt: Timestamp (createdAt + 24h)
 *     completedAt: Timestamp | null
 *     createdAt: Timestamp
 *
 * EKSPORTY:
 *   sendPajacChallenge(myUid, myData, targetUid, targetData, action?, customText?)
 *   respondToPajac(pajacId, response: 'accepted'|'declined', myUid)
 *   completePajac(pajacId, winnerId, myUid)
 *   getPendingPajacs(uid)       → incoming challenges
 *   initPajacInbox(uid)         → realtime stream
 *   injectPajacButton(el, myUid, myData, targetUid, targetData)
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { createNotification } from './notifications.js';
import { awardXP, XP_ACTIONS } from './xp.js';

import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const COL_PAJAC = 'pajacChallenges';

// XP wartości
const XP_PAJAC_SENT      = 2;
const XP_PAJAC_ACCEPTED  = 2;
const XP_PAJAC_WON       = 25;
const XP_PAJAC_COMPLETED = 10;

// Akcje
export const PAJAC_ACTIONS = {
  laga_pajaca: { label: '🍺 Zrób Lagę Pajacu',       xp: 25 },
  ognisko:     { label: '🔥 Ciągnę, palę lamusie',   xp: 30 },
};

// ── State ──────────────────────────────────────────────────
let _unsubInbox = null;


// ════════════════════════════════════════════════════════════
// SEND PAJAC CHALLENGE
// ════════════════════════════════════════════════════════════

/**
 * Rzuć wyzwanie "Lagi Pajacu".
 *
 * @param {string} myUid
 * @param {object} myData        — { displayName, photoURL }
 * @param {string} targetUid
 * @param {object} targetData    — { displayName, photoURL }
 * @param {string} action        — 'laga_pajaca' | 'ognisko'
 * @param {string} customText    — opcjonalny opis
 * @returns {Promise<string>}    — docId
 */
export async function sendPajacChallenge(
  myUid, myData, targetUid, targetData,
  action = 'laga_pajaca', customText = ''
) {
  const TAG = '[sendPajacChallenge]';

  if (!myUid || !targetUid) throw new Error('Brak uid');
  if (myUid === targetUid)  { showToast('Nie możesz rzucić wyzwania sobie 😅', 'info'); throw new Error('self'); }

  const actionDef = PAJAC_ACTIONS[action] ?? PAJAC_ACTIONS.laga_pajaca;

  console.log(TAG, `${myUid} → ${action} → ${targetUid}`);

  // Sprawdź czy nie ma już aktywnego wyzwania między tą parą
  const existing = await getDocs(query(
    collection(db, COL_PAJAC),
    where('initiatorId', '==', myUid),
    where('targetId',    '==', targetUid),
    where('status',      '==', 'pending'),
    limit(1),
  ));
  if (!existing.empty) {
    showToast('Masz już aktywne wyzwanie z tym wojownikiem! ⚔️', 'info');
    throw new Error('duplicate');
  }

  const now       = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  const ref = await addDoc(collection(db, COL_PAJAC), {
    initiatorId:    myUid,
    initiatorName:  myData.displayName  || 'Wojownik',
    initiatorPhoto: myData.photoURL     || '',
    targetId:       targetUid,
    targetName:     targetData.displayName  || 'Wojownik',
    targetPhoto:    targetData.photoURL     || '',
    action,
    customText:     customText.slice(0, 200),
    status:         'pending',
    xpReward:       actionDef.xp,
    winner:         null,
    completedAt:    null,
    expiresAt:      Timestamp.fromDate(expiresAt),
    createdAt:      serverTimestamp(),
  });

  console.log(TAG, '✅ Pajac wysłany:', ref.id);

  // XP za inicjowanie
  awardXP(myUid, { xp: XP_PAJAC_SENT, label: 'Laga Pajacu wysłana' }).catch(() => {});

  // Powiadomienie
  createNotification(targetUid, {
    type:  'pajac_challenge',
    title: `${myData.displayName || 'Wojownik'} rzucił Ci Lagę Pajacu! 🍺`,
    body:  customText || actionDef.label,
    url:   `index.html#pajac-inbox`,
  }).catch(() => {});

  return ref.id;
}


// ════════════════════════════════════════════════════════════
// RESPOND — accept / decline
// ════════════════════════════════════════════════════════════

/**
 * Odpowiedz na wyzwanie.
 *
 * @param {string} pajacId
 * @param {'accepted'|'declined'} response
 * @param {string} myUid
 */
export async function respondToPajac(pajacId, response, myUid) {
  const TAG = '[respondToPajac]';

  const ref  = doc(db, COL_PAJAC, pajacId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Pajac nie istnieje');

  const data = snap.data();
  if (data.targetId !== myUid) throw new Error('Brak uprawnień');
  if (data.status   !== 'pending') throw new Error('Pajac już nie jest w toku');

  await updateDoc(ref, {
    status:     response,
    respondedAt: serverTimestamp(),
  });

  console.log(TAG, `✅ ${response}:`, pajacId);

  if (response === 'accepted') {
    awardXP(myUid, { xp: XP_PAJAC_ACCEPTED, label: 'Laga Pajacu przyjęta' }).catch(() => {});

    createNotification(data.initiatorId, {
      type:  'pajac_accepted',
      title: `${data.targetName} przyjął Twoją Lagę! 🔥`,
      body:  'Wyzwanie jest aktywne. Czas działać!',
      url:   `index.html#pajac-inbox`,
    }).catch(() => {});

    showToast('Wyzwanie przyjęte! 🔥 Czas działać!', 'success', 4000);

  } else {
    createNotification(data.initiatorId, {
      type:  'pajac_declined',
      title: `${data.targetName}: Temat skończony 🚫`,
      body:  'Odrzucił Twoją Lagę Pajacu.',
      url:   `index.html`,
    }).catch(() => {});

    showToast('Wyzwanie odrzucone.', 'info');
  }
}


// ════════════════════════════════════════════════════════════
// COMPLETE PAJAC
// ════════════════════════════════════════════════════════════

/**
 * Zakończ wyzwanie z wynikiem.
 *
 * @param {string} pajacId
 * @param {string|null} winnerId — uid wygrywającego lub null (remis/brak rozstrzygnięcia)
 * @param {string} myUid
 */
export async function completePajac(pajacId, winnerId, myUid) {
  const TAG = '[completePajac]';

  const ref  = doc(db, COL_PAJAC, pajacId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Pajac nie istnieje');

  const data = snap.data();
  if (data.initiatorId !== myUid && data.targetId !== myUid) throw new Error('Brak uprawnień');
  if (!['accepted', 'pending'].includes(data.status)) throw new Error('Nieprawidłowy status');

  await updateDoc(ref, {
    status:      'completed',
    winner:      winnerId || null,
    completedAt: serverTimestamp(),
  });

  console.log(TAG, `✅ Ukończono. Winner: ${winnerId || 'remis'}`);

  const otherId = myUid === data.initiatorId ? data.targetId : data.initiatorId;
  const otherName = myUid === data.initiatorId ? data.targetName : data.initiatorName;

  if (winnerId) {
    // XP dla wygrywającego
    awardXP(winnerId, { xp: data.xpReward || XP_PAJAC_WON, label: 'Laga Pajacu — wygrana!' }).catch(() => {});

    const isMyWin = winnerId === myUid;
    showToast(isMyWin ? `Wygrałeś Lagę! +${data.xpReward || XP_PAJAC_WON} XP 🏆` : 'Wyzwanie ukończone.', isMyWin ? 'success' : 'info');

    createNotification(otherId, {
      type:  'pajac_completed',
      title: `Laga zakończona! ${winnerId === otherId ? 'Wygrałeś! 🏆' : `Wygrał ${winnerId === data.initiatorId ? data.initiatorName : data.targetName}`}`,
      body:  `Wyzwanie "${PAJAC_ACTIONS[data.action]?.label || data.action}" dobiegło końca.`,
      url:   `index.html`,
    }).catch(() => {});

  } else {
    // Remis / brak rozstrzygnięcia
    awardXP(myUid,    { xp: XP_PAJAC_COMPLETED, label: 'Laga Pajacu — ukończona' }).catch(() => {});
    awardXP(otherId,  { xp: XP_PAJAC_COMPLETED, label: 'Laga Pajacu — ukończona' }).catch(() => {});
    showToast('Wyzwanie ukończone! +10 XP', 'success');

    createNotification(otherId, {
      type:  'pajac_completed',
      title: `Laga zakończona! Remis.`,
      body:  `Oboje dostajecie +${XP_PAJAC_COMPLETED} XP.`,
      url:   `index.html`,
    }).catch(() => {});
  }
}


// ════════════════════════════════════════════════════════════
// GET PENDING PAJACS
// ════════════════════════════════════════════════════════════

/**
 * Pobierz aktywne wyzwania dla danego użytkownika (incoming + outgoing).
 *
 * @param {string} uid
 * @returns {Promise<{ incoming: Array, outgoing: Array }>}
 */
export async function getPendingPajacs(uid) {
  if (!uid) return { incoming: [], outgoing: [] };
  const now = Timestamp.now();

  try {
    const [inSnap, outSnap] = await Promise.all([
      getDocs(query(
        collection(db, COL_PAJAC),
        where('targetId', '==', uid),
        where('status',   '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(20),
      )),
      getDocs(query(
        collection(db, COL_PAJAC),
        where('initiatorId', '==', uid),
        where('status',      'in', ['pending','accepted']),
        orderBy('createdAt', 'desc'),
        limit(20),
      )),
    ]);

    const incoming = []; inSnap.forEach(d => incoming.push({ id: d.id, ...d.data() }));
    const outgoing = []; outSnap.forEach(d => outgoing.push({ id: d.id, ...d.data() }));

    return { incoming, outgoing };
  } catch(e) {
    console.warn('[getPendingPajacs]', e.code);
    return { incoming: [], outgoing: [] };
  }
}


// ════════════════════════════════════════════════════════════
// REALTIME INBOX
// ════════════════════════════════════════════════════════════

/**
 * Nasłuchuj przychodzących wyzwań w czasie rzeczywistym.
 * Aktualizuje badge na index.html.
 *
 * @param {string} uid
 * @param {Function} onUpdate — callback(pajacs: Array)
 */
export function initPajacInbox(uid, onUpdate = null) {
  if (!uid) return;
  if (_unsubInbox) { _unsubInbox(); _unsubInbox = null; }

  const q = query(
    collection(db, COL_PAJAC),
    where('targetId', '==', uid),
    where('status',   '==', 'pending'),
  );

  _unsubInbox = onSnapshot(q, snap => {
    const pajacs = [];
    snap.forEach(d => pajacs.push({ id: d.id, ...d.data() }));

    // Aktualizuj badge
    const badge = document.getElementById('pajac-badge');
    if (badge) {
      badge.textContent   = pajacs.length > 9 ? '9+' : pajacs.length;
      badge.style.display = pajacs.length > 0 ? 'flex' : 'none';
    }

    if (typeof onUpdate === 'function') onUpdate(pajacs);
  }, err => console.warn('[pajacInbox]', err.code));
}

export function destroyPajacInbox() {
  if (_unsubInbox) { _unsubInbox(); _unsubInbox = null; }
}


// ════════════════════════════════════════════════════════════
// INJECT PAJAC BUTTON — wstrzyknij na user.html
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje przycisk "🍺 Zrób Lagę Pajacu" do kontenera.
 *
 * @param {HTMLElement} containerEl
 * @param {string} myUid
 * @param {object} myData     — { displayName, photoURL }
 * @param {string} targetUid
 * @param {object} targetData — { displayName, photoURL }
 */
export function injectPajacButton(containerEl, myUid, myData, targetUid, targetData) {
  if (!containerEl || !myUid || !targetUid || myUid === targetUid) return;

  _injectPajacStyles();

  const btn = document.createElement('button');
  btn.className   = 'pajac-btn';
  btn.innerHTML   = '🍺 Zrób Lagę Pajacu';
  btn.title       = 'Rzuć wyzwanie Lagi Pajacu';

  btn.addEventListener('click', () => {
    _openPajacModal(myUid, myData, targetUid, targetData);
  });

  containerEl.appendChild(btn);
}


// ════════════════════════════════════════════════════════════
// MODAL WYBORU AKCJI
// ════════════════════════════════════════════════════════════

function _openPajacModal(myUid, myData, targetUid, targetData) {
  document.getElementById('pajac-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'pajac-modal-overlay';
  overlay.className = 'pajac-modal-overlay';

  overlay.innerHTML = `
    <div class="pajac-modal" role="dialog" aria-modal="true">
      <div class="pajac-modal-handle"></div>
      <div class="pajac-modal-title">🍺 Wybierz Lagę</div>
      <div class="pajac-modal-target">
        dla: <strong>${_esc(targetData.displayName || 'Wojownika')}</strong>
      </div>

      <div class="pajac-action-list">
        <button class="pajac-action-item" data-action="laga_pajaca">
          <span class="pajac-action-emoji">🍺</span>
          <div class="pajac-action-info">
            <div class="pajac-action-name">Zrób Lagę Pajacu</div>
            <div class="pajac-action-desc">Klasyczne wyzwanie. +${PAJAC_ACTIONS.laga_pajaca.xp} XP za wygraną</div>
          </div>
        </button>
        <button class="pajac-action-item" data-action="ognisko">
          <span class="pajac-action-emoji">🔥</span>
          <div class="pajac-action-info">
            <div class="pajac-action-name">Ciągnę, palę lamusie</div>
            <div class="pajac-action-desc">Intensywne wyzwanie. +${PAJAC_ACTIONS.ognisko.xp} XP za wygraną</div>
          </div>
        </button>
      </div>

      <div style="margin:.75rem 0 .25rem;">
        <textarea
          id="pajac-custom-text"
          placeholder="Dodaj opis wyzwania (opcjonalnie)..."
          maxlength="200"
          rows="2"
          style="width:100%;background:var(--bg-elevated);border:1px solid var(--border-mid);
            border-radius:var(--r-md);padding:.5rem .75rem;color:var(--text-primary);
            font-family:var(--font-body);font-size:.875rem;resize:none;outline:none;
            transition:border-color var(--dur-fast);"
        ></textarea>
      </div>

      <div style="display:flex;gap:.5rem;margin-top:.5rem;">
        <button class="btn btn-ghost btn-sm" id="pajac-cancel" style="flex:1;">Anuluj</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Close on backdrop
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('pajac-cancel')?.addEventListener('click', () => overlay.remove());

  // Action buttons
  overlay.querySelectorAll('.pajac-action-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action     = btn.dataset.action;
      const customText = document.getElementById('pajac-custom-text')?.value.trim() || '';
      overlay.remove();

      try {
        const id = await sendPajacChallenge(myUid, myData, targetUid, targetData, action, customText);
        showToast(`Laga Pajacu rzucona! 🍺 +${XP_PAJAC_SENT} XP`, 'success', 4000);
        console.log('[pajac] wysłano:', id);
      } catch(e) {
        if (e.message !== 'self' && e.message !== 'duplicate') {
          showToast('Błąd wysyłania wyzwania. Spróbuj ponownie.', 'error');
        }
      }
    });
  });
}


// ════════════════════════════════════════════════════════════
// RENDER PAJAC CARD (do używania w feed lub inbox)
// ════════════════════════════════════════════════════════════

/**
 * Buduje kartę wyzwania Lagi do wyświetlenia w feedzie/skrzynce.
 *
 * @param {object} pajac — dane z Firestore
 * @param {string} myUid
 * @returns {HTMLElement}
 */
export function buildPajacCard(pajac, myUid) {
  const isTarget     = pajac.targetId    === myUid;
  const isInitiator  = pajac.initiatorId === myUid;
  const actionDef    = PAJAC_ACTIONS[pajac.action] ?? PAJAC_ACTIONS.laga_pajaca;
  const expiresIn    = pajac.expiresAt
    ? Math.max(0, Math.floor((pajac.expiresAt.seconds * 1000 - Date.now()) / 3600000))
    : 0;

  const card = document.createElement('div');
  card.className      = 'pajac-card';
  card.dataset.pajacId = pajac.id;

  const statusLabel = {
    pending:   '⏳ Oczekuje',
    accepted:  '🔥 Aktywne',
    declined:  '🚫 Odrzucone',
    completed: '✅ Zakończone',
    expired:   '⏰ Wygasło',
  }[pajac.status] || pajac.status;

  const ini1 = (pajac.initiatorName || 'W').charAt(0).toUpperCase();
  const ini2 = (pajac.targetName    || 'W').charAt(0).toUpperCase();

  card.innerHTML = `
    <div class="pajac-card-header">
      <span class="pajac-card-emoji">${actionDef.label.split(' ')[0]}</span>
      <div style="flex:1;">
        <div class="pajac-card-title">${_esc(actionDef.label)}</div>
        <div class="pajac-card-status">${statusLabel}${pajac.status === 'pending' ? ` · wygasa za ${expiresIn}h` : ''}</div>
      </div>
      <div class="pajac-card-xp">+${pajac.xpReward || 25} XP</div>
    </div>

    <div class="pajac-card-players">
      <div class="pajac-player">
        <div class="pajac-av">${pajac.initiatorPhoto
          ? `<img src="${_esc(pajac.initiatorPhoto)}" alt="Avatar" onerror="this.parentElement.textContent='${ini1}'">`
          : ini1}</div>
        <div class="pajac-player-name">${_esc(pajac.initiatorName)}</div>
      </div>
      <div class="pajac-vs">⚔️</div>
      <div class="pajac-player">
        <div class="pajac-av">${pajac.targetPhoto
          ? `<img src="${_esc(pajac.targetPhoto)}" alt="Avatar" onerror="this.parentElement.textContent='${ini2}'">`
          : ini2}</div>
        <div class="pajac-player-name">${_esc(pajac.targetName)}</div>
      </div>
    </div>

    ${pajac.customText ? `<div class="pajac-card-desc">"${_esc(pajac.customText)}"</div>` : ''}

    ${pajac.status === 'pending' && isTarget ? `
      <div class="pajac-card-actions">
        <button class="pajac-accept-btn" data-id="${pajac.id}">🔥 Ciągnę!</button>
        <button class="pajac-decline-btn" data-id="${pajac.id}">🚫 Temat skończony</button>
      </div>` : ''}

    ${pajac.status === 'accepted' && (isInitiator || isTarget) ? `
      <div class="pajac-card-actions">
        <button class="pajac-win-btn" data-id="${pajac.id}" data-winner="${myUid}">
          🏆 Ja wygrałem!
        </button>
        <button class="pajac-draw-btn" data-id="${pajac.id}">
          🤝 Remis / Zakończ
        </button>
      </div>` : ''}

    ${pajac.status === 'completed' && pajac.winner ? `
      <div class="pajac-card-winner">
        🏆 Wygrał: <strong>${pajac.winner === pajac.initiatorId ? _esc(pajac.initiatorName) : _esc(pajac.targetName)}</strong>
      </div>` : ''}`;

  // Events
  card.querySelector('.pajac-accept-btn')?.addEventListener('click', async () => {
    try { await respondToPajac(pajac.id, 'accepted', myUid); }
    catch(e) { showToast('Błąd: ' + e.message, 'error'); }
  });

  card.querySelector('.pajac-decline-btn')?.addEventListener('click', async () => {
    try { await respondToPajac(pajac.id, 'declined', myUid); }
    catch(e) { showToast('Błąd: ' + e.message, 'error'); }
  });

  card.querySelector('.pajac-win-btn')?.addEventListener('click', async () => {
    try { await completePajac(pajac.id, myUid, myUid); }
    catch(e) { showToast('Błąd: ' + e.message, 'error'); }
  });

  card.querySelector('.pajac-draw-btn')?.addEventListener('click', async () => {
    try { await completePajac(pajac.id, null, myUid); }
    catch(e) { showToast('Błąd: ' + e.message, 'error'); }
  });

  return card;
}


// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

function _injectPajacStyles() {
  if (document.getElementById('pajac-styles')) return;
  const s = document.createElement('style');
  s.id = 'pajac-styles';
  s.textContent = `
    /* Przycisk na user.html */
    .pajac-btn {
      display: inline-flex;
      align-items: center;
      gap: .375rem;
      padding: .5rem 1rem;
      background: linear-gradient(135deg, rgba(180,100,0,.2), rgba(180,100,0,.1));
      border: 1px solid rgba(200,120,0,.35);
      border-radius: 9999px;
      font-family: var(--font-heading);
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .06em;
      color: #FFAA44;
      cursor: pointer;
      transition: all .2s ease;
      white-space: nowrap;
    }
    .pajac-btn:hover {
      background: rgba(180,100,0,.3);
      transform: scale(1.04);
      box-shadow: 0 4px 16px rgba(180,100,0,.25);
    }

    /* Modal overlay */
    .pajac-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.8);
      backdrop-filter: blur(6px);
      z-index: 9000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: calc(env(safe-area-inset-bottom,0) + .5rem);
      animation: fade-in .2s ease;
    }
    @media (min-width: 480px) {
      .pajac-modal-overlay { align-items: center; padding-bottom: 0; }
    }

    .pajac-modal {
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      border-radius: var(--r-xl) var(--r-xl) 0 0;
      padding: 1.25rem 1.25rem 1.5rem;
      width: 100%;
      max-width: 440px;
      animation: modal-in .3s var(--ease-out);
    }
    @media (min-width: 480px) { .pajac-modal { border-radius: var(--r-xl); } }

    .pajac-modal-handle {
      width: 36px; height: 4px;
      background: var(--border-dim);
      border-radius: 2px;
      margin: 0 auto .875rem;
    }
    @media (min-width: 480px) { .pajac-modal-handle { display: none; } }

    .pajac-modal-title {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 900;
      letter-spacing: .06em;
      color: var(--gold-400);
      margin-bottom: .25rem;
    }
    .pajac-modal-target {
      font-size: .875rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .pajac-action-list {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .pajac-action-item {
      display: flex;
      align-items: center;
      gap: .875rem;
      padding: .75rem .875rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--r-lg);
      cursor: pointer;
      transition: all .15s ease;
      text-align: left;
      width: 100%;
    }
    .pajac-action-item:hover {
      border-color: var(--gold-700);
      background: rgba(212,175,55,.06);
      transform: translateY(-1px);
    }
    .pajac-action-emoji { font-size: 1.625rem; flex-shrink: 0; }
    .pajac-action-name {
      font-family: var(--font-heading);
      font-size: .875rem;
      font-weight: 700;
      color: var(--text-bright);
    }
    .pajac-action-desc {
      font-size: .75rem;
      color: var(--text-muted);
      margin-top: .125rem;
    }

    /* Karta w feedzie/skrzynce */
    .pajac-card {
      background: linear-gradient(135deg, rgba(180,100,0,.08), rgba(180,100,0,.04));
      border: 1px solid rgba(200,120,0,.25);
      border-radius: var(--r-lg);
      padding: 1rem;
      margin: .5rem 0;
    }
    .pajac-card-header {
      display: flex; align-items: center; gap: .625rem; margin-bottom: .75rem;
    }
    .pajac-card-emoji { font-size: 1.375rem; flex-shrink: 0; }
    .pajac-card-title {
      font-family: var(--font-heading);
      font-size: .875rem;
      font-weight: 700;
      color: #FFAA44;
    }
    .pajac-card-status {
      font-size: .7rem;
      color: var(--text-muted);
      margin-top: .125rem;
      font-style: italic;
    }
    .pajac-card-xp {
      font-family: var(--font-heading);
      font-size: .75rem;
      font-weight: 700;
      color: var(--gold-500);
      margin-left: auto;
      flex-shrink: 0;
    }
    .pajac-card-players {
      display: flex;
      align-items: center;
      gap: .75rem;
      justify-content: center;
      margin-bottom: .75rem;
    }
    .pajac-player { text-align: center; flex: 1; }
    .pajac-av {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--bg-elevated);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-heading); font-size: .875rem; font-weight: 700;
      color: var(--gold-500);
      overflow: hidden;
      margin: 0 auto .375rem;
    }
    .pajac-av img { width:100%;height:100%;object-fit:cover; }
    .pajac-player-name {
      font-size: .75rem;
      color: var(--text-muted);
      font-family: var(--font-heading);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .pajac-vs { font-size: 1.375rem; flex-shrink: 0; }
    .pajac-card-desc {
      font-size: .875rem;
      color: var(--text-parchment);
      font-style: italic;
      text-align: center;
      margin-bottom: .75rem;
      padding: .5rem;
      background: rgba(255,255,255,.03);
      border-radius: var(--r-md);
    }
    .pajac-card-actions {
      display: flex; gap: .5rem;
    }
    .pajac-accept-btn, .pajac-win-btn {
      flex: 1;
      padding: .625rem;
      background: linear-gradient(135deg, rgba(180,100,0,.3), rgba(180,100,0,.15));
      border: 1px solid rgba(200,120,0,.4);
      border-radius: var(--r-md);
      font-family: var(--font-heading);
      font-size: .6875rem;
      font-weight: 700;
      color: #FFAA44;
      cursor: pointer;
      transition: all .15s ease;
    }
    .pajac-accept-btn:hover, .pajac-win-btn:hover {
      background: rgba(180,100,0,.4);
      transform: scale(1.02);
    }
    .pajac-decline-btn, .pajac-draw-btn {
      flex: 1;
      padding: .625rem;
      background: transparent;
      border: 1px solid var(--border-dim);
      border-radius: var(--r-md);
      font-family: var(--font-heading);
      font-size: .6875rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all .15s ease;
    }
    .pajac-decline-btn:hover { border-color: var(--error); color: var(--error); }
    .pajac-card-winner {
      text-align: center;
      font-family: var(--font-heading);
      font-size: .875rem;
      color: var(--gold-500);
      padding-top: .5rem;
    }
  `;
  document.head.appendChild(s);
}

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
