/**
 * Login page initialization
 * Handles auth modal forms, login, register, password reset
 */

import { authService } from '../services/AuthService.js';
import { protectAuthPage } from '../lib/guards.js';

async function initLoginPage() {
  try {
    // If user is already logged in, redirect to index
    await protectAuthPage();

    // DOM elements
    const authModal = document.getElementById('authModal');
    const closeAuthModalBtn = document.getElementById('closeAuthModal');
    const loginFormDiv = document.getElementById('loginForm');
    const registerFormDiv = document.getElementById('registerForm');
    const resetPasswordFormDiv = document.getElementById('resetPasswordForm');

    // Main buttons
    const loginMainBtn = document.querySelector('.auth-button');
    const registerLink = document.getElementById('registerLink');

    // Navigation links
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const resetPasswordLink = document.getElementById('resetPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');

    // Login fields
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginError = document.getElementById('loginError');

    // Register fields
    const registerDisplayNameInput = document.getElementById('registerDisplayName');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    const registerError = document.getElementById('registerError');

    // Password reset fields
    const resetEmailInput = document.getElementById('resetEmail');
    const resetSubmitBtn = document.getElementById('resetSubmitBtn');
    const resetError = document.getElementById('resetError');

    // Modal functions
    function openAuthModal(form = 'login') {
      authModal.classList.add('active');
      if (form === 'login') {
        loginFormDiv.style.display = 'block';
        registerFormDiv.style.display = 'none';
        resetPasswordFormDiv.style.display = 'none';
        loginEmailInput?.focus();
      } else if (form === 'register') {
        loginFormDiv.style.display = 'none';
        registerFormDiv.style.display = 'block';
        resetPasswordFormDiv.style.display = 'none';
        registerDisplayNameInput?.focus();
      } else if (form === 'reset') {
        loginFormDiv.style.display = 'none';
        registerFormDiv.style.display = 'none';
        resetPasswordFormDiv.style.display = 'block';
        resetEmailInput?.focus();
      }
    }

    function closeAuthModal() {
      authModal.classList.remove('active');
      clearErrors();
    }

    function clearErrors() {
      document.querySelectorAll('.auth-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
      });
    }

    function showError(elementId, message) {
      const el = document.getElementById(elementId);
      if (el) {
        el.textContent = message;
        el.classList.add('show');
      }
    }

    // Main button listeners
    loginMainBtn?.addEventListener('click', () => openAuthModal('login'));
    registerLink?.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('register');
    });

    // Close modal listeners
    closeAuthModalBtn?.addEventListener('click', closeAuthModal);
    authModal?.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });

    // Form navigation
    showRegisterLink?.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('register');
    });

    showLoginLink?.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('login');
    });

    resetPasswordLink?.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('reset');
    });

    backToLoginLink?.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('login');
    });

    // Login handler
    loginSubmitBtn?.addEventListener('click', async () => {
      clearErrors();
      const email = loginEmailInput?.value?.trim() || '';
      const password = loginPasswordInput?.value || '';

      if (!email) {
        showError('loginEmailError', 'Email jest wymagany');
        return;
      }

      if (!password) {
        showError('loginPasswordError', 'Hasło jest wymagane');
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = '⏳ Logowanie...';

      try {
        await authService.login(email, password);
        closeAuthModal();
        window.location.href = 'index.html';
      } catch (error) {
        showError('loginError', error.message || 'Błąd logowania');
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Zaloguj się';
      }
    });

    // Register handler
    registerSubmitBtn?.addEventListener('click', async () => {
      clearErrors();
      const displayName = registerDisplayNameInput?.value?.trim() || '';
      const email = registerEmailInput?.value?.trim() || '';
      const password = registerPasswordInput?.value || '';
      const confirmPassword = registerConfirmPasswordInput?.value || '';

      let hasError = false;

      if (!displayName) {
        showError('registerDisplayNameError', 'Nazwa użytkownika jest wymagana');
        hasError = true;
      }

      if (!email) {
        showError('registerEmailError', 'Email jest wymagany');
        hasError = true;
      }

      if (!password) {
        showError('registerPasswordError', 'Hasło jest wymagane');
        hasError = true;
      }

      if (password !== confirmPassword) {
        showError('registerConfirmPasswordError', 'Hasła się nie zgadzają');
        hasError = true;
      }

      if (hasError) return;

      registerSubmitBtn.disabled = true;
      registerSubmitBtn.textContent = '⏳ Rejestracja...';

      try {
        await authService.register(email, password, displayName);
        registerError.textContent = '✅ Konto utworzone! Teraz się zaloguj.';
        registerError.classList.add('show');
        setTimeout(() => {
          openAuthModal('login');
        }, 2000);
      } catch (error) {
        showError('registerError', error.message || 'Błąd rejestracji');
      } finally {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = 'Zarejestruj się';
      }
    });

    // Password reset handler
    resetSubmitBtn?.addEventListener('click', async () => {
      clearErrors();
      const email = resetEmailInput?.value?.trim() || '';

      if (!email) {
        showError('resetEmailError', 'Email jest wymagany');
        return;
      }

      resetSubmitBtn.disabled = true;
      resetSubmitBtn.textContent = '⏳ Wysyłanie...';

      try {
        await authService.resetPassword(email);
        resetError.textContent = '✅ Email wysłany! Sprawdź swoją skrzynkę.';
        resetError.classList.add('show');
        setTimeout(() => {
          openAuthModal('login');
        }, 3000);
      } catch (error) {
        showError('resetError', error.message || 'Błąd wysyłania emaila');
      } finally {
        resetSubmitBtn.disabled = false;
        resetSubmitBtn.textContent = 'Wyślij link';
      }
    });

  } catch (error) {
    console.error('Login page initialization error:', error);
  }
}

initLoginPage();
