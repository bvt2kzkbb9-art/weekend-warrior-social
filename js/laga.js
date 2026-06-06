/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — laga.js
 * System "Zrób Lagę" — główna mechanika społecznościowa
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * FIRESTORE:
 *   laga_invites/{autoId}
 *     senderId, senderName, senderPhoto
 *     receiverId, receiverName, receiverPhoto
 *     lagaType: string   (id rodzaju lagi)
 *     lagaLabel: string  (emoji + nazwa)
 *     message: string    (własny tekst, opcjonalny)
 *     status: 'pending' | 'accepted' | 'declined' | 'replied'
 *     createdAt, respondedAt, expiresAt (+24h)
 *
 *   active_lagas/{senderId_receiverId}
 *     lagaId, senderId, receiverId, status, startedAt
 *
 *   posts/{autoId}  — wpis w feedzie po wysłaniu
 *     type: 'laga_event', lagaInviteId, ...standardowe pola
 *
 * EKSPORTY:
 *   openLagaModal(myUid, myData)            — otwórz modal "Zrób Lagę"
 *   sendLaga(myUid, myData, targetUser, lagaType, message)
 *   respondToLaga(lagaId, response, myUid, myData)
 *   listenPendingLagas(uid, callback)       → unsubscribe
 *   getLagaCount(uid)                       → number
 *   injectLagaButton(containerEl, myUid, myData) — globalny guzik
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { createNotification } from './notifications.js';
import { awardXP } from './xp.js';

import {
  collection, doc, addDoc, setDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Kolekcje ──────────────────────────────────────────────────
export const COL_LAGA_INVITES = 'laga_invites';
export const COL_ACTIVE_LAGAS = 'active_lagas';

// ── Rodzaje Lag ────────────────────────────────────────────────
export const LAGA_TYPES = [
  { id: 'waz',      emoji: '🐍', label: 'Ale Wąż',            desc: 'Klasyczna zaczepka Areny' },
  { id: 'dawaj',    emoji: '🍺', label: 'Dawaj Na Jednego',   desc: 'Społeczne wyzwanie' },
  { id: 'gonisz',   emoji: '🏃', label: 'Gonisz Czy Uciekasz', desc: 'Sprawdzian odwagi' },
  { id: 'misja',    emoji: '🎯', label: 'Mam Dla Ciebie Misję', desc: 'Wyślij misję specjalną' },
  { id: 'jaja',     emoji: '🤡', label: 'Masz Jaja?',          desc: 'Wyzwanie charakteru' },
  { id: 'pojedynek',emoji: '⚔️', label: 'Pojedynek',           desc: 'Starcie wojowników' },
  { id: 'specjalna',emoji: '💀', label: 'Specjalna Laga',      desc: 'Legendarny rzut' },
];

// ── XP ────────────────────────────────────────────────────────
const XP_LAGA_SEND    = 5;
const XP_LAGA_ACCEPT  = 10;
const XP_LAGA_REPLY   = 15;
const XP_LAGA_DONE    = 25;


// ════════════════════════════════════════════════════════════
// SEND LAGA
// ════════════════════════════════════════════════════════════

export async function sendLaga(myUid, myData, targetUser, lagaTypeId, message = '') {
  if (!myUid || !targetUser?.uid) throw new Error('Brak uid');
  if (myUid === targetUser.uid) {
    showToast('Nie możesz rzucić lagi sobie 😅', 'info');
    return null;
  }

  const lagaType = LAGA_TYPES.find(t => t.id === lagaTypeId) ?? LAGA_TYPES[0];
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

  // Zapisz zaproszenie
  const invRef = await addDoc(collection(db, COL_LAGA_INVITES), {
    senderId:      myUid,
    senderName:    myData.displayName  || 'Wojownik',
    senderPhoto:   myData.photoURL     || '',
    receiverId:    targetUser.uid,
    receiverName:  targetUser.displayName || 'Wojownik',
    receiverPhoto: targetUser.photoURL    || '',
    lagaType:      lagaType.id,
    lagaLabel:     `${lagaType.emoji} ${lagaType.label}`,
    lagaEmoji:     lagaType.emoji,
    message:       message.slice(0, 200),
    status:        'pending',
    createdAt:     serverTimestamp(),
    respondedAt:   null,
    expiresAt:     Timestamp.fromDate(expiresAt),
  });

  // Post w feedzie
  await addDoc(collection(db, COL.POSTS), {
    type:          'laga_event',
    lagaInviteId:  invRef.id,
    authorId:      myUid,
    authorName:    myData.displayName || 'Wojownik',
    authorPhoto:   myData.photoURL    || '',
    content:       `${lagaType.emoji} ${myData.displayName || 'Wojownik'} rzucił lagę „${lagaType.label}" użytkownikowi ${targetUser.displayName || 'Wojownik'}${message ? ` — „${message}"` : ''}`,
    targetId:      targetUser.uid,
    targetName:    targetUser.displayName || 'Wojownik',
    lagaType:      lagaType.id,
    lagaLabel:     lagaType.label,
    lagaEmoji:     lagaType.emoji,
    likes:         [],
    likesCount:    0,
    reactions:     {},
    reactionsCount:0,
    commentsCount: 0,
    createdAt:     serverTimestamp(),
  });

  // Powiadomienie
  createNotification(targetUser.uid, {
    type:  'LAGA_RECEIVED',
    title: `${myData.displayName || 'Wojownik'} rzucił Ci lagę ${lagaType.emoji}`,
    body:  `„${lagaType.label}"${message ? ` — ${message}` : ''} · masz 24h`,
    url:   'index.html#lagas',
  }).catch(() => {});

  // XP
  awardXP(myUid, { xp: XP_LAGA_SEND, label: 'Wysłano lagę' }).catch(() => {});

  showToast(`${lagaType.emoji} Laga rzucona! +${XP_LAGA_SEND} XP`, 'success', 4000);
  return invRef.id;
}


// ════════════════════════════════════════════════════════════
// RESPOND TO LAGA
// ════════════════════════════════════════════════════════════

export async function respondToLaga(lagaId, response, myUid, myData = {}) {
  const ref  = doc(db, COL_LAGA_INVITES, lagaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Laga nie istnieje');

  const data = snap.data();
  if (data.receiverId !== myUid) throw new Error('Brak uprawnień');
  if (data.status !== 'pending') {
    showToast('Ta laga nie jest już aktywna.', 'info');
    return;
  }

  await updateDoc(ref, {
    status:      response,
    respondedAt: serverTimestamp(),
  });

  if (response === 'accepted') {
    // Utwórz active_laga
    const activeId = [data.senderId, myUid].sort().join('_') + '_' + lagaId.slice(0, 8);
    await setDoc(doc(db, COL_ACTIVE_LAGAS, activeId), {
      lagaId,
      senderId:   data.senderId,
      receiverId: myUid,
      lagaType:   data.lagaType,
      lagaLabel:  data.lagaLabel,
      status:     'active',
      startedAt:  serverTimestamp(),
    });

    // XP
    awardXP(myUid, { xp: XP_LAGA_ACCEPT, label: 'Przyjęto lagę' }).catch(() => {});

    // Powiadom nadawcę
    createNotification(data.senderId, {
      type:  'LAGA_ACCEPTED',
      title: `${myData.displayName || 'Wojownik'} przyjął Twoją lagę! 🔥`,
      body:  data.lagaLabel,
      url:   'index.html#lagas',
    }).catch(() => {});

    showToast(`🔥 Laga przyjęta! +${XP_LAGA_ACCEPT} XP`, 'success', 3000);

  } else if (response === 'declined') {
    createNotification(data.senderId, {
      type:  'LAGA_DECLINED',
      title: `${myData.displayName || 'Wojownik'} odrzucił Twoją lagę`,
      body:  data.lagaLabel,
      url:   'index.html',
    }).catch(() => {});

    showToast('Laga odrzucona.', 'info');
  }
}


// ════════════════════════════════════════════════════════════
// REPLY WITH LAGA (odpowiedz lagą)
// ════════════════════════════════════════════════════════════

export async function replyWithLaga(originalLagaId, myUid, myData, targetUser, lagaTypeId, message = '') {
  // Oznacz oryginalną jako replied
  await updateDoc(doc(db, COL_LAGA_INVITES, originalLagaId), {
    status:      'replied',
    respondedAt: serverTimestamp(),
  });

  // Wyślij nową lagę
  const newId = await sendLaga(myUid, myData, targetUser, lagaTypeId, message);

  // XP
  awardXP(myUid, { xp: XP_LAGA_REPLY, label: 'Odpowiedź lagą' }).catch(() => {});

  createNotification(targetUser.uid, {
    type:  'LAGA_REPLY',
    title: `${myData.displayName || 'Wojownik'} odpowiedział lagą! ⚔️`,
    body:  message || 'Odpowiedź na Twoją lagę',
    url:   'index.html#lagas',
  }).catch(() => {});

  showToast(`⚔️ Odpowiedź lagą! +${XP_LAGA_REPLY} XP`, 'success', 3000);
  return newId;
}


// ════════════════════════════════════════════════════════════
// LISTEN PENDING LAGAS
// ════════════════════════════════════════════════════════════

export function listenPendingLagas(uid, callback) {
  if (!uid) return () => {};

  const q = query(
    collection(db, COL_LAGA_INVITES),
    where('receiverId', '==', uid),
    where('status',     '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(20),
  );

  return onSnapshot(q, snap => {
    const lagas = [];
    snap.forEach(d => lagas.push({ id: d.id, ...d.data() }));
    callback(lagas);
  }, err => console.warn('[listenPendingLagas]', err.code));
}


// ════════════════════════════════════════════════════════════
// GET COUNT
// ════════════════════════════════════════════════════════════

export async function getLagaCount(uid) {
  if (!uid) return 0;
  try {
    const snap = await getDocs(query(
      collection(db, COL_LAGA_INVITES),
      where('senderId', '==', uid),
    ));
    return snap.size;
  } catch { return 0; }
}


// ════════════════════════════════════════════════════════════
// MODAL — GŁÓWNA FUNKCJA
// ════════════════════════════════════════════════════════════

export function openLagaModal(myUid, myData) {
  if (!myUid) { showToast('Musisz być zalogowany.', 'error'); return; }
  document.getElementById('laga-modal-root')?.remove();
  _injectStyles();

  const root = document.createElement('div');
  root.id = 'laga-modal-root';

  root.innerHTML = `
    <div class="laga-overlay" id="laga-overlay">
      <div class="laga-modal" role="dialog" aria-modal="true" aria-label="Zrób Lagę">
        <div class="laga-handle"></div>

        <!-- Header -->
        <div class="laga-header">
          <div class="laga-title">🔥 Zrób Lagę</div>
          <button class="laga-close" id="laga-close-btn" aria-label="Zamknij">✕</button>
        </div>

        <!-- Steps indicator -->
        <div class="laga-steps">
          <div class="laga-step active" data-step="1">1 Wojownik</div>
          <div class="laga-step-sep">→</div>
          <div class="laga-step" data-step="2">2 Rodzaj</div>
          <div class="laga-step-sep">→</div>
          <div class="laga-step" data-step="3">3 Wyślij</div>
        </div>

        <!-- STEP 1: Choose user -->
        <div class="laga-step-content" id="laga-step-1">
          <div class="laga-step-label">Wybierz wojownika</div>
          <input type="search" id="laga-user-search" placeholder="🔍 Szukaj po nicku..."
            autocomplete="off" spellcheck="false" maxlength="40"/>
          <div class="laga-users-list" id="laga-users-list">
            <div class="laga-loading">Ładowanie wojowników…</div>
          </div>
        </div>

        <!-- STEP 2: Choose type -->
        <div class="laga-step-content hidden" id="laga-step-2">
          <div class="laga-step-label">Wybierz rodzaj lagi</div>
          <div id="laga-selected-user" class="laga-selected-user"></div>
          <div class="laga-types-grid" id="laga-types-grid">
            ${LAGA_TYPES.map(t => `
              <button class="laga-type-btn" data-id="${t.id}">
                <span class="laga-type-emoji">${t.emoji}</span>
                <span class="laga-type-label">${t.label}</span>
                <span class="laga-type-desc">${t.desc}</span>
              </button>`).join('')}
          </div>
        </div>

        <!-- STEP 3: Message + Send -->
        <div class="laga-step-content hidden" id="laga-step-3">
          <div class="laga-step-label">Dodaj wiadomość (opcjonalnie)</div>
          <div class="laga-preview" id="laga-preview"></div>
          <textarea id="laga-message" placeholder="Masz 24h żeby udowodnić że nie jesteś hydra…"
            maxlength="200" rows="3"></textarea>
          <div class="laga-char-count"><span id="laga-char">0</span>/200</div>
          <button class="laga-send-btn" id="laga-send-btn">🔥 Rzuć Lagę!</button>
        </div>

        <!-- Back button -->
        <button class="laga-back-btn hidden" id="laga-back-btn">← Wróć</button>
      </div>
    </div>`;

  document.body.appendChild(root);

  // ── State ──────────────────────────────────────────────────
  let step       = 1;
  let selUser    = null;
  let selType    = null;
  let allUsers   = [];
  let searchQ    = '';

  const steps    = [null,
    root.querySelector('#laga-step-1'),
    root.querySelector('#laga-step-2'),
    root.querySelector('#laga-step-3'),
  ];

  function goStep(n) {
    step = n;
    steps.forEach((el, i) => { if (el) el.classList.toggle('hidden', i !== n); });
    root.querySelectorAll('.laga-step').forEach(el => el.classList.toggle('active', Number(el.dataset.step) === n));
    root.querySelector('#laga-back-btn').classList.toggle('hidden', n === 1);
  }

  // ── Load users ────────────────────────────────────────────
  const { db: _db, COL: _COL } = { db, COL };
  const { getDocs: _getDocs, collection: _col, query: _q, orderBy: _ord, limit: _lim }
    = { getDocs, collection, query, orderBy, limit };

  async function loadUsers() {
    try {
      const snap = await getDocs(query(
        collection(db, COL.USERS),
        orderBy('points','desc'),
        limit(50),
      ));
      allUsers = [];
      snap.forEach(d => { if (d.id !== myUid) allUsers.push({ uid: d.id, ...d.data() }); });
      renderUsers();
    } catch(e) {
      root.querySelector('#laga-users-list').innerHTML = `<div class="laga-empty">Błąd: ${e.code}</div>`;
    }
  }

  function renderUsers() {
    const list = root.querySelector('#laga-users-list');
    const q    = searchQ.toLowerCase();
    const filtered = q
      ? allUsers.filter(u => (u.displayName||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q))
      : allUsers;

    if (!filtered.length) {
      list.innerHTML = `<div class="laga-empty">Brak wyników</div>`;
      return;
    }

    list.innerHTML = '';
    filtered.slice(0, 20).forEach(u => {
      const ini = (u.displayName||'?')[0].toUpperCase();
      const row = document.createElement('div');
      row.className = 'laga-user-row' + (selUser?.uid === u.uid ? ' selected' : '');
      row.innerHTML = `
        <div class="laga-user-av">
          ${u.photoURL ? `<img src="${_esc(u.photoURL)}" alt="Av" onerror="this.parentElement.textContent='${ini}'"/>` : ini}
        </div>
        <div class="laga-user-info">
          <div class="laga-user-name">${_esc(u.displayName||'Wojownik')}</div>
          <div class="laga-user-sub">Poz. ${Math.max(1, Math.floor((u.points||0)/100)+1)} · ${(u.points||0).toLocaleString('pl-PL')} XP</div>
        </div>
        ${selUser?.uid === u.uid ? '<div class="laga-check">✓</div>' : ''}`;
      row.addEventListener('click', () => {
        selUser = u;
        renderUsers();
        // Auto-advance to step 2
        _showSelectedUser();
        goStep(2);
      });
      list.appendChild(row);
    });
  }

  function _showSelectedUser() {
    const el = root.querySelector('#laga-selected-user');
    if (!el || !selUser) return;
    const ini = (selUser.displayName||'?')[0].toUpperCase();
    el.innerHTML = `
      <div class="laga-user-av" style="width:30px;height:30px;font-size:.6875rem;">
        ${selUser.photoURL ? `<img src="${_esc(selUser.photoURL)}" alt="Av" onerror="this.parentElement.textContent='${ini}'"/>` : ini}
      </div>
      <span style="font-size:.875rem;font-weight:600;color:var(--text-primary);">${_esc(selUser.displayName||'Wojownik')}</span>`;
  }

  // ── Events ────────────────────────────────────────────────
  root.querySelector('#laga-close-btn').addEventListener('click', () => root.remove());
  root.querySelector('#laga-overlay').addEventListener('click', e => { if (e.target === root.querySelector('#laga-overlay')) root.remove(); });
  root.querySelector('#laga-back-btn').addEventListener('click', () => goStep(Math.max(1, step - 1)));

  root.querySelector('#laga-user-search').addEventListener('input', e => {
    searchQ = e.target.value.trim();
    renderUsers();
  });

  root.querySelectorAll('.laga-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selType = btn.dataset.id;
      root.querySelectorAll('.laga-type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      // Show preview + advance
      _showPreview();
      goStep(3);
    });
  });

  function _showPreview() {
    const el = root.querySelector('#laga-preview');
    if (!el || !selUser || !selType) return;
    const lt = LAGA_TYPES.find(t => t.id === selType);
    el.innerHTML = `
      <span class="laga-preview-emoji">${lt?.emoji}</span>
      <span><strong>${_esc(myData.displayName||'Ty')}</strong> → <strong>${_esc(selUser.displayName)}</strong>: ${lt?.label}</span>`;
  }

  root.querySelector('#laga-message').addEventListener('input', e => {
    root.querySelector('#laga-char').textContent = e.target.value.length;
  });

  root.querySelector('#laga-send-btn').addEventListener('click', async () => {
    if (!selUser || !selType) { showToast('Wybierz wojownika i rodzaj lagi!', 'error'); return; }
    const msg = root.querySelector('#laga-message').value.trim();
    const btn = root.querySelector('#laga-send-btn');
    btn.disabled = true; btn.textContent = 'Wysyłam…';
    try {
      await sendLaga(myUid, myData, selUser, selType, msg);
      root.remove();
    } catch(e) {
      btn.disabled = false; btn.textContent = '🔥 Rzuć Lagę!';
      showToast('Błąd: ' + (e.message || e.code), 'error');
    }
  });

  // Init
  loadUsers();
}


// ════════════════════════════════════════════════════════════
// INJECT GLOBAL LAGA BUTTON
// ════════════════════════════════════════════════════════════

export function injectLagaButton(containerEl, myUid, myData) {
  if (!containerEl) return;
  _injectStyles();

  const btn = document.createElement('button');
  btn.className = 'laga-global-btn';
  btn.innerHTML = '🔥 Zrób Lagę';
  btn.title     = 'Rzuć lagę wojownikowi';
  btn.addEventListener('click', () => openLagaModal(myUid, myData));
  containerEl.appendChild(btn);
}


// ════════════════════════════════════════════════════════════
// BUILD LAGA CARD — do feedu i skrzynki
// ════════════════════════════════════════════════════════════

export function buildLagaCard(laga, myUid, myData = {}) {
  const card = document.createElement('div');
  card.className = 'laga-card';
  card.dataset.lagaId = laga.id;

  const isReceiver = laga.receiverId === myUid;
  const isSender   = laga.senderId   === myUid;
  const sIni = (laga.senderName  ||'?')[0].toUpperCase();
  const rIni = (laga.receiverName||'?')[0].toUpperCase();

  const statusBadge = {
    pending:  `<span class="laga-status pending">⏳ Oczekuje</span>`,
    accepted: `<span class="laga-status accepted">✅ Przyjęta</span>`,
    declined: `<span class="laga-status declined">❌ Odrzucona</span>`,
    replied:  `<span class="laga-status replied">⚔️ Odpowiedziano</span>`,
  }[laga.status] || '';

  card.innerHTML = `
    <div class="laga-card-header">
      <span class="laga-card-emoji">${laga.lagaEmoji || '🔥'}</span>
      <div class="laga-card-meta">
        <div class="laga-card-label">${_esc(laga.lagaLabel || 'Laga')}</div>
        <div class="laga-card-sub">
          <span class="laga-card-from">${_esc(laga.senderName||'?')}</span>
          →
          <span class="laga-card-to">${_esc(laga.receiverName||'?')}</span>
        </div>
      </div>
      ${statusBadge}
    </div>
    ${laga.message ? `<div class="laga-card-msg">"${_esc(laga.message)}"</div>` : ''}
    ${laga.status === 'pending' && isReceiver ? `
      <div class="laga-card-actions">
        <button class="laga-accept-btn">✅ Przyjmuję</button>
        <button class="laga-decline-btn">❌ Odrzucam</button>
        <button class="laga-reply-btn">⚔️ Odpowiedz Lagą</button>
      </div>` : ''}`;

  if (laga.status === 'pending' && isReceiver) {
    card.querySelector('.laga-accept-btn')?.addEventListener('click', async () => {
      try { await respondToLaga(laga.id, 'accepted', myUid, myData); }
      catch(e) { showToast(e.message, 'error'); }
    });
    card.querySelector('.laga-decline-btn')?.addEventListener('click', async () => {
      try { await respondToLaga(laga.id, 'declined', myUid, myData); }
      catch(e) { showToast(e.message, 'error'); }
    });
    card.querySelector('.laga-reply-btn')?.addEventListener('click', () => {
      // Otwórz modal z pre-selected userze (sender staje się targetem)
      openLagaModal(myUid, myData);
    });
  }

  return card;
}


// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

let _stylesInjected = false;
function _injectStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;

  const s = document.createElement('style');
  s.id = 'laga-styles';
  s.textContent = `
/* ── Overlay ── */
.laga-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: fadeIn .2s ease;
}
@media (min-width: 480px) {
  .laga-overlay { align-items: center; }
}

/* ── Modal ── */
.laga-modal {
  background: var(--bg-panel, #131722);
  border: 1px solid var(--border-light, #354055);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 88svh;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: slideUp .3s var(--ease-out, cubic-bezier(0.16,1,0.3,1));
}
@media (min-width: 480px) { .laga-modal { border-radius: 20px; max-height: 90svh; } }

.laga-handle {
  width: 36px; height: 4px;
  background: var(--border-light, #354055);
  border-radius: 2px;
  margin: .75rem auto .25rem;
  flex-shrink: 0;
}
@media (min-width: 480px) { .laga-handle { display: none; } }

.laga-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .625rem 1rem;
  border-bottom: 1px solid var(--border, #2A3140);
  flex-shrink: 0;
}
.laga-title { font-size: 1.0625rem; font-weight: 800; color: var(--text-primary, #fff); }
.laga-close {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-elevated, #1E2535); border: none;
  color: var(--text-muted, #6B7688); cursor: pointer; font-size: .875rem;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s ease;
}
.laga-close:hover { background: var(--border, #2A3140); color: var(--text-primary, #fff); }

/* ── Steps ── */
.laga-steps {
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .625rem 1rem .5rem; flex-shrink: 0;
}
.laga-step {
  font-size: .6875rem; font-weight: 600;
  color: var(--text-muted, #6B7688);
  padding: .2rem .625rem; border-radius: 9999px;
  background: transparent; border: 1px solid transparent;
  transition: all .15s ease;
}
.laga-step.active {
  color: #fff;
  background: linear-gradient(135deg, #8A9AB0, #C8D8E8);
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(168,184,200,.3);
}
.laga-step-sep { font-size: .6875rem; color: var(--text-faint, #3D4659); }

/* ── Step content ── */
.laga-step-content {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: .75rem 1rem 1rem;
  display: flex; flex-direction: column; gap: .625rem;
}
.laga-step-content.hidden { display: none; }

.laga-step-label {
  font-size: .75rem; font-weight: 700;
  color: var(--text-secondary, #B0B7C3);
  text-transform: uppercase; letter-spacing: .04em;
  margin-bottom: .125rem;
}

/* ── User search ── */
#laga-user-search {
  width: 100%;
  background: var(--bg-input, #0F1219);
  border: 1px solid var(--border, #2A3140);
  border-radius: 10px;
  color: var(--text-primary, #fff);
  font-size: 1rem; /* prevent iOS zoom */
  padding: .5625rem .875rem;
  outline: none;
  -webkit-appearance: none;
  transition: border-color .15s ease;
  box-sizing: border-box;
}
#laga-user-search:focus { border-color: #A8B8C8; }

/* ── Users list ── */
.laga-users-list {
  display: flex; flex-direction: column; gap: .375rem;
  max-height: 280px; overflow-y: auto; -webkit-overflow-scrolling: touch;
}
.laga-user-row {
  display: flex; align-items: center; gap: .625rem;
  padding: .5625rem .625rem;
  background: var(--bg-elevated, #1E2535);
  border: 1px solid var(--border, #2A3140);
  border-radius: 10px; cursor: pointer;
  transition: all .12s ease;
}
.laga-user-row:hover { border-color: #A8B8C8; background: var(--bg-card, #1A2030); }
.laga-user-row.selected { border-color: #C8D8E8; background: rgba(200,216,232,.06); }
.laga-user-av {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--bg-card, #1A2030);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .875rem; color: var(--text-secondary, #B0B7C3);
  overflow: hidden; flex-shrink: 0;
  border: 1.5px solid var(--border-light, #354055);
}
.laga-user-av img { width:100%;height:100%;object-fit:cover; }
.laga-user-info { flex: 1; min-width: 0; }
.laga-user-name { font-size: .9375rem; font-weight: 600; color: var(--text-primary, #fff); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.laga-user-sub  { font-size: .6875rem; color: var(--text-muted, #6B7688); }
.laga-check     { color: #C8D8E8; font-weight: 700; }

/* ── Types grid ── */
.laga-types-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.laga-type-btn {
  display: flex; flex-direction: column; align-items: center; gap: .25rem;
  padding: .75rem .5rem;
  background: var(--bg-elevated, #1E2535);
  border: 1.5px solid var(--border, #2A3140);
  border-radius: 12px; cursor: pointer;
  transition: all .12s ease; text-align: center;
}
.laga-type-btn:hover { border-color: #A8B8C8; transform: translateY(-1px); }
.laga-type-btn.selected {
  border-color: #C8D8E8;
  background: rgba(200,216,232,.08);
  box-shadow: 0 0 0 3px rgba(200,216,232,.12);
}
.laga-type-emoji { font-size: 1.75rem; line-height: 1; }
.laga-type-label { font-size: .75rem; font-weight: 700; color: var(--text-primary, #fff); line-height: 1.2; }
.laga-type-desc  { font-size: .6rem;  color: var(--text-muted, #6B7688); line-height: 1.3; }

/* ── Selected user pill ── */
.laga-selected-user {
  display: flex; align-items: center; gap: .5rem;
  background: rgba(200,216,232,.06);
  border: 1px solid rgba(200,216,232,.18);
  border-radius: 9999px; padding: .375rem .75rem;
  margin-bottom: .25rem; align-self: flex-start;
}

/* ── Preview ── */
.laga-preview {
  display: flex; align-items: center; gap: .625rem;
  background: rgba(200,216,232,.06);
  border: 1px solid rgba(200,216,232,.18);
  border-radius: 10px; padding: .625rem .875rem;
  font-size: .875rem; color: var(--text-secondary, #B0B7C3);
}
.laga-preview-emoji { font-size: 1.375rem; flex-shrink: 0; }

/* ── Message textarea ── */
#laga-message {
  width: 100%; box-sizing: border-box;
  background: var(--bg-input, #0F1219);
  border: 1px solid var(--border, #2A3140);
  border-radius: 10px; color: var(--text-primary, #fff);
  font-size: 1rem; font-family: inherit;
  padding: .625rem .875rem; resize: none; outline: none;
  -webkit-appearance: none;
  transition: border-color .15s ease;
}
#laga-message:focus { border-color: #A8B8C8; }
.laga-char-count { font-size: .6875rem; color: var(--text-muted, #6B7688); text-align: right; }

/* ── Send button ── */
.laga-send-btn {
  width: 100%; padding: .875rem;
  background: linear-gradient(135deg, #8A9AB0 0%, #C8D8E8 40%, #A8B8C8 100%);
  border: none; border-radius: 12px;
  font-size: 1rem; font-weight: 800;
  color: #0B0D12; cursor: pointer;
  transition: all .15s ease;
  box-shadow: 0 2px 12px rgba(168,184,200,.35),
              0 1px 2px rgba(255,255,255,.15) inset;
}
.laga-send-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
.laga-send-btn:active { transform: scale(.97); }
.laga-send-btn:disabled { opacity: .6; pointer-events: none; }

/* ── Back button ── */
.laga-back-btn {
  background: none; border: none; cursor: pointer;
  font-size: .8125rem; font-weight: 600;
  color: var(--text-muted, #6B7688);
  padding: .5rem 1rem;
  flex-shrink: 0; text-align: left;
  transition: color .15s ease;
}
.laga-back-btn:hover { color: var(--text-primary, #fff); }
.laga-back-btn.hidden { display: none; }

/* ── Loading / empty ── */
.laga-loading, .laga-empty {
  text-align: center; padding: 1.5rem 1rem;
  font-size: .875rem; color: var(--text-muted, #6B7688);
}

/* ── Global laga button ── */
.laga-global-btn {
  display: inline-flex; align-items: center; gap: .375rem;
  padding: .625rem 1.25rem;
  background: linear-gradient(135deg, #8A9AB0 0%, #C8D8E8 35%, #A8B8C8 100%);
  border: none; border-radius: 9999px;
  font-size: .875rem; font-weight: 800;
  color: #0B0D12; cursor: pointer;
  transition: all .15s ease;
  box-shadow: 0 2px 8px rgba(168,184,200,.3), 0 1px 2px rgba(255,255,255,.15) inset;
  white-space: nowrap;
}
.laga-global-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
.laga-global-btn:active { transform: scale(.97); }

/* ── Feed card ── */
.laga-card {
  background: var(--bg-panel, #131722);
  border: 1px solid rgba(200,216,232,.2);
  border-radius: 12px; padding: .875rem;
  transition: border-color .15s ease;
}
.laga-card:hover { border-color: rgba(200,216,232,.35); }
.laga-card-header {
  display: flex; align-items: center; gap: .625rem;
  margin-bottom: .5rem;
}
.laga-card-emoji { font-size: 1.375rem; flex-shrink: 0; }
.laga-card-meta  { flex: 1; min-width: 0; }
.laga-card-label { font-size: .875rem; font-weight: 700; color: var(--text-primary, #fff); }
.laga-card-sub   { font-size: .75rem; color: var(--text-muted, #6B7688); margin-top: .125rem; }
.laga-card-from, .laga-card-to { color: #C8D8E8; font-weight: 600; }
.laga-card-msg {
  font-size: .875rem; color: var(--text-secondary, #B0B7C3);
  font-style: italic; padding: .375rem .5rem;
  background: rgba(255,255,255,.03); border-radius: 6px;
  margin-bottom: .5rem;
}
.laga-card-actions { display: flex; gap: .375rem; flex-wrap: wrap; }
.laga-accept-btn, .laga-decline-btn, .laga-reply-btn {
  flex: 1; min-width: 80px; padding: .5rem .625rem;
  border-radius: 8px; font-size: .75rem; font-weight: 700;
  cursor: pointer; transition: all .12s ease; border: none;
}
.laga-accept-btn  { background: rgba(34,197,94,.12);  color: #22C55E; border: 1px solid rgba(34,197,94,.25); }
.laga-accept-btn:hover  { background: rgba(34,197,94,.2); }
.laga-decline-btn { background: rgba(239,68,68,.08);  color: #EF4444; border: 1px solid rgba(239,68,68,.2); }
.laga-decline-btn:hover { background: rgba(239,68,68,.15); }
.laga-reply-btn   { background: rgba(200,216,232,.08); color: #C8D8E8; border: 1px solid rgba(200,216,232,.2); }
.laga-reply-btn:hover   { background: rgba(200,216,232,.15); }

/* ── Status badges ── */
.laga-status { font-size: .625rem; font-weight: 700; padding: 2px 7px; border-radius: 9999px; white-space: nowrap; }
.laga-status.pending  { background: rgba(245,158,11,.12); color: #F59E0B; }
.laga-status.accepted { background: rgba(34,197,94,.12);  color: #22C55E; }
.laga-status.declined { background: rgba(239,68,68,.1);   color: #EF4444; }
.laga-status.replied  { background: rgba(200,216,232,.1);  color: #C8D8E8; }
`;
  document.head.appendChild(s);
}

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
