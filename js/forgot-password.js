/**
 * Forgot Password Page Logic - Warrior OS 2.0
 * Obsługa resetowania hasła
 */

import { initializeFirebase } from './firebase-config.js';
import { authService } from './auth-service.js';

// State
const state = {
  isLoading: false
};

// DOM Elements
const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const infoBox = document.getElementById('infoBox');

/**
 * Inicjalizacja strony
 */
async function initPage() {
  try {
    // Inicjalizacja Firebase
    await initializeFirebase();
    
    // Inicjalizacja Auth Service
    await authService.initialize();

    // Event listeners
    setupEventListeners();
    
    // Pokazuj info box na starcie
    infoBox.style.display = 'block';
    
    console.log('✓ Reset password page initialized');

  } catch (error) {
    console.error('✗ Initialization error:', error);
    showError('Błąd inicjalizacji. Sprawdź konsolę.');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  resetForm.addEventListener('submit', handlePasswordReset);
  emailInput.addEventListener('blur', validateEmail);
}

/**
 * Obsługa resetowania hasła
 */
async function handlePasswordReset(e) {
  e.preventDefault();
  
  // Walidacja
  if (!validateEmail()) {
    return;
  }

  const email = emailInput.value.trim();
  
  setLoading(true);

  try {
    // Reset hasła
    const result = await authService.resetPassword(email);

    if (result.success) {
      showSuccess(
        `✓ Link resetowania wysłany na ${email}!\n\n` +
        'Sprawdź swoją skrzynkę (i folder spam).\n\n' +
        'Link jest ważny przez 24 godziny.'
      );
      
      // Wyczyść formularz
      emailInput.value = '';
      
      // Hide info box
      infoBox.style.display = 'none';
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Reset password error:', error);
    showError('Błąd podczas resetowania hasła');
  } finally {
    setLoading(false);
  }
}

/**
 * Walidacja email
 */
function validateEmail() {
  const email = emailInput.value.trim();
  const emailError = document.getElementById('emailError');
  
  if (!email) {
    showFieldError(emailError, 'Email jest wymagany');
    emailInput.classList.add('error');
    return false;
  }
  
  if (!authService.validateEmail(email)) {
    showFieldError(emailError, 'Niepoprawny format email');
    emailInput.classList.add('error');
    return false;
  }
  
  clearFieldError(emailError);
  emailInput.classList.remove('error');
  return true;
}

/**
 * Pokaż błąd pola
 */
function showFieldError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

/**
 * Wyczyść błąd pola
 */
function clearFieldError(element) {
  element.textContent = '';
  element.classList.remove('show');
}

/**
 * Pokaż ogólny błąd
 */
function showError(message) {
  formError.textContent = message;
  formError.classList.add('show');
  formSuccess.classList.remove('show');
  
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  setTimeout(() => {
    formError.classList.remove('show');
  }, 6000);
}

/**
 * Pokaż komunikat sukcesu
 */
function showSuccess(message) {
  formSuccess.innerHTML = message.replace(/\n/g, '<br>');
  formSuccess.classList.add('show');
  formError.classList.remove('show');
  
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Ustaw loading state
 */
function setLoading(isLoading) {
  state.isLoading = isLoading;
  submitBtn.disabled = isLoading;
  
  if (isLoading) {
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.btn-loader').classList.remove('hidden');
  } else {
    submitBtn.querySelector('.btn-text').classList.remove('hidden');
    submitBtn.querySelector('.btn-loader').classList.add('hidden');
  }
}

/**
 * Start
 */
document.addEventListener('DOMContentLoaded', initPage);
