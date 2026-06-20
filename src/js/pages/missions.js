export function renderMissions() {
  return `
    <div class="page-container">
      <div class="section">
        <h2 class="section-title">Misje Specjalne</h2>
        
        <div class="mission-card">
          <div class="mission-icon">💪</div>
          <div class="mission-details">
            <h3>Tydzień Mocy</h3>
            <p class="mission-description">Wykonaj ćwiczenia przez 7 dni z rzędu</p>
            <span class="mission-reward">+500 XP</span>
          </div>
          <div class="mission-action">
            <button class="btn btn-primary btn-sm">Zaakceptuj</button>
          </div>
        </div>

        <div class="mission-card">
          <div class="mission-icon">📚</div>
          <div class="mission-details">
            <h3>Mistrz Nauki</h3>
            <p class="mission-description">Poświęć 10 godzin nauce tej tygodnia</p>
            <span class="mission-reward">+750 XP</span>
          </div>
          <div class="mission-action">
            <button class="btn btn-primary btn-sm">Zaakceptuj</button>
          </div>
        </div>

        <div class="mission-card">
          <div class="mission-icon">🏃</div>
          <div class="mission-details">
            <h3>Maratończyk</h3>
            <p class="mission-description">Przebiegn 30 km tego miesiąca</p>
            <span class="mission-reward">+1000 XP</span>
          </div>
          <div class="mission-action">
            <button class="btn btn-primary btn-sm">Zaakceptuj</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
