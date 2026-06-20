export function renderArena() {
  return `
    <div class="page-container">
      <div class="section">
        <div class="section-title">Arena</div>
      </div>

      <div class="section">
        <div class="card">
          <div style="height: 60px; border: 1px solid #000; margin-bottom: 8px;"></div>
          <div style="font-size: 12px; font-weight: bold;">Seria: 14 dni</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Wyzwania</div>
        <div class="grid">
          <div class="grid-item">Ćwiczenia</div>
          <div class="grid-item">Nauka</div>
          <div class="grid-item">Bieganie</div>
          <div class="grid-item">Muzyka</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Top Gracze</div>
        <div class="list-item">
          <div>1. Gracz A</div>
          <div>5000 pkt</div>
        </div>
        <div class="list-item">
          <div>2. Gracz B</div>
          <div>4800 pkt</div>
        </div>
        <div class="list-item">
          <div>3. Gracz C</div>
          <div>4600 pkt</div>
        </div>
      </div>
    </div>
  `;
}
