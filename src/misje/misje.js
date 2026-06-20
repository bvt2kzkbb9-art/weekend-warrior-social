export function renderMisje() {
  return `
    <div class="page-container">
      <div class="section">
        <div class="section-title">Misje</div>
      </div>

      <div class="card">
        <div style="font-weight: bold;">Tydzień Mocy</div>
        <div style="font-size: 12px; margin: 4px 0;">Ćwiczenia przez 7 dni</div>
        <div class="progress-bar"><div class="progress-fill" style="width: 50%;"></div></div>
        <div style="font-size: 11px; color: #666;">Nagroda: +500 XP</div>
      </div>

      <div class="card">
        <div style="font-weight: bold;">Mistrz Nauki</div>
        <div style="font-size: 12px; margin: 4px 0;">10 godzin nauki</div>
        <div class="progress-bar"><div class="progress-fill" style="width: 30%;"></div></div>
        <div style="font-size: 11px; color: #666;">Nagroda: +750 XP</div>
      </div>

      <div class="card">
        <div style="font-weight: bold;">Maratończyk</div>
        <div style="font-size: 12px; margin: 4px 0;">30 km biegu</div>
        <div class="progress-bar"><div class="progress-fill" style="width: 20%;"></div></div>
        <div style="font-size: 11px; color: #666;">Nagroda: +1000 XP</div>
      </div>
    </div>
  `;
}
