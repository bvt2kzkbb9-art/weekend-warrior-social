import {
  auth, db, COL, getLevel, getRank, RANKS,
  collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc, updateDoc, setDoc, addDoc, serverTimestamp
} from './firebase.js';

import {
  checkAuth, logout, showToast, ensureUserDoc, getCurrentUserData
} from './auth.js';

import { CHALLENGES_DATA } from './challenge-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════════

export const appState = {
  currentUser: null,
  currentUserData: null,
  userFeed: [],
  userRanking: [],
  userChallenges: CHALLENGES_DATA,
  unsubscribes: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

export function initializeApp() {
  checkAuth((user, userData) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    appState.currentUser = user;
    appState.currentUserData = userData || {};

    renderUI();
    setupRealtimeListeners();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupRealtimeListeners() {
  if (!appState.currentUser) return;

  // Listen to user profile changes
  const userRef = doc(db, COL.USERS, appState.currentUser.uid);
  const unsubUser = onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      appState.currentUserData = snap.data();
      updateHeroCard();
      updateProfileCard();
    }
  }, (err) => console.error('User listener error:', err));

  // Listen to feed posts
  const feedQuery = query(
    collection(db, COL.POSTS),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const unsubFeed = onSnapshot(feedQuery, (snap) => {
    appState.userFeed = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderFeed();
  }, (err) => console.error('Feed listener error:', err));

  // Listen to weekly rankings
  const rankingQuery = query(
    collection(db, 'weekly_rankings'),
    orderBy('points', 'desc'),
    limit(100)
  );
  const unsubRanking = onSnapshot(rankingQuery, (snap) => {
    appState.userRanking = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderRanking();
  }, (err) => console.error('Ranking listener error:', err));

  // Store unsubscribes for cleanup
  appState.unsubscribes = [unsubUser, unsubFeed, unsubRanking];
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function renderUI() {
  updateHeroCard();
  renderChallenges();
  renderFeed();
  renderRanking();
  updateProfileCard();
}

function updateHeroCard() {
  const userData = appState.currentUserData;
  if (!userData) return;

  const level = getLevel(userData.points || 0);
  const rank = getRank(userData.points || 0);

  document.getElementById('hero-avatar')?.textContent = (userData.displayName || 'W').charAt(0).toUpperCase();
  document.getElementById('hero-name')?.textContent = userData.displayName || 'Wojownik';
  document.getElementById('hero-rank')?.textContent = rank || 'Rookie';
  document.getElementById('hero-level')?.textContent = level || 1;
  document.getElementById('hero-xp')?.textContent = userData.points || 0;
  document.getElementById('hero-streak')?.textContent = userData.streak || 0;
  document.getElementById('hero-completed')?.textContent = userData.challengesCompleted || 0;
  document.getElementById('hero-wins')?.textContent = userData.challengesSent || 0;
}

function renderChallenges() {
  const container = document.getElementById('challenges-grid');
  if (!container) return;

  container.innerHTML = appState.userChallenges.map((challenge, idx) => `
    <div class="challenge-card" onclick="window.appV4.handleChallengeClick(${idx})">
      <div class="challenge-image">${challenge.emoji || '🎯'}</div>
      <div class="challenge-content">
        <div class="challenge-title">${challenge.title}</div>
        <div class="challenge-difficulty">${challenge.difficulty || 'Medium'}</div>
        <div class="challenge-xp"><strong>${challenge.xp || 250}</strong> XP</div>
        <button class="btn" style="width: 100%; margin-top: 10px; font-size: 12px;">Przejmij</button>
      </div>
    </div>
  `).join('');
}

function renderFeed() {
  const container = document.getElementById('feed-items');
  if (!container) return;

  if (appState.userFeed.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Brak postów. Bądź pierwszy do akcji!</p>';
    return;
  }

  container.innerHTML = appState.userFeed.map(post => `
    <div class="feed-item">
      <div class="feed-header">
        <div class="feed-avatar">${(post.authorName || 'W').charAt(0).toUpperCase()}</div>
        <div class="feed-meta">
          <div class="feed-name">${post.authorName || 'Nieznany'}</div>
          <div class="feed-rank">${post.authorRank || 'Rookie'} • ${post.authorLevel || 1}</div>
        </div>
      </div>
      <div class="feed-content">${post.content || ''}</div>
      ${post.image ? `<img src="${post.image}" style="width: 100%; margin: 15px 0; border-radius: 4px;">` : ''}
      <div class="feed-stats">
        <div class="feed-stat">❤️ ${post.likes || 0} polubień</div>
        <div class="feed-stat">💬 ${post.comments || 0} komentarzy</div>
        <div class="feed-stat">⚔️ ${post.shares || 0} wyzwań</div>
      </div>
    </div>
  `).join('');
}

function renderRanking() {
  const podium = document.getElementById('ranking-podium');
  const table = document.getElementById('ranking-table');

  if (!podium || !table) return;

  // Podium (top 3)
  const top3 = appState.userRanking.slice(0, 3);

  podium.innerHTML = `
    ${top3.length > 1 ? `
      <div class="podium-slot silver">
        <div class="medal">🥈</div>
        <div class="podium-name">${top3[1]?.name || 'N/A'}</div>
        <div class="podium-xp">${(top3[1]?.points || 0).toLocaleString()} XP</div>
      </div>
    ` : ''}
    ${top3.length > 0 ? `
      <div class="podium-slot gold">
        <div class="medal">🥇</div>
        <div class="podium-name">${top3[0]?.name || 'N/A'}</div>
        <div class="podium-xp">${(top3[0]?.points || 0).toLocaleString()} XP</div>
      </div>
    ` : ''}
    ${top3.length > 2 ? `
      <div class="podium-slot bronze">
        <div class="medal">🥉</div>
        <div class="podium-name">${top3[2]?.name || 'N/A'}</div>
        <div class="podium-xp">${(top3[2]?.points || 0).toLocaleString()} XP</div>
      </div>
    ` : ''}
  `;

  // Ranking table (4-10)
  table.innerHTML = appState.userRanking.slice(3, 10).map((user, idx) => `
    <div class="ranking-row">
      <div class="ranking-position">#${idx + 4}</div>
      <div class="ranking-user">
        <div class="ranking-avatar">${(user.name || 'W').charAt(0).toUpperCase()}</div>
        <div class="ranking-info">
          <h4>${user.name || 'Nieznany'}</h4>
          <p>${user.rank || 'Rookie'} • ${getLevel(user.points || 0)} poziom</p>
        </div>
      </div>
      <div class="ranking-xp">
        <div class="value">${((user.points || 0) / 1000).toFixed(1)}K</div>
        <div class="label">XP</div>
      </div>
    </div>
  `).join('');
}

function updateProfileCard() {
  const userData = appState.currentUserData;
  if (!userData) return;

  const level = getLevel(userData.points || 0);
  const rank = getRank(userData.points || 0);

  document.getElementById('profile-avatar')?.textContent = (userData.displayName || 'W').charAt(0).toUpperCase();
  document.getElementById('profile-name')?.textContent = userData.displayName || 'Wojownik';
  document.getElementById('profile-rank')?.textContent = rank || 'Rookie';
  document.getElementById('profile-level')?.textContent = level || 1;
  document.getElementById('profile-xp')?.textContent = (userData.points || 0).toLocaleString();
  document.getElementById('profile-challenges')?.textContent = userData.challengesCompleted || 0;
  document.getElementById('profile-wins')?.textContent = userData.challengesSent || 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

export async function handleChallengeClick(idx) {
  try {
    if (!appState.currentUser) {
      showToast('❌ Nie zalogowany', 'error');
      return;
    }

    const challenge = appState.userChallenges[idx];
    if (!challenge) {
      showToast('❌ Wyzwanie nie znalezione', 'error');
      return;
    }

    const newXP = (appState.currentUserData?.points || 0) + challenge.xp;
    const newLevel = getLevel(newXP);

    await updateDoc(doc(db, COL.USERS, appState.currentUser.uid), {
      points: newXP,
      level: newLevel,
      challengesCompleted: (appState.currentUserData?.challengesCompleted || 0) + 1,
      lastActive: serverTimestamp()
    });

    showToast(`🎯 +${challenge.xp} XP za "${challenge.title}"`, 'success');
  } catch (err) {
    console.error('Challenge error:', err);
    showToast(`❌ Błąd: ${err.message}`, 'error');
  }
}

export function handleLogout() {
  appState.unsubscribes.forEach(unsub => unsub?.());
  logout();
}

export function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-screen="${screenId}"]`)?.classList.add('active');

  window.scrollTo(0, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

export function cleanupApp() {
  appState.unsubscribes.forEach(unsub => unsub?.());
  appState.unsubscribes = [];
}

// Export for global access
window.appV4 = {
  initializeApp,
  handleChallengeClick,
  handleLogout,
  switchScreen,
  cleanupApp,
  getAppState: () => appState
};
