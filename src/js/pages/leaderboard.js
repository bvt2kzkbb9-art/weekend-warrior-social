import { db, collection, getDocs, query, orderBy, limit } from '../core/firebase.js';

export async function renderLeaderboard() {
  try {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, orderBy('xp', 'desc'), limit(100));
    const usersSnap = await getDocs(usersQuery);
    const users = usersSnap.docs.map(doc => doc.data());

    return `
      <div class="page-container">
        <div class="section">
          <h2 class="section-title">Sala Chwały</h2>
          <p class="section-subtitle">Najlepsi wojownicy wszych czasów</p>
          
          ${users.length > 0 ? `
            ${users.map((user, i) => `
              <div class="leaderboard-row">
                <div class="leaderboard-rank">${i + 1}</div>
                <div class="leaderboard-info">
                  <div class="leaderboard-user-info">
                    <span class="leaderboard-username">${user.username || 'Wojownik'}</span>
                    <span class="leaderboard-level">${user.rank || 'Rookie'} • Lvl ${Math.floor((user.xp || 0) / 500) + 1}</span>
                  </div>
                </div>
                <div class="leaderboard-points">${user.xp || 0}</div>
              </div>
            `).join('')}
          ` : '<p>Brak danych</p>'}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error rendering leaderboard:', err);
    return '<p>Błąd wczytywania rankingu</p>';
  }
}
