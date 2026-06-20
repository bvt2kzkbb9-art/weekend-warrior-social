import { db, collection, getDocs, query, where } from '../core/firebase.js';
import { auth } from '../core/firebase.js';

export async function renderProfile() {
  const user = auth.currentUser;
  if (!user) return '<p>Zaloguj się aby zobaczyć profil</p>';

  try {
    const userRef = collection(db, 'users');
    const userQuery = query(userRef, where('uid', '==', user.uid));
    const userSnap = await getDocs(userQuery);
    const userData = userSnap.docs[0]?.data() || {};

    const level = Math.floor((userData.xp || 0) / 500) + 1;
    const xpInCurrentLevel = (userData.xp || 0) % 500;
    const xpProgress = Math.round((xpInCurrentLevel / 500) * 100);

    return `
      <div class="page-container">
        <div class="profile-header">
          <div class="avatar avatar-lg">
            ${userData.avatar ? `<img src="${userData.avatar}" alt="${userData.username}">` : userData.username?.charAt(0).toUpperCase() || 'W'}
          </div>
          <h1 class="profile-name">${userData.username || user.displayName || 'Wojownik'}</h1>
          <span class="profile-rank">${userData.rank || 'Rookie'}</span>
        </div>

        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${level}</div>
            <div class="profile-stat-label">Poziom</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${userData.xp || 0}</div>
            <div class="profile-stat-label">Punkty Doświadczenia</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${userData.streak || 0}</div>
            <div class="profile-stat-label">Seria Dni</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${userData.online ? '🟢' : '⚫'}</div>
            <div class="profile-stat-label">${userData.online ? 'Online' : 'Offline'}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Postęp</h2>
          <div class="card">
            <div style="margin-bottom: var(--spacing-lg);">
              <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
                <span>Postęp do poziomu ${level + 1}</span>
                <span style="color: var(--primary);">${xpProgress}%</span>
              </div>
              <div style="width: 100%; height: 12px; background: var(--border); border-radius: 6px; overflow: hidden;">
                <div style="width: ${xpProgress}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent));"></div>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: var(--spacing-xl);">
          <button class="btn btn-secondary btn-full" onclick="logout()">
            Wyloguj się
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error rendering profile:', err);
    return '<p>Błąd wczytywania profilu</p>';
  }
}
