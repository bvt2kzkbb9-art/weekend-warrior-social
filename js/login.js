/**
 * Login Page Logic - Warrior OS 2.0
 * Obsługa formularza logowania
 */

import { initializeFirebase } from './firebase-config.js';
import { authService } from './auth-service.js';

// State
const state = {
  isLoading: false,
  showPassword: false
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const googleBtn = document.getElementById('googleBtn');
const rememberMeCheckbox = document.getElementById('rememberMe');

/**
 * Inicjalizacja strony
 */
async function initPage() {
  try {
    // Inicjalizacja Firebase
    await initializeFirebase();
    
    // Inicjalizacja Auth Service
    await authService.initialize();

    // Jeśli użytkownik jest zalogowany, kieruj go do dashboard
    if (authService.getCurrentUser()) {
      redirectToDashboard();
      return;
    }

    // Przywróż email jeśli checkbox "zapamiętaj mnie" był zaznaczony
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      emailInput.value = savedEmail;
      rememberMeCheckbox.checked = true;
    }

    // Event listeners
    setupEventListeners();
    console.log('✓ Login page initialized');

  } catch (error) {
    console.error('✗ Initialization error:', error);
    showError('Błąd inicjalizacji. Sprawdź konsolę.');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  loginForm.addEventListener('submit', handleLogin);
  togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  googleBtn.addEventListener('click', handleGoogleLogin);
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);
}

/**
 * Obsługa logowania
 */
async function handleLogin(e) {
  e.preventDefault();
  
  // Walidacja
  if (!validateEmail() || !validatePassword()) {
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeCheckbox.checked;

  setLoading(true);

  try {
    // Logowanie
    const result = await authService.login(email, password);

    if (result.success) {
      // Zapisz email jeśli zaznaczony "zapamiętaj mnie"
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      showSuccess('Zalogowano pomyślnie! ⚔️');
      
      // Redirect do dashboard po 1 sekundzie
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Nieznany błąd podczas logowania');
  } finally {
    setLoading(false);
  }
}

/**
 * Obsługa logowania przez Google
 */
async function handleGoogleLogin(e) {
  e.preventDefault();
  
  setLoading(true);
  
  try {
    const result = await authService.loginWithGoogle();
    
    if (result.success) {
      showSuccess('Zalogowano przez Google! 🔵');
      
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Google login error:', error);
    showError('Błąd logowania przez Google');
  } finally {
    setLoading(false);
  }
}

/**
 * Toggle widoczności hasła
 */
function togglePasswordVisibility(e) {
  e.preventDefault();
  state.showPassword = !state.showPassword;
  
  if (state.showPassword) {
    passwordInput.type = 'text';
    togglePasswordBtn.textContent = '🔐';
  } else {
    passwordInput.type = 'password';
    togglePasswordBtn.textContent = '👁️';
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
 * Walidacja hasła
 */
function validatePassword() {
  const password = passwordInput.value;
  const passwordError = document.getElementById('passwordError');
  
  if (!password) {
    showFieldError(passwordError, 'Hasło jest wymagane');
    passwordInput.classList.add('error');
    return false;
  }
  
  if (password.length < 6) {
    showFieldError(passwordError, 'Hasło musi mieć minimum 6 znaków');
    passwordInput.classList.add('error');
    return false;
  }
  
  clearFieldError(passwordError);
  passwordInput.classList.remove('error');
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
  
  // Scroll do komunikatu
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Auto-hide po 5 sekundach
  setTimeout(() => {
    formError.classList.remove('show');
  }, 5000);
}

/**
 * Pokaż komunikat sukcesu
 */
function showSuccess(message) {
  formSuccess.textContent = message;
  formSuccess.classList.add('show');
  formError.classList.remove('show');
}

/**
 * Ustaw loading state
 */
function setLoading(isLoading) {
  state.isLoading = isLoading;
  submitBtn.disabled = isLoading;
  googleBtn.disabled = isLoading;
  
  if (isLoading) {
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.btn-loader').classList.remove('hidden');
  } else {
    submitBtn.querySelector('.btn-text').classList.remove('hidden');
    submitBtn.querySelector('.btn-loader').classList.add('hidden');
  }
}

/**
 * Redirect do dashboard
 */
function redirectToDashboard() {
  // Dostosuj ścieżkę do lokalizacji dashboard w twoim projekcie
  window.location.href = '../dashboard.html';
}

/**
 * Start
 */
document.addEventListener('DOMContentLoaded', initPage);
