import { db, collection, getDocs, query, where, orderBy, limit } from '../core/firebase.js';
import { auth } from '../core/firebase.js';

export async function renderArena() {
  const user = auth.currentUser;
  if (!user) return '<p>Zaloguj się aby zobaczyć Arenę</p>';

  try {
    // Get user data
    const userRef = collection(db, 'users');
    const userQuery = query(userRef, where('uid', '==', user.uid));
    const userSnap = await getDocs(userQuery);
    const userData = userSnap.docs[0]?.data() || {};

    // Get top players for leaderboard
    const playersRef = collection(db, 'users');
    const playersQuery = query(playersRef, orderBy('xp', 'desc'), limit(3));
    const playersSnap = await getDocs(playersQuery);
    const topPlayers = playersSnap.docs.map(doc => doc.data());

    return `
      <div class="page-container">
        <div class="arena-hero">
          <h1>⚔ Arena Wojowników</h1>
          <p>Wyzwania czekają. Czy podejmiesz je?</p>
        </div>

        <div class="section">
          <h2 class="section-title">Twoja Seria</h2>
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
              <div>
                <h3 style="margin-bottom: var(--spacing-xs);">🔥 Seria Aktywności</h3>
                <p style="color: var(--text-tertiary); margin: 0;">${userData.streak || 0} dni z rzędu</p>
              </div>
              <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">${userData.streak || 0}</div>
            </div>
            <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.min(100, (userData.streak || 0) * 5)}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent));"></div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Dostępne Wyzwania</h2>
          <div class="challenges-grid">
            <div class="challenge-card">
              <div class="challenge-emoji">💪</div>
              <div class="challenge-name">Ćwiczenia</div>
              <div class="challenge-xp">+50 XP</div>
            </div>
            <div class="challenge-card">
              <div class="challenge-emoji">📚</div>
              <div class="challenge-name">Nauka</div>
              <div class="challenge-xp">+75 XP</div>
            </div>
            <div class="challenge-card">
              <div class="challenge-emoji">🏃</div>
              <div class="challenge-name">Bieganie</div>
              <div class="challenge-xp">+40 XP</div>
            </div>
            <div class="challenge-card">
              <div class="challenge-emoji">🎵</div>
              <div class="challenge-name">Muzyka</div>
              <div class="challenge-xp">+30 XP</div>
            </div>
            <div class="challenge-card">
              <div class="challenge-emoji">🧘</div>
              <div class="challenge-name">Medytacja</div>
              <div class="challenge-xp">+25 XP</div>
            </div>
            <div class="challenge-card">
              <div class="challenge-emoji">🍎</div>
              <div class="challenge-name">Zdrowa Dieta</div>
              <div class="challenge-xp">+35 XP</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Top 3 Wojowników</h2>
          ${topPlayers.length > 0 ? `
            ${topPlayers.map((player, i) => `
              <div class="ranking-item">
                <div class="ranking-position">
                  ${['🥇', '🥈', '🥉'][i]}
                </div>
                <div class="ranking-info">
                  <div class="ranking-name">${player.username || 'Wojownik'}</div>
                  <div class="ranking-meta">${player.rank || 'Rookie'} • Poziom ${Math.floor((player.xp || 0) / 500) + 1}</div>
                </div>
                <div class="ranking-score">${player.xp || 0} pkt</div>
              </div>
            `).join('')}
          ` : '<p>Brak danych</p>'}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error rendering arena:', err);
    return '<p>Błąd wczytywania Areny</p>';
  }
}
