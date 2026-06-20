export function renderUstawienia() {
  return `
    <div class="page-container">
      <div class="section">
        <div class="section-title">Ustawienia</div>
      </div>

      <div class="section">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 12px;">Konto</div>
        <div class="card">
          <div style="font-size: 12px;">Email</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 8px;">user@example.com</div>
          <button class="btn">Zmień</button>
        </div>
        <div class="card">
          <div style="font-size: 12px;">Hasło</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 8px;">••••••••</div>
          <button class="btn">Zmień</button>
        </div>
      </div>

      <div class="section">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 12px;">Powiadomienia</div>
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px;">Push Notifications</div>
              <div style="font-size: 11px; color: #666;">Powiadomienia push</div>
            </div>
            <input type="checkbox" checked>
          </div>
        </div>
      </div>

      <div class="section">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 12px;">Prywatność</div>
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px;">Profil Publiczny</div>
              <div style="font-size: 11px; color: #666;">Widoczny dla innych</div>
            </div>
            <input type="checkbox" checked>
          </div>
        </div>
      </div>

      <button class="btn" style="width: 100%; margin-top: 24px;" onclick="logout()">Wyloguj się</button>
    </div>
  `;
}
