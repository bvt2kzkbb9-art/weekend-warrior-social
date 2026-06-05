/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — duels.js
 * System Rzucania Wyzwań Między Użytkownikami
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Kolekcja Firestore: duels/{id}
 * {
 *   challengerId, challengerName, challengerPhoto,
 *   targetId, targetName,
 *   challengeId, challengeTitle, challengeEmoji, challengeXP,
 *   status: 'pending' | 'accepted' | 'rejected' | 'completed',
 *   expiresAt, createdAt
 * }
 *
 * Eksporty:
 *   initDuels(user, userData)     — start nasłuchu przychodzących
 *   openSendDuelModal(challenges) — modal wyboru wyzwania + celu
 *   destroyDuels()                — cleanup
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, addDoc, updateDoc, getDocs,
  onSnapshot, query, where, serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ── State ─────────────────────────────────────────────────
let _user        = null;
let _userData    = null;
let _unsub       = null;


// ════════════════════════════════════════════════════════════
// INIT — nasłuch przychodzących dueli
// ════════════════════════════════════════════════════════════

export function initDuels(user, userData) {
  _user     = user;
  _userData = userData;

  if (!user?.uid) return;
  if (_unsub) { _unsub(); _unsub = null; }

  const q = query(
    collection(db, 'duels'),
    where('targetId', '==', user.uid),
    where('status',   '==', 'pending'),
  );

  _unsub = onSnapshot(q, snap => {
    const incoming = [];
    snap.forEach(d => incoming.push({ id: d.id, ...d.data() }));
    _renderIncoming(incoming);
  }, err => {
    console.warn('[duels] onSnapshot error:', err.code, err.message);
  });
}

export function destroyDuels() {
  if (_unsub) { _unsub(); _unsub = null; }
}


// ════════════════════════════════════════════════════════════
// WYSYŁANIE WYZWANIA
// Modal: wybór wyzwania → wybór użytkownika → wyślij
// ════════════════════════════════════════════════════════════

/**
 * @param {Array} challengesList — lista wyzwań z id (z CHALLENGES lub Firestore)
 */
export async function openSendDuelModal(challengesList) {
  if (!_user) { showToast('Musisz być zalogowany.', 'error'); return; }

  // Usuń poprzedni modal jeśli istnieje
  document.getElementById('duel-send-modal-root')?.remove();

  // Pobierz użytkowników
  let users = [];
  try {
    const snap = await getDocs(collection(db, COL.USERS));
    snap.forEach(d => {
      if (d.id !== _user.uid) {
        users.push({ uid: d.id, ...d.data() });
      }
    });
  } catch (err) {
    showToast('Błąd pobierania wojowników: ' + err.code, 'error');
    return;
  }

  if (users.length === 0) {
    showToast('Brak innych wojowników na arenie. Zaproś znajomych! 🛡️', 'info', 5000);
    return;
  }

  // Upewnij się że challengesList ma poprawne id
  const validChallenges = challengesList.filter(c => c && c.id);
  if (validChallenges.length === 0) {
    showToast('Ładowanie wyzwań... Spróbuj za chwilę.', 'info');
    return;
  }

  _renderSendModal(validChallenges, users);
}


// ── Render modal wysyłania ────────────────────────────────
function _renderSendModal(challenges, users) {
  const root = document.createElement('div');
  root.id    = 'duel-send-modal-root';

  // Domyślnie wybrane pierwsze wyzwanie i pierwszy użytkownik
  let selectedChIdx = 0;
  let selectedUser  = users[0];

  const challengeOptions = challenges.map((ch, i) =>
    `<option value="${i}">${ch.badge ?? '⚔️'} ${_esc(ch.title)} (+${ch.xp} XP)</option>`
  ).join('');

  root.innerHTML = `
    <div id="duel-send-backdrop" style="
      position:fixed;inset:0;z-index:400;
      background:rgba(0,0,0,0.88);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      display:flex;align-items:center;justify-content:center;
      padding:1.25rem;
      animation:fadeIn .2s ease both;
    ">
      <div style="
        background:#0E0F12;
        border:1px solid rgba(212,175,55,0.3);
        border-radius:20px;
        padding:1.75rem 1.5rem;
        width:100%;max-width:420px;
        max-height:90vh;overflow-y:auto;
        animation:slideUp .3s ease both;
        position:relative;
      ">

        <!-- Nagłówek -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:1.25rem;
                        font-weight:800;color:#D4AF37;text-transform:uppercase;
                        letter-spacing:.05em;">⚔️ Rzuć Wyzwanie</div>
            <div style="font-size:.8125rem;color:#8A7E6A;margin-top:.125rem;">
              Wybierz wyzwanie i wojownika
            </div>
          </div>
          <button id="duel-modal-close" style="
            background:none;border:none;color:#4E5464;
            cursor:pointer;font-size:1.25rem;padding:.25rem;
            line-height:1;
          ">✕</button>
        </div>

        <!-- Wybór wyzwania -->
        <div style="margin-bottom:1rem;">
          <label style="font-size:.75rem;font-weight:700;color:#8A7E6A;
                         letter-spacing:.08em;text-transform:uppercase;
                         display:block;margin-bottom:.5rem;">
            Wyzwanie
          </label>
          <select id="duel-challenge-select" style="
            width:100%;background:#121317;
            border:1px solid rgba(212,175,55,0.2);
            border-radius:10px;padding:.75rem 1rem;
            color:#E8E0D0;font-size:.9375rem;
            font-family:'Inter',sans-serif;
            outline:none;cursor:pointer;
            -webkit-appearance:none;appearance:none;
          ">
            ${challengeOptions}
          </select>
        </div>

        <!-- Podgląd wybranego wyzwania -->
        <div id="duel-ch-preview" style="
          background:rgba(212,175,55,0.06);
          border:1px solid rgba(212,175,55,0.15);
          border-radius:12px;padding:.875rem 1rem;
          margin-bottom:1.25rem;
        "></div>

        <!-- Wybór użytkownika -->
        <div style="margin-bottom:1rem;">
          <label style="font-size:.75rem;font-weight:700;color:#8A7E6A;
                         letter-spacing:.08em;text-transform:uppercase;
                         display:block;margin-bottom:.5rem;">
            Wojownik (${users.length})
          </label>
          <div id="duel-users-list" style="
            max-height:200px;overflow-y:auto;
            border:1px solid rgba(212,175,55,0.12);
            border-radius:12px;
          "></div>
        </div>

        <!-- Wybrany cel -->
        <div id="duel-target-info" style="
          background:rgba(212,175,55,0.05);
          border:1px solid rgba(212,175,55,0.1);
          border-radius:10px;padding:.625rem .875rem;
          font-size:.8125rem;color:#B8A87A;
          margin-bottom:1.25rem;
          display:flex;align-items:center;gap:.5rem;
        ">
          <span>🎯</span>
          <span id="duel-target-text">Wybierz wojownika powyżej</span>
        </div>

        <!-- Przycisk wysłania -->
        <button id="duel-send-btn" style="
          width:100%;padding:.9375rem;
          background:linear-gradient(135deg,#D4AF37,#A88B28);
          border:none;border-radius:14px;
          color:#000;font-family:'Rajdhani',sans-serif;
          font-size:1rem;font-weight:800;
          letter-spacing:.05em;text-transform:uppercase;
          cursor:pointer;transition:all .2s ease;
          position:relative;
        ">
          ⚔️ Rzuć Wyzwanie!
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Wypełnij podgląd i listę użytkowników
  const updatePreview = () => {
    const ch  = challenges[selectedChIdx];
    const pre = document.getElementById('duel-ch-preview');
    if (!pre || !ch) return;
    pre.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;">
        <div style="font-size:1.75rem;flex-shrink:0;">${ch.badge ?? '⚔️'}</div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:1rem;
                      font-weight:700;color:#D4AF37;text-transform:uppercase;">
            ${_esc(ch.title)}
          </div>
          <div style="font-size:.8125rem;color:#8A7E6A;margin-top:.125rem;">
            ${_esc(ch.desc ?? ch.task ?? '')}
          </div>
          <div style="font-size:.75rem;color:#D4AF37;font-weight:700;margin-top:.25rem;">
            +${ch.xp} XP · ${ch.difficulty ?? 'medium'}
          </div>
        </div>
      </div>
    `;
  };

  const renderUsers = () => {
    const list = document.getElementById('duel-users-list');
    if (!list) return;
    list.innerHTML = '';
    users.forEach(u => {
      const isSelected = u.uid === selectedUser?.uid;
      const initials   = (u.displayName || '?')[0].toUpperCase();
      const item       = document.createElement('div');
      item.style.cssText = `
        display:flex;align-items:center;gap:.75rem;
        padding:.75rem 1rem;cursor:pointer;
        border-bottom:1px solid rgba(255,255,255,0.04);
        background:${isSelected ? 'rgba(212,175,55,0.1)' : 'transparent'};
        border-left:${isSelected ? '3px solid #D4AF37' : '3px solid transparent'};
        transition:background .15s ease;
      `;

      const avatarHTML = u.photoURL
        ? `<img src="${_esc(u.photoURL)}" alt="Avatar"
               style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
               onerror="this.parentElement.textContent='${initials}'" />`
        : initials;

      item.innerHTML = `
        <div style="
          width:36px;height:36px;border-radius:50%;flex-shrink:0;
          background:#1A1C22;border:1px solid rgba(212,175,55,${isSelected?'0.4':'0.15'});
          display:flex;align-items:center;justify-content:center;
          font-family:'Rajdhani',sans-serif;font-weight:700;
          font-size:.875rem;color:#D4AF37;overflow:hidden;
        ">${avatarHTML}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.875rem;font-weight:600;
                      color:${isSelected?'#D4AF37':'#E8E0D0'};">
            ${_esc(u.displayName || 'Wojownik')}
          </div>
          <div style="font-size:.6875rem;color:#8A7E6A;margin-top:.1rem;">
            ${u.rank || 'Rookie'} · ${(u.points || 0).toLocaleString('pl-PL')} XP
          </div>
        </div>
        ${isSelected ? '<div style="color:#D4AF37;font-size:1rem;">✓</div>' : ''}
      `;

      item.addEventListener('click', () => {
        selectedUser = u;
        renderUsers();
        const targetText = document.getElementById('duel-target-text');
        if (targetText) targetText.textContent =
          `${u.displayName || 'Wojownik'} zostanie wyzwany`;
      });

      list.appendChild(item);
    });
  };

  updatePreview();
  renderUsers();

  // Aktualizuj podgląd wyzwania
  document.getElementById('duel-challenge-select')?.addEventListener('change', e => {
    selectedChIdx = parseInt(e.target.value) || 0;
    updatePreview();
  });

  // Zamknij
  const close = () => root.remove();
  document.getElementById('duel-modal-close')?.addEventListener('click', close);
  document.getElementById('duel-send-backdrop')?.addEventListener('click', e => {
    if (e.target.id === 'duel-send-backdrop') close();
  });

  // Wyślij
  document.getElementById('duel-send-btn')?.addEventListener('click', async () => {
    const ch  = challenges[selectedChIdx];
    const btn = document.getElementById('duel-send-btn');

    if (!selectedUser) {
      showToast('Wybierz wojownika!', 'error'); return;
    }
    if (!ch?.id) {
      showToast('Błąd: wyzwanie nie ma ID. Odśwież stronę.', 'error'); return;
    }

    // Loading state
    btn.disabled     = true;
    btn.textContent  = 'Wysyłam...';
    btn.style.background = 'rgba(212,175,55,0.3)';

    try {
      await _sendDuel(selectedUser, ch);
      close();
    } catch (err) {
      btn.disabled    = false;
      btn.textContent = '⚔️ Rzuć Wyzwanie!';
      btn.style.background = 'linear-gradient(135deg,#D4AF37,#A88B28)';
    }
  });
}


// ── Wysyłanie do Firestore ────────────────────────────────
async function _sendDuel(targetUser, ch) {
  const TAG = '[_sendDuel]';

  console.log(TAG, {
    challenger: _user.uid,
    target:     targetUser.uid,
    challenge:  ch.id,
    xp:         ch.xp,
  });

  const duelData = {
    challengerId:   _user.uid,
    challengerName: _userData?.displayName || _user.displayName || 'Wojownik',
    challengerPhoto:_userData?.photoURL    || _user.photoURL    || '',
    targetId:       targetUser.uid,
    targetName:     targetUser.displayName || 'Wojownik',
    challengeId:    ch.id,
    challengeTitle: ch.title,
    challengeEmoji: ch.badge ?? '⚔️',
    challengeXP:    ch.xp,
    status:         'pending',
    expiresAt:      Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    ),
    createdAt:      serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'duels'), duelData);
  console.log(TAG, '✅ Duel wysłany, id:', ref.id);

  // Powiadomienie dla celu
  createNotification(targetUser.uid, {
    type:  'duel',
    title: `${duelData.challengerName} rzuca Ci wyzwanie! ⚔️`,
    body:  `"${ch.title}" · +${ch.xp} XP · Masz 24h`,
    url:   'challenges.html',
  }).catch(() => {});

  showToast(
    `⚔️ Wyzwanie rzucone! ${targetUser.displayName || 'Wojownik'} ma 24h na odpowiedź.`,
    'success', 5000
  );
}


// ════════════════════════════════════════════════════════════
// ODBIÓR WYZWAŃ — render bannera przychodzących dueli
// ════════════════════════════════════════════════════════════

function _renderIncoming(duels) {
  const container = document.getElementById('ch-incoming');
  const list      = document.getElementById('ch-duels-list');
  const countEl   = document.getElementById('ch-duels-count');

  if (!container || !list) return;

  if (duels.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  if (countEl) countEl.textContent = duels.length;

  list.innerHTML = '';

  duels.forEach(duel => {
    const initials = (duel.challengerName || '?')[0].toUpperCase();
    const expiry   = duel.expiresAt?.toDate?.() ?? new Date(Date.now() + 86400000);
    const hoursLeft= Math.max(0, Math.floor((expiry - Date.now()) / 3600000));
    const isUrgent = hoursLeft < 4;

    const item = document.createElement('div');
    item.className = 'ch-duel-item';
    item.innerHTML = `
      <div class="ch-duel-avatar">
        ${duel.challengerPhoto
          ? `<img src="${_esc(duel.challengerPhoto)}" alt="Avatar"
                 style="width:100%;height:100%;object-fit:cover;display:block;"
                 onerror="this.style.display='none'" />`
          : initials}
      </div>
      <div class="ch-duel-info">
        <div class="ch-duel-challenger">
          <span style="color:#D4AF37;">${_esc(duel.challengerName)}</span>
          rzuca wyzwanie:
        </div>
        <div class="ch-duel-challenge-name">
          ${duel.challengeEmoji ?? '⚔️'} "${_esc(duel.challengeTitle)}"
          · +${duel.challengeXP} XP
        </div>
        <div class="ch-duel-timer" style="color:${isUrgent ? '#EF4444' : '#8A7E6A'};">
          ⏳ ${hoursLeft}h pozostało
        </div>
      </div>
      <div class="ch-duel-actions">
        <button class="ch-duel-accept"
                data-id="${duel.id}">
          Walczę!
        </button>
        <button class="ch-duel-reject"
                data-id="${duel.id}">✕</button>
      </div>
    `;

    item.querySelector('.ch-duel-accept')?.addEventListener('click', async e => {
      e.stopPropagation();
      await _acceptDuel(duel);
    });

    item.querySelector('.ch-duel-reject')?.addEventListener('click', async e => {
      e.stopPropagation();
      await _rejectDuel(duel.id);
    });

    list.appendChild(item);
  });
}


// ── Akceptacja / odrzucenie ───────────────────────────────
async function _acceptDuel(duel) {
  try {
    await updateDoc(doc(db, 'duels', duel.id), { status: 'accepted' });
    showToast('⚔️ Wyzwanie podjęte! Do walki!', 'success', 4000);
    _showAcceptedModal(duel);
  } catch (err) {
    showToast('Błąd akceptacji: ' + err.code, 'error');
  }
}

async function _rejectDuel(duelId) {
  try {
    await updateDoc(doc(db, 'duels', duelId), { status: 'rejected' });
    showToast('Wyzwanie odrzucone.', 'info');
  } catch (err) {
    showToast('Błąd: ' + err.code, 'error');
  }
}

function _showAcceptedModal(duel) {
  const root = document.createElement('div');
  root.innerHTML = `
    <div style="
      position:fixed;inset:0;z-index:500;
      background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);
      display:flex;align-items:center;justify-content:center;
      padding:1.5rem;animation:fadeIn .25s ease both;
    " id="duel-accepted-backdrop">
      <div style="
        background:#0E0F12;border:2px solid #D4AF37;border-radius:20px;
        padding:2rem 1.5rem;max-width:360px;width:100%;text-align:center;
        box-shadow:0 0 60px rgba(212,175,55,0.3);
        animation:unlockPop .5s cubic-bezier(.34,1.56,.64,1) both;
      ">
        <div style="font-size:3rem;margin-bottom:.75rem;">
          ${duel.challengeEmoji ?? '⚔️'}
        </div>
        <div style="font-size:.6875rem;font-weight:700;letter-spacing:.15em;
                    text-transform:uppercase;color:#D4AF37;margin-bottom:.5rem;">
          Wyzwanie podjęte!
        </div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:1.25rem;
                    font-weight:800;color:#fff;text-transform:uppercase;margin-bottom:.375rem;">
          ${_esc(duel.challengeTitle)}
        </div>
        <div style="font-size:.875rem;color:#8A7E6A;margin-bottom:1.25rem;font-style:italic;">
          Rzucono przez: ${_esc(duel.challengerName)}<br>
          Masz 24h na ukończenie · +${duel.challengeXP} XP
        </div>
        <button onclick="this.closest('[id=duel-accepted-backdrop]')?.parentElement?.remove()"
                style="
                  width:100%;padding:.875rem;
                  background:linear-gradient(135deg,#D4AF37,#A88B28);
                  border:none;border-radius:12px;color:#000;
                  font-family:'Rajdhani',sans-serif;font-size:1rem;
                  font-weight:800;letter-spacing:.04em;text-transform:uppercase;
                  cursor:pointer;
                ">
          ⚔️ Do walki!
        </button>
        <div style="font-size:.6875rem;color:#4E5464;margin-top:.875rem;">
          Dotknij aby zamknąć
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  document.getElementById('duel-accepted-backdrop')?.addEventListener('click', e => {
    if (e.target.id === 'duel-accepted-backdrop') root.remove();
  });
  setTimeout(() => root?.remove(), 8000);
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
