export function renderCzat() {
  return `
    <div class="page-container">
      <div class="section">
        <div class="section-title">Czat z Graczem A</div>
      </div>

      <div style="height: 300px; border: 1px solid #000; padding: 12px; margin-bottom: 12px; overflow-y: auto;">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; color: #666;">10:30</div>
          <div style="background: #f0f0f0; padding: 8px; border-radius: 2px; max-width: 70%;">
            Cześć, jak się masz?
          </div>
        </div>
        <div style="margin-bottom: 12px; text-align: right;">
          <div style="font-size: 11px; color: #666;">10:35</div>
          <div style="background: #000; color: #fff; padding: 8px; border-radius: 2px; max-width: 70%; margin-left: auto; display: inline-block;">
            Dobrze! A ty?
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <input type="text" placeholder="Napisz wiadomość..." style="flex: 1;">
        <button class="btn">Wyślij</button>
      </div>
    </div>
  `;
}
