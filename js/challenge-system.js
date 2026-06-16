/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — challenge-system.js v2
 * System: Rzucenie → Quiz Areny → Akceptacja → Realizacja → XP
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Kolekcje Firestore:
 *   challenge_invites/{id}     — zaproszenia + stan
 *   challenge_quizzes/{id}     — wyniki quizów
 *   challenge_completions/{id} — ukończone wyzwania
 *
 * Eksporty:
 *   CHALLENGES_DATA
 *   initChallengeSystem(user, userData)
 */

import { db, COL } from './firebase.js';
import { showToast } from './auth.js';
import { awardXP }   from './xp.js';
import { createNotification } from './notifications.js';

import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, onSnapshot, query, where,
  serverTimestamp, Timestamp, increment,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// WYZWANIA + QUIZY ARENY
// ════════════════════════════════════════════════════════════

export const CHALLENGES_DATA = [
  {
    id: 'lowca_wezy', order: 1,
    title: 'Łowca Węży', badge: '🏹', xp: 30,
    difficulty: 'easy', category: 'Odkrycie',
    image: 'assets/challenges/lowca-wezy.png',
    desc: 'Uświadom sobie swoją główną przeszkodę.',
    task: 'Nazwij jedną rzecz, która najbardziej przeszkadza Ci w osiągnięciu celu. Zapisz ją i podziel się z wojownikami na feedzie.',
    quiz: {
      question: 'Który skurwiały wąż dziś pierwszy zaczął ci robić w bani taki cyrk, jakbyś wstał po nocy, której wolałbyś nie pamiętać?',
      answers: [
        'Ten, co mi od rana pierdoli, że „chodź, będzie zabawnie", a kończy się płaczem.',
        'Ten, co siedzi w głowie jak lokator bez umowy i robi syf.',
        'Ten największy, co ciągnie mnie w stronę decyzji, po których mam ochotę jebnąć się w czoło.',
      ],
      correct: 2,
      wrongMessages: [
        'Hydra śmieje się z twojej odpowiedzi.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
        'Arena uznaje tę odpowiedź za podejrzanie miękką.',
        'Pochodnia przygasa. Myśl jeszcze raz.',
      ],
    },
  },
  {
    id: 'tropiciel_hydry', order: 2,
    title: 'Tropiciel Hydry', badge: '🔍', xp: 40,
    difficulty: 'easy', category: 'Planowanie',
    image: 'assets/challenges/tropiciel-hydry.png',
    desc: 'Stwórz plan walki z przeszkodą.',
    task: 'Zapisz plan rozwiązania jednego problemu w 3 krokach. Opublikuj go na arenie.',
    quiz: {
      question: 'Kiedy ostatnio jedna myśl rozjebała ci się na dziesięć i każda darła mordę jak halun po złej nocy?',
      answers: [
        'Wczoraj — mózg mi się rozlał jak tanie piwo po chodniku.',
        'Dziś — jedna myśl i nagle cały jebany cyrk.',
        'Codziennie — hydra mnie śledzi jak stary cieć spod klatki.',
      ],
      correct: 1,
      wrongMessages: [
        'Kwiatowy Zakon nie jest zachwycony.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
        'Hydra śmieje się z twojej odpowiedzi.',
        'Pochodnia przygasa. Myśl jeszcze raz.',
      ],
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
      question: 'Co próbujesz zgniatać jako pierwsze, kiedy czujesz, że mózg ci się robi jak po tripie, którego nikt nie zamawiał?',
      answers: [
        'Temat, zanim on zgniata mnie.',
        'Swoje pierdolenie, bo ono najgłośniej drze ryja.',
        'Wszystko naraz, jakbym miał młot bojowy i ADHD.',
      ],
      correct: 0,
      wrongMessages: [
        'Arena uznaje tę odpowiedź za podejrzanie miękką.',
        'Hydra śmieje się z twojej odpowiedzi.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
      ],
    },
  },
  {
    id: 'maly_na_rozruch', order: 4,
    title: 'Mały Na Rozruch', badge: '💸', xp: 70,
    difficulty: 'medium', category: 'Działanie',
    image: 'assets/challenges/maly-na-rozruch.png',
    desc: 'Zacznij odkładane zadanie w 10 minut.',
    task: 'W ciągu 10 minut od otwarcia aplikacji — rozpocznij jedno odkładane zadanie.',
    quiz: {
      question: 'Jaki ruch robisz, zanim odklejka pokaże ci, że za dużo zajebałeś?',
      answers: [
        'Odpalam zadanie, zanim mózg zacznie kombinować jak typek pod Żabką.',
        'Robię cokolwiek, żeby nie wyglądać jak życiowy zjazd.',
        'Włączam tryb „działam", zanim tryb „uciekam" mnie odklei.',
      ],
      correct: 2,
      wrongMessages: [
        'Pochodnia przygasa. Myśl jeszcze raz.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
        'Hydra śmieje się z twojej odpowiedzi.',
      ],
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
      question: 'Co robisz, zanim hydra zacznie wyglądać jakby miała 20 głów i każda cię wyzywała od idiotów?',
      answers: [
        'Wychodzę, bo już mnie wkurwia.',
        'Macham szabelką, zanim mnie odklei.',
        'Jedną rzecz, ale z takim pierdolnięciem, że aż echo idzie.',
      ],
      correct: 1,
      wrongMessages: [
        'Kwiatowy Zakon nie jest zachwycony.',
        'Arena uznaje tę odpowiedź za podejrzanie miękką.',
        'Hydra śmieje się z twojej odpowiedzi.',
      ],
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
      question: 'Jak wygląda twój tydzień, kiedy próbujesz dojść do siebie po odklejkach? Odpoczynek czy udawanie, że żyjesz?',
      answers: [
        'Trzepię się codziennie, żeby nie paść jak cienias.',
        'Oglądam seriale, bo hydra mnie wpierdoli.',
        'Udaję, że mam ogar, ale to kłamstwo.',
      ],
      correct: 1,
      wrongMessages: [
        'Wąż uciekł. Spróbuj jeszcze raz.',
        'Pochodnia przygasa. Myśl jeszcze raz.',
        'Hydra śmieje się z twojej odpowiedzi.',
      ],
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
      question: 'Kiedy ostatnio obudziłeś się po epickiej wyprawie i pomyślałeś: no pięknie, znowu odjebałem?',
      answers: [
        'Wczoraj — klasyk.',
        'Dziś — jeszcze mnie trzyma.',
        'Nie pamiętam, ale to chyba nie jest dobry znak.',
      ],
      correct: 1,
      wrongMessages: [
        'Arena uznaje tę odpowiedź za podejrzanie miękką.',
        'Kwiatowy Zakon nie jest zachwycony.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
      ],
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
      question: 'Jakie odpały przychodzą ci do głowy, kiedy masz wrażenie, że jesteś nieśmiertelny jak po złej fantazji?',
      answers: [
        'Że mogę wszystko — nawet to, czego nie powinienem.',
        'Że jestem królem osiedla, dopóki nie wstanę z łóżka.',
        'Że jutro będę lepszy, ale jutro nigdy nie przychodzi.',
      ],
      correct: 0,
      wrongMessages: [
        'Hydra śmieje się z twojej odpowiedzi.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
        'Pochodnia przygasa. Myśl jeszcze raz.',
        'Arena uznaje tę odpowiedź za podejrzanie miękką.',
      ],
    },
  },
  {
    id: 'legenda_wojownikow', order: 9,
    title: 'Legenda Wojowników', badge: '🏆', xp: 300,
    difficulty: 'legend', category: 'Specjalne',
    image: 'assets/challenges/duch-areny.png', // fallback
    desc: 'Zostań Legendą Areny.',
    task: 'Ukończ wszystkie poprzednie wyzwania i potwierdź swoje miejsce w legendach areny.',
    quiz: {
      question: 'Kiedy ostatnio czułeś się jak legenda… a potem rzeczywistość przypomniała ci, że jesteś z osiedla i masz rachunki?',
      answers: [
        'Wczoraj — odlot, a potem szybki powrót na ziemię.',
        'Dziś — pięć minut chwały, reszta wstyd.',
        'Codziennie — to mój cykl życia.',
      ],
      correct: 0,
      wrongMessages: [
        'Kwiatowy Zakon nie jest zachwycony.',
        'Hydra śmieje się z twojej odpowiedzi.',
        'Arena uznaje tę odpowiedź za podejrzanie miękką.',
        'Wąż uciekł. Spróbuj jeszcze raz.',
      ],
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

let _user       = null;
let _userData   = null;
let _unsubs     = [];
let _activeTab  = 'challenges';


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
  ['challenges','received','sent','active','history'].forEach(s => {
    const el = document.getElementById(`cs-section-${s}`);
    if (el) el.style.display = s === tab ? '' : 'none';
  });
  _unsubs.forEach(u => { try { u(); } catch {} });
  _unsubs = [];
  if (tab === 'challenges') _renderCards();
  if (tab === 'received')   _listenReceived();
  if (tab === 'sent')       _listenSent();
  if (tab === 'active')     _listenActive();
  if (tab === 'history')    _listenHistory();
}


// ════════════════════════════════════════════════════════════
// TAB 1 — KARTY WYZWAŃ
// ════════════════════════════════════════════════════════════

function _renderCards() {
  const grid = document.getElementById('cs-cards-grid');
  if (!grid) return;
  grid.innerHTML = '';
  CHALLENGES_DATA.forEach((ch, idx) => {
    const card = _makeCard(ch, idx);
    grid.appendChild(card);
  });
}

function _makeCard(ch, idx) {
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
      <div class="ch-card-title ch-gold-pulse">${_esc(ch.title)}</div>
      <div class="ch-card-desc">${_esc(ch.desc)}</div>
    </div>
    <div class="ch-card-footer">
      <button class="ch-card-btn cs-throw-btn" data-id="${ch.id}">⚔️ Rzuć wyzwanie</button>
    </div>
  `;
  card.addEventListener('click', e => {
    if (!e.target.closest('.cs-throw-btn')) _openDetailModal(ch);
  });
  card.querySelector('.cs-throw-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    _openSendModal(ch);
  });
  return card;
}


// ════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════

function _openDetailModal(ch) {
  _rm('cs-detail-root');
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
            <div class="ch-detail-task-label">Zadanie</div>
            <div class="ch-detail-task">${_esc(ch.task)}</div>
          </div>
          <div class="ch-detail-reward">
            <div class="ch-detail-reward-icon">🏆</div>
            <div>
              <div class="ch-detail-reward-xp">+${ch.xp} XP</div>
              <div class="ch-detail-reward-badge">Po quizie i ukończeniu wyzwania</div>
            </div>
          </div>
          <button class="ch-detail-action-btn" id="cs-detail-btn">⚔️ Rzuć wyzwanie wojownikowi</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(root);
  root.querySelector('#cs-detail-close')?.addEventListener('click', () => root.remove());
  document.getElementById('cs-detail-bg')?.addEventListener('click', e => {
    if (e.target.id === 'cs-detail-bg') root.remove();
  });
  root.querySelector('#cs-detail-btn')?.addEventListener('click', () => {
    root.remove();
    _openSendModal(ch);
  });
}


// ════════════════════════════════════════════════════════════
// SEND MODAL — ARENA WOJOWNIKÓW
// ════════════════════════════════════════════════════════════

async function _openSendModal(ch) {
  if (!_user) { showToast('Musisz być zalogowany.', 'error'); return; }
  _rm('cs-send-root');

  let users = [];
  try {
    const snap = await getDocs(collection(db, COL.USERS));
    snap.forEach(d => { if (d.id !== _user.uid) users.push({ uid: d.id, ...d.data() }); });
    users.sort((a,b) => (b.points||0) - (a.points||0));
  } catch(e) {
    showToast('Błąd pobierania wojowników: ' + (e.code||e.message), 'error');
    return;
  }
  if (!users.length) {
    showToast('Brak innych wojowników. Zaproś znajomych! 🛡️', 'info', 5000);
    return;
  }

  let selUser = users[0];
  let searchTerm = '';

  const root = document.createElement('div');
  root.id    = 'cs-send-root';

  root.innerHTML = `
    <div class="cs-modal-bg" id="cs-send-bg">
      <div class="cs-modal">
        <div class="cs-modal-header">
          <div>
            <div class="cs-modal-title">⚔️ Arena Wojowników</div>
            <div class="cs-modal-sub">Wybierz wojownika i rzuć wyzwanie</div>
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

        <!-- Wyszukiwarka -->
        <div style="position:relative;margin-bottom:.625rem;">
          <input id="cs-search-input" type="text" placeholder="🔍 Szukaj wojownika..."
            style="width:100%;background:#121317;border:1px solid rgba(212,175,55,.2);
            border-radius:10px;padding:.625rem 1rem;color:#E8E0D0;font-size:.875rem;
            font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;" />
        </div>

        <!-- Lista wojowników -->
        <div class="cs-modal-label">Wojownicy (<span id="cs-users-count">${users.length}</span>)</div>
        <div class="cs-users-list" id="cs-users-list"></div>

        <!-- Wybrany cel -->
        <div class="cs-target-info">
          🎯 Wyzywie:
          <strong style="color:#D4AF37;" id="cs-target-name">${_esc(selUser.displayName||'Wojownik')}</strong>
        </div>

        <button class="cs-send-btn" id="cs-send-btn">⚔️ Rzuć Wyzwanie!</button>
      </div>
    </div>`;
  document.body.appendChild(root);

  // Render users
  const renderUsers = () => {
    const list = document.getElementById('cs-users-list');
    const countEl = document.getElementById('cs-users-count');
    if (!list) return;
    const filtered = users.filter(u =>
      !searchTerm || (u.displayName||'').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (countEl) countEl.textContent = filtered.length;
    list.innerHTML = '';
    filtered.forEach(u => {
      const sel = u.uid === selUser?.uid;
      const ini = (u.displayName||'?')[0].toUpperCase();
      const { emoji } = _rankFromPoints(u.points||0);
      const row = document.createElement('div');
      row.className = `cs-user-row${sel ? ' selected' : ''}`;
      row.dataset.uid = u.uid;
      row.innerHTML = `
        <div class="cs-user-avatar">
          ${u.photoURL
            ? `<img src="${_esc(u.photoURL)}" onerror="this.parentElement.textContent='${ini}'">`
            : ini}
        </div>
        <div class="cs-user-info">
          <div class="cs-user-name">${_esc(u.displayName||'Wojownik')}</div>
          <div class="cs-user-sub">${emoji} ${u.rank||'Rookie'} · ${(u.points||0).toLocaleString('pl-PL')} XP</div>
        </div>
        ${sel ? '<div class="cs-user-check">✓</div>' : ''}
      `;
      row.addEventListener('click', () => {
        selUser = u;
        const nameEl = document.getElementById('cs-target-name');
        if (nameEl) nameEl.textContent = u.displayName || 'Wojownik';
        renderUsers();
      });
      list.appendChild(row);
    });
  };

  renderUsers();

  // Search
  document.getElementById('cs-search-input')?.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderUsers();
  });

  // Close
  const close = () => root.remove();
  document.getElementById('cs-send-close')?.addEventListener('click', close);
  document.getElementById('cs-send-bg')?.addEventListener('click', e => {
    if (e.target.id === 'cs-send-bg') close();
  });

  // Send
  document.getElementById('cs-send-btn')?.addEventListener('click', async () => {
    if (!selUser) { showToast('Wybierz wojownika!', 'error'); return; }
    const btn = document.getElementById('cs-send-btn');
    btn.disabled = true; btn.textContent = 'Wysyłam...';
    try {
      await _sendInvite(ch, selUser);
      close();
    } catch(e) {
      btn.disabled = false; btn.textContent = '⚔️ Rzuć Wyzwanie!';
    }
  });
}

function _rankFromPoints(pts) {
  if (pts >= 10000) return { emoji: '💎' };
  if (pts >= 2000)  return { emoji: '🥇' };
  if (pts >= 500)   return { emoji: '🥈' };
  return { emoji: '🥉' };
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
    targetPhoto:    targetUser.photoURL    || '',
    challengeId:    ch.id,
    challengeTitle: ch.title,
    challengeBadge: ch.badge,
    challengeXP:    ch.xp,
    status:         'pending',
    quizPassed:     false,
    expiresAt:      Timestamp.fromDate(new Date(Date.now() + 72 * 3600 * 1000)),
    createdAt:      serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'challenge_invites'), data);

  // Aktualizuj licznik wysłanych wyzwań dla nadawcy
  try {
    await updateDoc(doc(db, 'users', _user.uid), {
      challengesSent: increment(1),
    });
  } catch (e) { console.warn('[update-sent-counter]', e); }

  // Powiadomienie in-app
  createNotification(targetUser.uid, {
    type:  'duel',
    title: `${data.challengerName} rzuca Ci wyzwanie! ⚔️`,
    body:  `"${ch.title}" · +${ch.xp} XP · 72h na odpowiedź`,
    url:   'challenges.html',
  }).catch(() => {});

  showToast(`⚔️ Wyzwanie rzucone! ${targetUser.displayName||'Wojownik'} ma 72h na odpowiedź.`, 'success', 5000);
  return ref;
}


// ════════════════════════════════════════════════════════════
// TAB 2 — ODEBRANE WYZWANIA
// ════════════════════════════════════════════════════════════

function _listenReceived() {
  const el = document.getElementById('cs-received-list');
  if (!el) return;
  el.innerHTML = _spinnerHTML();
  const q = query(
    collection(db, 'challenge_invites'),
    where('targetId', '==', _user.uid),
    where('status',   'in', ['pending','quiz_pending','active']),
  );
  const unsub = onSnapshot(q, snap => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    items.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    el.innerHTML = '';
    if (!items.length) {
      el.innerHTML = _emptyHTML('📭', 'Brak odebranych wyzwań', 'Nikt jeszcze Cię nie wyzwał. Poczekaj na wyzwanie.');
      return;
    }
    items.forEach((inv, i) => {
      const card = _makeReceivedCard(inv);
      card.style.animationDelay = (i * 0.06) + 's';
      el.appendChild(card);
    });
  }, err => { el.innerHTML = _emptyHTML('⚠️', 'Błąd', err.code); });
  _unsubs.push(unsub);
}

function _makeReceivedCard(inv) {
  const card = document.createElement('div');
  card.className = 'cs-invite-card';

  const statusLabels = {
    pending:      { text: '⏳ Oczekuje na akceptację', color: '#F59E0B' },
    quiz_pending: { text: '🧠 Quiz do wykonania',       color: '#4F8CFF' },
    active:       { text: '⚔️ Wyzwanie aktywne',        color: '#16C784' },
  };
  const s = statusLabels[inv.status] ?? { text: inv.status, color: '#8A7E6A' };
  const expiry    = inv.expiresAt?.toDate?.() ?? new Date(Date.now() + 72*3600000);
  const hoursLeft = Math.max(0, Math.floor((expiry - Date.now()) / 3600000));
  const ini       = (inv.challengerName||'?')[0].toUpperCase();

  card.innerHTML = `
    <div class="cs-invite-header">
      <div class="cs-invite-avatar">
        ${inv.challengerPhoto
          ? `<img src="${_esc(inv.challengerPhoto)}" onerror="this.parentElement.textContent='${ini}'">`
          : ini}
      </div>
      <div class="cs-invite-info">
        <div class="cs-invite-from">
          <span style="color:#D4AF37;">${_esc(inv.challengerName||'Wojownik')}</span>
          rzucił Ci wyzwanie:
        </div>
        <div class="cs-invite-challenge">
          ${inv.challengeBadge??'⚔️'} „${_esc(inv.challengeTitle)}" · +${inv.challengeXP} XP
        </div>
        <div style="display:flex;align-items:center;gap:.75rem;margin-top:.3rem;flex-wrap:wrap;">
          <span style="font-size:.75rem;font-weight:700;color:${s.color};">${s.text}</span>
          <span style="font-size:.6875rem;color:${hoursLeft<6?'#EF4444':'#8A7E6A'};">
            ⏳ ${hoursLeft}h pozostało
          </span>
        </div>
      </div>
    </div>
    <div id="cs-actions-${inv.id}">
      ${_receivedActionsHTML(inv)}
    </div>
  `;
  _bindReceivedActions(card, inv);
  return card;
}

function _receivedActionsHTML(inv) {
  if (inv.status === 'pending') {
    return `
      <div style="display:flex;gap:.625rem;flex-wrap:wrap;">
        <button class="cs-btn-accept" data-id="${inv.id}" style="flex:2;">
          ⚔️ Przyjmuję wyzwanie!
        </button>
        <button class="cs-btn-reject" data-id="${inv.id}" style="flex:1;">
          Odrzucam
        </button>
      </div>`;
  }
  if (inv.status === 'quiz_pending') {
    return `<button class="cs-btn-quiz" data-id="${inv.id}" data-ch-id="${inv.challengeId}"
      style="width:100%;">🧠 Rozwiąż Quiz Areny</button>`;
  }
  if (inv.status === 'active') {
    const task = _getTask(inv.challengeId);
    return `
      <div style="font-size:.8125rem;color:#16C784;font-weight:600;margin-bottom:.5rem;">
        ✅ Quiz zaliczony! Czas na realizację:
      </div>
      <div style="font-size:.875rem;color:#E8E0D0;line-height:1.65;
        padding:.875rem;background:rgba(212,175,55,.05);border-radius:10px;
        border-left:3px solid rgba(212,175,55,.3);margin-bottom:.75rem;font-style:italic;">
        ${_esc(task)}
      </div>
      <button class="cs-btn-complete" data-id="${inv.id}" style="width:100%;">
        🏆 Ukończyłem wyzwanie!
      </button>`;
  }
  return '';
}

function _bindReceivedActions(card, inv) {
  card.querySelector('.cs-btn-accept')?.addEventListener('click', async () => {
    const btn = card.querySelector('.cs-btn-accept');
    btn.disabled = true; btn.textContent = 'Akceptuję...';
    try {
      await updateDoc(doc(db, 'challenge_invites', inv.id), {
        status: 'quiz_pending', acceptedAt: serverTimestamp(),
      });
      showToast('Wyzwanie zaakceptowane! Rozwiąż teraz Quiz Areny. 🧠', 'success', 4000);
    } catch(e) {
      showToast('Błąd: ' + e.code, 'error');
      btn.disabled = false; btn.textContent = '⚔️ Przyjmuję wyzwanie!';
    }
  });

  card.querySelector('.cs-btn-reject')?.addEventListener('click', async () => {
    if (!confirm('Odrzucić wyzwanie?')) return;
    try {
      await updateDoc(doc(db, 'challenge_invites', inv.id), { status: 'rejected' });
      showToast('Wyzwanie odrzucone.', 'info');
    } catch(e) { showToast('Błąd: ' + e.code, 'error'); }
  });

  card.querySelector('.cs-btn-quiz')?.addEventListener('click', () => {
    const ch = CHALLENGES_DATA.find(c => c.id === inv.challengeId);
    if (ch) _openQuizModal(ch, inv);
    else showToast('Nie znaleziono wyzwania.', 'error');
  });

  card.querySelector('.cs-btn-complete')?.addEventListener('click', async () => {
    const btn = card.querySelector('.cs-btn-complete');
    btn.disabled = true; btn.textContent = 'Zapisuję...';
    try {
      await _completeChallenge(inv);
    } catch(e) {
      showToast('Błąd: ' + e.code, 'error');
      btn.disabled = false; btn.textContent = '🏆 Ukończyłem wyzwanie!';
    }
  });
}


// ════════════════════════════════════════════════════════════
// QUIZ ARENY
// ════════════════════════════════════════════════════════════

function _openQuizModal(ch, inv) {
  _rm('cs-quiz-root');
  const quiz = ch.quiz;
  let answered = false;
  let timer    = 30;
  let interval = null;
  const letters = ['A','B','C'];

  const root = document.createElement('div');
  root.id    = 'cs-quiz-root';
  root.innerHTML = `
    <div class="cs-modal-bg" id="cs-quiz-bg">
      <div class="cs-quiz-modal">
        <!-- Header -->
        <div class="cs-quiz-header">
          <div class="cs-quiz-badge">${ch.badge}</div>
          <div style="flex:1;min-width:0;">
            <div class="cs-quiz-ch-title">${_esc(ch.title)}</div>
            <div class="cs-quiz-sub">⚔️ Quiz Areny — odblokuj wyzwanie</div>
          </div>
          <div class="cs-quiz-timer" id="cs-quiz-timer">30</div>
        </div>

        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent);margin:.875rem 0;"></div>

        <!-- Pytanie -->
        <div class="cs-quiz-question" style="font-size:.9375rem;">${_esc(quiz.question)}</div>

        <!-- Odpowiedzi -->
        <div class="cs-quiz-answers" id="cs-quiz-answers">
          ${quiz.answers.map((ans, i) => `
            <button class="cs-quiz-answer" data-idx="${i}">
              <span class="cs-answer-letter">${letters[i]}</span>
              <span class="cs-answer-text">${_esc(ans)}</span>
            </button>
          `).join('')}
        </div>

        <!-- Feedback -->
        <div class="cs-quiz-feedback hidden" id="cs-quiz-feedback"></div>

        <!-- Reward -->
        <div class="cs-quiz-reward">
          <span>🏆</span>
          <span>Poprawna odpowiedź odblokuje wyzwanie · <strong style="color:#D4AF37;">+${ch.xp} XP</strong></span>
        </div>
      </div>
    </div>`;
  document.body.appendChild(root);

  // Timer
  const timerEl = document.getElementById('cs-quiz-timer');
  interval = setInterval(() => {
    timer--;
    if (timerEl) {
      timerEl.textContent = timer;
      if (timer <= 10) timerEl.style.color = '#EF4444';
      if (timer <= 5)  timerEl.style.animation = 'notifPop .5s ease infinite';
    }
    if (timer <= 0) { clearInterval(interval); if (!answered) _timeoutQuiz(); }
  }, 1000);

  // Odpowiedzi
  document.getElementById('cs-quiz-answers')?.addEventListener('click', async e => {
    const btn = e.target.closest('.cs-quiz-answer');
    if (!btn || answered) return;
    answered = true;
    clearInterval(interval);

    const chosen  = parseInt(btn.dataset.idx);
    const correct = quiz.correct;
    const isRight = chosen === correct;

    // Wizualny feedback
    document.querySelectorAll('.cs-quiz-answer').forEach((b, i) => {
      b.disabled = true;
      if (i === correct)                    b.classList.add('correct');
      else if (i === chosen && !isRight)    b.classList.add('wrong');
    });

    const fb = document.getElementById('cs-quiz-feedback');
    if (fb) {
      fb.classList.remove('hidden');
      if (isRight) {
        fb.className = 'cs-quiz-feedback cs-feedback-correct';
        fb.innerHTML = `
          <div style="font-size:1.5rem;margin-bottom:.375rem;">⚔️</div>
          <div style="font-weight:700;font-family:'Rajdhani',sans-serif;
                      font-size:1.1rem;margin-bottom:.25rem;text-transform:uppercase;">
            Arena uznała Cię za godnego walki.
          </div>
          <div style="font-size:.875rem;opacity:.85;">Wyzwanie odblokowane! Czas działać.</div>`;
      } else {
        const msgs = quiz.wrongMessages ?? ['Wąż uciekł. Spróbuj jeszcze raz.'];
        const msg  = msgs[Math.floor(Math.random() * msgs.length)];
        fb.className = 'cs-quiz-feedback cs-feedback-wrong';
        fb.innerHTML = `
          <div style="font-size:1.5rem;margin-bottom:.375rem;">🐍</div>
          <div style="font-weight:700;font-family:'Rajdhani',sans-serif;
                      font-size:1.05rem;margin-bottom:.25rem;">${_esc(msg)}</div>
          <div style="font-size:.875rem;opacity:.75;">Bez utraty XP. Możesz spróbować ponownie.</div>`;
      }
    }

    // Zapis
    try {
      await addDoc(collection(db, 'challenge_quizzes'), {
        userId: _user.uid, inviteId: inv.id, challengeId: ch.id,
        chosenAnswer: chosen, correct: isRight, attemptAt: serverTimestamp(),
      });
    } catch(e) { console.warn('[quiz save]', e.code); }

    if (isRight) {
      try {
        await updateDoc(doc(db, 'challenge_invites', inv.id), {
          status: 'active', quizPassed: true, quizPassedAt: serverTimestamp(),
        });
      } catch(e) { console.warn('[quiz unlock]', e.code); }

      // Przycisk zamknięcia
      setTimeout(() => {
        if (fb) fb.innerHTML += `
          <button id="cs-quiz-ok" style="
            margin-top:.875rem;width:100%;padding:.75rem;
            background:linear-gradient(135deg,#D4AF37,#A88B28);
            border:none;border-radius:12px;color:#000;
            font-family:'Rajdhani',sans-serif;font-size:.9375rem;font-weight:800;
            letter-spacing:.04em;text-transform:uppercase;cursor:pointer;">
            ROZPOCZNIJ WYZWANIE →
          </button>`;
        document.getElementById('cs-quiz-ok')?.addEventListener('click', () => root.remove());
      }, 800);

    } else {
      setTimeout(() => {
        if (fb) fb.innerHTML += `
          <button id="cs-quiz-retry" style="
            margin-top:.875rem;padding:.625rem 1.25rem;
            background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.25);
            border-radius:10px;color:#D4AF37;font-weight:600;font-size:.875rem;
            cursor:pointer;font-family:'Inter',sans-serif;">
            Zamknij i spróbuj ponownie
          </button>`;
        document.getElementById('cs-quiz-retry')?.addEventListener('click', () => root.remove());
      }, 800);
    }
  });

  document.getElementById('cs-quiz-bg')?.addEventListener('click', e => {
    if (e.target.id === 'cs-quiz-bg' && answered) root.remove();
  });
}

function _timeoutQuiz() {
  const fb = document.getElementById('cs-quiz-feedback');
  if (!fb) return;
  fb.classList.remove('hidden');
  fb.className = 'cs-quiz-feedback cs-feedback-wrong';
  fb.innerHTML = `
    <div style="font-size:1.5rem;margin-bottom:.375rem;">⏰</div>
    <div style="font-weight:700;margin-bottom:.25rem;">Pochodnia przygasła!</div>
    <div style="font-size:.875rem;opacity:.8;">Czas minął. Zamknij i spróbuj ponownie.</div>
    <button id="cs-timeout-close" style="margin-top:.875rem;padding:.625rem 1.25rem;
      background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.25);
      border-radius:10px;color:#D4AF37;font-weight:600;font-size:.875rem;
      cursor:pointer;font-family:'Inter',sans-serif;">Zamknij</button>`;
  document.querySelectorAll('.cs-quiz-answer').forEach(b => { b.disabled = true; });
  document.getElementById('cs-timeout-close')?.addEventListener('click', () => {
    document.getElementById('cs-quiz-root')?.remove();
  });
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

  // Aktualizuj licznik wyzwań dla odbiorcy
  try {
    await updateDoc(doc(db, 'users', _user.uid), {
      challengesCompleted: increment(1),
    });
  } catch (e) { console.warn('[update-counter]', e); }

  // XP dla odbiorcy (wykonującego)
  await awardXP(_user.uid, {
    key:   'challenge_complete_' + inv.id,
    xp:    inv.challengeXP,
    label: `Ukończono: ${inv.challengeTitle}`,
  });

  // Bonus XP dla nadawcy (~20%)
  const bonus = Math.max(10, Math.round(inv.challengeXP * 0.2));
  if (inv.challengerId && inv.challengerId !== _user.uid) {
    awardXP(inv.challengerId, {
      key:   'challenge_sent_bonus_' + inv.id,
      xp:    bonus,
      label: `Bonus za aktywność: ${_user.displayName||'Wojownik'} ukończył wyzwanie!`,
    }).catch(() => {});

    createNotification(inv.challengerId, {
      type:  'achievement',
      title: `${_user.displayName||'Wojownik'} ukończył Twoje wyzwanie! 🏆`,
      body:  `"${inv.challengeTitle}" · Dostajesz +${bonus} XP bonus!`,
      url:   'challenges.html',
    }).catch(() => {});
  }

  showToast(`🏆 +${inv.challengeXP} XP! Wyzwanie ukończone!`, 'success', 5000);
  _showCelebration(inv);
}

function _showCelebration(inv) {
  _rm('cs-complete-root');
  const root = document.createElement('div');
  root.id    = 'cs-complete-root';
  root.style.cssText = `position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.92);backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;
    padding:1.5rem;animation:chFadeIn .25s ease both;cursor:pointer;`;
  root.innerHTML = `
    <div style="background:linear-gradient(160deg,#0E0F12,#141208,#0E0F12);
      border:2px solid #D4AF37;border-radius:20px;
      padding:2.5rem 2rem;max-width:340px;width:100%;text-align:center;
      box-shadow:0 0 80px rgba(212,175,55,.4);
      animation:chUnlockPop .6s cubic-bezier(.34,1.56,.64,1) both;
      position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;
        background:linear-gradient(90deg,transparent,#D4AF37,transparent);"></div>
      <div style="font-size:3.5rem;margin-bottom:.75rem;">${inv.challengeBadge??'⚔️'}</div>
      <div style="font-size:.625rem;font-weight:700;letter-spacing:.18em;
                  text-transform:uppercase;color:#D4AF37;margin-bottom:.5rem;">
        Wyzwanie ukończone!
      </div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:1.4rem;font-weight:800;
                  color:#fff;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.375rem;">
        ${_esc(inv.challengeTitle)}
      </div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:2.5rem;font-weight:800;
                  color:#D4AF37;line-height:1;margin:.5rem 0;
                  text-shadow:0 0 30px rgba(212,175,55,.7);">
        +${inv.challengeXP} XP
      </div>
      <div style="font-size:.75rem;color:#4E5464;margin-top:1.25rem;">
        Dotknij aby zamknąć
      </div>
    </div>`;
  document.body.appendChild(root);
  root.addEventListener('click', () => root.remove());
  setTimeout(() => root?.remove(), 7000);
}


// ════════════════════════════════════════════════════════════
// TAB 3 — WYSŁANE
// ════════════════════════════════════════════════════════════

function _listenSent() {
  const el = document.getElementById('cs-sent-list');
  if (!el) return;
  el.innerHTML = _spinnerHTML();

  const q = query(
    collection(db, 'challenge_invites'),
    where('challengerId', '==', _user.uid),
  );
  const unsub = onSnapshot(q, snap => {
    let items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    items.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    el.innerHTML = '';
    if (!items.length) {
      el.innerHTML = _emptyHTML('📤', 'Brak wysłanych', 'Rzuć pierwsze wyzwanie wojownikowi!');
      return;
    }
    items.forEach((inv, i) => {
      const statusMap = {
        pending:      { text: '⏳ Oczekuje',    color: '#F59E0B' },
        quiz_pending: { text: '🧠 Quiz w toku', color: '#4F8CFF' },
        active:       { text: '⚔️ Aktywne',     color: '#16C784' },
        completed:    { text: '✅ Ukończone',    color: '#16C784' },
        rejected:     { text: '❌ Odrzucone',    color: '#EF4444' },
      };
      const s   = statusMap[inv.status] ?? { text: inv.status, color: '#8A7E6A' };
      const ini = (inv.targetName||'?')[0].toUpperCase();
      const dt  = inv.createdAt?.toDate?.();
      const ds  = dt ? dt.toLocaleDateString('pl-PL',{day:'numeric',month:'short'}) : '';
      const row = document.createElement('div');
      row.className = 'cs-sent-row';
      row.style.animationDelay = (i * 0.06) + 's';
      row.innerHTML = `
        <div class="cs-invite-avatar" style="width:38px;height:38px;font-size:.875rem;">
          ${inv.targetPhoto
            ? `<img src="${_esc(inv.targetPhoto)}" onerror="this.parentElement.textContent='${ini}'">`
            : ini}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.875rem;font-weight:600;color:#E8E0D0;">
            ${_esc(inv.targetName||'Wojownik')}
          </div>
          <div style="font-size:.8125rem;color:#8A7E6A;">
            ${inv.challengeBadge??'⚔️'} ${_esc(inv.challengeTitle)} · +${inv.challengeXP} XP
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.75rem;font-weight:700;color:${s.color};">${s.text}</div>
          <div style="font-size:.6875rem;color:#4E5464;margin-top:.1rem;">${ds}</div>
        </div>`;
      el.appendChild(row);
    });
  }, err => { el.innerHTML = _emptyHTML('⚠️','Błąd',err.code); });
  _unsubs.push(unsub);
}


// ════════════════════════════════════════════════════════════
// TAB 4 — AKTYWNE
// ════════════════════════════════════════════════════════════

function _listenActive() {
  const el = document.getElementById('cs-active-list');
  if (!el) return;
  el.innerHTML = _spinnerHTML();

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
        'Zaakceptuj odebrane wyzwanie i przejdź quiz, aby je aktywować.');
      return;
    }
    items.forEach((inv, i) => {
      const ini  = (inv.challengerName||'?')[0].toUpperCase();
      const task = _getTask(inv.challengeId);
      const card = document.createElement('div');
      card.className = 'cs-invite-card';
      card.style.borderColor = 'rgba(22,199,132,.3)';
      card.style.animationDelay = (i * 0.06) + 's';
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
              Od: ${_esc(inv.challengerName||'?')} · +${inv.challengeXP} XP
            </div>
          </div>
        </div>
        <div style="font-size:.875rem;color:#E8E0D0;line-height:1.65;
          padding:.875rem;background:rgba(212,175,55,.05);border-radius:10px;
          border-left:3px solid rgba(212,175,55,.3);margin:.875rem 0;font-style:italic;">
          ${_esc(task)}
        </div>
        <button class="cs-btn-complete" data-id="${inv.id}" style="width:100%;">
          🏆 Ukończyłem wyzwanie!
        </button>`;
      card.querySelector('.cs-btn-complete')?.addEventListener('click', async () => {
        const btn = card.querySelector('.cs-btn-complete');
        btn.disabled = true; btn.textContent = 'Zapisuję...';
        try { await _completeChallenge(inv); }
        catch(e) {
          showToast('Błąd: '+e.code,'error');
          btn.disabled = false; btn.textContent = '🏆 Ukończyłem wyzwanie!';
        }
      });
      el.appendChild(card);
    });
  }, err => { el.innerHTML = _emptyHTML('⚠️','Błąd',err.code); });
  _unsubs.push(unsub);
}


// ════════════════════════════════════════════════════════════
// TAB 5 — HISTORIA
// ════════════════════════════════════════════════════════════

function _listenHistory() {
  const el = document.getElementById('cs-history-list');
  if (!el) return;
  el.innerHTML = _spinnerHTML();

  // Pobierz jako nadawca lub odbiorca
  const q1 = query(collection(db,'challenge_invites'), where('targetId','==',_user.uid), where('status','in',['completed','rejected']));
  const q2 = query(collection(db,'challenge_invites'), where('challengerId','==',_user.uid), where('status','in',['completed','rejected']));

  let items1 = [], items2 = [], ready = 0;

  const render = () => {
    if (ready < 2) return;
    const seen = new Set();
    const all  = [...items1, ...items2].filter(i => {
      if (seen.has(i.id)) return false;
      seen.add(i.id); return true;
    });
    all.sort((a,b) => (b.completedAt?.seconds||b.createdAt?.seconds||0)
                    - (a.completedAt?.seconds||a.createdAt?.seconds||0));
    el.innerHTML = '';
    if (!all.length) {
      el.innerHTML = _emptyHTML('🏁','Brak historii','Ukończone i odrzucone wyzwania pojawią się tutaj.');
      return;
    }
    all.forEach((inv, i) => {
      const isTarget  = inv.targetId === _user.uid;
      const completed = inv.status   === 'completed';
      const other     = isTarget ? inv.challengerName : inv.targetName;
      const otherPhoto= isTarget ? inv.challengerPhoto : inv.targetPhoto;
      const ini       = (other||'?')[0].toUpperCase();
      const dt        = (inv.completedAt||inv.createdAt)?.toDate?.();
      const ds        = dt ? dt.toLocaleDateString('pl-PL',{day:'numeric',month:'short',year:'numeric'}) : '';
      const row       = document.createElement('div');
      row.className   = 'cs-sent-row';
      row.style.opacity = completed ? '1' : '0.55';
      row.style.animationDelay = (i * 0.06) + 's';
      row.innerHTML = `
        <div style="font-size:1.5rem;flex-shrink:0;">${completed ? inv.challengeBadge??'⚔️' : '❌'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.875rem;font-weight:600;color:${completed?'#E8E0D0':'#666'};">
            ${_esc(inv.challengeTitle)}
          </div>
          <div style="font-size:.75rem;color:#666;">
            ${isTarget ? 'Od:' : 'Do:'} ${_esc(other||'?')}
            ${completed && isTarget ? ` · +${inv.challengeXP} XP zdobyte` : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.75rem;font-weight:700;color:${completed?'#16C784':'#EF4444'};">
            ${completed ? '✅ Ukończone' : '❌ Odrzucone'}
          </div>
          <div style="font-size:.6875rem;color:#4E5464;margin-top:.1rem;">${ds}</div>
        </div>`;
      el.appendChild(row);
    });
  };

  const u1 = onSnapshot(q1, snap => {
    items1 = []; snap.forEach(d => items1.push({id:d.id,...d.data()}));
    ready = Math.max(ready, 1); render();
  }, ()=>{ready++;render();});
  const u2 = onSnapshot(q2, snap => {
    items2 = []; snap.forEach(d => items2.push({id:d.id,...d.data()}));
    ready++; render();
  }, ()=>{ready++;render();});
  _unsubs.push(u1, u2);
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _getTask(id) {
  return CHALLENGES_DATA.find(c => c.id === id)?.task ?? 'Wykonaj zadanie wyzwania.';
}

function _emptyHTML(icon, title, text) {
  return `<div style="text-align:center;padding:3rem 1rem;">
    <div style="font-size:2.5rem;margin-bottom:.75rem;">${icon}</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;
                color:#D4AF37;text-transform:uppercase;margin-bottom:.375rem;">${title}</div>
    <p style="font-size:.875rem;color:#4E5464;line-height:1.6;font-style:italic;">${text}</p>
  </div>`;
}

function _spinnerHTML() {
  return `<div style="text-align:center;padding:2.5rem;">
    <div style="display:inline-block;width:24px;height:24px;border-radius:50%;
      border:2px solid rgba(212,175,55,.2);border-top-color:#D4AF37;
      animation:chSpin .65s linear infinite;"></div>
  </div>`;
}

function _rm(id) { document.getElementById(id)?.remove(); }

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
