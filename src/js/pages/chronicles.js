export function renderChronicles() {
  return `
    <div class="page-container">
      <div class="section">
        <h2 class="section-title">Kroniki Twoich Walkach</h2>
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          <h3>Brak zapisów</h3>
          <p>Twoje wyzwania pojawią się tutaj po pierwszej aktywnośći</p>
          <button class="btn btn-primary" onclick="navigateTo('#/')">Przejdź do Areny</button>
        </div>
      </div>
    </div>
  `;
}
