/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — social.js
 * Profile publiczne + System zaproszeń
 * ============================================================
 *
 * Eksporty:
 *   openUserProfile(uid)         — otwiera user.html?uid=XXX
 *   getInviteLink(uid?)          — generuje link zaproszenia
 *   copyInviteLink(uid?)         — kopiuje/share link zaproszenia
 *   initInviteButton(btnEl, uid) — podłącza przycisk zaproszenia
 *   makeAvatarsClickable()       — sprawia że avatary w DOM są klikalne
 */

import { auth } from './firebase.js';
import { showToast } from './auth.js';


// ── Base URL ─────────────────────────────────────────────────
function getBase() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
}


// ════════════════════════════════════════════════════════════
// OTWIERANIE PROFILU
// ════════════════════════════════════════════════════════════

/**
 * Otwiera publiczny profil użytkownika.
 * Jeśli to zalogowany użytkownik → własny profil.
 */
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
// LINK ZAPROSZENIA
// ════════════════════════════════════════════════════════════

/**
 * Generuje personalny link zaproszenia.
 * @param {string} [uid] - opcjonalnie UID zapraszającego
 * @returns {string}
 */
export function getInviteLink(uid) {
  const base = getBase();
  const ref  = uid ?? auth.currentUser?.uid ?? '';
  return `${base}invite.html${ref ? '?ref=' + encodeURIComponent(ref) : ''}`;
}

/**
 * Kopiuje / share link zaproszenia.
 * Na mobile używa Web Share API.
 */
export async function copyInviteLink(uid) {
  const link = getInviteLink(uid ?? auth.currentUser?.uid);
  const title= 'Weekend Warrior Social ⚔️';
  const text = 'Dołącz na Arenę! Wyzwania, ranking i osiągnięcia czekają.';

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: link });
      return;
    } catch {
      // User cancelled — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(link);
    showToast('Link zaproszenia skopiowany! 📋', 'success', 3500);
  } catch {
    // Fallback: prompt
    prompt('Skopiuj link zaproszenia:', link);
  }
}

/**
 * Podłącza przycisk zaproszenia.
 * @param {HTMLElement} btnEl
 * @param {string} [uid]
 */
export function initInviteButton(btnEl, uid) {
  if (!btnEl) return;
  btnEl.addEventListener('click', () => copyInviteLink(uid));
}


// ════════════════════════════════════════════════════════════
// KLIKALNE AVATARY
// ════════════════════════════════════════════════════════════

/**
 * Sprawia że wszystkie elementy z [data-user-uid]
 * stają się klikalne i prowadzą do profilu.
 *
 * Wywołaj po wyrenderowaniu listy (feed, ranking).
 *
 * @param {HTMLElement} [container=document] - zakres szukania
 */
export function makeAvatarsClickable(container = document) {
  container.querySelectorAll('[data-user-uid]').forEach(el => {
    if (el.dataset.clickableProfile) return; // already bound
    el.dataset.clickableProfile = '1';
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserProfile(el.dataset.userUid);
    });
  });
}


// ════════════════════════════════════════════════════════════
// INVITE BANNER — pokazywany na index.html
// ════════════════════════════════════════════════════════════

/**
 * Wstrzykuje przycisk "Zaproś wojownika" do podanego kontenera.
 * @param {HTMLElement} containerEl
 * @param {string} uid
 */
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
    animation: fadeInUp 0.4s ease 0.35s both;
  `;

  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <div style="font-size:1.375rem;flex-shrink:0;">🛡️</div>
      <div>
        <div style="font-family:var(--font-hd);font-size:0.875rem;font-weight:700;
                    color:var(--gold);letter-spacing:0.06em;text-transform:uppercase;">
          Zaproś wojownika
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          Podeślij link znajomemu
        </div>
      </div>
    </div>
    <button id="inject-invite-btn" style="
      display:flex;align-items:center;gap:0.5rem;
      padding:0.5625rem 1.125rem;
      background:linear-gradient(135deg,var(--gold),var(--gold-dim));
      border:none;border-radius:9999px;color:#000;
      font-family:var(--font-hd);font-size:0.875rem;font-weight:700;
      letter-spacing:0.04em;text-transform:uppercase;
      cursor:pointer;transition:all .2s ease;white-space:nowrap;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Kopiuj link
    </button>
  `;

  containerEl.appendChild(div);

  div.querySelector('#inject-invite-btn')?.addEventListener('click', () => {
    copyInviteLink(uid);
  });
}
