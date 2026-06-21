/**
 * ⚔️ WARRIOR OS 2.0 — APP.JS
 * 
 * Root application file. Handles:
 * - Initialization
 * - Routing
 * - UI interactions
 * - State management
 * 
 * @module app
 */

const app = {
  state: {
    currentRoute: '/',
    isLoggedIn: false,
    currentUser: null,
    notificationsPanelOpen: false,
  },

  // ─────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────

  async init() {
    console.log('⚔️ Initializing Warrior OS 2.0...');

    // Setup event listeners
    this.setupEventListeners();

    // Check if user is logged in
    await this.checkAuthStatus();

    // Setup router
    this.setupRouter();

    // Load initial route
    const path = window.location.hash.slice(1) || '/arena';
    await this.navigate(path);

    console.log('✅ Warrior OS initialized');
  },

  // ─────────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────────────────────────────

  setupEventListeners() {
    // Notification toggle
    const notifBtn = document.getElementById('notification-trigger');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => this.toggleNotificationPanel());
    }

    // Notification close
    const notifClose = document.getElementById('notification-close');
    if (notifClose) {
      notifClose.addEventListener('click', () => this.closeNotificationPanel());
    }

    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notification-panel');
      const btn = document.getElementById('notification-trigger');
      if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
        this.closeNotificationPanel();
      }
    });

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route');
        this.navigate(route);
      });
    });

    // Hash change (browser back/forward)
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.slice(1) || '/arena';
      this.navigate(path);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeNotificationPanel();
      }
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────

  async checkAuthStatus() {
    try {
      // TODO: Check Firebase Auth status
      // For now, we'll mock a logged-in user
      this.state.isLoggedIn = true;
      this.state.currentUser = {
        uid: 'user-123',
        email: 'warrior@example.com',
        displayName: 'Trojstary Karabin',
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      this.state.isLoggedIn = false;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // ROUTING
  // ─────────────────────────────────────────────────────────────────

  setupRouter() {
    // This will be expanded in router.js
  },

  async navigate(path) {
    console.log(`📍 Navigating to: ${path}`);

    // Close notification panel when navigating
    this.closeNotificationPanel();

    // Update state
    this.state.currentRoute = path;

    // Update URL
    window.location.hash = path;

    // Update active nav item
    this.updateActiveNavItem(path);

    // Load screen
    await this.loadScreen(path);
  },

  updateActiveNavItem(path) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      const itemRoute = item.getAttribute('data-route');
      if (path.startsWith(itemRoute)) {
        item.setAttribute('aria-current', 'page');
        item.classList.add('active');
      } else {
        item.removeAttribute('aria-current');
        item.classList.remove('active');
      }
    });
  },

  async loadScreen(path) {
    const contentArea = document.getElementById('content-area');

    // Show loading
    contentArea.innerHTML = '<div class="screen-loading"><div class="spinner"></div><p>Ładowanie...</p></div>';

    try {
      let screen;

      if (path === '/arena') {
        screen = this.screens.arenaScreen();
      } else if (path === '/posts') {
        screen = this.screens.feedScreen();
      } else if (path === '/missions') {
        screen = this.screens.missionsScreen();
      } else if (path === '/ranking') {
        screen = this.screens.rankingScreen();
      } else if (path === '/profile' || path === '/profile/me') {
        screen = this.screens.profileScreen();
      } else if (path === '/messages') {
        screen = this.screens.messengerScreen();
      } else {
        screen = this.screens.arenaScreen();
      }

      contentArea.innerHTML = screen;
      this.attachScreenListeners(path);
    } catch (error) {
      console.error('Screen load failed:', error);
      contentArea.innerHTML = `
        <div class="error-screen">
          <h1>⚠️ Błąd ładowania</h1>
          <p>${error.message}</p>
          <button class="btn btn--primary" onclick="app.navigate('/arena')">Powrót do Areny</button>
        </div>
      `;
    }
  },

  attachScreenListeners(path) {
    // Attach event listeners specific to loaded screen
    // This will be expanded as we add more screens
  },

  // ─────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────

  toggleNotificationPanel() {
    if (this.state.notificationsPanelOpen) {
      this.closeNotificationPanel();
    } else {
      this.openNotificationPanel();
    }
  },

  openNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    const btn = document.getElementById('notification-trigger');
    if (panel) {
      panel.style.display = 'block';
      btn.setAttribute('aria-expanded', 'true');
      this.state.notificationsPanelOpen = true;
    }
  },

  closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    const btn = document.getElementById('notification-trigger');
    if (panel) {
      panel.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      this.state.notificationsPanelOpen = false;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // SCREEN TEMPLATES (Mock Screens)
  // ─────────────────────────────────────────────────────────────────

  screens: {
    arenaScreen() {
      return `
        <div class="screen screen--arena">
          <h1>⚔️ ARENA WOJOWNIKÓW</h1>
          <p class="screen-subtitle">Podejmij wyzwania. Zwyciężaj. Wspinaj się w rankingu.</p>
          
          <div class="screen-content">
            <div class="card card--premium">
              <h3>🔥 Wyzwania Aktywne</h3>
              <div class="challenges-grid">
                <div class="challenge-item">
                  <div class="challenge-icon">💪</div>
                  <h4>30 dni bez cukru</h4>
                  <p class="challenge-difficulty">Trudne</p>
                  <p class="challenge-participants">1,247 uczestników</p>
                  <button class="btn btn--primary btn--small">Dołącz</button>
                </div>
                
                <div class="challenge-item">
                  <div class="challenge-icon">🏃</div>
                  <h4>Bieganie 5km dziennie</h4>
                  <p class="challenge-difficulty">Średnie</p>
                  <p class="challenge-participants">834 uczestników</p>
                  <button class="btn btn--primary btn--small">Dołącz</button>
                </div>
                
                <div class="challenge-item">
                  <div class="challenge-icon">📚</div>
                  <h4>Czytaj 30 minut dziennie</h4>
                  <p class="challenge-difficulty">Łatwe</p>
                  <p class="challenge-participants">2,156 uczestników</p>
                  <button class="btn btn--primary btn--small">Dołącz</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    feedScreen() {
      return `
        <div class="screen screen--feed">
          <h1>📜 KRONIKI</h1>
          <p class="screen-subtitle">Feed społeczny. Podziękuj się osiągnięciami.</p>
          
          <div class="screen-content">
            <div class="card">
              <button class="btn btn--secondary btn--block">+ Utwórz Post</button>
            </div>
            
            <div class="card">
              <div class="post-header">
                <img class="post-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%238F8FFF'/%3E%3Ctext x='24' y='32' text-anchor='middle' font-size='24' font-weight='bold' fill='white'%3ET%3C/text%3E%3C/svg%3E" alt="Avatar">
                <div>
                  <h4>Trojstary Karabin</h4>
                  <p class="post-time">15 minut temu</p>
                </div>
              </div>
              <p class="post-content">Ukończyłem wyzwanie "30 dni bez cukru"! 🎉 Czuję się zadziwiająco dobrze. Seria: 30 dni!</p>
              <div class="post-actions">
                <button class="btn-icon">👍 124</button>
                <button class="btn-icon">💬 12</button>
                <button class="btn-icon">↗️ 3</button>
              </div>
            </div>
            
            <div class="card">
              <div class="post-header">
                <img class="post-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%2300FFAA'/%3E%3Ctext x='24' y='32' text-anchor='middle' font-size='24' font-weight='bold' fill='%23000'%3ES%3C/text%3E%3C/svg%3E" alt="Avatar">
                <div>
                  <h4>Shadow</h4>
                  <p class="post-time">45 minut temu</p>
                </div>
              </div>
              <p class="post-content">Nowy poziom! 🚀 Osiągnąłem rank Champion. Dziękuję całej społeczności za wsparcie!</p>
              <div class="post-actions">
                <button class="btn-icon">👍 289</button>
                <button class="btn-icon">💬 45</button>
                <button class="btn-icon">↗️ 18</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    missionsScreen() {
      return `
        <div class="screen screen--missions">
          <h1>⚔️ MISJE</h1>
          <p class="screen-subtitle">Codzienne wyzwania. Zbieraj doświadczenie.</p>
          
          <div class="screen-content">
            <div class="tabs">
              <button class="tab-btn active">DZIENNE</button>
              <button class="tab-btn">TYGODNIOWE</button>
              <button class="tab-btn">SPECJALNE</button>
            </div>
            
            <div class="card">
              <div class="mission-item">
                <div class="mission-icon">🔥</div>
                <div class="mission-details">
                  <h4>Zaloguj się dzisiaj</h4>
                  <p class="mission-desc">Wejdź do aplikacji</p>
                  <div class="progress-bar bar--xp" style="margin-top: 8px;">
                    <span class="stat-bar-text">1/1</span>
                  </div>
                </div>
                <div class="mission-reward">+50 XP</div>
              </div>
              
              <div class="mission-item">
                <div class="mission-icon">💪</div>
                <div class="mission-details">
                  <h4>Wygraj 3 wyzwania</h4>
                  <p class="mission-desc">Ukończ aktywne wyzwania</p>
                  <div class="progress-bar bar--xp" style="margin-top: 8px;">
                    <span class="stat-bar-text">1/3</span>
                  </div>
                </div>
                <div class="mission-reward">+150 XP</div>
              </div>
              
              <div class="mission-item mission-item--completed">
                <div class="mission-icon">✅</div>
                <div class="mission-details">
                  <h4>Napisz post</h4>
                  <p class="mission-desc">Podziel się swoim postępem</p>
                </div>
                <div class="mission-reward">+100 XP</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    rankingScreen() {
      return `
        <div class="screen screen--ranking">
          <h1>👑 CHWAŁA</h1>
          <p class="screen-subtitle">Ranking globalny. Twoją pozycja: <strong>#27</strong></p>
          
          <div class="screen-content">
            <div class="card card--premium">
              <h3>Twoja Pozycja</h3>
              <div class="ranking-entry rank-1" style="margin-top: 16px;">
                <div class="ranking-number">27</div>
                <div class="ranking-avatar" style="background: linear-gradient(135deg, #8F8FFF, #00FFFF);">TY</div>
                <div style="flex: 1;">
                  <h4>Trojstary Karabin</h4>
                  <p class="text-small">Champion</p>
                </div>
                <div class="ranking-xp">2,450 XP</div>
              </div>
            </div>
            
            <div class="card">
              <h3>Top 10</h3>
              <div class="ranking-entry rank-1">
                <div class="ranking-number">1</div>
                <div class="ranking-avatar" style="background: linear-gradient(135deg, #FFD700, #FFAA00);">O</div>
                <div style="flex: 1;">
                  <h4>Owner (TY)</h4>
                  <p class="text-small">Legend</p>
                </div>
                <div class="ranking-xp">25,450 XP</div>
              </div>
              
              <div class="ranking-entry rank-2">
                <div class="ranking-number">2</div>
                <div class="ranking-avatar" style="background: linear-gradient(135deg, #C0C0C0, #A9A9A9);">T</div>
                <div style="flex: 1;">
                  <h4>TrojstaryKarabin</h4>
                  <p class="text-small">Champion</p>
                </div>
                <div class="ranking-xp">12,180 XP</div>
              </div>
              
              <div class="ranking-entry rank-3">
                <div class="ranking-number">3</div>
                <div class="ranking-avatar" style="background: linear-gradient(135deg, #FF5500, #FF7700);">S</div>
                <div style="flex: 1;">
                  <h4>Sztywny</h4>
                  <p class="text-small">Warrior</p>
                </div>
                <div class="ranking-xp">9,650 XP</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    profileScreen() {
      return `
        <div class="screen screen--profile">
          <h1>🛡️ BOHATER</h1>
          <p class="screen-subtitle">Twój profil i statystyki.</p>
          
          <div class="screen-content">
            <div class="card card--premium">
              <div style="text-align: center;">
                <div class="profile-avatar" style="width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, #8F8FFF, #00FFFF); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; color: white; border: 3px solid var(--color-gold-ceremonial);">T</div>
                <h2>Trojstary Karabin</h2>
                <p class="text-glow">Champion</p>
                <p style="margin-top: 8px; color: var(--color-gray-silver);">Pozycja: #27</p>
              </div>
            </div>
            
            <div class="card">
              <h3>Statystyki</h3>
              <div class="stat-row">
                <span>Doświadczenie</span>
                <span class="text-gold">2,450 XP / 5,000 XP</span>
              </div>
              <div class="progress-bar bar--xp" style="margin: 8px 0;">
                <span class="stat-bar-text">49%</span>
              </div>
              
              <div class="stat-row" style="margin-top: 16px;">
                <span>Seria</span>
                <span class="text-glow">🔥 12 dni</span>
              </div>
              
              <div class="stat-row" style="margin-top: 16px;">
                <span>Misje Ukończone</span>
                <span>58</span>
              </div>
              
              <div class="stat-row" style="margin-top: 16px;">
                <span>Wyzwania Aktywne</span>
                <span>3</span>
              </div>
            </div>
            
            <div class="card">
              <h3>Osiągnięcia</h3>
              <div class="achievements-grid">
                <div class="badge badge--gold">30 dni</div>
                <div class="badge badge--gold">100 XP</div>
                <div class="badge badge--gold">Champion</div>
                <div class="badge badge--cyan">Socjalizm</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    messengerScreen() {
      return `
        <div class="screen screen--messenger">
          <h1>💬 WIADOMOŚCI</h1>
          <p class="screen-subtitle">Rozmowy z naukami.</p>
          
          <div class="screen-content">
            <div class="card">
              <div class="conversation-item">
                <div class="conversation-avatar" style="background: linear-gradient(135deg, #00FFAA, #00FFFF); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 20px;">S</div>
                <div style="flex: 1;">
                  <h4>Shadow</h4>
                  <p class="text-small text-secondary">Hej! Gotów na nowe wyzwanie?</p>
                </div>
                <p class="text-small" style="color: var(--color-gold-energetic);">12:34</p>
              </div>
              
              <div class="conversation-item">
                <div class="conversation-avatar" style="background: linear-gradient(135deg, #FF8A00, #FFD700); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 20px;">W</div>
                <div style="flex: 1;">
                  <h4>Warrior Team</h4>
                  <p class="text-small text-secondary">Zaproszenie do grupy "Elitarni Wojownicy"</p>
                </div>
                <p class="text-small" style="color: var(--color-gold-energetic);">15:42</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
