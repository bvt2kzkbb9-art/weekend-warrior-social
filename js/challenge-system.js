/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — challenge-system.js
 * Nowy system: Wyzwanie → Quiz → Realizacja → XP
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Kolekcje Firestore:
 *   challenge_invites/{id}
 *   challenge_quizzes/{id}       (wyniki quizów)
 *   challenge_progress/{id}      (aktywne wyzwania)
 *   challenge_completions/{id}   (ukończone)
 *   challenge_notifications/{uid}/items/{id}
 *
 * Eksporty:
 *   initChallengeSystem(user, userData)
 *   openSendInviteModal()
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { awardXP }   from './xp.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, onSnapshot, query, where, orderBy,
  serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// DANE — WYZWANIA + QUIZY
// ════════════════════════════════════════════════════════════

export const CHALLENGES_DATA = [
  {
    id: 'lowca_wezy', order: 1,
    title: 'Łowca Węży', badge: '🏹', xp: 30,
    difficulty: 'easy', category: 'Odkrycie',
    image: 'assets/challenges/lowca-wezy.png',
    desc: 'Uświadom sobie swoją główną przeszkodę.',
    task: 'Nazwij jedną rzecz, która najbardziej przeszkadza Ci w osiągnięciu celu.',
    quiz: {
      question: 'No to dawaj, który wąż ci dziś najbardziej syczy w bani?',
      answers: [
        'Ten, co mi od rana pierdoli, że będzie fajnie, a potem robi dramat.',
        'Ten, co siedzi w głowie i udaje, że jest moim kumplem.',
        'Ten największy, co mnie ciągnie w stronę głupich decyzji.',
      ],
      correct: 2,
    },
  },
  {
    id: 'tropiciel_hydry', order: 2,
    title: 'Tropiciel Hydry', badge: '🔍', xp: 40,
    difficulty: 'easy', category: 'Planowanie',
    image: 'assets/challenges/tropiciel-hydry.png',
    desc: 'Stwórz plan walki z przeszkodą.',
    task: 'Zapisz plan rozwiązania jednego problemu w 3 krokach.',
    quiz: {
      question: 'Jak ogarniesz ten burdel w trzech krokach, zanim hydra cię oplącze?',
      answers: [
        'Najpierw ogarnę głowę, potem chaos, a na końcu siebie.',
        'Krok pierwszy: nie pierdolić. Krok drugi: zrobić. Krok trzeci: nie zjebać.',
        'Zrobię plan, a potem będę udawał, że go trzymam.',
      ],
      correct: 1,
    },
  },
  {
    id: 'zgniatacz_wezy', order: 3,
    title: 'Zgniatacz Węży', badge: '⚔️', xp: 50,
    difficulty: 'medium', category: 'Działanie',
    image: 'assets/challenges/zgniatacz-wezy.png',
    desc: 'Rozwiąż jedną zaległą sprawę.',
    task: 'Rozwiąż jedną sprawę, którą odkładasz od tygodnia.',
    quiz: {
      question: 'Co dziś zgniatasz jako pierwsze?',
      answers: [
        'Problem.',
        'Własne wymówki.',
        'Wszystko po kolei.',
      ],
      correct: 0,
    },
  },
  {
    id: 'maly_na_rozruch', order: 4,
    title: 'Mały Na Rozruch', badge: '💸', xp: 70,
    difficulty: 'medium', category: 'Działanie',
    image: 'assets/challenges/maly-na-rozruch.png',
    desc: 'Zacznij odkładane zadanie w 10 minut.',
    task: 'W ciągu 10 minut rozpocznij zadanie, które odkładasz.',
    quiz: {
      question: 'Jaki ruch wykonasz w ciągu 10 minut?',
      answers: [
        'Odpalę zadanie zanim zacznę kombinować.',
        'Zrobię cokolwiek.',
        'Poczekam na lepszy moment.',
      ],
      correct: 0,
    },
  },
  {
    id: 'pogromca_krychy', order: 5,
    title: 'Pogromca Krychy', badge: '👑', xp: 150,
    difficulty: 'hard', category: 'Mądrość',
    image: 'assets/challenges/pogromca-krychy.png',
    desc: 'Usuń iluzję blokującą Twój wzrost.',
    task: 'Usuń jedną rzecz, która pozornie pomaga, ale blokuje Twój rozwój.',
    quiz: {
      question: 'Co usuwasz ze swojego życia?',
      answers: [
        'To co mnie blokuje.',
        'Losową rzecz.',
        'Nic.',
      ],
      correct: 0,
    },
  },
  {
    id: 'siedem_dni_chwaly', order: 6,
    title: 'Siedem Dni Chwały', badge: '🌼', xp: 60,
    difficulty: 'medium', category: 'Wytrwałość',
    image: 'assets/challenges/siedem-dni-chwaly.png',
    desc: 'Loguj się 7 dni z rzędu.',
    task: 'Zaloguj się do aplikacji przez 7 kolejnych dni.',
    quiz: {
      question: 'Jak pokonasz hydrę lenistwa?',
      answers: [
        'Nie pokonam.',
        'Będę logował się codziennie.',
        'Może jutro.',
      ],
      correct: 1,
    },
  },
  {
    id: 'nagroda_wojownika', order: 7,
    title: 'Nagroda Wojownika', badge: '💎', xp: 200,
    difficulty: 'hard', category: 'Osiągnięcie',
    image: 'assets/challenges/nagroda-wojownika.png',
    desc: 'Zdobądź 200 XP w ciągu tygodnia.',
    task: 'Zdobądź 200 XP w ciągu jednego tygodnia.',
    quiz: {
      question: '200 XP w tydzień?',
      answers: [
        'Robię.',
        'Może.',
        'Nie wiem.',
      ],
      correct: 0,
    },
  },
  {
    id: 'duch_areny', order: 8,
    title: 'Duch Areny', badge: '🐍', xp: 200,
    difficulty: 'legend', category: 'Inspiracja',
    image: 'assets/challenges/duch-areny.png',
    desc: 'Opublikuj post o swoim największym celu.',
    task: 'Opublikuj post o swoim największym celu lub inspiracji.',
    quiz: {
      question: 'W czym chcesz być najlepszy?',
      answers: [
        'W niczym.',
        'W kończeniu rzeczy.',
        'W odkładaniu.',
      ],
      correct: 1,
    },
  },
];

const DIFF_MAP = {
  easy:   { label: 'Łatwe',      cls: 'diff-easy'   },
  medium: { label: 'Średnie',    cls: 'diff-medium'  },
  hard:   { label: 'Trudne',     cls: 'diff-hard'    },
  legend: { label: 'Legendarne', cls: 'diff-legend'  },
};


// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════

let _user        = null;
let _userData    = null;
let _unsubs      = [];
let _activeTab   = 'challenges'; // challenges | received | sent | active | history


// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initChallengeSystem(user, userData) {
  _user     = user;
  _userData = userData;

  if (!user?.uid) return;

  _setupTabs();
  _loadTab(_activeTab);
}

function _setupTabs() {
  document.querySelectorAll('[data-cs-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.csTab;
      if (tab === _activeTab) return;
      _activeTab = tab;
      document.querySelectorAll('[data-cs-tab]').forEach(b =>
        b.classList.toggle('active', b.dataset.csTab === tab)
      );
      _loadTab(tab);
    });
  });
}

function _loadTab(tab) {
  const sections = ['challenges','received','sent','active','history'];
  sections.forEach(s => {
    const el = document.getElementById(`cs-section-${s}`);
    if (el) el.style.display = s === tab ? '' : 'none';
  });

  // Cleanup old listeners
  _unsubs.forEach(u => u());
  _unsubs = [];

  if (tab === 'challenges') _renderChallengeCards();
  if (tab === 'received')   _listenReceived();
  if (tab === 'sent')       _listenSent();
  if (tab === 'active')     _listenActive();
  if (tab === 'history')    _listenHistory();
}


// ════════════════════════════════════════════════════════════
// TAB 1 — KARTY WYZWAŃ
// ════════════════════════════════════════════════════════════

function _renderChallengeCards() {
  const grid = document.getElementById('cs-cards-grid');
  if (!grid) return;
  grid.innerHTML = '';

  CHALLENGES_DATA.forEach((ch, idx) => {
    const diff = DIFF_MAP[ch.difficulty] ?? DIFF_MAP.medium;
    const card = document.createElement('div');
    card.className = 'ch-card';
    card.style.animationDelay = (idx * 0.07) + 's';

    card.innerHTML = `
      <div class="ch-card-num">${ch.order}</div>
      <div class="ch-xp-badge">+${ch.xp}<span>XP</span></div>
      <div class="ch-card-img-wrap">
        <img src="${ch.image}" alt="${_esc(ch.title)}" class="ch-card-img" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <div class="ch-card-img-placeholder" style="display:none;">${ch.badge}</div>
      </div>
      <div class="ch-card-body">
        <div class="ch-card-divider"><span>◆</span></div>
        <div class="ch-card-title">${_esc(ch.title)}</div>
        <div class="ch-card-desc">${_esc(ch.desc)}</div>
      </div>
      <div class="ch-card-footer">
        <button class="ch-card-btn cs-challenge-btn" data-id="${ch.id}">
          ⚔️ Rzuć wyzwanie
        </button>
      </div>
    `;

    // Kliknięcie karty → detail
    card.addEventListener('click', e => {
      if (!e.target.closest('.cs-challenge-btn')) _openChallengeDetail(ch);
    });

    // Kliknięcie przycisku
    card.querySelector('.cs-challenge-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      _openSendModal(ch);
    });

    grid.appendChild(card);
  });
}


// ════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════

function _openChallengeDetail(ch) {
  _removeModal('cs-detail-root');
  const diff = DIFF_MAP[ch.difficulty] ?? DIFF_MAP.medium;
  const root = document.createElement('div');
  root.id    = 'cs-detail-root';

  root.innerHTML = `
    <div class="ch-detail-backdrop" id="cs-detail-bg">
      <div class="ch-detail-modal">
        <div class="ch-detail-img-wrap">
          <img src="${ch.image}" alt="${_esc(ch.title)}" class="ch-detail-img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="ch-detail-img-placeholder" style="display:none;">${ch.badge}</div>
          <div class="ch-detail-img-overlay"></div>
          <button class="ch-detail-close" id="cs-detail-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div class="ch-detail-num-badge">${ch.order}</div>
        </div>
        <div class="ch-detail-body">
          <h2 class="ch-detail-title ch-gold-pulse">${ch.badge} ${_esc(ch.title)}</h2>
          <div class="ch-detail-divider"><span>◆</span></div>
          <div class="ch-detail-badges">
            <span class="difficulty-badge ${diff.cls}">${diff.label}</span>
            <span style="font-size:.75rem;color:#8A7E6A;font-style:italic;">${ch.category}</span>
          </div>
          <div class="ch-detail-task-wrap">
            <div class="ch-detail-task-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Zadanie
            </div>
            <div class="ch-detail-task">${_esc(ch.task)}</div>
          </div>
          <div class="ch-detail-reward">
            <div class="ch-detail-reward-icon">🏆</div>
            <div>
              <div class="ch-detail-reward-xp">+${ch.xp} XP</div>
              <div class="ch-detail-reward-badge">Po ukończeniu quizu i wyzwania</div>
            </div>
          </div>
          <button class="ch-detail-action-btn" id="cs-detail-send-btn">
            ⚔️ Rzuć wyzwanie wojownikowi
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  root.querySelector('#cs-detail-close')?.addEventListener('click', () => root.remove());
  document.getElementById('cs-detail-bg')?.addEventListener('click', e => {
    if (e.target.id === 'cs-detail-bg') root.remove();
  });
  root.querySelector('#cs-detail-send-btn')?.addEventListener('click', () => {
    root.remove();
    _openSendModal(ch);
  });
}


// ════════════════════════════════════════════════════════════
// SEND INVITE MODAL
// ════════════════════════════════════════════════════════════

async function _openSendModal(ch) {
  if (!_user) { showToast('Musisz być zalogowany.', 'error'); return; }

  _removeModal('cs-send-root');

  // Pobierz użytkowników
  let users = [];
  try {
    const snap = await getDocs(collection(db, COL.USERS));
    snap.forEach(d => { if (d.id !== _user.uid) users.push({ uid: d.id, ...d.data() }); });
  } catch (e) {
    showToast('Błąd pobierania wojowników: ' + (e.code || e.message), 'error');
    return;
  }

  if (!users.length) {
    showToast('Brak innych wojowników. Zaproś znajomych! 🛡️', 'info', 5000);
    return;
  }

  let selUser = users[0];

  const root = document.createElement('div');
  root.id    = 'cs-send-root';

  const usersHTML = () => users.map(u => {
    const sel = u.uid === selUser?.uid;
    const ini = (u.displayName || '?')[0].toUpperCase();
    return `
      <div class="cs-user-row ${sel ? 'selected' : ''}" data-uid="${u.uid}">
        <div class="cs-user-avatar">
          ${u.photoURL
            ? `<img src="${_esc(u.photoURL)}" onerror="this.parentElement.textContent='${ini}'">`
            : ini}
        </div>
        <div class="cs-user-info">
          <div class="cs-user-name">${_esc(u.displayName || 'Wojownik')}</div>
          <div class="cs-user-sub">${u.rank || 'Rookie'} · ${u.points || 0} XP</div>
        </div>
        ${sel ? '<div class="cs-user-check">✓</div>' : ''}
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div class="cs-modal-bg" id="cs-send-bg">
      <div class="cs-modal">
        <div class="cs-modal-header">
          <div>
            <div class="cs-modal-title">⚔️ Rzuć Wyzwanie</div>
            <div class="cs-modal-sub">Wybierz wojownika do walki</div>
          </div>
          <button class="cs-modal-close" id="cs-send-close">✕</button>
        </div>

        <!-- Podgląd wyzwania -->
        <div class="cs-challenge-preview">
          <div style="font-size:1.5rem;flex-shrink:0;">${ch.badge}</div>
          <div>
            <div class="cs-preview-title">${_esc(ch.title)}</div>
            <div class="cs-preview-sub">+${ch.xp} XP · ${(DIFF_MAP[ch.difficulty]||{}).label||''}</div>
          </div>
        </div>

        <!-- Lista użytkowników -->
        <div class="cs-modal-label">Wojownicy (${users.length})</div>
        <div class="cs-users-list" id="cs-users-list">${usersHTML()}</div>

        <!-- Info -->
        <div class="cs-target-info" id="cs-target-info">
          🎯 <span id="cs-target-name">${_esc(selUser.displayName || 'Wojownik')}</span>
          zostanie wyzwany
        </div>

        <button class="cs-send-btn" id="cs-send-btn">⚔️ Rzuć Wyzwanie!</button>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Delegacja kliknięć na użytkowników
  document.getElementById('cs-users-list')?.addEventListener('click', e => {
    const row = e.target.closest('.cs-user-row');
    if (!row) return;
    const uid = row.dataset.uid;
    selUser = users.find(u => u.uid === uid);
    document.getElementById('cs-users-list').innerHTML = usersHTML();
    const nameEl = document.getElementById('cs-target-name');
    if (nameEl) nameEl.textContent = selUser?.displayName || 'Wojownik';
    // Re-bind click (innerHTML reset)
    _bindUserListClick();
  });

  function _bindUserListClick() {
    document.getElementById('cs-users-list')?.addEventListener('click', e => {
      const row = e.target.closest('.cs-user-row');
      if (!row) return;
      selUser = users.find(u => u.uid === row.dataset.uid);
      document.getElementById('cs-users-list').innerHTML = usersHTML();
      const nameEl = document.getElementById('cs-target-name');
      if (nameEl) nameEl.textContent = selUser?.displayName || 'Wojownik';
    });
  }

  const close = () => root.remove();
  document.getElementById('cs-send-close')?.addEventListener('click', close);
  document.getElementById('cs-send-bg')?.addEventListener('click', e => {
    if (e.target.id === 'cs-send-bg') close();
  });

  document.getElementById('cs-send-btn')?.addEventListener('click', async () => {
    if (!selUser) { showToast('Wybierz wojownika!', 'error'); return; }
    const btn = document.getElementById('cs-send-btn');
    btn.disabled = true; btn.textContent = 'Wysyłam...';

    try {
      await _sendInvite(ch, selUser);
      close();
    } catch (e) {
      btn.disabled = false; btn.textContent = '⚔️ Rzuć Wyzwanie!';
    }
  });
}


// ════════════════════════════════════════════════════════════
// WYŚLIJ ZAPROSZENIE
// ════════════════════════════════════════════════════════════

async function _sendInvite(ch, targetUser) {
  const data = {
    challengerId:   _user.uid,
    challengerName: _userData?.displayName || _user.displayName || 'Wojownik',
    challengerPhoto:_userData?.photoURL    || _user.photoURL    || '',
    targetId:       targetUser.uid,
    targetName:     targetUser.displayName || 'Wojownik',
    challengeId:    ch.id,
    challengeTitle: ch.title,
    challengeBadge: ch.badge,
    challengeXP:    ch.xp,
    status:         'pending',   // pending | quiz_pending | active | completed | rejected
    quizPassed:     false,
    expiresAt:      Timestamp.fromDate(new Date(Date.now() + 72 * 3600 * 1000)),
    createdAt:      serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'challenge_invites'), data);
  console.log('[sendInvite] ✅ id:', ref.id);

  // Powiadomienie in-app
  createNotification(targetUser.uid, {
    type:  'duel',
    title: `${data.challengerName} rzuca Ci wyzwanie! ⚔️`,
    body:  `"${ch.title}" · +${ch.xp} XP · Masz 72h`,
    url:   'challenges.html',
  }).catch(() => {});

  showToast(
    `⚔️ Wyzwanie rzucone! ${targetUser.displayName || 'Wojownik'} ma 72h na odpowiedź.`,
    'success', 5000
  );
}


// ════════════════════════════════════════════════════════════
// TAB 2 — ODEBRANE WYZWANIA
// ════════════════════════════════════════════════════════════

function _listenReceived() {
  const el = document.getElementById('cs-received-list');
  if (!el) return;
  el.innerHTML = _loadingHTML();

  const q = query(
    collection(db, 'challenge_invites'),
    where('targetId', '==', _user.uid),
    where('status',   'in', ['pending', 'quiz_pending', 'active']),
  );

  const unsub = onSnapshot(q, snap => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    el.innerHTML = '';

    if (!items.length) {
      el.innerHTML = _emptyHTML('📭', 'Brak odebranych wyzwań', 'Nikt jeszcze Cię nie wyzwał. Poczekaj na wyzwanie.');
      return;
    }

    items.forEach(inv => {
      const card = _makeReceivedCard(inv);
      el.appendChild(card);
    });
  }, err => {
    el.innerHTML = _emptyHTML('⚠️', 'Błąd ładowania', err.code);
  });

  _unsubs.push(unsub);
}

function _makeReceivedCard(inv) {
  const card = document.createElement('div');
  card.className = 'cs-invite-card';

  const status = {
    pending:      { label: '⏳ Oczekuje',     color: '#F59E0B' },
    quiz_pending: { label: '🧠 Quiz do zrobienia', color: '#4F8CFF' },
    active:       { label: '⚔️ Aktywne',      color: '#16C784' },
  }[inv.status] ?? { label: inv.status, color: '#8A7E6A' };

  const expiry    = inv.expiresAt?.toDate?.() ?? new Date(Date.now() + 72 * 3600000);
  const hoursLeft = Math.max(0, Math.floor((expiry - Date.now()) / 3600000));
  const ini       = (inv.challengerName || '?')[0].toUpperCase();

  card.innerHTML = `
    <div class="cs-invite-header">
      <div class="cs-invite-avatar">
        ${inv.challengerPhoto
          ? `<img src="${_esc(inv.challengerPhoto)}" onerror="this.parentElement.textContent='${ini}'">`
          : ini}
      </div>
      <div class="cs-invite-info">
        <div class="cs-invite-from">
          <span style="color:#D4AF37;">${_esc(inv.challengerName)}</span> rzuca wyzwanie:
        </div>
        <div class="cs-invite-challenge">
          ${inv.challengeBadge ?? '⚔️'} "${_esc(inv.challengeTitle)}" · +${inv.challengeXP} XP
        </div>
        <div style="display:flex;align-items:center;gap:.75rem;margin-top:.25rem;flex-wrap:wrap;">
          <span style="font-size:.75rem;font-weight:700;color:${status.color};">${status.label}</span>
          <span style="font-size:.6875rem;color:${hoursLeft < 6 ? '#EF4444' : '#8A7E6A'};">
            ⏳ ${hoursLeft}h pozostało
          </span>
        </div>
      </div>
    </div>
    <div class="cs-invite-actions" id="cs-actions-${inv.id}">
      ${_receivedActions(inv)}
    </div>
  `;

  _bindReceivedActions(card, inv);
  return card;
}

function _receivedActions(inv) {
  if (inv.status === 'pending') {
    return `
      <button class="cs-btn-accept" data-id="${inv.id}">⚔️ Podejmuję walkę!</button>
      <button class="cs-btn-reject" data-id="${inv.id}">Odrzuć</button>
    `;
  }
  if (inv.status === 'quiz_pending') {
    return `<button class="cs-btn-quiz" data-id="${inv.id}" data-ch-id="${inv.challengeId}">
      🧠 Rozwiąż Quiz
    </button>`;
  }
  if (inv.status === 'active') {
    return `
      <div style="font-size:.8125rem;color:#16C784;font-weight:600;margin-bottom:.625rem;">
        ✅ Quiz zaliczony! Czas na wyzwanie:
      </div>
      <div style="font-size:.875rem;color:#E8E0D0;line-height:1.6;margin-bottom:.75rem;
                  font-style:italic;background:rgba(212,175,55,.05);
                  padding:.75rem;border-radius:8px;border-left:3px solid rgba(212,175,55,.3);">
        ${_esc(_getChallengeTask(inv.challengeId))}
      </div>
      <button class="cs-btn-complete" data-id="${inv.id}">🏆 Ukończyłem wyzwanie</button>
    `;
  }
  return '';
}

function _bindReceivedActions(card, inv) {
  // Accept
  card.querySelector('.cs-btn-accept')?.addEventListener('click', async () => {
    const btn = card.querySelector('.cs-btn-accept');
    btn.disabled = true; btn.textContent = 'Akceptuję...';
    try {
      await updateDoc(doc(db, 'challenge_invites', inv.id), {
        status: 'quiz_pending', acceptedAt: serverTimestamp(),
      });
      showToast('Wyzwanie zaakceptowane! Rozwiąż teraz quiz. 🧠', 'success', 4000);
    } catch(e) {
      showToast('Błąd: ' + e.code, 'error');
      btn.disabled = false; btn.textContent = '⚔️ Podejmuję walkę!';
    }
  });

  // Reject
  card.querySelector('.cs-btn-reject')?.addEventListener('click', async () => {
    if (!confirm('Odrzucić wyzwanie?')) return;
    try {
      await updateDoc(doc(db, 'challenge_invites', inv.id), { status: 'rejected' });
      showToast('Wyzwanie odrzucone.', 'info');
    } catch(e) { showToast('Błąd: ' + e.code, 'error'); }
  });

  // Quiz
  card.querySelector('.cs-btn-quiz')?.addEventListener('click', () => {
    const ch = CHALLENGES_DATA.find(c => c.id === inv.challengeId);
    if (ch) _openQuizModal(ch, inv);
  });

  // Complete
  card.querySelector('.cs-btn-complete')?.addEventListener('click', async () => {
    const btn = card.querySelector('.cs-btn-complete');
    btn.disabled = true; btn.textContent = 'Zapisuję...';
    try {
      await _completeChallenge(inv);
    } catch(e) {
      showToast('Błąd: ' + e.code, 'error');
      btn.disabled = false; btn.textContent = '🏆 Ukończyłem wyzwanie';
    }
  });
}


// ════════════════════════════════════════════════════════════
// QUIZ MODAL
// ════════════════════════════════════════════════════════════

function _openQuizModal(ch, inv) {
  _removeModal('cs-quiz-root');

  const quiz    = ch.quiz;
  let   answered = false;
  let   timer    = 30;
  let   interval = null;

  const root = document.createElement('div');
  root.id    = 'cs-quiz-root';

  root.innerHTML = `
    <div class="cs-modal-bg" id="cs-quiz-bg">
      <div class="cs-quiz-modal">

        <!-- Header -->
        <div class="cs-quiz-header">
          <div class="cs-quiz-badge">${ch.badge}</div>
          <div>
            <div class="cs-quiz-ch-title">${_esc(ch.title)}</div>
            <div class="cs-quiz-sub">Quiz odblokowujący wyzwanie</div>
          </div>
          <div class="cs-quiz-timer" id="cs-quiz-timer">30</div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent);margin:.875rem 0;"></div>

        <!-- Pytanie -->
        <div class="cs-quiz-question">${_esc(quiz.question)}</div>

        <!-- Odpowiedzi -->
        <div class="cs-quiz-answers" id="cs-quiz-answers">
          ${quiz.answers.map((ans, i) => `
            <button class="cs-quiz-answer" data-idx="${i}">
              <span class="cs-answer-letter">${['A','B','C'][i]}</span>
              <span class="cs-answer-text">${_esc(ans)}</span>
            </button>
          `).join('')}
        </div>

        <!-- Feedback (hidden) -->
        <div class="cs-quiz-feedback hidden" id="cs-quiz-feedback"></div>

        <!-- XP reward -->
        <div class="cs-quiz-reward">
          <span>🏆</span>
          <span>Poprawna odpowiedź odblokuje wyzwanie i nada <strong style="color:#D4AF37;">+${ch.xp} XP</strong></span>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Timer
  const timerEl = document.getElementById('cs-quiz-timer');
  interval = setInterval(() => {
    timer--;
    if (timerEl) {
      timerEl.textContent = timer;
      if (timer <= 10) timerEl.style.color = '#EF4444';
    }
    if (timer <= 0) {
      clearInterval(interval);
      if (!answered) _quizTimeout(quiz, inv);
    }
  }, 1000);

  // Answers
  document.getElementById('cs-quiz-answers')?.addEventListener('click', async e => {
    const btn = e.target.closest('.cs-quiz-answer');
    if (!btn || answered) return;
    answered = true;
    clearInterval(interval);

    const chosen = parseInt(btn.dataset.idx);
    const correct = quiz.correct;

    // Visual feedback
    document.querySelectorAll('.cs-quiz-answer').forEach((b, i) => {
      b.disabled = true;
      if (i === correct) b.classList.add('correct');
      else if (i === chosen && chosen !== correct) b.classList.add('wrong');
    });

    const feedback = document.getElementById('cs-quiz-feedback');
    if (feedback) {
      feedback.classList.remove('hidden');
      if (chosen === correct) {
        feedback.className = 'cs-quiz-feedback cs-feedback-correct';
        feedback.innerHTML = `
          <div style="font-size:1.5rem;margin-bottom:.375rem;">✅</div>
          <div style="font-weight:700;margin-bottom:.25rem;">Dobrze! Wyzwanie odblokowane!</div>
          <div style="font-size:.875rem;opacity:.85;">Teraz czas na realizację zadania.</div>
        `;
      } else {
        feedback.className = 'cs-quiz-feedback cs-feedback-wrong';
        feedback.innerHTML = `
          <div style="font-size:1.5rem;margin-bottom:.375rem;">❌</div>
          <div style="font-weight:700;margin-bottom:.25rem;">Błędna odpowiedź!</div>
          <div style="font-size:.875rem;opacity:.85;">Spróbuj ponownie za 10 minut.</div>
        `;
      }
    }

    // Zapis wyniku quizu
    try {
      await addDoc(collection(db, 'challenge_quizzes'), {
        userId:       _user.uid,
        inviteId:     inv.id,
        challengeId:  ch.id,
        answer:       chosen,
        correct:      chosen === correct,
        attemptAt:    serverTimestamp(),
      });
    } catch (e) { console.warn('[quiz save]', e.code); }

    if (chosen === correct) {
      // Odblokuj wyzwanie
      try {
        await updateDoc(doc(db, 'challenge_invites', inv.id), {
          status: 'active', quizPassed: true, quizPassedAt: serverTimestamp(),
        });
      } catch (e) { console.warn('[quiz unlock]', e.code); }

      setTimeout(() => root.remove(), 2500);

    } else {
      // Zła odpowiedź — przycisk "Spróbuj ponownie"
      setTimeout(() => {
        if (feedback) {
          feedback.innerHTML += `
            <button id="cs-quiz-retry" style="
              margin-top:.875rem;padding:.625rem 1.25rem;
              background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.25);
              border-radius:10px;color:#D4AF37;font-weight:600;font-size:.875rem;
              cursor:pointer;font-family:'Inter',sans-serif;
            ">Zamknij</button>
          `;
          document.getElementById('cs-quiz-retry')?.addEventListener('click', () => root.remove());
        }
      }, 1000);
    }
  });

  document.getElementById('cs-quiz-bg')?.addEventListener('click', e => {
    if (e.target.id === 'cs-quiz-bg' && answered) root.remove();
  });
}

function _quizTimeout(quiz, inv) {
  const feedback = document.getElementById('cs-quiz-feedback');
  if (feedback) {
    feedback.classList.remove('hidden');
    feedback.className = 'cs-quiz-feedback cs-feedback-wrong';
    feedback.innerHTML = `
      <div style="font-size:1.5rem;margin-bottom:.375rem;">⏰</div>
      <div style="font-weight:700;margin-bottom:.25rem;">Czas minął!</div>
      <div style="font-size:.875rem;opacity:.85;">Zamknij i spróbuj ponownie.</div>
      <button id="cs-quiz-timeout-close" style="
        margin-top:.875rem;padding:.625rem 1.25rem;
        background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.25);
        border-radius:10px;color:#D4AF37;font-weight:600;font-size:.875rem;
        cursor:pointer;font-family:'Inter',sans-serif;">
        Zamknij
      </button>
    `;
    document.getElementById('cs-quiz-timeout-close')?.addEventListener('click', () => {
      document.getElementById('cs-quiz-root')?.remove();
    });
  }
  document.querySelectorAll('.cs-quiz-answer').forEach(b => { b.disabled = true; });
}


// ════════════════════════════════════════════════════════════
// UKOŃCZENIE WYZWANIA
// ════════════════════════════════════════════════════════════

async function _completeChallenge(inv) {
  // Zapisz ukończenie
  await addDoc(collection(db, 'challenge_completions'), {
    userId:      _user.uid,
    inviteId:    inv.id,
    challengeId: inv.challengeId,
    xpEarned:    inv.challengeXP,
    completedAt: serverTimestamp(),
  });

  // Aktualizuj invite
  await updateDoc(doc(db, 'challenge_invites', inv.id), {
    status: 'completed', completedAt: serverTimestamp(),
  });

  // XP dla odbiorcy
  await awardXP(_user.uid, {
    key:   'challenge_complete_' + inv.challengeId,
    xp:    inv.challengeXP,
    label: `Ukończono: ${inv.challengeTitle}`,
  });

  // Bonus XP dla nadawcy
  const senderBonus = Math.max(10, Math.round(inv.challengeXP * 0.2));
  if (inv.challengerId && inv.challengerId !== _user.uid) {
    await awardXP(inv.challengerId, {
      key:   'challenge_sent_bonus_' + inv.id,
      xp:    senderBonus,
      label: `Bonus: ${_user.displayName || 'Wojownik'} ukończył Twoje wyzwanie!`,
    }).catch(() => {});

    createNotification(inv.challengerId, {
      type:  'achievement',
      title: `${_user.displayName || 'Wojownik'} ukończył wyzwanie! 🏆`,
      body:  `"${inv.challengeTitle}" · +${senderBonus} XP bonus dla Ciebie`,
      url:   'challenges.html',
    }).catch(() => {});
  }

  showToast(`🏆 Wyzwanie ukończone! +${inv.challengeXP} XP`, 'success', 5000);
  _showCompletionCelebration(inv);
}

function _showCompletionCelebration(inv) {
  _removeModal('cs-complete-root');
  const root = document.createElement('div');
  root.id    = 'cs-complete-root';
  root.style.cssText = `position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.9);backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;padding:1.5rem;
    animation:fadeIn .25s ease both;cursor:pointer;`;

  root.innerHTML = `
    <div style="background:linear-gradient(160deg,#0E0F12,#141208,#0E0F12);
      border:2px solid #D4AF37;border-radius:20px;padding:2.5rem 2rem;
      max-width:340px;width:100%;text-align:center;
      box-shadow:0 0 80px rgba(212,175,55,.4);
      animation:unlockPop .6s cubic-bezier(.34,1.56,.64,1) both;">
      <div style="font-size:3.5rem;margin-bottom:.75rem;">${inv.challengeBadge ?? '⚔️'}</div>
      <div style="font-size:.625rem;font-weight:700;letter-spacing:.18em;
                  text-transform:uppercase;color:#D4AF37;margin-bottom:.5rem;">
        Wyzwanie ukończone!
      </div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:1.4rem;font-weight:800;
                  color:#fff;text-transform:uppercase;margin-bottom:.375rem;">
        ${_esc(inv.challengeTitle)}
      </div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:2.5rem;font-weight:800;
                  color:#D4AF37;text-shadow:0 0 30px rgba(212,175,55,.7);margin:.5rem 0;">
        +${inv.challengeXP} XP
      </div>
      <div style="font-size:.75rem;color:#4E5464;margin-top:1.25rem;">
        Dotknij aby zamknąć
      </div>
    </div>
  `;

  document.body.appendChild(root);
  root.addEventListener('click', () => root.remove());
  setTimeout(() => root?.remove(), 6000);
}


// ════════════════════════════════════════════════════════════
// TAB 3 — WYSŁANE WYZWANIA
// ════════════════════════════════════════════════════════════

function _listenSent() {
  const el = document.getElementById('cs-sent-list');
  if (!el) return;
  el.innerHTML = _loadingHTML();

  const q = query(
    collection(db, 'challenge_invites'),
    where('challengerId', '==', _user.uid),
  );

  const unsub = onSnapshot(q, snap => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    items.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

    el.innerHTML = '';
    if (!items.length) {
      el.innerHTML = _emptyHTML('📤', 'Brak wysłanych wyzwań', 'Rzuć pierwsze wyzwanie wojownikowi!');
      return;
    }

    items.forEach(inv => {
      const statusMap = {
        pending:    { label: '⏳ Oczekuje na akceptację', color: '#F59E0B' },
        quiz_pending:{ label: '🧠 Quiz w toku',           color: '#4F8CFF' },
        active:     { label: '⚔️ Wyzwanie aktywne',       color: '#16C784' },
        completed:  { label: '✅ Ukończone',               color: '#16C784' },
        rejected:   { label: '❌ Odrzucone',               color: '#EF4444' },
      };
      const s   = statusMap[inv.status] ?? { label: inv.status, color: '#8A7E6A' };
      const ini = (inv.targetName || '?')[0].toUpperCase();
      const dt  = inv.createdAt?.toDate?.();
      const dateStr = dt ? dt.toLocaleDateString('pl-PL', {day:'numeric',month:'short'}) : '';

      const row = document.createElement('div');
      row.className = 'cs-sent-row';
      row.innerHTML = `
        <div class="cs-invite-avatar" style="width:38px;height:38px;font-size:.875rem;">
          ${inv.targetPhoto
            ? `<img src="${_esc(inv.targetPhoto)}" onerror="this.parentElement.textContent='${ini}'">`
            : ini}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.875rem;font-weight:600;color:#E8E0D0;">
            ${_esc(inv.targetName || 'Wojownik')}
          </div>
          <div style="font-size:.8125rem;color:#8A7E6A;">
            ${inv.challengeBadge??'⚔️'} ${_esc(inv.challengeTitle)} · +${inv.challengeXP} XP
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.75rem;font-weight:700;color:${s.color};">${s.label}</div>
          <div style="font-size:.6875rem;color:#4E5464;margin-top:.1rem;">${dateStr}</div>
        </div>
      `;
      el.appendChild(row);
    });
  }, err => {
    el.innerHTML = _emptyHTML('⚠️', 'Błąd', err.code);
  });

  _unsubs.push(unsub);
}


// ════════════════════════════════════════════════════════════
// TAB 4 — AKTYWNE WYZWANIA
// ════════════════════════════════════════════════════════════

function _listenActive() {
  const el = document.getElementById('cs-active-list');
  if (!el) return;
  el.innerHTML = _loadingHTML();

  const q = query(
    collection(db, 'challenge_invites'),
    where('targetId', '==', _user.uid),
    where('status',   '==', 'active'),
  );

  const unsub = onSnapshot(q, snap => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    el.innerHTML = '';

    if (!items.length) {
      el.innerHTML = _emptyHTML('⚔️', 'Brak aktywnych wyzwań',
        'Zaakceptuj odebrane wyzwanie i zalicz quiz, aby aktywować.');
      return;
    }

    items.forEach(inv => {
      const ini = (inv.challengerName || '?')[0].toUpperCase();
      const card = document.createElement('div');
      card.className = 'cs-invite-card';
      card.style.borderColor = 'rgba(22,199,132,.3)';
      card.innerHTML = `
        <div class="cs-invite-header">
          <div class="cs-invite-avatar">
            ${inv.challengerPhoto
              ? `<img src="${_esc(inv.challengerPhoto)}" onerror="this.parentElement.textContent='${ini}'">`
              : ini}
          </div>
          <div class="cs-invite-info">
            <div class="cs-invite-challenge" style="font-size:1rem;">
              ${inv.challengeBadge??'⚔️'} ${_esc(inv.challengeTitle)}
            </div>
            <div style="font-size:.8125rem;color:#16C784;font-weight:600;margin:.25rem 0;">
              ✅ Quiz zaliczony — czas na realizację!
            </div>
            <div style="font-size:.8125rem;color:#8A7E6A;">
              Od: ${_esc(inv.challengerName || 'Wojownik')} · +${inv.challengeXP} XP
            </div>
          </div>
        </div>
        <div style="font-size:.875rem;color:#E8E0D0;line-height:1.65;
          padding:.875rem;background:rgba(212,175,55,.05);
          border-radius:10px;border-left:3px solid rgba(212,175,55,.3);
          margin:.875rem 0;font-style:italic;">
          ${_esc(_getChallengeTask(inv.challengeId))}
        </div>
        <button class="cs-btn-complete" data-id="${inv.id}" style="
          width:100%;padding:.875rem;
          background:linear-gradient(135deg,#16C784,#0ea568);
          border:none;border-radius:12px;color:#fff;font-weight:700;
          font-family:'Rajdhani',sans-serif;font-size:1rem;
          text-transform:uppercase;letter-spacing:.04em;cursor:pointer;">
          🏆 Ukończyłem wyzwanie!
        </button>
      `;

      card.querySelector('.cs-btn-complete')?.addEventListener('click', async () => {
        const btn = card.querySelector('.cs-btn-complete');
        btn.disabled = true; btn.textContent = 'Zapisuję...';
        try { await _completeChallenge(inv); }
        catch(e) {
          showToast('Błąd: ' + e.code, 'error');
          btn.disabled = false; btn.textContent = '🏆 Ukończyłem wyzwanie!';
        }
      });

      el.appendChild(card);
    });
  }, err => {
    el.innerHTML = _emptyHTML('⚠️', 'Błąd', err.code);
  });

  _unsubs.push(unsub);
}


// ════════════════════════════════════════════════════════════
// TAB 5 — HISTORIA
// ════════════════════════════════════════════════════════════

function _listenHistory() {
  const el = document.getElementById('cs-history-list');
  if (!el) return;
  el.innerHTML = _loadingHTML();

  const q = query(
    collection(db, 'challenge_invites'),
    where('status', 'in', ['completed', 'rejected']),
  );

  const unsub = onSnapshot(q, snap => {
    let items = [];
    snap.forEach(d => {
      const data = d.data();
      // Pokazuj tylko gdzie user jest uczestnikiem
      if (data.targetId === _user.uid || data.challengerId === _user.uid) {
        items.push({ id: d.id, ...data });
      }
    });
    items.sort((a,b) => (b.completedAt?.seconds||b.createdAt?.seconds||0)
                      - (a.completedAt?.seconds||a.createdAt?.seconds||0));

    el.innerHTML = '';
    if (!items.length) {
      el.innerHTML = _emptyHTML('🏁', 'Brak historii', 'Ukończone i odrzucone wyzwania pojawią się tutaj.');
      return;
    }

    items.forEach(inv => {
      const isMe      = inv.targetId === _user.uid;
      const completed = inv.status === 'completed';
      const ini       = ((isMe ? inv.challengerName : inv.targetName) || '?')[0].toUpperCase();
      const dt        = (inv.completedAt || inv.createdAt)?.toDate?.();
      const dateStr   = dt ? dt.toLocaleDateString('pl-PL', {day:'numeric',month:'short',year:'numeric'}) : '';

      const row = document.createElement('div');
      row.className = 'cs-sent-row';
      row.style.opacity = completed ? '1' : '0.6';
      row.innerHTML = `
        <div style="font-size:1.5rem;flex-shrink:0;">
          ${completed ? inv.challengeBadge??'⚔️' : '❌'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.875rem;font-weight:600;color:${completed?'#E8E0D0':'#666'};">
            ${_esc(inv.challengeTitle)}
          </div>
          <div style="font-size:.75rem;color:#666;">
            ${isMe ? `Od: ${_esc(inv.challengerName||'?')}` : `Do: ${_esc(inv.targetName||'?')}`}
            ${completed && isMe ? ` · +${inv.challengeXP} XP zdobyte` : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.75rem;font-weight:700;
            color:${completed?'#16C784':'#EF4444'};">
            ${completed ? '✅ Ukończone' : '❌ Odrzucone'}
          </div>
          <div style="font-size:.6875rem;color:#4E5464;margin-top:.1rem;">${dateStr}</div>
        </div>
      `;
      el.appendChild(row);
    });
  }, err => {
    el.innerHTML = _emptyHTML('⚠️', 'Błąd', err.code);
  });

  _unsubs.push(unsub);
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _getChallengeTask(id) {
  return CHALLENGES_DATA.find(c => c.id === id)?.task ?? 'Wykonaj zadanie wyzwania.';
}

function _emptyHTML(icon, title, text) {
  return `
    <div style="text-align:center;padding:3rem 1rem;">
      <div style="font-size:2.5rem;margin-bottom:.75rem;">${icon}</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;
                  color:#D4AF37;text-transform:uppercase;margin-bottom:.375rem;">${title}</div>
      <p style="font-size:.875rem;color:#4E5464;line-height:1.6;font-style:italic;">${text}</p>
    </div>`;
}

function _loadingHTML() {
  return `
    <div style="text-align:center;padding:2rem;">
      <div style="display:inline-block;width:24px;height:24px;border-radius:50%;
        border:2px solid rgba(212,175,55,.2);border-top-color:#D4AF37;
        animation:chSpin .65s linear infinite;"></div>
    </div>`;
}

function _removeModal(id) {
  document.getElementById(id)?.remove();
}

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export { _openSendModal as openSendInviteModal };
