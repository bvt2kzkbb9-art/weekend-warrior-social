export function renderPlaceholder(moduleName) {
  return `
    <div class="page-container">
      <div class="building-notice">
        ${moduleName} - moduł w budowie
      </div>
    </div>
  `;
}

export function renderKroniki() {
  return renderPlaceholder("Kroniki");
}

export function renderMisje() {
  return renderPlaceholder("Misje");
}

export function renderChwala() {
  return renderPlaceholder("Chwała");
}

export function renderBohater() {
  const userData = window.currentUserData || {};
  return `
    <div class="page-container">
      <div class="section">
        <div class="section-header">TWÓJ PROFIL</div>
        <div class="section-content">
          <div class="section-row">
            <span class="row-label">Nazwa:</span>
            <span class="row-value">${userData.username || "---"}</span>
          </div>
          <div class="section-row">
            <span class="row-label">Email:</span>
            <span class="row-value">${userData.email || "---"}</span>
          </div>
          <div class="section-row">
            <span class="row-label">XP:</span>
            <span class="row-value">${userData.xp || 0}</span>
          </div>
          <div class="section-row">
            <span class="row-label">Poziom:</span>
            <span class="row-value">${userData.level || 1}</span>
          </div>
        </div>
      </div>

      <button class="btn btn-full" id="logout-btn" style="margin-top: 10px;">WYLOGUJ</button>
    </div>
  `;
}
