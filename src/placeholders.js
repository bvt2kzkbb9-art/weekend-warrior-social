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
  return renderPlaceholder("Bohater");
}
