/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — cloudinary.js
 * Upload manager — WYŁĄCZNIE Cloudinary, zero Firebase Storage
 * ============================================================
 *
 * Cloud Name i preset pobrane z config.js (dxanfwb3l / wws_upload)
 */

export const CLOUDINARY_CLOUD_NAME    = 'dxanfwb3l';    // z config.js
export const CLOUDINARY_UPLOAD_PRESET = 'wws_upload';    // z config.js

const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;
const MAX_SIZE  = 10 * 1024 * 1024; // 10 MB
const ALLOWED   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ── Upload z progress ──────────────────────────────────────────
export async function uploadToCloudinary(file, folder = 'wws', onProgress = null) {
  if (!file) throw new Error('Brak pliku');
  if (!ALLOWED.includes(file.type)) throw new Error('Dozwolone: JPG, PNG, WebP, GIF');
  if (file.size > MAX_SIZE)         throw new Error('Plik za duży (max 10 MB)');

  const formData = new FormData();
  formData.append('file',          file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder',        folder);
  formData.append('quality',       'auto');
  formData.append('fetch_format',  'auto');

  if (typeof onProgress === 'function') {
    return _uploadXHR(formData, onProgress);
  }

  const res = await fetch(`${BASE_URL}/image/upload`, { method: 'POST', body: formData });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Cloudinary error ${res.status}`);
  }
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

function _uploadXHR(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/image/upload`);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const d = JSON.parse(xhr.responseText);
          resolve({ url: d.secure_url, publicId: d.public_id });
        } catch { reject(new Error('Nieprawidłowa odpowiedź Cloudinary')); }
      } else {
        try   { reject(new Error(JSON.parse(xhr.responseText)?.error?.message || `HTTP ${xhr.status}`)); }
        catch { reject(new Error(`HTTP ${xhr.status}`)); }
      }
    };
    xhr.onerror   = () => reject(new Error('Błąd sieci'));
    xhr.ontimeout = () => reject(new Error('Timeout'));
    xhr.timeout   = 60000;
    xhr.send(formData);
  });
}

// ── Thumbnail URL ─────────────────────────────────────────────
export function cloudinaryUrl(publicId, opts = {}) {
  if (!publicId) return '';
  const { w = null, h = null, crop = 'fill', quality = 'auto' } = opts;
  const t = ['f_auto', `q_${quality}`];
  if (w) t.push(`w_${w}`);
  if (h) t.push(`h_${h}`);
  if (w || h) t.push(`c_${crop}`);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${t.join(',')}/${publicId}`;
}

// ── Delete ────────────────────────────────────────────────────
// Unsigned preset nie pozwala na delete bez backendu.
// publicId zapisywany w Firestore — można usunąć ręcznie w Dashboard.
export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  console.log('[Cloudinary] Plik do usunięcia (ręcznie w Dashboard):', publicId);
}
