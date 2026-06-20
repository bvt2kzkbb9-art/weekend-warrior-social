export function renderWiadomosci() {
  return `
    <div class="page-container">
      <div class="section">
        <div class="section-title">Wiadomości</div>
      </div>

      <div class="list-item">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 12px;">Gracz A</div>
          <div style="font-size: 11px; color: #666;">Cześć, jak się masz?</div>
        </div>
        <div style="font-size: 10px; color: #999;">10:30</div>
      </div>

      <div class="list-item">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 12px;">Gracz B</div>
          <div style="font-size: 11px; color: #666;">Chcesz wyzwanie?</div>
        </div>
        <div style="font-size: 10px; color: #999;">09:15</div>
      </div>

      <div class="list-item">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 12px;">Gracz C</div>
          <div style="font-size: 11px; color: #666;">Super seria!</div>
        </div>
        <div style="font-size: 10px; color: #999;">Wczoraj</div>
      </div>
    </div>
  `;
}
