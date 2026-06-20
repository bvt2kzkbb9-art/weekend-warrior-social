/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — profile-service.js
 * Cloudinary Image Upload Service
 * ============================================================
 *
 * Handles avatar and banner uploads with automatic optimization
 * Uses unsigned Cloudinary upload presets for secure client-side uploads
 *
 * Exports:
 *   uploadAvatar(file)    — Upload user avatar (150x150)
 *   uploadBanner(file)    — Upload user banner (1200x300)
 */

// ════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════

const CLOUDINARY_CLOUD_NAME = 'dxanfwb3l';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const PRESETS = {
  avatar: 'wws_avatar',
  banner: 'wws_banner',
};

const CONSTRAINTS = {
  avatar: {
    maxSize: 5 * 1024 * 1024,  // 5MB
    preset: PRESETS.avatar,
    types: ['image/jpeg', 'image/png', 'image/webp'],
  },
  banner: {
    maxSize: 10 * 1024 * 1024, // 10MB
    preset: PRESETS.banner,
    types: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

// ════════════════════════════════════════════════════════════
// UPLOAD FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Upload avatar image to Cloudinary
 * Automatically resized to 150x150
 *
 * @param {File} file - Image file to upload
 * @returns {Promise<{url: string, publicId: string}>}
 * @throws {Error} Validation or upload error
 */
export async function uploadAvatar(file) {
  const TAG = '[uploadAvatar]';
  console.log(TAG, '🖼️ Uploading avatar...');

  // Validate
  const validation = validateFile(file, CONSTRAINTS.avatar);
  if (!validation.valid) {
    console.error(TAG, '❌', validation.error);
    throw new Error(validation.error);
  }

  try {
    const result = await uploadToCloudinary(file, CONSTRAINTS.avatar);
    console.log(TAG, '✅ Avatar uploaded:', result.publicId);
    return result;
  } catch (err) {
    console.error(TAG, '❌ Upload failed:', err.message);
    throw new Error(`Nie udało się wysłać avatara: ${err.message}`);
  }
}

/**
 * Upload banner image to Cloudinary
 * Automatically resized to 1200x300
 *
 * @param {File} file - Image file to upload
 * @returns {Promise<{url: string, publicId: string}>}
 * @throws {Error} Validation or upload error
 */
export async function uploadBanner(file) {
  const TAG = '[uploadBanner]';
  console.log(TAG, '🎨 Uploading banner...');

  // Validate
  const validation = validateFile(file, CONSTRAINTS.banner);
  if (!validation.valid) {
    console.error(TAG, '❌', validation.error);
    throw new Error(validation.error);
  }

  try {
    const result = await uploadToCloudinary(file, CONSTRAINTS.banner);
    console.log(TAG, '✅ Banner uploaded:', result.publicId);
    return result;
  } catch (err) {
    console.error(TAG, '❌ Upload failed:', err.message);
    throw new Error(`Nie udało się wysłać banera: ${err.message}`);
  }
}

/**
 * Upload post image to Cloudinary
 * Optimized for social feed display
 *
 * @param {File} file - Image file to upload
 * @returns {Promise<{url: string, publicId: string}>}
 * @throws {Error} Validation or upload error
 */
export async function uploadPostImage(file) {
  const TAG = '[uploadPostImage]';
  console.log(TAG, '📸 Uploading post image...');

  const constraints = {
    maxSize: 5 * 1024 * 1024,  // 5MB
    preset: 'wws_post',         // Post preset (add to Cloudinary)
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  };

  // Validate
  const validation = validateFile(file, constraints);
  if (!validation.valid) {
    console.error(TAG, '❌', validation.error);
    throw new Error(validation.error);
  }

  try {
    const result = await uploadToCloudinary(file, constraints);
    console.log(TAG, '✅ Post image uploaded:', result.publicId);
    return result;
  } catch (err) {
    console.error(TAG, '❌ Upload failed:', err.message);
    throw new Error(`Nie udało się wysłać zdjęcia: ${err.message}`);
  }
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

/**
 * Validate file before upload
 * @private
 */
function validateFile(file, constraints) {
  if (!file) {
    return { valid: false, error: 'Nie wybrano pliku' };
  }

  if (!constraints.types.includes(file.type)) {
    return {
      valid: false,
      error: `Format ${file.type} nie jest obsługiwany. Użyj JPG, PNG lub WebP.`,
    };
  }

  if (file.size > constraints.maxSize) {
    const maxMB = Math.round(constraints.maxSize / 1024 / 1024);
    return {
      valid: false,
      error: `Plik jest zbyt duży (max ${maxMB}MB). Rozmiar: ${Math.round(file.size / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Upload file to Cloudinary
 * @private
 */
async function uploadToCloudinary(file, constraints) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', constraints.preset);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Upload failed');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}

/**
 * Get optimized Cloudinary URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export function getOptimizedUrl(publicId, options = {}) {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations = [];

  if (width || height) {
    transformations.push(`w_${width || 'auto'}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`c_${crop}`);
  }

  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  const transform = transformations.length > 0 ? `/${transformations.join(',')}` : '';

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload${transform}/${publicId}`;
}

/**
 * Delete image from Cloudinary
 * Requires authentication (server-side use)
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>}
 */
export async function deleteImage(publicId) {
  const TAG = '[deleteImage]';
  console.log(TAG, '🗑️ Deleting:', publicId);

  // Note: This requires server-side implementation with auth token
  // For now, we rely on Cloudinary's auto-cleanup of unused images
  // Implement this endpoint on your backend if needed

  console.warn(TAG, '⚠️ Delete requires backend implementation');
  return false;
}

// ════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════

export const ProfileService = {
  uploadAvatar,
  uploadBanner,
  uploadPostImage,
  getOptimizedUrl,
  deleteImage,
};

export default ProfileService;
