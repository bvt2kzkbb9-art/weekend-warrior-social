/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — poke.js
 * System zaczepek „Zrób lagę"
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * STRUKTURA FIRESTORE:
 *   pokes/{autoId}
 *     pokerId:      uid — kto zaczepił
 *     pokerName:    string
 *     pokerPhoto:   string
 *     targetId:     uid — kto dostał
 *     createdAt:    Timestamp
 *
 *   users/{uid}.pokeCount         — ile razy dostał (increment)
 *   users/{uid}.lastPokeAt        — ostatnia zaczepka wysłana PRZEZE MNIE (do cooldown)
 *
 * COOLDOWN: 30 minut per para (sprawdzane po stronie klienta + Firestore)
 *
 * EKSPORTY:
 *   sendPoke(myUid, targetUid, myData)   — wyślij zaczepkę
 *   getPokeCount(targetUid)              → number
 *   injectPokeButton(containerEl, myUid, targetUid, myData)
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { createNotification } from './notifications.js';
import { awardXP, XP_ACTIONS } from './xp.js';

import {
  collection, doc, addDoc, getDoc, updateDoc,
  query, where, orderBy, limit, getDocs,
  serverTimestamp, increment, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COL_POKES     = 'pokes';
const COOLDOWN_MS   = 30 * 60 * 1000;   // 30 minut
const POKE_XP       = 1;                // XP za zaczepkę (śmieszne)

// Dźwięk zaczepki — generowany programatycznie (AudioContext, bez pliku)
function _playPokeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Krótki "ding-ding"
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}


// ════════════════════════════════════════════════════════════
// SEND POKE
// ════════════════════════════════════════════════════════════

/**
 * Wysyła zaczepkę do użytkownika.
 *
 * @param {string} myUid
 * @param {string} targetUid
 * @param {object} myData  — { displayName, photoURL }
 * @returns {Promise<{ ok: boolean, cooldownMs?: number }>}
 */
export async function sendPoke(myUid, targetUid, myData = {}) {
  const TAG = '[sendPoke]';

  if (!myUid || !targetUid)   return { ok: false };
  if (myUid === targetUid)    { showToast('Nie możesz zaczepić samego siebie 😅', 'info'); return { ok: false }; }

  // Sprawdź cooldown — kiedy ostatnio zaczepił targetUid
  const cooldownKey = `poke_cooldown_${myUid}_${targetUid}`;
  const stored = localStorage.getItem(cooldownKey);
  if (stored) {
    const elapsed = Date.now() - parseInt(stored, 10);
    if (elapsed < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      showToast(`Zaczep za ${remaining} min. Cooldown aktywny! ⏳`, 'info');
      return { ok: false, cooldownMs: COOLDOWN_MS - elapsed };
    }
  }

  console.log(TAG, `${myUid} → poke → ${targetUid}`);

  try {
    // Zapisz zaczepkę
    await addDoc(collection(db, COL_POKES), {
      pokerId:    myUid,
      pokerName:  myData.displayName || 'Wojownik',
      pokerPhoto: myData.photoURL    || '',
      targetId:   targetUid,
      createdAt:  serverTimestamp(),
    });

    // Inkrementuj licznik
    await updateDoc(doc(db, COL.USERS, targetUid), {
      pokeCount: increment(1),
    });

    // Cooldown w localStorage
    localStorage.setItem(cooldownKey, Date.now().toString());

    // Powiadomienie
    createNotification(targetUid, {
      type:  'poke',
      title: `${myData.displayName || 'Wojownik'} zaczepił Cię! 👈`,
      body:  'Ktoś zrobił Ci lagę na Arenie!',
      url:   `user.html?uid=${myUid}`,
    }).catch(() => {});

    // Dźwięk + XP (symboliczne)
    _playPokeSound();
    awardXP(myUid, { ...XP_ACTIONS.DAILY_LOGIN, xp: POKE_XP, label: 'Zaczepka' }).catch(() => {});

    console.log(TAG, '✅ Zaczepka wysłana');
    return { ok: true };

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    showToast('Błąd zaczepki. Spróbuj ponownie.', 'error');
    return { ok: false };
  }
}


// ════════════════════════════════════════════════════════════
// GET POKE COUNT
// ════════════════════════════════════════════════════════════

export async function getPokeCount(targetUid) {
  if (!targetUid) return 0;
  try {
    const snap = await getDoc(doc(db, COL.USERS, targetUid));
    return snap.data()?.pokeCount ?? 0;
  } catch { return 0; }
}


// ════════════════════════════════════════════════════════════
// INJECT POKE BUTTON
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje przycisk „👈 Zrób lagę" do podanego kontenera.
 * Obsługuje cooldown, animację i licznik.
 *
 * @param {HTMLElement} containerEl
 * @param {string} myUid
 * @param {string} targetUid
 * @param {object} myData
 */
export async function injectPokeButton(containerEl, myUid, targetUid, myData = {}) {
  if (!containerEl || !myUid || !targetUid || myUid === targetUid) return;

  // Pobierz aktualny licznik
  const count = await getPokeCount(targetUid);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:.625rem;';

  const btn = document.createElement('button');
  btn.className = 'poke-btn';
  btn.dataset.targetUid = targetUid;

  // Sprawdź cooldown
  const cooldownKey = `poke_cooldown_${myUid}_${targetUid}`;
  const stored      = localStorage.getItem(cooldownKey);
  const inCooldown  = stored && (Date.now() - parseInt(stored, 10)) < COOLDOWN_MS;

  const countEl = document.createElement('span');
  countEl.className = 'poke-count';
  countEl.textContent = count > 0 ? `${count} zaczepień` : '';

  _updatePokeBtn(btn, inCooldown, stored);

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add('poking');

    // Animacja
    _animatePoke(btn);

    const result = await sendPoke(myUid, targetUid, myData);

    if (result.ok) {
      // Pokaż toast sukcesu
      showToast('Zaczepka wysłana! 👈💥', 'success', 3000);
      // Aktualizuj licznik
      const newCount = (parseInt(countEl.textContent) || 0) + 1;
      countEl.textContent = `${newCount} zaczepień`;
      // Cooldown
      _updatePokeBtn(btn, true, Date.now().toString());
      // Timer odmierzający cooldown
      _startCooldownTimer(btn, COOLDOWN_MS);
    } else {
      btn.disabled = false;
      btn.classList.remove('poking');
    }
  });

  wrap.appendChild(btn);
  wrap.appendChild(countEl);
  containerEl.appendChild(wrap);

  // Wstrzyknij style jeśli nie ma
  _injectPokeStyles();
}

function _updatePokeBtn(btn, inCooldown, stored) {
  if (inCooldown && stored) {
    const elapsed   = Date.now() - parseInt(stored, 10);
    const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
    btn.disabled     = true;
    btn.innerHTML    = `⏳ Zaczep za ${remaining} min`;
    btn.classList.add('cooldown');
  } else {
    btn.disabled     = false;
    btn.innerHTML    = `👈 Zrób lagę`;
    btn.classList.remove('cooldown');
  }
}

function _animatePoke(btn) {
  btn.classList.add('poke-shake');
  setTimeout(() => btn.classList.remove('poke-shake'), 600);
}

function _startCooldownTimer(btn, remainingMs) {
  const endTime = Date.now() + remainingMs;
  const tick = () => {
    const left = endTime - Date.now();
    if (left <= 0) {
      _updatePokeBtn(btn, false, null);
      btn.disabled = false;
      return;
    }
    const mins = Math.ceil(left / 60000);
    btn.innerHTML = `⏳ Zaczep za ${mins} min`;
    setTimeout(tick, 30000);  // odśwież co 30s
  };
  setTimeout(tick, 30000);
}


// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

function _injectPokeStyles() {
  if (document.getElementById('poke-styles')) return;
  const style = document.createElement('style');
  style.id = 'poke-styles';
  style.textContent = `
    .poke-btn {
      display: inline-flex;
      align-items: center;
      gap: .375rem;
      padding: .5rem 1rem;
      background: linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.08));
      border: 1px solid rgba(212,175,55,.35);
      border-radius: 9999px;
      font-family: var(--font-hd);
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .06em;
      color: var(--gold);
      cursor: pointer;
      transition: all .2s ease;
      white-space: nowrap;
    }
    .poke-btn:hover:not(:disabled) {
      background: rgba(212,175,55,.2);
      transform: scale(1.04);
      box-shadow: 0 4px 16px rgba(212,175,55,.2);
    }
    .poke-btn:disabled {
      opacity: .6;
      cursor: not-allowed;
      transform: none;
    }
    .poke-btn.cooldown {
      color: var(--text-muted);
      border-color: var(--border-mid);
      background: transparent;
    }
    .poke-btn.poking {
      animation: none;
    }
    @keyframes poke-shake {
      0%,100% { transform: translateX(0) rotate(0); }
      15%      { transform: translateX(-4px) rotate(-5deg); }
      30%      { transform: translateX(4px) rotate(5deg); }
      45%      { transform: translateX(-3px) rotate(-3deg); }
      60%      { transform: translateX(3px) rotate(3deg); }
      75%      { transform: translateX(-2px) rotate(-2deg); }
      90%      { transform: translateX(2px) rotate(2deg); }
    }
    .poke-shake {
      animation: poke-shake .5s ease both !important;
    }
    .poke-count {
      font-family: var(--font-hd);
      font-size: .625rem;
      color: var(--text-muted);
      letter-spacing: .06em;
    }
  `;
  document.head.appendChild(style);
}
