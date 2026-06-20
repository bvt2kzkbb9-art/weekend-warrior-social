/**
 * WEEKEND WARRIOR SOCIAL — Helpery Formularzy
 * Narzędzia do obsługi walidacji i zarządzania formularzami
 */

/**
 * Waliduje adres email
 * @param {string} email - Email do walidacji
 * @returns {boolean} True jeśli email jest poprawny
 */
export function walidujEmail(email) {
  const wyrażenieMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return wyrażenieMail.test(email);
}

/**
 * Waliduje hasło (minimum 6 znaków)
 * @param {string} hasło - Hasło do walidacji
 * @returns {Object} {isValid: boolean, siła: 'słabe'|'średnie'|'silne'}
 */
export function walidujHasło(hasło) {
  if (!hasło || hasło.length < 6) {
    return { isValid: false, siła: 'słabe' };
  }

  let siła = 'słabe';
  let liczbaZnaków = 0;

  if (/[a-z]/.test(hasło)) liczbaZnaków++;
  if (/[A-Z]/.test(hasło)) liczbaZnaków++;
  if (/[0-9]/.test(hasło)) liczbaZnaków++;
  if (/[^a-zA-Z0-9]/.test(hasło)) liczbaZnaków++;

  if (liczbaZnaków >= 3 && hasło.length >= 8) siła = 'silne';
  else if (liczbaZnaków >= 2) siła = 'średnie';

  return { isValid: true, siła };
}

/**
 * Waliduje nazwę użytkownika (3-20 znaków, tylko litery i cyfry)
 * @param {string} nazwa - Nazwa użytkownika
 * @returns {boolean} True jeśli nazwa jest poprawna
 */
export function walidujNazwęUżytkownika(nazwa) {
  if (!nazwa || nazwa.length < 3 || nazwa.length > 20) return false;
  return /^[a-zA-Z0-9_-]+$/.test(nazwa);
}

/**
 * Wyświetla błąd w polu formularza
 * @param {HTMLInputElement} pole - Element pola formularza
 * @param {string} wiadomość - Wiadomość błędu
 */
export function wyświetliBłądPola(pole, wiadomość) {
  if (!pole) return;

  pole.classList.add('błąd');
  pole.setAttribute('aria-invalid', 'true');

  const grupa = pole.closest('.form-group');
  if (!grupa) return;

  let elementBłędu = grupa.querySelector('.form-error-msg');
  if (!elementBłędu) {
    elementBłędu = document.createElement('p');
    elementBłędu.className = 'form-error-msg';
    elementBłędu.setAttribute('role', 'alert');
    grupa.appendChild(elementBłędu);
  }

  elementBłędu.textContent = wiadomość;
}

/**
 * Usuwa błąd z pola formularza
 * @param {HTMLInputElement} pole - Element pola formularza
 */
export function usuniBłądPola(pole) {
  if (!pole) return;

  pole.classList.remove('błąd', 'ważny');
  pole.removeAttribute('aria-invalid');

  const grupa = pole.closest('.form-group');
  if (!grupa) return;

  const elementBłędu = grupa.querySelector('.form-error-msg');
  if (elementBłędu) elementBłędu.textContent = '';
}

/**
 * Zaznacza pole jako prawidłowe
 * @param {HTMLInputElement} pole - Element pola formularza
 */
export function zaznaczJakoPrawidłowe(pole) {
  if (!pole) return;

  pole.classList.remove('błąd');
  pole.classList.add('ważny');
  pole.setAttribute('aria-invalid', 'false');

  const grupa = pole.closest('.form-group');
  if (!grupa) return;

  const elementBłędu = grupa.querySelector('.form-error-msg');
  if (elementBłędu) elementBłędu.textContent = '';
}

/**
 * Pobiera wszystkie wartości formularza
 * @param {HTMLFormElement} formularz - Element formularza
 * @returns {Object} Obiektu z wartościami pól
 */
export function pobierzWartościFormularza(formularz) {
  if (!formularz) return {};

  const dane = {};
  const elementy = formularz.querySelectorAll('input, textarea, select');

  elementy.forEach(element => {
    if (element.name) {
      if (element.type === 'checkbox') {
        dane[element.name] = element.checked;
      } else if (element.type === 'radio') {
        if (element.checked) dane[element.name] = element.value;
      } else {
        dane[element.name] = element.value;
      }
    }
  });

  return dane;
}

/**
 * Ustawia wartości formularza
 * @param {HTMLFormElement} formularz - Element formularza
 * @param {Object} dane - Obiektu z wartościami do ustawienia
 */
export function ustaw WartościFormularza(formularz, dane) {
  if (!formularz || !dane) return;

  Object.keys(dane).forEach(klucz => {
    const element = formularz.querySelector(`[name="${klucz}"]`);
    if (!element) return;

    if (element.type === 'checkbox') {
      element.checked = Boolean(dane[klucz]);
    } else if (element.type === 'radio') {
      const wybrany = formularz.querySelector(`[name="${klucz}"][value="${dane[klucz]}"]`);
      if (wybrany) wybrany.checked = true;
    } else {
      element.value = dane[klucz];
    }
  });
}

/**
 * Resetuje formularz do stanu początkowego
 * @param {HTMLFormElement} formularz - Element formularza
 */
export function resetujFormularz(formularz) {
  if (!formularz) return;

  formularz.reset();

  const pola = formularz.querySelectorAll('input, textarea, select');
  pola.forEach(pole => {
    usuniBłądPola(pole);
  });
}

/**
 * Wyłącza/włącza wszystkie pola w formularzu
 * @param {HTMLFormElement} formularz - Element formularza
 * @param {boolean} wyłączone - True aby wyłączyć, false aby włączyć
 */
export function ustaw StanFormularza(formularz, wyłączone = false) {
  if (!formularz) return;

  const pola = formularz.querySelectorAll('input, textarea, select, button');
  pola.forEach(pole => {
    pole.disabled = wyłączone;
  });
}
