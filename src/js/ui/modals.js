/**
 * WEEKEND WARRIOR SOCIAL — Helpery Modali
 * Narzędzia do obsługi okien dialogowych
 */

/**
 * Tworzy prosty modal potwierdzenia
 * @param {Object} opcje - Konfiguracja modala
 * @param {string} opcje.tytuł - Tytuł modala
 * @param {string} opcje.wiadomość - Treść wiadomości
 * @param {string} opcje.przyciskPotwierdzenia - Tekst przycisku potwierdzenia (default: OK)
 * @param {string} opcje.przyciskAnulowania - Tekst przycisku anulowania (default: Anuluj)
 * @returns {Promise<boolean>} True jeśli potwierdził, false jeśli anulował
 */
export function wyświetliPotwierdzenie(opcje = {}) {
  const {
    tytuł = 'Potwierdzenie',
    wiadomość = 'Czy jesteś pewny?',
    przyciskPotwierdzenia = 'OK',
    przyciskAnulowania = 'Anuluj'
  } = opcje;

  return new Promise((rozwiąż) => {
    // Twórz modal
    const modal = document.createElement('div');
    modal.className = 'modal aktywny';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'modal-title');

    const zawartość = document.createElement('div');
    zawartość.className = 'modal-content';

    const tytułElement = document.createElement('h2');
    tytułElement.id = 'modal-title';
    tytułElement.className = 'modal-title';
    tytułElement.textContent = tytuł;

    const wiadomośćElement = document.createElement('p');
    wiadomośćElement.className = 'modal-message';
    wiadomośćElement.textContent = wiadomość;

    const przyciski = document.createElement('div');
    przyciski.className = 'modal-buttons';

    const przyciskAnuluj = document.createElement('button');
    przyciskAnuluj.className = 'btn btn-secondary';
    przyciskAnuluj.textContent = przyciskAnulowania;
    przyciskAnuluj.addEventListener('click', () => {
      modal.remove();
      rozwiąż(false);
    });

    const przyciskPotwierdź = document.createElement('button');
    przyciskPotwierdź.className = 'btn btn-primary';
    przyciskPotwierdź.textContent = przyciskPotwierdzenia;
    przyciskPotwierdź.addEventListener('click', () => {
      modal.remove();
      rozwiąż(true);
    });

    przyciski.appendChild(przyciskAnuluj);
    przyciski.appendChild(przyciskPotwierdź);

    zawartość.appendChild(tytułElement);
    zawartość.appendChild(wiadomośćElement);
    zawartość.appendChild(przyciski);

    modal.appendChild(zawartość);
    document.body.appendChild(modal);

    przyciskPotwierdź.focus();

    // Obsługa Escape
    const obsługaEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', obsługaEscape);
        rozwiąż(false);
      }
    };
    document.addEventListener('keydown', obsługaEscape);
  });
}

/**
 * Wyświetla alertu z wiadomością
 * @param {Object} opcje - Konfiguracja alertu
 * @param {string} opcje.tytuł - Tytuł alertu
 * @param {string} opcje.wiadomość - Treść wiadomości
 * @param {string} opcje.typ - Typ: 'info', 'sukces', 'błąd', 'ostrzeżenie'
 * @returns {Promise<void>}
 */
export function wyświetliAlert(opcje = {}) {
  const {
    tytuł = 'Powiadomienie',
    wiadomość = 'OK',
    typ = 'info'
  } = opcje;

  return wyświetliPotwierdzenie({
    tytuł,
    wiadomość,
    przyciskPotwierdzenia: 'OK',
    przyciskAnulowania: null
  }).then(() => {
    // Alert został zamknięty
  });
}

/**
 * Otwiera modal
 * @param {HTMLElement|string} modal - Element modala lub jego ID
 */
export function otwórzModal(modal) {
  const element = typeof modal === 'string'
    ? document.getElementById(modal)
    : modal;

  if (!element) {
    console.warn('[modals] Modal nie znaleziony');
    return;
  }

  element.classList.add('aktywny');
  element.setAttribute('aria-hidden', 'false');

  // Domyślnie fokusuj pierwszy przycisk
  const przycisk = element.querySelector('button');
  if (przycisk) przycisk.focus();
}

/**
 * Zamyka modal
 * @param {HTMLElement|string} modal - Element modala lub jego ID
 */
export function zamknijModal(modal) {
  const element = typeof modal === 'string'
    ? document.getElementById(modal)
    : modal;

  if (!element) {
    console.warn('[modals] Modal nie znaleziony');
    return;
  }

  element.classList.remove('aktywny');
  element.setAttribute('aria-hidden', 'true');
}

/**
 * Przełącza stan modala
 * @param {HTMLElement|string} modal - Element modala lub jego ID
 */
export function przełączModal(modal) {
  const element = typeof modal === 'string'
    ? document.getElementById(modal)
    : modal;

  if (!element) return;

  if (element.classList.contains('aktywny')) {
    zamknijModal(element);
  } else {
    otwórzModal(element);
  }
}

/**
 * Ustawia handler dla przycisku zamknięcia modala
 * @param {HTMLElement} modal - Element modala
 */
export function ustawHandlerZamknięcia(modal) {
  if (!modal) return;

  const przyciskZamknięcia = modal.querySelector('[data-close]');
  if (przyciskZamknięcia) {
    przyciskZamknięcia.addEventListener('click', () => {
      zamknijModal(modal);
    });
  }

  // Zamknij na kliknięcie poza modalem
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      zamknijModal(modal);
    }
  });

  // Zamknij na Escape
  const obsługaEscape = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('aktywny')) {
      zamknijModal(modal);
      document.removeEventListener('keydown', obsługaEscape);
    }
  };
  document.addEventListener('keydown', obsługaEscape);
}

/**
 * Wyświetla toast powiadomienia
 * @param {string} wiadomość - Tekst powiadomienia
 * @param {string} typ - Typ: 'sukces', 'błąd', 'info', 'ostrzeżenie'
 * @param {number} czas - Czas wyświetlania w ms (default: 4000)
 */
export function wyświetliToast(wiadomość, typ = 'info', czas = 4000) {
  const kontenery = document.querySelector('.toast-container');
  if (!kontenery) {
    console.warn('[modals] Toast container nie znaleziony');
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${typ}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = wiadomość;

  kontenery.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('ukryty');
    setTimeout(() => toast.remove(), 300);
  }, czas);
}

/**
 * Tworzy kontener dla toastów
 */
export function stwórzKontenerToastów() {
  let kontenery = document.querySelector('.toast-container');

  if (!kontenery) {
    kontenery = document.createElement('div');
    kontenery.className = 'toast-container';
    document.body.appendChild(kontenery);
  }

  return kontenery;
}
