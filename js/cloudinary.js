/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — cloudinary.js
 * WYŁĄCZNIE Cloudinary — zero Firebase Storage
 * cloud: dxanfwb3l | preset: wws_upload (unsigned)
 * ============================================================
 */

export const CLOUDINARY_CLOUD_NAME    = 'dxanfwb3l';
export const CLOUDINARY_UPLOAD_PRESET = 'wws_upload';

const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadToCloudinary(file, folder = 'wws', onProgress = null) {
  if (!file)                        throw new Error('Brak pliku');
  if (!ALLOWED.includes(file.type)) throw new Error('Dozwolone: JPG, PNG, WebP, GIF');
  if (file.size > MAX_SIZE)         throw new Error('Plik za duży (max 10 MB)');

  const fd = new FormData();
  fd.append('file',          file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  fd.append('folder',        folder);
  fd.append('quality',       'auto');
  fd.append('fetch_format',  'auto');

  if (typeof onProgress === 'function') return _xhr(fd, onProgress);

  const res  = await fetch(`${BASE_URL}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Cloudinary ${res.status}`);
  }
  const d = await res.json();
  return { url: d.secure_url, publicId: d.public_id };
}

function _xhr(fd, onProgress) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/image/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { const d = JSON.parse(xhr.responseText); res({ url: d.secure_url, publicId: d.public_id }); }
        catch { rej(new Error('Nieprawidłowa odpowiedź')); }
      } else {
        try { rej(new Error(JSON.parse(xhr.responseText)?.error?.message || `HTTP ${xhr.status}`)); }
        catch { rej(new Error(`HTTP ${xhr.status}`)); }
      }
    };
    xhr.onerror   = () => rej(new Error('Błąd sieci'));
    xhr.ontimeout = () => rej(new Error('Timeout'));
    xhr.timeout   = 60000;
    xhr.send(fd);
  });
}

export function cloudinaryUrl(publicId, { w = null, h = null, crop = 'fill', q = 'auto' } = {}) {
  if (!publicId) return '';
  const t = [`q_${q}`, 'f_auto'];
  if (w) t.push(`w_${w}`);
  if (h) t.push(`h_${h}`);
  if (w || h) t.push(`c_${crop}`);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${t.join(',')}/${publicId}`;
}

// Unsigned preset nie wspiera delete — loguj publicId do ręcznego usunięcia w Dashboard
export async function deleteFromCloudinary(publicId) {
  if (publicId) console.log('[Cloudinary] Do usunięcia w Dashboard:', publicId);
}
