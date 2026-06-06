/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — blocks.js
 * System blokowania i raportowania użytkowników
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * FIRESTORE:
 *   blocks/{blockerId_blockedId}   — deterministyczne ID
 *     blockerId, blockedId, createdAt
 *
 *   reports/{autoId}
 *     reporterId, targetType, targetId, targetAuthorId
 *     reason, description, status, createdAt
 *
 * EKSPORTY:
 *   blockUser(myUid, targetUid)
 *   unblockUser(myUid, targetUid)
 *   isBlocked(myUid, targetUid) → boolean
 *   getBlockedIds(myUid)        → string[]
 *   reportContent(reporterId, data)
 *   injectReportButton(container, reporterId, targetType, targetId, targetAuthorId)
 *   injectBlockButton(container, myUid, targetUid, myDisplayName)
 *   filterBlockedPosts(posts, blockedIds) → filtered posts
 */

import { db } from './firebase.js';
import { showToast } from './auth.js';

import {
  collection, doc, setDoc, deleteDoc, getDoc, getDocs,
  addDoc, query, where, limit, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COL_BLOCKS  = 'blocks';
const COL_REPORTS = 'reports';

// ── Cache (lokalny) ───────────────────────────────────────────
let _blockedIdsCache = null;


// ════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK
// ════════════════════════════════════════════════════════════

/**
 * Zablokuj użytkownika.
 * @param {string} myUid
 * @param {string} targetUid
 */
export async function blockUser(myUid, targetUid) {
  if (!myUid || !targetUid || myUid === targetUid) return;

  const docId = `${myUid}_${targetUid}`;
  await setDoc(doc(db, COL_BLOCKS, docId), {
    blockerId: myUid,
    blockedId: targetUid,
    createdAt: serverTimestamp(),
  });

  // Wyczyść cache
  _blockedIdsCache = null;

  console.log('[blockUser] ✅ Zablokowano:', targetUid);
  showToast('Użytkownik zablokowany. Jego posty nie będą widoczne.', 'info', 4000);
}

/**
 * Odblokuj użytkownika.
 * @param {string} myUid
 * @param {string} targetUid
 */
export async function unblockUser(myUid, targetUid) {
  if (!myUid || !targetUid) return;

  const docId = `${myUid}_${targetUid}`;
  await deleteDoc(doc(db, COL_BLOCKS, docId));
  _blockedIdsCache = null;

  console.log('[unblockUser] ✅ Odblokowano:', targetUid);
  showToast('Użytkownik odblokowany.', 'info');
}

/**
 * Sprawdź czy targetUid jest zablokowany przez myUid.
 * @returns {Promise<boolean>}
 */
export async function isBlocked(myUid, targetUid) {
  if (!myUid || !targetUid) return false;
  const docId = `${myUid}_${targetUid}`;
  try {
    const snap = await getDoc(doc(db, COL_BLOCKS, docId));
    return snap.exists();
  } catch { return false; }
}

/**
 * Pobierz listę zablokowanych UID (z cache).
 * @param {string} myUid
 * @returns {Promise<string[]>}
 */
export async function getBlockedIds(myUid) {
  if (!myUid) return [];
  if (_blockedIdsCache) return _blockedIdsCache;

  try {
    const snap = await getDocs(query(
      collection(db, COL_BLOCKS),
      where('blockerId', '==', myUid),
    ));
    _blockedIdsCache = [];
    snap.forEach(d => _blockedIdsCache.push(d.data().blockedId));
    return _blockedIdsCache;
  } catch(e) {
    console.warn('[getBlockedIds]', e.code);
    return [];
  }
}

/**
 * Filtruje posty — usuwa posty od zablokowanych użytkowników.
 * @param {Array} posts        — tablica postów
 * @param {string[]} blockedIds — lista zablokowanych UID
 * @returns {Array}
 */
export function filterBlockedPosts(posts, blockedIds) {
  if (!blockedIds || blockedIds.length === 0) return posts;
  return posts.filter(p => !blockedIds.includes(p.authorId));
}


// ════════════════════════════════════════════════════════════
// REPORT
// ════════════════════════════════════════════════════════════

const REPORT_REASONS = [
  { id: 'spam',        label: '🚫 Spam lub reklama' },
  { id: 'harassment',  label: '😡 Nękanie lub zastraszanie' },
  { id: 'hate_speech', label: '🔥 Mowa nienawiści' },
  { id: 'violence',    label: '⚠️ Przemoc lub zagrożenie' },
  { id: 'fake',        label: '🎭 Fałszywa tożsamość' },
  { id: 'other',       label: '📝 Inne' },
];

/**
 * Wyślij zgłoszenie do Firestore.
 *
 * @param {string} reporterId
 * @param {object} data — { targetType, targetId, targetAuthorId, reason, description }
 */
export async function reportContent(reporterId, data) {
  if (!reporterId || !data.targetType || !data.targetId) throw new Error('Brak wymaganych pól');

  await addDoc(collection(db, COL_REPORTS), {
    reporterId,
    targetType:    data.targetType,
    targetId:      data.targetId,
    targetAuthorId: data.targetAuthorId || '',
    reason:        data.reason     || 'other',
    description:   (data.description || '').slice(0, 500),
    status:        'pending',
    createdAt:     serverTimestamp(),
  });

  console.log('[reportContent] ✅ Zgłoszenie wysłane');
  showToast('Zgłoszenie wysłane. Dziękujemy za dbanie o Arenę! 🛡️', 'success', 4000);
}


// ════════════════════════════════════════════════════════════
// INJECT BLOCK BUTTON
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje przycisk Blokuj/Odblokuj do kontenera.
 * Używany na user.html dla innych użytkowników.
 *
 * @param {HTMLElement} containerEl
 * @param {string} myUid
 * @param {string} targetUid
 */
export async function injectBlockButton(containerEl, myUid, targetUid) {
  if (!containerEl || !myUid || !targetUid || myUid === targetUid) return;

  _injectBlockStyles();

  const blocked = await isBlocked(myUid, targetUid);
  const btn     = document.createElement('button');
  btn.className = 'block-btn' + (blocked ? ' blocked' : '');
  btn.textContent = blocked ? '🔓 Odblokuj' : '🚫 Zablokuj';

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      if (btn.classList.contains('blocked')) {
        await unblockUser(myUid, targetUid);
        btn.classList.remove('blocked');
        btn.textContent = '🚫 Zablokuj';
      } else {
        if (!confirm('Czy na pewno chcesz zablokować tego użytkownika?')) { btn.disabled = false; return; }
        await blockUser(myUid, targetUid);
        btn.classList.add('blocked');
        btn.textContent = '🔓 Odblokuj';
      }
    } catch(e) {
      showToast('Błąd: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  containerEl.appendChild(btn);
}


// ════════════════════════════════════════════════════════════
// INJECT REPORT BUTTON
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje przycisk "Zgłoś" do kontenera.
 *
 * @param {HTMLElement} containerEl
 * @param {string} reporterId
 * @param {string} targetType     — 'post' | 'user' | 'comment'
 * @param {string} targetId
 * @param {string} targetAuthorId
 */
export function injectReportButton(containerEl, reporterId, targetType, targetId, targetAuthorId) {
  if (!containerEl || !reporterId || reporterId === targetAuthorId) return;

  _injectBlockStyles();

  const btn = document.createElement('button');
  btn.className   = 'report-btn';
  btn.innerHTML   = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
    Zgłoś`;
  btn.title = 'Zgłoś treść';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    _openReportModal(reporterId, targetType, targetId, targetAuthorId);
  });

  containerEl.appendChild(btn);
}

function _openReportModal(reporterId, targetType, targetId, targetAuthorId) {
  document.getElementById('report-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'report-modal-overlay';
  overlay.className = 'block-modal-overlay';

  const targetLabels = { post: 'posta', user: 'profilu', comment: 'komentarza' };
  const targetLabel  = targetLabels[targetType] || targetType;

  overlay.innerHTML = `
    <div class="block-modal" role="dialog" aria-modal="true">
      <div class="block-modal-handle"></div>
      <div class="block-modal-title">🚩 Zgłoś ${targetLabel}</div>
      <div class="block-modal-sub">Wybierz powód zgłoszenia:</div>

      <div class="report-reasons">
        ${REPORT_REASONS.map(r => `
          <label class="report-reason-item">
            <input type="radio" name="report-reason" value="${r.id}"/>
            <span>${r.label}</span>
          </label>`).join('')}
      </div>

      <div style="margin:.75rem 0 .25rem;">
        <textarea
          id="report-description"
          placeholder="Opcjonalny opis (max 200 znaków)..."
          maxlength="200"
          rows="2"
          style="width:100%;background:var(--bg-elevated);border:1px solid var(--border-mid);
            border-radius:var(--r-md);padding:.5rem .75rem;color:var(--text-primary);
            font-family:var(--font-body);font-size:.875rem;resize:none;outline:none;"></textarea>
      </div>

      <div style="display:flex;gap:.5rem;">
        <button class="btn btn-ghost btn-sm" id="report-cancel" style="flex:1;">Anuluj</button>
        <button class="btn btn-primary btn-sm" id="report-submit" style="flex:1;">Wyślij zgłoszenie</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('report-cancel')?.addEventListener('click', () => overlay.remove());

  document.getElementById('report-submit')?.addEventListener('click', async () => {
    const reason  = overlay.querySelector('input[name="report-reason"]:checked')?.value;
    const desc    = document.getElementById('report-description')?.value.trim() || '';

    if (!reason) { showToast('Wybierz powód zgłoszenia.', 'error'); return; }

    const submitBtn = document.getElementById('report-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wysyłam...'; }

    try {
      await reportContent(reporterId, { targetType, targetId, targetAuthorId, reason, description: desc });
      overlay.remove();
    } catch(e) {
      showToast('Błąd wysyłania zgłoszenia.', 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Wyślij zgłoszenie'; }
    }
  });
}


// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

function _injectBlockStyles() {
  if (document.getElementById('block-styles')) return;
  const s = document.createElement('style');
  s.id = 'block-styles';
  s.textContent = `
    .block-btn {
      display: inline-flex; align-items: center; gap: .375rem;
      padding: .4rem .875rem;
      background: transparent;
      border: 1px solid var(--border-dim);
      border-radius: 9999px;
      font-family: var(--font-heading);
      font-size: .575rem; font-weight: 700; letter-spacing: .08em;
      color: var(--text-muted); cursor: pointer;
      transition: all .2s ease;
    }
    .block-btn:hover { border-color: var(--error); color: var(--error); }
    .block-btn.blocked { color: var(--text-faint); }

    .report-btn {
      display: inline-flex; align-items: center; gap: .25rem;
      background: none; border: none;
      font-family: var(--font-heading);
      font-size: .575rem; font-weight: 700; letter-spacing: .06em;
      color: var(--text-muted); cursor: pointer;
      padding: .25rem .5rem;
      border-radius: var(--r-sm);
      transition: color .15s ease;
    }
    .report-btn:hover { color: var(--error); }
    .report-btn svg   { flex-shrink: 0; }

    .block-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.75);
      backdrop-filter: blur(6px);
      z-index: 9000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: calc(env(safe-area-inset-bottom,0) + .5rem);
      animation: fade-in .2s ease;
    }
    @media (min-width: 480px) { .block-modal-overlay { align-items: center; padding-bottom: 0; } }

    .block-modal {
      background: var(--bg-panel);
      border: 1px solid var(--border-panel);
      border-radius: var(--r-xl) var(--r-xl) 0 0;
      padding: 1.25rem 1.25rem 1.5rem;
      width: 100%; max-width: 400px;
      animation: modal-in .3s var(--ease-out);
    }
    @media (min-width: 480px) { .block-modal { border-radius: var(--r-xl); } }

    .block-modal-handle {
      width: 36px; height: 4px;
      background: var(--border-dim);
      border-radius: 2px;
      margin: 0 auto .875rem;
    }
    @media (min-width: 480px) { .block-modal-handle { display: none; } }

    .block-modal-title {
      font-family: var(--font-heading);
      font-size: 1rem; font-weight: 700;
      color: var(--text-bright);
      margin-bottom: .25rem;
    }
    .block-modal-sub {
      font-size: .8125rem; color: var(--text-muted);
      margin-bottom: .875rem;
    }

    .report-reasons { display: flex; flex-direction: column; gap: .375rem; margin-bottom: .5rem; }
    .report-reason-item {
      display: flex; align-items: center; gap: .625rem;
      padding: .5rem .75rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--r-md);
      cursor: pointer;
      font-size: .875rem;
      color: var(--text-parchment);
      transition: all .15s ease;
    }
    .report-reason-item:hover { border-color: var(--border-mid); }
    .report-reason-item input { accent-color: var(--gold-500); }
    .report-reason-item:has(input:checked) {
      border-color: var(--gold-500);
      background: rgba(212,175,55,.06);
    }
  `;
  document.head.appendChild(s);
}
