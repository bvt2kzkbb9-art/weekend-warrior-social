/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — cloudinary.js
 * Centralny moduł upload/delete Cloudinary
 * Unsigned upload — bez backend, działa na GitHub Pages
 * ============================================================
 *
 * KONFIGURACJA:
 *   Wpisz swój CLOUD_NAME z https://cloudinary.com/console
 *   Utwórz unsigned upload preset "weekend-warrior" w:
 *   Settings → Upload → Upload presets → Add upload preset
 *   Signing mode: Unsigned
 * ============================================================
 */

export const CLOUDINARY_CLOUD_NAME   = 'dxanfwb3l';      // ← zmień na swój cloud name
export const CLOUDINARY_UPLOAD_PRESET = 'wws_upload';    // ← musi być "unsigned"

const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;


// ════════════════════════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════════════════════════

/**
 * Uploaduje plik do Cloudinary.
 *
 * @param {File}   file              — obiekt File z input[type=file]
 * @param {string} [folder='wws']    — folder w Cloudinary
 * @param {function} [onProgress]    — callback(pct: 0–100)
 * @returns {{ url: string, publicId: string }}
 */
export async function uploadToCloudinary(file, folder = 'wws', onProgress = null) {
  const TAG = '[Cloudinary.upload]';

  if (!file) throw new Error('Brak pliku do uploadu');

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    throw new Error('Plik jest za duży (max 10 MB)');
  }

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Dozwolone formaty: JPG, PNG, WebP, GIF');
  }

  console.log(TAG, `⬆️ Upload: ${file.name} (${(file.size / 1024).toFixed(0)} KB) → ${folder}`);

  const formData = new FormData();
  formData.append('file',           file);
  formData.append('upload_preset',  CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder',         folder);

  // XHR zamiast fetch żeby obsługiwać onProgress
  if (typeof onProgress === 'function') {
    return _uploadWithProgress(formData, onProgress);
  }

  // Fetch (bez progress)
  const response = await fetch(`${BASE_URL}/image/upload`, {
    method: 'POST',
    body:   formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error(TAG, '❌ Cloudinary error:', err);
    throw new Error(err?.error?.message || `Upload failed (${response.status})`);
  }

  const data = await response.json();
  console.log(TAG, '✅ Upload OK:', data.secure_url);

  return {
    url:      data.secure_url,
    publicId: data.public_id,
  };
}

function _uploadWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: data.secure_url, publicId: data.public_id });
        } catch {
          reject(new Error('Nieprawidłowa odpowiedź Cloudinary'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Błąd sieci podczas uploadu'));
    xhr.ontimeout = () => reject(new Error('Upload timeout'));
    xhr.timeout = 60000; // 60s

    xhr.open('POST', `${BASE_URL}/image/upload`);
    xhr.send(formData);
  });
}


// ════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════

/**
 * Usuwa asset z Cloudinary.
 * UWAGA: unsigned delete wymaga "Allow unsigned delete" w preset.
 * Na MVP logujemy tylko — fizyczne usunięcie wymaga backendu lub Admin API.
 *
 * @param {string} publicId
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  // Na unsigned presetach nie można usuwać bez signed request.
  // Logujemy publicId — można usunąć ręcznie w Cloudinary Dashboard
  // lub zaimplementować Cloud Function/proxy w przyszłości.
  console.log('[Cloudinary.delete] ℹ️ publicId do usunięcia:', publicId,
    '— usuń ręcznie w https://cloudinary.com/console/media_library');
}


// ════════════════════════════════════════════════════════════
// TRANSFORM URL
// ════════════════════════════════════════════════════════════

/**
 * Generuje zoptymalizowany URL obrazu.
 *
 * @param {string} publicId
 * @param {object} [opts]
 * @param {number} [opts.w]      — szerokość
 * @param {number} [opts.h]      — wysokość
 * @param {string} [opts.crop]   — 'fill' | 'thumb' | 'scale'
 * @param {string} [opts.quality]— 'auto' | 'auto:low'
 * @returns {string}
 */
export function cloudinaryUrl(publicId, opts = {}) {
  if (!publicId) return '';
  const {
    w       = null,
    h       = null,
    crop    = 'fill',
    quality = 'auto',
  } = opts;

  const transforms = ['f_auto', `q_${quality}`];
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  if (w || h) transforms.push(`c_${crop}`);

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`;
}
