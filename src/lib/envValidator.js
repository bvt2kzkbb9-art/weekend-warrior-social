/**
 * Environment Variables Validator
 *
 * Validates that required environment variables are set for Firebase and Cloudinary integration.
 * Provides helpful error messages when configuration is missing.
 */

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validates Cloudinary configuration
   */
  validateCloudinary() {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      this.errors.push('VITE_CLOUDINARY_CLOUD_NAME is not set');
    }

    if (!uploadPreset) {
      this.errors.push('VITE_CLOUDINARY_UPLOAD_PRESET is not set');
    }

    // These are optional for client-side, but good to have
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!apiKey) {
      this.warnings.push(
        'VITE_CLOUDINARY_API_KEY is not set. Asset deletion will not work.'
      );
    }

    if (!apiSecret) {
      this.warnings.push(
        'VITE_CLOUDINARY_API_SECRET is not set. Asset deletion will not work.'
      );
    }
  }

  /**
   * Validates Firebase configuration
   * Firebase can be hardcoded or use environment variables
   */
  validateFirebase() {
    // Firebase is configured in src/lib/firebase.js
    // Check if it can be overridden by env vars
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (projectId) {
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID',
      ];

      requiredVars.forEach((varName) => {
        if (!import.meta.env[varName]) {
          this.errors.push(`${varName} is not set`);
        }
      });
    } else {
      this.warnings.push(
        'Firebase is using hardcoded configuration from src/lib/firebase.js'
      );
    }
  }

  /**
   * Performs all validations
   */
  validate() {
    this.errors = [];
    this.warnings = [];

    this.validateCloudinary();
    this.validateFirebase();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Returns validation report as a formatted string
   */
  getReport() {
    const validation = this.validate();
    const lines = [];

    lines.push('\n=== Environment Configuration Report ===\n');

    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      lines.push('✓ All environment variables are properly configured\n');
    } else {
      if (validation.errors.length > 0) {
        lines.push('✗ Errors:');
        validation.errors.forEach((error) => {
          lines.push(`  - ${error}`);
        });
        lines.push('');
      }

      if (validation.warnings.length > 0) {
        lines.push('⚠ Warnings:');
        validation.warnings.forEach((warning) => {
          lines.push(`  - ${warning}`);
        });
        lines.push('');
      }
    }

    lines.push('Configuration Guide:');
    lines.push('  1. Copy .env.example to .env.local');
    lines.push('  2. Get Cloudinary credentials: https://cloudinary.com/console');
    lines.push('  3. Fill in your VITE_CLOUDINARY_* variables');
    lines.push(
      '  4. Firebase is pre-configured for production (see src/lib/firebase.js)'
    );
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Logs validation report to console
   */
  logReport() {
    const report = this.getReport();
    const validation = this.validate();

    if (validation.errors.length > 0) {
      console.error(report);
    } else if (validation.warnings.length > 0) {
      console.warn(report);
    } else {
      console.log(report);
    }
  }
}

const envValidator = new EnvironmentValidator();

export { envValidator, EnvironmentValidator };
