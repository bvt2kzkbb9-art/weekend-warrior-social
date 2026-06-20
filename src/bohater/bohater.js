export function renderBohater() {
  return `
    <div class="page-container">
      <div class="section">
        <div class="card" style="text-align: center;">
          <div style="width: 60px; height: 60px; border: 1px solid #000; margin: 0 auto 12px;"></div>
          <div style="font-weight: bold; margin-bottom: 4px;">Twoja Nazwa</div>
          <div style="font-size: 12px; color: #666;">Rookie</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold;">1</div>
          <div style="font-size: 11px;">Poziom</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold;">0</div>
          <div style="font-size: 11px;">XP</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold;">0</div>
          <div style="font-size: 11px;">Seria</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold;">🟢</div>
          <div style="font-size: 11px;">Online</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Postęp</div>
        <div class="progress-bar"><div class="progress-fill" style="width: 0%;"></div></div>
        <div style="font-size: 11px; color: #666; text-align: right;">0% do lvl 2</div>
      </div>

      <button class="btn" style="width: 100%; margin-top: 24px;" onclick="logout()">Wyloguj się</button>
    </div>
  `;
}
