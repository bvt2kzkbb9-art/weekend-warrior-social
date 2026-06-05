/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — media.js
 * Obsługa mediów: Cloudinary upload + YouTube/SoundCloud embed
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * EKSPORTY:
 *   uploadMedia(file, folder, onProgress?)       → { url, publicId, thumbnailUrl }
 *   generateThumbnail(publicId, opts?)           → url string
 *   detectEmbed(text)                            → null | { type, videoId/url, embedHtml }
 *   renderEmbedInFeed(containerEl, embedData)    — wstawia player do DOM
 *   renderMediaFeed(postData, containerEl)       — kompletny render mediów posta
 *   injectMediaCompose(containerEl, onMediaReady) — compose box z media picker
 */

// ── Cloudinary config ─────────────────────────────────────────
const CLOUD_NAME   = 'dxanfwb3l';      // ← zmień na swój cloud name
const UPLOAD_PRESET = 'wws_upload';    // ← unsigned preset

// ── Limity ───────────────────────────────────────────────────
const MAX_SIZE  = 10 * 1024 * 1024;  // 10 MB
const ALLOWED   = ['image/jpeg','image/png','image/webp','image/gif'];


// ════════════════════════════════════════════════════════════
// UPLOAD DO CLOUDINARY
// ════════════════════════════════════════════════════════════

/**
 * Upload pliku do Cloudinary z progress callbackiem.
 *
 * @param {File}     file
 * @param {string}   folder      — np. 'posts/uid123', 'dm/uid123'
 * @param {Function} onProgress  — callback(pct: 0–100)
 * @returns {Promise<{ url, publicId, thumbnailUrl }>}
 */
export async function uploadMedia(file, folder = 'wws', onProgress = null) {
  if (!file) throw new Error('Brak pliku');

  if (!ALLOWED.includes(file.type)) {
    throw new Error('Dozwolone formaty: JPG, PNG, WebP, GIF');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Plik za duży (max 10 MB)');
  }

  const formData = new FormData();
  formData.append('file',           file);
  formData.append('upload_preset',  UPLOAD_PRESET);
  formData.append('folder',         folder);
  // Automatyczna kompresja jakości
  formData.append('quality',        'auto');
  formData.append('fetch_format',   'auto');

  let url_base = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  if (typeof onProgress === 'function') {
    return _uploadWithXHR(url_base, formData, onProgress);
  }

  const res = await fetch(url_base, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Błąd Cloudinary (${res.status})`);
  }
  const data = await res.json();

  return {
    url:          data.secure_url,
    publicId:     data.public_id,
    thumbnailUrl: generateThumbnail(data.public_id, { w: 400, h: 300 }),
    width:        data.width,
    height:       data.height,
    format:       data.format,
  };
}

function _uploadWithXHR(endpoint, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url:          data.secure_url,
            publicId:     data.public_id,
            thumbnailUrl: generateThumbnail(data.public_id, { w: 400, h: 300 }),
            width:        data.width,
            height:       data.height,
          });
        } catch { reject(new Error('Nieprawidłowa odpowiedź Cloudinary')); }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message || `HTTP ${xhr.status}`));
        } catch { reject(new Error(`HTTP ${xhr.status}`)); }
      }
    };
    xhr.onerror   = () => reject(new Error('Błąd sieci'));
    xhr.ontimeout = () => reject(new Error('Timeout'));
    xhr.timeout   = 60000;
    xhr.send(formData);
  });
}


// ════════════════════════════════════════════════════════════
// THUMBNAIL URL (Cloudinary transformacje)
// ════════════════════════════════════════════════════════════

/**
 * Generuje URL miniatury przez transformacje Cloudinary.
 *
 * @param {string} publicId
 * @param {object} opts  — { w, h, crop, quality }
 * @returns {string}
 */
export function generateThumbnail(publicId, opts = {}) {
  if (!publicId) return '';
  const {
    w       = 400,
    h       = 300,
    crop    = 'fill',
    quality = 'auto',
  } = opts;

  const transforms = [
    `w_${w}`,
    `h_${h}`,
    `c_${crop}`,
    `q_${quality}`,
    'f_auto',
  ].join(',');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}


// ════════════════════════════════════════════════════════════
// WYKRYWANIE EMBEDDÓW
// ════════════════════════════════════════════════════════════

/**
 * Wykrywa czy tekst zawiera link YouTube/SoundCloud.
 *
 * @param {string} text
 * @returns {null | { type: 'youtube'|'soundcloud', videoId?, url, embedHtml }}
 */
export function detectEmbed(text) {
  if (!text) return null;

  const urlMatch = text.match(/(https?:\/\/[^\s<>"]+)/);
  if (!urlMatch) return null;
  const url = urlMatch[1];

  // YouTube
  const ytId = _parseYouTubeId(url);
  if (ytId) {
    return {
      type:     'youtube',
      videoId:  ytId,
      url,
      embedHtml: _buildYouTubeEmbed(ytId, url),
    };
  }

  // SoundCloud
  if (_isSoundCloud(url)) {
    return {
      type:     'soundcloud',
      url,
      embedHtml: _buildSoundCloudEmbed(url),
    };
  }

  return null;
}

function _parseYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function _isSoundCloud(url) {
  return /soundcloud\.com\/.+/.test(url);
}

function _buildYouTubeEmbed(videoId, originalUrl) {
  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  return `
    <div class="media-embed yt-embed" data-video-id="${_esc(videoId)}" data-url="${_esc(originalUrl)}">
      <div class="embed-thumbnail" style="background-image:url('${thumb}');" data-videoid="${_esc(videoId)}">
        <div class="embed-play-btn" aria-label="Odtwórz YouTube">
          <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div class="embed-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 12.56 12.56 0 00-8.64 0A4.83 4.83 0 013.41 6.69 11.09 11.09 0 002 12a11.09 11.09 0 001.41 5.31 4.83 4.83 0 003.77 2.75 12.56 12.56 0 008.64 0 4.83 4.83 0 003.77-2.75A11.09 11.09 0 0022 12a11.09 11.09 0 00-2.41-5.31zM10 15V9l5 3z"/>
          </svg>
          YouTube
        </div>
      </div>
    </div>`;
}

function _buildSoundCloudEmbed(url) {
  const encoded = encodeURIComponent(url);
  return `
    <div class="media-embed sc-embed">
      <iframe
        src="https://w.soundcloud.com/player/?url=${encoded}&color=%23D4AF37&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true"
        frameborder="0"
        scrolling="no"
        allow="autoplay"
        loading="lazy"
        style="width:100%;height:300px;border-radius:12px;display:block;"
        title="SoundCloud player">
      </iframe>
    </div>`;
}


// ════════════════════════════════════════════════════════════
// RENDER EMBED W FEEDZIE
// ════════════════════════════════════════════════════════════

/**
 * Wstawia embed player do elementu DOM.
 * Po kliknięciu na thumbnail YouTube — zamienia na iframe.
 *
 * @param {HTMLElement} containerEl
 * @param {{ type, videoId?, url, embedHtml }} embedData
 */
export function renderEmbedInFeed(containerEl, embedData) {
  if (!containerEl || !embedData) return;

  containerEl.innerHTML = embedData.embedHtml;

  // YouTube: lazy load — kliknięcie na thumbnail ładuje iframe
  if (embedData.type === 'youtube') {
    const thumb = containerEl.querySelector('.embed-thumbnail');
    const vid   = embedData.videoId;
    thumb?.addEventListener('click', () => {
      thumb.outerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${_esc(vid)}?autoplay=1&rel=0&modestbranding=1"
          frameborder="0"
          allow="autoplay;accelerometer;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
          allowfullscreen
          loading="lazy"
          style="width:100%;aspect-ratio:16/9;border-radius:12px;display:block;"
          title="YouTube video">
        </iframe>`;
    });
  }

  // Wstrzyknij style embeddów
  _injectEmbedStyles();
}


// ════════════════════════════════════════════════════════════
// RENDER MEDIÓW POSTA (kompletny)
// ════════════════════════════════════════════════════════════

/**
 * Renderuje sekcję mediów posta (obraz + embed).
 * Wywołaj w createPostElement z feed.js.
 *
 * @param {object}      postData
 * @param {HTMLElement} containerEl — element gdzie wstawić media
 */
export function renderMediaFeed(postData, containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  // Obraz (Cloudinary)
  if (postData.imageUrl) {
    const thumbUrl = postData.imagePublicId
      ? generateThumbnail(postData.imagePublicId, { w: 600, h: 400, crop: 'fill' })
      : postData.imageUrl;

    const wrap  = document.createElement('div');
    wrap.className = 'post-media-wrap';
    const img   = document.createElement('img');
    img.src     = thumbUrl;
    img.alt     = 'Zdjęcie posta';
    img.className = 'post-media-img';
    img.loading  = 'lazy';
    // Kliknięcie → pełny rozmiar
    img.addEventListener('click', () => _openMediaLightbox(postData.imageUrl));
    wrap.appendChild(img);
    containerEl.appendChild(wrap);
  }

  // Embed (YouTube/SoundCloud wykryty z treści)
  if (postData.content) {
    const embed = detectEmbed(postData.content);
    if (embed) {
      const embedWrap = document.createElement('div');
      embedWrap.className = 'post-embed-wrap';
      renderEmbedInFeed(embedWrap, embed);
      containerEl.appendChild(embedWrap);
    }
  }
}

function _openMediaLightbox(src) {
  const lb = document.createElement('div');
  lb.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9000;
    display:flex;align-items:center;justify-content:center;cursor:zoom-out;`;
  lb.innerHTML = `
    <button style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.1);
      border:none;color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:1.25rem;">✕</button>
    <img src="${_esc(src)}" style="max-width:92vw;max-height:90vh;object-fit:contain;border-radius:12px;" alt="Zdjęcie"/>`;
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'BUTTON') lb.remove(); });
  document.body.appendChild(lb);
  const onKey = (e) => { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}


// ════════════════════════════════════════════════════════════
// INJECT MEDIA COMPOSE BOX
// ════════════════════════════════════════════════════════════

/**
 * Tworzy i wstrzykuje Media Picker do elementu compose.
 * Obsługuje preview, upload progress, błędy.
 *
 * @param {HTMLElement} containerEl   — gdzie wstrzyknąć
 * @param {Function}    onMediaReady  — callback({ url, publicId, thumbnailUrl })
 * @param {string}      folder        — Cloudinary folder
 */
export function injectMediaCompose(containerEl, onMediaReady, folder = 'posts') {
  if (!containerEl || !onMediaReady) return;

  const id     = 'mc_' + Math.random().toString(36).slice(2, 8);
  const wrap   = document.createElement('div');
  wrap.innerHTML = `
    <div class="media-compose-wrap" id="mc-wrap-${id}">
      <input type="file" id="mc-input-${id}" accept="image/jpeg,image/png,image/webp,image/gif"
             style="display:none;" aria-label="Wybierz zdjęcie"/>

      <button type="button" class="media-compose-btn" id="mc-btn-${id}" title="Dodaj zdjęcie">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>

      <div class="media-compose-preview hidden" id="mc-preview-${id}">
        <img src="" alt="Podgląd"/>
        <button type="button" class="media-compose-remove" id="mc-remove-${id}" aria-label="Usuń">✕</button>
        <div class="media-compose-progress" id="mc-progress-${id}" style="display:none;">
          <div class="progress-track">
            <div class="progress-fill" id="mc-bar-${id}" style="width:0%;"></div>
          </div>
          <span id="mc-pct-${id}">0%</span>
        </div>
      </div>
    </div>`;
  containerEl.appendChild(wrap);

  const fileInput  = document.getElementById(`mc-input-${id}`);
  const triggerBtn = document.getElementById(`mc-btn-${id}`);
  const preview    = document.getElementById(`mc-preview-${id}`);
  const removeBtn  = document.getElementById(`mc-remove-${id}`);
  const progressWrap = document.getElementById(`mc-progress-${id}`);
  const bar        = document.getElementById(`mc-bar-${id}`);
  const pct        = document.getElementById(`mc-pct-${id}`);

  let currentMedia = null;

  triggerBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED.includes(file.type)) { alert('Dozwolone: JPG, PNG, WebP, GIF'); return; }
    if (file.size > MAX_SIZE) { alert('Maks. 10 MB.'); return; }

    // Lokalny preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (preview) {
        preview.classList.remove('hidden');
        const img = preview.querySelector('img');
        if (img) img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);

    // Progress
    if (progressWrap) progressWrap.style.display = 'flex';
    triggerBtn.disabled = true;

    try {
      const result = await uploadMedia(file, folder, (p) => {
        if (bar) bar.style.width = p + '%';
        if (pct) pct.textContent = p + '%';
      });

      currentMedia = result;
      if (progressWrap) progressWrap.style.display = 'none';
      triggerBtn?.classList.add('active');
      onMediaReady(result);

    } catch (err) {
      alert(err.message || 'Błąd uploadu');
      currentMedia = null;
      if (preview) preview.classList.add('hidden');
      if (progressWrap) progressWrap.style.display = 'none';
    } finally {
      triggerBtn.disabled = false;
      if (fileInput) fileInput.value = '';
    }
  });

  removeBtn?.addEventListener('click', () => {
    currentMedia = null;
    if (preview) { preview.classList.add('hidden'); const img = preview.querySelector('img'); if (img) img.src = ''; }
    triggerBtn?.classList.remove('active');
    onMediaReady(null);
  });

  _injectMediaComposeStyles();
}


// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

function _injectEmbedStyles() {
  if (document.getElementById('embed-styles')) return;
  const s = document.createElement('style');
  s.id = 'embed-styles';
  s.textContent = `
    .media-embed { border-radius: 12px; overflow: hidden; margin: .5rem 0; }

    /* YouTube thumbnail player */
    .embed-thumbnail {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000 center/cover no-repeat;
      cursor: pointer;
      border-radius: 12px;
      overflow: hidden;
    }
    .embed-thumbnail::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,.3);
      transition: background .2s;
    }
    .embed-thumbnail:hover::after { background: rgba(0,0,0,.2); }
    .embed-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%,-50%);
      z-index: 2;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(212,175,55,.9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      transition: transform .2s;
    }
    .embed-thumbnail:hover .embed-play-btn { transform: translate(-50%,-50%) scale(1.1); }
    .embed-label {
      position: absolute;
      bottom: .5rem;
      left: .625rem;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: .25rem;
      font-size: .6875rem;
      font-family: var(--font-hd, 'Rajdhani', sans-serif);
      font-weight: 700;
      color: rgba(255,255,255,.8);
      letter-spacing: .06em;
    }

    /* SoundCloud */
    .sc-embed { background: var(--bg-elevated, #1A1C22); border-radius: 12px; overflow: hidden; }

    /* Post media image */
    .post-media-wrap { margin: .5rem 0; overflow: hidden; border-radius: 12px; }
    .post-media-img  { width: 100%; max-height: 400px; object-fit: cover; display: block; cursor: zoom-in; border-radius: 12px; }
    .post-embed-wrap { margin: .5rem 0; }
  `;
  document.head.appendChild(s);
}

function _injectMediaComposeStyles() {
  if (document.getElementById('mc-styles')) return;
  const s = document.createElement('style');
  s.id = 'mc-styles';
  s.textContent = `
    .media-compose-wrap { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; }
    .media-compose-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: var(--r-md, 10px);
      background: var(--bg-elevated, #1A1C22); border: 1px solid var(--border-mid, rgba(255,255,255,.11));
      color: var(--text-muted, #4E5464); cursor: pointer;
      transition: all .2s ease;
    }
    .media-compose-btn:hover { border-color: var(--gold, #D4AF37); color: var(--gold, #D4AF37); }
    .media-compose-btn.active { border-color: var(--gold, #D4AF37); color: var(--gold, #D4AF37); }
    .media-compose-preview {
      position: relative; display: flex; align-items: center; gap: .5rem;
      background: var(--bg-elevated, #1A1C22); padding: .375rem .5rem;
      border-radius: var(--r-md, 10px); border: 1px solid rgba(212,175,55,.3);
    }
    .media-compose-preview.hidden { display: none; }
    .media-compose-preview img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
    .media-compose-remove {
      background: none; border: none; color: var(--error, #EF4444);
      cursor: pointer; font-size: .875rem; padding: 0 .25rem;
    }
    .media-compose-progress { display: flex; align-items: center; gap: .375rem; font-size: .75rem; color: var(--text-muted, #4E5464); }
    .progress-track { width: 80px; height: 4px; background: var(--border, rgba(255,255,255,.07)); border-radius: 2px; overflow: hidden; }
    .progress-fill  { height: 100%; background: var(--gold, #D4AF37); border-radius: 2px; transition: width .1s; }
  `;
  document.head.appendChild(s);
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
