/**
 * COMPATIBILITY LAYER - js/auth.js
 *
 * This file maintains backwards compatibility by re-exporting from the main auth module.
 * Import from src/js/core/auth.js instead for new code.
 *
 * Old imports like: import { showToast } from './js/auth.js'
 * Will now use the unified system from src/js/core/auth.js
 */

console.log('[js/auth.js] DEPRECATED: Using compatibility layer - please import from src/js/core/auth.js');
console.error('[js/auth.js] Auth Host:', window.location.hostname);
console.error('[js/auth.js] Auth Origin:', window.location.origin);

// Import all exports from the unified auth module
export {
  showToast,
  ensureUserDoc,
  migrateUserDoc,
  updateLastSeen,
  getCurrentUserData,
  checkAuth,
  redirectIfNotLogged,
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  logout,
  handleAuthUI,
  redirectIfLogged,
  initLoginForm,
  initRegisterForm,
  initResetPasswordForm
} from '../src/js/core/auth.js';
