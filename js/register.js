/**
 * Register Page Logic - Warrior OS 2.0
 * Obsługa formularza rejestracji z walidacją siły hasła
 */

import { initializeFirebase } from './firebase-config.js';
import { authService } from './auth-service.js';

// State
const state = {
  isLoading: false,
  showPassword: false,
  showConfirmPassword: false
};

// DOM Elements
const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePasswordBtn = document.getElementById('togglePassword');
const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
const submitBtn = document.getElementById('submitBtn');
const termsCheckbox = document.getElementById('terms');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const googleBtn = document.getElementById('googleBtn');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const usernameIcon = document.getElementById('usernameIcon');

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

    // Event listeners
    setupEventListeners();
    console.log('✓ Register page initialized');

  } catch (error) {
    console.error('✗ Initialization error:', error);
    showError('Błąd inicjalizacji. Sprawdź konsolę.');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  registerForm.addEventListener('submit', handleRegister);
  togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  toggleConfirmPasswordBtn.addEventListener('click', toggleConfirmPasswordVisibility);
  googleBtn.addEventListener('click', handleGoogleRegister);
  
  // Walidacja real-time
  emailInput.addEventListener('blur', validateEmail);
  usernameInput.addEventListener('blur', validateUsername);
  usernameInput.addEventListener('input', checkUsernameAvailability);
  passwordInput.addEventListener('blur', validatePassword);
  passwordInput.addEventListener('input', updatePasswordStrength);
  confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
  termsCheckbox.addEventListener('change', validateTerms);
}

/**
 * Obsługa rejestracji
 */
async function handleRegister(e) {
  e.preventDefault();
  
  // Walidacja
  if (!validateEmail() || !validateUsername() || !validatePassword() || 
      !validateConfirmPassword() || !validateTerms()) {
    return;
  }

  const email = emailInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  setLoading(true);

  try {
    // Rejestracja
    const result = await authService.register(email, password, username);

    if (result.success) {
      showSuccess(`Konto stworzone! Witaj, ${username}! ⚔️`);
      
      // Wyczyść formularz
      registerForm.reset();
      
      // Redirect do login po 2 sekundach
      setTimeout(() => {
        window.location.href = 'login.html?registered=true';
      }, 2000);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Register error:', error);
    showError('Nieznany błąd podczas rejestracji');
  } finally {
    setLoading(false);
  }
}

/**
 * Obsługa rejestracji przez Google
 */
async function handleGoogleRegister(e) {
  e.preventDefault();
  
  setLoading(true);
  
  try {
    const result = await authService.loginWithGoogle();
    
    if (result.success) {
      showSuccess('Konto stworzone przez Google! 🔵');
      
      setTimeout(() => {
        redirectToDashboard();
      }, 1500);
    } else {
      showError(result.error);
    }
  } catch (error) {
    console.error('Google register error:', error);
    showError('Błąd rejestracji przez Google');
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
 * Toggle widoczności potwierdzenia hasła
 */
function toggleConfirmPasswordVisibility(e) {
  e.preventDefault();
  state.showConfirmPassword = !state.showConfirmPassword;
  
  if (state.showConfirmPassword) {
    confirmPasswordInput.type = 'text';
    toggleConfirmPasswordBtn.textContent = '🔐';
  } else {
    confirmPasswordInput.type = 'password';
    toggleConfirmPasswordBtn.textContent = '👁️';
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
 * Walidacja nazwy użytkownika
 */
function validateUsername() {
  const username = usernameInput.value.trim();
  const usernameError = document.getElementById('usernameError');
  
  if (!username) {
    showFieldError(usernameError, 'Nazwa użytkownika jest wymagana');
    usernameInput.classList.add('error');
    return false;
  }
  
  if (!authService.validateUsername(username)) {
    showFieldError(usernameError, '3-20 znaków, litery, cyfry, podkreślenia');
    usernameInput.classList.add('error');
    return false;
  }
  
  clearFieldError(usernameError);
  usernameInput.classList.remove('error');
  return true;
}

/**
 * Sprawdzenie dostępności nazwy użytkownika
 */
function checkUsernameAvailability() {
  const username = usernameInput.value.trim();
  
  if (username && authService.validateUsername(username)) {
    usernameIcon.textContent = '⏳'; // Loading indicator
  } else {
    usernameIcon.textContent = '👤';
  }
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
  
  if (!authService.validatePassword(password)) {
    showFieldError(passwordError, 'Hasło musi mieć minimum 6 znaków');
    passwordInput.classList.add('error');
    return false;
  }
  
  clearFieldError(passwordError);
  passwordInput.classList.remove('error');
  return true;
}

/**
 * Aktualizuj siłę hasła
 */
function updatePasswordStrength() {
  const password = passwordInput.value;
  let strength = 0;
  let strengthLabel = 'Słabe';
  let strengthPercent = 0;

  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  switch (strength) {
    case 0:
    case 1:
      strengthLabel = 'Słabe';
      strengthPercent = 25;
      break;
    case 2:
      strengthLabel = 'Średnie';
      strengthPercent = 50;
      break;
    case 3:
      strengthLabel = 'Dobre';
      strengthPercent = 75;
      break;
    case 4:
    case 5:
      strengthLabel = 'Silne';
      strengthPercent = 100;
      break;
  }

  strengthText.textContent = strengthLabel;
  strengthBar.style.setProperty('--width', strengthPercent + '%');
  strengthBar.querySelector(':after').style.width = strengthPercent + '%';
}

/**
 * Walidacja potwierdzenia hasła
 */
function validateConfirmPassword() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  
  if (!confirmPassword) {
    showFieldError(confirmPasswordError, 'Potwierdź hasło');
    confirmPasswordInput.classList.add('error');
    return false;
  }
  
  if (password !== confirmPassword) {
    showFieldError(confirmPasswordError, 'Hasła nie są identyczne');
    confirmPasswordInput.classList.add('error');
    return false;
  }
  
  clearFieldError(confirmPasswordError);
  confirmPasswordInput.classList.remove('error');
  return true;
}

/**
 * Walidacja regulaminu
 */
function validateTerms() {
  const termsError = document.getElementById('termsError');
  
  if (!termsCheckbox.checked) {
    showFieldError(termsError, 'Musisz zaakceptować regulamin');
    return false;
  }
  
  clearFieldError(termsError);
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
  window.location.href = '../dashboard.html';
}

/**
 * Start
 */
document.addEventListener('DOMContentLoaded', initPage);
