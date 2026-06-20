import { db, collection, getDocs, query, where, updateDoc, doc } from '../core/firebase.js';
import { auth } from '../core/firebase.js';

export async function renderSettings() {
  const user = auth.currentUser;
  if (!user) return '<p>Zaloguj się aby zobaczyć ustawienia</p>';

  try {
    const userRef = collection(db, 'users');
    const userQuery = query(userRef, where('uid', '==', user.uid));
    const userSnap = await getDocs(userQuery);
    const userData = userSnap.docs[0]?.data() || {};

    return `
      <div class="page-container">
        <div class="section">
          <h2 class="section-title">Ustawienia</h2>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Konto</div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Email</span>
              <span class="settings-label-sub">${user.email}</span>
            </div>
          </div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Imię Wojownika</span>
              <span class="settings-label-sub">${userData.username || 'Brak'}</span>
            </div>
            <button class="btn btn-secondary btn-sm">Edytuj</button>
          </div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Avatar</span>
              <span class="settings-label-sub">Zmień zdjęcie profilowe</span>
            </div>
            <button class="btn btn-secondary btn-sm">Prześlij</button>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Powiadomienia</div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Powiadomienia Push</span>
              <span class="settings-label-sub">Otrzymuj powiadomienia o nowych wyzwaniach</span>
            </div>
            <input type="checkbox" checked>
          </div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Email Podsumowania</span>
              <span class="settings-label-sub">Tygodniowe podsumowanie aktywności</span>
            </div>
            <input type="checkbox">
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Prywatność</div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Profil Publiczny</span>
              <span class="settings-label-sub">Inni mogą zobaczyć twój profil</span>
            </div>
            <input type="checkbox" checked>
          </div>

          <div class="settings-item">
            <div class="settings-label">
              <span class="settings-label-main">Pokaż Status Online</span>
              <span class="settings-label-sub">Inni będą widzieć czy jesteś online</span>
            </div>
            <input type="checkbox">
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Zagrożenie</div>

          <button class="btn btn-secondary btn-full" onclick="logout()">
            Wyloguj się
          </button>

          <button class="btn btn-error btn-full" style="background: var(--error); margin-top: var(--spacing-md); color: white;" disabled>
            Usuń konto
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error rendering settings:', err);
    return '<p>Błąd wczytywania ustawień</p>';
  }
}
