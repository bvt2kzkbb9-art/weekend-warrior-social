export function renderArena() {
  return `
    <div class="page-container">
      <div style="text-align: center; margin-bottom: 20px; font-size: 16px; font-weight: bold; letter-spacing: 2px;">
        WEEKEND WARRIOR
      </div>

      <div class="section">
        <div class="section-header">AKTYWNE WYZWANIA</div>
        <div class="section-content">
          <div style="text-align: center; color: #999;">Brak danych</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">TWOJA SERIA</div>
        <div class="section-content">
          <div class="section-row">
            <span class="row-label">Dni z rzędu:</span>
            <span class="row-value">0</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">RANKING</div>
        <div class="section-content">
          <div class="section-row">
            <span class="row-label">1.</span>
            <span class="row-value">---</span>
          </div>
          <div class="section-row">
            <span class="row-label">2.</span>
            <span class="row-value">---</span>
          </div>
          <div class="section-row">
            <span class="row-label">3.</span>
            <span class="row-value">---</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">STATYSTYKI</div>
        <div class="section-content">
          <div class="section-row">
            <span class="row-label">XP:</span>
            <span class="row-value">0</span>
          </div>
          <div class="section-row">
            <span class="row-label">POZIOM:</span>
            <span class="row-value">1</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
