/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — challenges.js v3
 * System Fabularnych Wyzwań — Droga Wojownika
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Kolekcje:
 *   challenges/{id}            — definicje wyzwań
 *   userChallenges/{uid_chId}  — ukończenia
 *   duels/{id}                 — wyzwania między użytkownikami
 *
 * Eksporty:
 *   initChallengesPage()
 */

import { auth, db, COL } from './firebase.js';
import { checkAuth, logout, getCurrentUserData, showToast } from './auth.js';
import { awardXP } from './xp.js';

import {
  collection, doc, addDoc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy,
  serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// DANE WYZWAŃ — DROGA WOJOWNIKA
// ════════════════════════════════════════════════════════════

const CHALLENGES = [
  {
    id:        'lowca_wezy',
    order:     1,
    title:     'Łowca Węży',
    lore:      'Każdy wojownik musi najpierw odnaleźć swoje węże. Nie można pokonać przeciwnika, którego się nie widzi.',
    task:      'Nazwij jedną rzecz, która najbardziej przeszkadza Ci w osiągnięciu celu. Zapisz ją i podziel się z wojownikami.',
    desc:      'Uświadom sobie swoją główną przeszkodę.',
    xp:        30,
    badge:     '🏹',
    badgeName: 'Łowca Węży',
    image:     'assets/challenges/lowca-wezy.png',
    difficulty:'easy',
    category:  'Odkrycie',
    targetType:'post',
    active:    true,
  },
  {
    id:        'tropiciel_hydry',
    order:     2,
    title:     'Tropiciel Hydry',
    lore:      'Wojownik odnalazł trop. Wie już gdzie znajduje się przeciwnik i nie może się wycofać.',
    task:      'Zapisz plan rozwiązania jednego problemu w 3 krokach. Opublikuj go na arenie.',
    desc:      'Stwórz plan walki z przeszkodą.',
    xp:        40,
    badge:     '🔍',
    badgeName: 'Tropiciel Hydry',
    image:     'assets/challenges/tropiciel-hydry.png',
    difficulty:'easy',
    category:  'Planowanie',
    targetType:'post',
    active:    true,
  },
  {
    id:        'zgniatacz_wezy',
    order:     3,
    title:     'Zgniatacz Węży',
    lore:      'Karta nie symbolizuje pieniędzy. To artefakt służący do zgniatania problemów codziennego życia.',
    task:      'Rozwiąż jedną sprawę, którą odkładasz od tygodnia. Poinformuj o tym wojowników.',
    desc:      'Rozwiąż jedną zaległą sprawę.',
    xp:        50,
    badge:     '⚔️',
    badgeName: 'Zgniatacz Węży',
    image:     'assets/challenges/zgniatacz-wezy.png',
    difficulty:'medium',
    category:  'Działanie',
    targetType:'post',
    active:    true,
  },
  {
    id:        'maly_na_rozruch',
    order:     4,
    title:     'Mały Na Rozruch',
    lore:      'Symbol pierwszego kroku. Każda wielka bitwa zaczyna się od małego ruchu. Nie czekaj na idealne warunki.',
    task:      'W ciągu 10 minut od otwarcia aplikacji — rozpocznij jedno odkładane zadanie.',
    desc:      'Zacznij odkładane zadanie w 10 minut.',
    xp:        70,
    badge:     '💸',
    badgeName: 'Mały Impuls',
    image:     'assets/challenges/maly-na-rozruch.png',
    difficulty:'medium',
    category:  'Działanie',
    targetType:'general',
    active:    true,
  },
  {
    id:        'pogromca_krychy',
    order:     5,
    title:     'Pogromca Krychy',
    lore:      'Podstępem doprowadził do upadku kryształowego węża. Prawdziwy przeciwnik ukrywał się pod piękną powłoką.',
    task:      'Usuń jedną rzecz, która pozornie pomaga, ale w rzeczywistości blokuje Twój rozwój.',
    desc:      'Usuń iluzję blokującą Twój wzrost.',
    xp:        150,
    badge:     '👑',
    badgeName: 'Pogromca Krychy',
    image:     'assets/challenges/pogromca-krychy.png',
    difficulty:'hard',
    category:  'Mądrość',
    targetType:'general',
    active:    true,
  },
  {
    id:        'siedem_dni_chwaly',
    order:     6,
    title:     'Siedem Dni Chwały',
    lore:      'Za nim tydzień ciężkiej walki z wężami. Teraz odpoczywa wśród ruminanków. Wytrwałość to najsilniejsza broń.',
    task:      'Zaloguj się do aplikacji przez 7 kolejnych dni.',
    desc:      'Loguj się 7 dni z rzędu.',
    xp:        60,
    badge:     '🌼',
    badgeName: 'Siedem Dni Chwały',
    image:     'assets/challenges/siedem-dni-chwaly.png',
    difficulty:'medium',
    category:  'Wytrwałość',
    targetType:'logins',
    target:    7,
    active:    true,
  },
  {
    id:        'nagroda_wojownika',
    order:     7,
    title:     'Nagroda Wojownika',
    lore:      'Po zwycięstwie przychodzi czas na zdobycz. Na after wpada Coco Chanel, a rycerze zbierani są z trawy dopiero o świcie.',
    task:      'Zdobądź 200 XP w ciągu jednego tygodnia.',
    desc:      'Zdobądź 200 XP w ciągu tygodnia.',
    xp:        200,
    badge:     '💎',
    badgeName: 'Nagroda Wojownika',
    image:     'assets/challenges/nagroda-wojownika.png',
    difficulty:'hard',
    category:  'Osiągnięcie',
    targetType:'points',
    target:    200,
    active:    true,
  },
  {
    id:        'duch_areny',
    order:     8,
    title:     'Duch Areny',
    lore:      'Mistyczna istota, która miała przynieść wojownikowi węża, lecz podarowała kryształ. Nikt nie wie, czy była przewodnikiem czy oszustką.',
    task:      'Opublikuj post o swoim największym celu lub inspiracji. Podziel się marzeniem z areną.',
    desc:      'Opublikuj post o swoim największym celu.',
    xp:        200,
    badge:     '🐍',
    badgeName: 'Duch Areny',
    image:     'assets/challenges/duch-areny.png',
    difficulty:'legend',
    category:  'Inspiracja',
    targetType:'post',
    active:    true,
  },
];

// Losowe fabularne powiadomienia
const LORE_MESSAGES = [
  '⚔️ Na Arenie pojawił się nowy wąż. Czy go dostrzeżesz?',
  '🐍 Hydra została zauważona na północy. Wojownicy ruszają.',
  '🌟 Strażniczka Mocy szuka śmiałków. Czy jesteś gotowy?',
  '⚡ Twój przeciwnik czeka. Nie pozwól mu uciec.',
  '🔥 Legenda nie powstaje w bezczynności. Działaj.',
  '🌙 Twoja pochodnia przygasa. Czas odnaleźć węże.',
  '💎 Kryształ się kruszy. Prawdziwa siła czeka za iluzją.',
  '👑 Arena wzywa. Historia piszą ci, którzy walczą.',
  '🏹 Wojownik bez celu jest jak łuk bez strzały.',
];

const DIFFICULTIES = {
  easy:   { label: 'Łatwe',      cls: 'diff-easy',   color: '#16C784' },
  medium: { label: 'Średnie',    cls: 'diff-medium', color: '#F59E0B' },
  hard:   { label: 'Trudne',     cls: 'diff-hard',   color: '#EF4444' },
  legend: { label: 'Legendarne', cls: 'diff-legend', color: '#B9F2FF' },
};


// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════

let currentUser     = null;
let currentUserData = null;
let userChallenges  = {};   // { challengeId: doc }
let pendingDuels    = [];   // incoming duels
let activeTab       = 'all';
let unsubUserCh     = null;
let unsubDuels      = null;
let loreIndex       = 0;


// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

export function initChallengesPage() {
  const TAG = '[initChallengesPage]';
  console.log(TAG, '🚀 Droga Wojownika rozpoczęta');

  checkAuth(async (user) => {
    currentUser = user;
    console.log(TAG, '✅ Wojownik:', user.uid, user.displayName);

    try {
      currentUserData = await getCurrentUserData(user.uid, user);
    } catch { currentUserData = null; }

    currentUserData ??= {
      uid: user.uid,
      displayName: user.displayName || 'Wojownik',
      photoURL:    user.photoURL    || '',
      points:      0,
    };

    // Seed challenges to Firestore (first run)
    await seedChallenges();

    setupTabs();
    subscribeUserChallenges();
    subscribeDuels();
    startLoreBanner();

    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('ch-invite-btn')?.addEventListener('click', openDuelSelector);
  });
}


// ════════════════════════════════════════════════════════════
// SEED CHALLENGES
// ════════════════════════════════════════════════════════════

async function seedChallenges() {
  try {
    const snap = await getDocs(collection(db, 'challenges'));
    if (!snap.empty) return; // Already seeded

    console.log('[seedChallenges] Seeding 8 wyzwań...');
    for (const ch of CHALLENGES) {
      const { id, ...data } = ch;
      await setDoc(doc(db, 'challenges', id), {
        ...data, createdAt: serverTimestamp(),
      });
    }
    console.log('[seedChallenges] ✅ Done');
  } catch (err) {
    console.warn('[seedChallenges] ⚠️ Fallback to local data:', err.message);
  }
}


// ════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ════════════════════════════════════════════════════════════

function subscribeUserChallenges() {
  if (!currentUser) return;

  const q = query(
    collection(db, 'userChallenges'),
    where('userId', '==', currentUser.uid)
  );

  if (unsubUserCh) { unsubUserCh(); }

  unsubUserCh = onSnapshot(q, (snap) => {
    userChallenges = {};
    snap.forEach(d => {
      const data = d.data();
      userChallenges[data.challengeId] = { ...data, id: d.id };
    });

    updateStats();
    renderGrid();
    checkLegendStatus();
  }, err => console.error('[subscribeUserChallenges]', err.code));
}

function subscribeDuels() {
  if (!currentUser) return;

  const q = query(
    collection(db, 'duels'),
    where('targetId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  if (unsubDuels) { unsubDuels(); }

  unsubDuels = onSnapshot(q, (snap) => {
    pendingDuels = [];
    snap.forEach(d => pendingDuels.push({ ...d.data(), id: d.id }));
    renderIncomingDuels();
  }, err => console.warn('[subscribeDuels]', err.code));
}


// ════════════════════════════════════════════════════════════
// LORE BANNER
// ════════════════════════════════════════════════════════════

function startLoreBanner() {
  const el = document.getElementById('ch-lore-text');
  if (!el) return;

  loreIndex = Math.floor(Math.random() * LORE_MESSAGES.length);
  el.textContent = LORE_MESSAGES[loreIndex];

  setInterval(() => {
    loreIndex = (loreIndex + 1) % LORE_MESSAGES.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = LORE_MESSAGES[loreIndex];
      el.style.transition = 'opacity 0.6s ease';
      el.style.opacity    = '1';
    }, 400);
  }, 8000);

  document.getElementById('ch-lore-banner')?.addEventListener('click', () => {
    loreIndex = (loreIndex + 1) % LORE_MESSAGES.length;
    el.textContent = LORE_MESSAGES[loreIndex];
  });
}


// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════

function setupTabs() {
  document.querySelectorAll('.ch-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;
      activeTab = tab;
      document.querySelectorAll('.ch-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
  });
}


// ════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════

function updateStats() {
  const done  = Object.values(userChallenges).filter(c => c.completed).length;
  const total = CHALLENGES.length;
  const xpGot = CHALLENGES
    .filter(ch => userChallenges[ch.id]?.completed)
    .reduce((s, ch) => s + ch.xp, 0);

  setText('ch-stat-done',  String(done));
  setText('ch-stat-total', String(total));
  setText('ch-stat-xp',    String(xpGot));
}


// ════════════════════════════════════════════════════════════
// RENDER GRID
// ════════════════════════════════════════════════════════════

function renderGrid() {
  const grid = document.getElementById('ch-grid');
  if (!grid) return;

  let list;
  if (activeTab === 'all')       list = CHALLENGES;
  else if (activeTab === 'my')   list = CHALLENGES.filter(c => userChallenges[c.id]);
  else if (activeTab === 'done') list = CHALLENGES.filter(c => userChallenges[c.id]?.completed);
  else                            list = CHALLENGES;

  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">⚔️</div>
        <div style="font-family:'Cinzel',serif;font-size:1rem;font-weight:700;
                    color:#D4AF37;margin-bottom:0.375rem;text-transform:uppercase;">
          ${activeTab === 'my' ? 'Nie dołączyłeś jeszcze' : activeTab === 'done' ? 'Brak ukończonych' : 'Brak wyzwań'}
        </div>
        <p style="font-size:0.875rem;color:#8A7E6A;line-height:1.6;font-style:italic;">
          ${activeTab === 'my' || activeTab === 'done'
            ? 'Twoja historia dopiero się zaczyna. Podejmij wyzwanie!'
            : 'Arena czeka na wojownika.'}
        </p>
      </div>`;
    // Show skeleton → content
    document.getElementById('ch-skeleton')?.classList.add('hidden');
    document.getElementById('ch-grid-wrap')?.classList.remove('hidden');
    return;
  }

  list.forEach((ch, idx) => {
    const card = createCard(ch, idx);
    grid.appendChild(card);
  });

  document.getElementById('ch-skeleton')?.classList.add('hidden');
  document.getElementById('ch-grid-wrap')?.classList.remove('hidden');
}


// ════════════════════════════════════════════════════════════
// CREATE CARD
// ════════════════════════════════════════════════════════════

function createCard(ch, idx) {
  const isDone = !!userChallenges[ch.id]?.completed;
  const diff   = DIFFICULTIES[ch.difficulty] ?? DIFFICULTIES.medium;

  const card = document.createElement('div');
  card.className = `ch-card${isDone ? ' completed' : ''}`;
  card.style.animationDelay = (idx * 0.07) + 's';

  const imgHTML = `
    <img src="${ch.image}" alt="${escHtml(ch.title)}" class="ch-card-img" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
    <div class="ch-card-img-placeholder" style="display:none;">${ch.badge}</div>
  `;

  card.innerHTML = `
    <!-- Number badge or done badge -->
    ${isDone
      ? `<div class="ch-done-badge">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                stroke-linecap="round" stroke-linejoin="round">
             <polyline points="20 6 9 17 4 12"/>
           </svg>
         </div>`
      : `<div class="ch-card-num">${ch.order}</div>`
    }

    <!-- XP badge -->
    <div class="ch-xp-badge">+${ch.xp}<span>XP</span></div>

    <!-- Image -->
    <div class="ch-card-img-wrap">${imgHTML}</div>

    <!-- Body -->
    <div class="ch-card-body">
      <div class="ch-card-divider"><span>◆</span></div>
      <div class="ch-card-title ch-gold-pulse">${escHtml(ch.title)}</div>
      <div class="ch-card-desc">${escHtml(ch.desc)}</div>
    </div>

    <!-- Footer button -->
    <div class="ch-card-footer">
      ${isDone
        ? `<button class="ch-card-btn done" disabled>✅ Ukończono</button>`
        : `<button class="ch-card-btn" data-id="${ch.id}">Podejmij walkę</button>`
      }
    </div>
  `;

  // Click card → detail modal
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.ch-card-btn')) openDetailModal(ch);
  });

  // Button click
  card.querySelector('.ch-card-btn:not([disabled])')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openDetailModal(ch);
  });

  return card;
}


// ════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════

function openDetailModal(ch) {
  document.querySelector('.ch-detail-backdrop')?.remove();

  const isDone = !!userChallenges[ch.id]?.completed;
  const diff   = DIFFICULTIES[ch.difficulty] ?? DIFFICULTIES.medium;

  const backdrop = document.createElement('div');
  backdrop.className = 'ch-detail-backdrop';

  backdrop.innerHTML = `
    <div class="ch-detail-modal">

      <!-- Image header -->
      <div class="ch-detail-img-wrap">
        <img src="${ch.image}" alt="${escHtml(ch.title)}" class="ch-detail-img"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <div class="ch-detail-img-placeholder" style="display:none;">${ch.badge}</div>
        <div class="ch-detail-img-overlay"></div>

        <button class="ch-detail-close" id="ch-detail-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div class="ch-detail-num-badge">${ch.order}</div>
      </div>

      <!-- Body -->
      <div class="ch-detail-body">

        <!-- Title -->
        <div>
          <h2 class="ch-detail-title ch-gold-pulse">${ch.badge} ${escHtml(ch.title)}</h2>
          <div class="ch-detail-divider"><span>◆</span></div>
        </div>

        <!-- Badges -->
        <div class="ch-detail-badges">
          <span class="difficulty-badge ${diff.cls}">${diff.label}</span>
          <span style="font-size:0.75rem;color:#8A7E6A;font-style:italic;">${ch.category}</span>
          ${isDone
            ? `<span style="font-size:0.75rem;font-weight:700;color:#16C784;">✅ Ukończone</span>`
            : ''}
        </div>

        <!-- Lore -->
        <div class="ch-detail-lore">${escHtml(ch.lore)}</div>

        <!-- Task -->
        <div class="ch-detail-task-wrap">
          <div class="ch-detail-task-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Twoje wyzwanie
          </div>
          <div class="ch-detail-task">${escHtml(ch.task)}</div>
        </div>

        <!-- Reward -->
        <div class="ch-detail-reward">
          <div class="ch-detail-reward-icon">🏆</div>
          <div>
            <div class="ch-detail-reward-xp">+${ch.xp} XP</div>
            <div class="ch-detail-reward-badge">Odznaka: ${ch.badge} ${escHtml(ch.badgeName)}</div>
          </div>
        </div>

        <!-- Main CTA -->
        <button id="ch-detail-action-btn"
                class="ch-detail-action-btn${isDone ? ' done' : ''}"
                ${isDone ? 'disabled' : ''}>
          ${isDone ? '✅ Wyzwanie ukończone' : '⚔️ Podejmuję walkę!'}
        </button>

        <!-- Duel button (only if not done) -->
        ${!isDone ? `
          <button id="ch-detail-duel-btn" class="ch-detail-duel-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zM20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 4.7l-2.5 5.8M9 5L3 19l9-4 9 4-6-14"/>
            </svg>
            Rzuć wyzwanie innemu wojownikowi
          </button>
        ` : ''}

      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  // Close
  backdrop.querySelector('#ch-detail-close')?.addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  // Complete
  if (!isDone) {
    backdrop.querySelector('#ch-detail-action-btn')?.addEventListener('click', () => {
      backdrop.remove();
      completeChallenge(ch);
    });

    // Duel
    backdrop.querySelector('#ch-detail-duel-btn')?.addEventListener('click', () => {
      backdrop.remove();
      openDuelSelector(ch);
    });
  }
}


// ════════════════════════════════════════════════════════════
// COMPLETE CHALLENGE
// ════════════════════════════════════════════════════════════

async function completeChallenge(ch) {
  const TAG = '[completeChallenge]';

  if (!currentUser) return;
  if (userChallenges[ch.id]?.completed) {
    showToast('To wyzwanie zostało już ukończone!', 'info'); return;
  }

  console.log(TAG, '⚔️', ch.title);

  try {
    // Save userChallenge
    await setDoc(doc(db, 'userChallenges', `${currentUser.uid}_${ch.id}`), {
      userId:      currentUser.uid,
      challengeId: ch.id,
      completed:   true,
      completedAt: serverTimestamp(),
    });

    // Award XP
    await awardXP(currentUser.uid, {
      key:   `challenge_${ch.id}`,
      xp:    ch.xp,
      label: `Ukończono: ${ch.title}`,
    });

    // Publish to feed
    await publishToFeed(ch);

    // Celebrate
    showUnlockCelebration(ch);

    console.log(TAG, '✅', ch.title, '+' + ch.xp + ' XP');

  } catch (err) {
    console.error(TAG, '❌', err.code, err.message);
    showToast(
      err.code === 'permission-denied'
        ? 'Brak uprawnień. Sprawdź reguły Firestore.'
        : 'Błąd ukończenia wyzwania.',
      'error'
    );
  }
}


// ════════════════════════════════════════════════════════════
// PUBLISH TO FEED
// ════════════════════════════════════════════════════════════

async function publishToFeed(ch) {
  try {
    await addDoc(collection(db, COL.POSTS), {
      authorId:        currentUser.uid,
      authorName:      currentUserData?.displayName || currentUser.displayName || 'Wojownik',
      authorPhoto:     currentUserData?.photoURL    || currentUser.photoURL    || '',
      authorRank:      currentUserData?.rank || 'Rookie',
      authorRankEmoji: '⚔️',
      content:         `${ch.badge} Ukończyłem wyzwanie:\n"${ch.title}"\n\n${ch.task.split('.')[0]}.\n\n+${ch.xp} XP · Odznaka: ${ch.badge} ${ch.badgeName}`,
      imageUrl:        '',
      imageStoragePath:'',
      likes:           [],
      likesCount:      0,
      commentsCount:   0,
      isAchievement:   true,
      achievementId:   ch.id,
      createdAt:       serverTimestamp(),
    });
    console.log('[publishToFeed] ✅ Post opublikowany');
  } catch (err) {
    console.warn('[publishToFeed] ⚠️', err.message);
  }
}


// ════════════════════════════════════════════════════════════
// UNLOCK CELEBRATION
// ════════════════════════════════════════════════════════════

function showUnlockCelebration(ch) {
  document.querySelector('.ch-unlock-backdrop')?.remove();

  const el = document.createElement('div');
  el.className = 'ch-unlock-backdrop';
  el.innerHTML = `
    <div class="ch-unlock-card">
      <img src="${ch.image}" alt="${escHtml(ch.title)}" class="ch-unlock-card-img"
           onerror="this.style.display='none';" />
      <div class="ch-unlock-body">
        <div class="ch-unlock-label">⚔️ Wyzwanie ukończone!</div>
        <div class="ch-unlock-title">${escHtml(ch.title)}</div>
        <div class="ch-unlock-xp">+${ch.xp} XP</div>
        <div class="ch-unlock-badge-name">${ch.badge} ${escHtml(ch.badgeName)}</div>
        <div class="ch-unlock-dismiss">Dotknij aby zamknąć</div>
        <div id="ch-particles-container"></div>
      </div>
    </div>
  `;

  document.body.appendChild(el);
  spawnParticles(el.querySelector('#ch-particles-container'));
  el.addEventListener('click', () => el.remove());
  setTimeout(() => el?.remove(), 6000);
}

function spawnParticles(container) {
  if (!container) return;
  const colors = ['#D4AF37','#FFD700','#FFF8DC','#F0E68C','#FFFFFF'];

  for (let i = 0; i < 18; i++) {
    const p    = document.createElement('div');
    p.className= 'ch-particle';
    const px   = (Math.random() - 0.5) * 180;
    const py   = -(60 + Math.random() * 140);
    p.style.cssText = `
      --px: ${px}px; --py: ${py}px;
      left: ${30 + Math.random() * 40}%;
      bottom: ${5 + Math.random() * 20}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.4}s;
      animation-duration: ${1 + Math.random() * 0.8}s;
      width: ${3 + Math.random() * 7}px;
      height: ${3 + Math.random() * 7}px;
    `;
    container.appendChild(p);
  }
}


// ════════════════════════════════════════════════════════════
// DUELS — SYSTEM WYZWAŃ MIĘDZY UŻYTKOWNIKAMI
// ════════════════════════════════════════════════════════════

async function openDuelSelector(ch = null) {
  // Get list of other users
  let users = [];
  try {
    const snap = await getDocs(collection(db, COL.USERS));
    snap.forEach(d => {
      if (d.id !== currentUser.uid) {
        users.push({ ...d.data(), uid: d.id });
      }
    });
  } catch (err) {
    showToast('Błąd pobierania wojowników.', 'error');
    return;
  }

  if (users.length === 0) {
    showToast('Brak innych wojowników na arenie.', 'info'); return;
  }

  document.querySelector('.ch-duel-modal-backdrop')?.remove();

  // If no specific challenge, let user pick
  const challengeToSend = ch ?? CHALLENGES[0];

  const backdrop = document.createElement('div');
  backdrop.className = 'ch-duel-modal-backdrop';

  const usersHTML = users.map(u => {
    const initials = (u.displayName || '?')[0].toUpperCase();
    const avatarHTML = u.photoURL
      ? `<img src="${escHtml(u.photoURL)}" alt="Avatar"
             style="width:100%;height:100%;object-fit:cover;display:block;"
             onerror="this.parentElement.textContent='${initials}'" />`
      : initials;
    return `
      <div class="ch-duel-item" data-uid="${u.uid}"
           data-name="${escHtml(u.displayName || 'Wojownik')}" style="cursor:pointer;">
        <div class="ch-duel-avatar">${avatarHTML}</div>
        <div class="ch-duel-info">
          <div class="ch-duel-challenger" style="color:#E8E0D0;">${escHtml(u.displayName || 'Wojownik')}</div>
          <div class="ch-duel-challenge-name">${u.rank || 'Rookie'} · ${u.points || 0} XP</div>
        </div>
        <button class="ch-duel-accept send-duel-btn" data-uid="${u.uid}"
                data-name="${escHtml(u.displayName || 'Wojownik')}">
          Rzuć ⚔️
        </button>
      </div>
    `;
  }).join('');

  backdrop.innerHTML = `
    <div class="ch-duel-modal">
      <div class="ch-duel-modal-icon">⚔️</div>
      <div class="ch-duel-modal-title">Rzuć Wyzwanie</div>
      <div class="ch-duel-modal-sub">
        Wybierz wojownika, któremu chcesz rzucić wyzwanie:<br>
        <span>"${escHtml(challengeToSend.title)}"</span>
      </div>

      <div style="max-height:280px;overflow-y:auto;border-radius:12px;
                  border:1px solid rgba(212,175,55,0.12);">
        ${usersHTML || '<p style="padding:1rem;text-align:center;color:#8A7E6A;font-size:0.875rem;">Brak wojowników</p>'}
      </div>

      <button id="close-duel-selector" style="
        margin-top:1rem;width:100%;padding:0.75rem;
        background:transparent;border:1px solid rgba(255,255,255,0.08);
        border-radius:10px;color:#8A7E6A;font-family:'Inter',sans-serif;
        font-size:0.875rem;cursor:pointer;">
        Anuluj
      </button>
    </div>
  `;

  document.body.appendChild(backdrop);

  backdrop.querySelector('#close-duel-selector')?.addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelectorAll('.send-duel-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const targetId   = btn.dataset.uid;
      const targetName = btn.dataset.name;
      backdrop.remove();
      await sendDuel(targetId, targetName, challengeToSend);
    });
  });
}

async function sendDuel(targetId, targetName, ch) {
  const TAG = '[sendDuel]';
  try {
    await addDoc(collection(db, 'duels'), {
      challengerId:   currentUser.uid,
      challengerName: currentUserData?.displayName || currentUser.displayName || 'Wojownik',
      challengerPhoto:currentUserData?.photoURL || currentUser.photoURL || '',
      targetId,
      targetName,
      challengeId:    ch.id,
      challengeTitle: ch.title,
      challengeXP:    ch.xp,
      status:         'pending',
      expiresAt:      Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      createdAt:      serverTimestamp(),
    });
    console.log(TAG, '✅ Duel wysłany do', targetName);
    showToast(`⚔️ Wyzwanie rzucone! ${targetName} ma 24h na odpowiedź.`, 'success', 4000);
  } catch (err) {
    console.error(TAG, '❌', err.code);
    showToast('Błąd wysyłania wyzwania.', 'error');
  }
}


// ════════════════════════════════════════════════════════════
// INCOMING DUELS
// ════════════════════════════════════════════════════════════

function renderIncomingDuels() {
  const container = document.getElementById('ch-incoming');
  const list      = document.getElementById('ch-duels-list');
  const countEl   = document.getElementById('ch-duels-count');

  if (!container || !list) return;

  if (pendingDuels.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  if (countEl) countEl.textContent = pendingDuels.length;

  list.innerHTML = '';
  pendingDuels.forEach(duel => {
    const ch = CHALLENGES.find(c => c.id === duel.challengeId);
    const initials = (duel.challengerName || '?')[0].toUpperCase();
    const avatarHTML = duel.challengerPhoto
      ? `<img src="${escHtml(duel.challengerPhoto)}" alt="Avatar"
             style="width:100%;height:100%;object-fit:cover;display:block;"
             onerror="this.parentElement.textContent='${initials}'" />`
      : initials;

    // Time remaining
    const expiry = duel.expiresAt?.toDate?.() ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    const hoursLeft = Math.max(0, Math.floor((expiry - Date.now()) / (1000 * 60 * 60)));

    const item = document.createElement('div');
    item.className = 'ch-duel-item';
    item.innerHTML = `
      <div class="ch-duel-avatar">${avatarHTML}</div>
      <div class="ch-duel-info">
        <div class="ch-duel-challenger">
          <span>${escHtml(duel.challengerName)}</span> rzucił Ci wyzwanie
        </div>
        <div class="ch-duel-challenge-name">"${escHtml(duel.challengeTitle)}" · +${duel.challengeXP} XP</div>
        <div class="ch-duel-timer">⏳ ${hoursLeft}h pozostało</div>
      </div>
      <div class="ch-duel-actions">
        <button class="ch-duel-accept duel-accept-btn" data-id="${duel.id}" data-ch-id="${duel.challengeId}">
          Walczę!
        </button>
        <button class="ch-duel-reject duel-reject-btn" data-id="${duel.id}">✕</button>
      </div>
    `;

    item.querySelector('.duel-accept-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const duelId = e.target.dataset.id;
      const chId   = e.target.dataset.chId;
      await acceptDuel(duelId, chId);
    });

    item.querySelector('.duel-reject-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await rejectDuel(e.target.dataset.id);
    });

    list.appendChild(item);
  });
}

async function acceptDuel(duelId, challengeId) {
  try {
    await updateDoc(doc(db, 'duels', duelId), { status: 'accepted' });
    const ch = CHALLENGES.find(c => c.id === challengeId);
    if (ch) {
      showDuelAcceptModal(ch);
    }
    showToast('⚔️ Wyzwanie podjęte! Do walki!', 'success');
  } catch (err) {
    showToast('Błąd akceptacji wyzwania.', 'error');
  }
}

async function rejectDuel(duelId) {
  try {
    await updateDoc(doc(db, 'duels', duelId), { status: 'rejected' });
    showToast('Wyzwanie odrzucone.', 'info');
  } catch (err) {
    showToast('Błąd.', 'error');
  }
}

function showDuelAcceptModal(ch) {
  document.querySelector('.ch-duel-modal-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'ch-duel-modal-backdrop';
  backdrop.innerHTML = `
    <div class="ch-duel-modal">
      <div class="ch-duel-modal-icon">${ch.badge}</div>
      <div class="ch-duel-modal-title">Wyzwanie Podjęte!</div>
      <div class="ch-duel-modal-sub">Masz 24 godziny aby ukończyć:</div>
      <div class="ch-duel-modal-challenge">
        <div class="ch-duel-modal-challenge-name">${escHtml(ch.title)}</div>
        <div class="ch-duel-modal-challenge-xp">${escHtml(ch.task)}</div>
      </div>
      <div class="ch-duel-modal-timer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        24 godziny na ukończenie
      </div>
      <div class="ch-duel-modal-actions">
        <button class="ch-duel-modal-accept" id="duel-modal-go">
          ⚔️ Podejmuję walkę!
        </button>
        <button class="ch-duel-modal-reject" id="duel-modal-close">Później</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  backdrop.querySelector('#duel-modal-go')?.addEventListener('click', () => {
    backdrop.remove();
    openDetailModal(ch);
  });

  backdrop.querySelector('#duel-modal-close')?.addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
}


// ════════════════════════════════════════════════════════════
// LEGEND STATUS
// ════════════════════════════════════════════════════════════

async function checkLegendStatus() {
  const done = Object.values(userChallenges).filter(c => c.completed).length;
  if (done < CHALLENGES.length) return;

  console.log('[checkLegendStatus] 🏆 LEGENDA ARENY!');

  try {
    await updateDoc(doc(db, COL.USERS, currentUser.uid), {
      isLegend:        true,
      legendAchievedAt:serverTimestamp(),
    });
  } catch { /* non-critical */ }

  // Show legend banner
  showLegendBanner();
}

function showLegendBanner() {
  document.querySelector('.ch-unlock-backdrop')?.remove();

  const el = document.createElement('div');
  el.className = 'ch-unlock-backdrop';
  el.innerHTML = `
    <div class="ch-unlock-card">
      <div style="padding:2rem;text-align:center;">
        <div style="font-size:4rem;margin-bottom:0.75rem;">👑</div>
        <div style="font-family:'Cinzel',serif;font-size:0.6875rem;font-weight:700;
                    letter-spacing:0.18em;text-transform:uppercase;color:#D4AF37;
                    opacity:0.8;margin-bottom:0.5rem;">Legenda Areny</div>
        <div style="font-family:'Cinzel',serif;font-size:1.5rem;font-weight:700;
                    color:#FFFFFF;text-transform:uppercase;letter-spacing:0.04em;">
          🏆 LEGENDA WEEKEND WARRIOR
        </div>
        <div style="font-family:'Cinzel',serif;font-size:2.5rem;font-weight:700;
                    color:#D4AF37;text-shadow:0 0 30px rgba(212,175,55,0.7);
                    margin:0.75rem 0;">Wszystkie ukończone!</div>
        <div style="font-size:0.875rem;color:#B8A87A;font-style:italic;
                    line-height:1.65;max-width:280px;margin:0 auto 1rem;">
          Przeszedłeś przez wszystkie próby. Twoje imię zostanie zapisane w legendach areny.
        </div>
        <div style="display:inline-flex;align-items:center;gap:0.375rem;
                    padding:0.375rem 1rem;background:rgba(212,175,55,0.1);
                    border:1px solid rgba(212,175,55,0.3);border-radius:9999px;
                    font-size:0.875rem;font-weight:600;color:#D4AF37;">
          👑 Legenda Areny
        </div>
        <div style="font-size:0.6875rem;color:#8A7E6A;margin-top:1rem;">Dotknij aby zamknąć</div>
      </div>
    </div>
  `;

  document.body.appendChild(el);
  spawnParticles(el.querySelector('.ch-unlock-card'));
  el.addEventListener('click', () => el.remove());
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
