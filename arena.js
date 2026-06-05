/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — arena.js
 * Living Arena Engine: Particles, XP Effects, Rank Ceremonies
 * ============================================================
 *
 * Eksporty:
 *   initArena()           — uruchom cząsteczki + efekty globalne
 *   spawnXPFloat(el, xp)  — animacja +XP przy elemencie
 *   showRankUp(newRank)   — ceremonia awansu rangi
 *   arenaVibrate(pattern) — haptyczne powiadomienie (mobile)
 */

// ════════════════════════════════════════════════════════════
// ARENA INIT
// ════════════════════════════════════════════════════════════

export function initArena() {
  _injectVignette();
  _initCanvas();
  _initTilt();
  console.log('[Arena] ⚔️ Arena Wojowników 2.0 aktywna');
}


// ════════════════════════════════════════════════════════════
// VIGNETTE — torch atmosphere
// ════════════════════════════════════════════════════════════

function _injectVignette() {
  if (document.getElementById('arena-vignette')) return;
  const el = document.createElement('div');
  el.id        = 'arena-vignette';
  el.className = 'arena-vignette';
  el.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(el, document.body.firstChild);
}


// ════════════════════════════════════════════════════════════
// PARTICLE CANVAS — golden sparks & dust
// ════════════════════════════════════════════════════════════

let _canvas, _ctx, _particles = [], _animId;

function _initCanvas() {
  if (document.getElementById('arena-canvas')) return;

  _canvas = document.createElement('canvas');
  _canvas.id = 'arena-canvas';
  _canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(_canvas, document.body.firstChild);
  _ctx = _canvas.getContext('2d');

  _resizeCanvas();
  window.addEventListener('resize', _resizeCanvas, { passive: true });

  _spawnInitialParticles();
  _animate();
}

function _resizeCanvas() {
  if (!_canvas) return;
  _canvas.width  = window.innerWidth;
  _canvas.height = window.innerHeight;
}

// Particle types
const PARTICLE_TYPES = [
  { type: 'spark',  color: 'rgba(255,215,0,',   size: [1, 3],   speed: [0.3, 0.9],  life: [80, 160]  },
  { type: 'ember',  color: 'rgba(200,98,26,',    size: [1, 2.5], speed: [0.2, 0.7],  life: [100, 200] },
  { type: 'dust',   color: 'rgba(212,175,55,',   size: [0.5, 2], speed: [0.1, 0.4],  life: [150, 300] },
  { type: 'myst',   color: 'rgba(139,111,212,',  size: [1, 2],   speed: [0.1, 0.3],  life: [200, 400] },
];

function _createParticle(x, y, type = null) {
  const t = type ? PARTICLE_TYPES.find(t => t.type === type) : PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)];
  const size = _rand(t.size[0], t.size[1]);
  return {
    x: x ?? Math.random() * _canvas.width,
    y: y ?? _rand(_canvas.height * 0.3, _canvas.height),
    vx: (_rand(-0.5, 0.5)),
    vy: -_rand(t.speed[0], t.speed[1]),
    size,
    maxSize: size,
    color:   t.color,
    life:    _rand(t.life[0], t.life[1]),
    maxLife: _rand(t.life[0], t.life[1]),
    twinkle: Math.random() > 0.6,
    twinkleSpeed: _rand(0.02, 0.08),
    twinklePhase: Math.random() * Math.PI * 2,
    drift: _rand(-0.001, 0.001),
  };
}

function _spawnInitialParticles() {
  // Sparse ambient particles — max 35 for performance
  const count = Math.min(35, Math.floor(window.innerWidth / 30));
  for (let i = 0; i < count; i++) {
    const p = _createParticle();
    p.life = Math.random() * p.maxLife; // stagger start
    _particles.push(p);
  }
}

const MAX_PARTICLES = 45;

function _animate() {
  if (!_ctx || !_canvas) return;
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

  // Occasionally spawn new particles
  if (_particles.length < MAX_PARTICLES && Math.random() < 0.15) {
    _particles.push(_createParticle());
  }

  // Update & draw
  for (let i = _particles.length - 1; i >= 0; i--) {
    const p = _particles[i];
    p.life--;

    if (p.life <= 0) {
      _particles.splice(i, 1);
      continue;
    }

    // Movement with drift
    p.vx += p.drift;
    p.x  += p.vx;
    p.y  += p.vy;

    // Twinkle
    let alpha = p.life / p.maxLife;
    if (alpha > 0.8) alpha = 1 - (1 - alpha) * 5; // fade in
    if (p.twinkle) {
      p.twinklePhase += p.twinkleSpeed;
      alpha *= 0.5 + 0.5 * Math.sin(p.twinklePhase);
    }

    // Size pulse
    const sizeFactor = p.life / p.maxLife;

    _ctx.beginPath();
    _ctx.arc(p.x, p.y, p.size * sizeFactor, 0, Math.PI * 2);
    _ctx.fillStyle = p.color + Math.min(0.85, alpha).toFixed(2) + ')';
    _ctx.fill();

    // Glow for sparks
    if (p.size > 1.5 && alpha > 0.3) {
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.size * sizeFactor * 2.5, 0, Math.PI * 2);
      _ctx.fillStyle = p.color + (alpha * 0.15).toFixed(2) + ')';
      _ctx.fill();
    }
  }

  _animId = requestAnimationFrame(_animate);
}


// ════════════════════════════════════════════════════════════
// BURST — explosion of sparks at position
// ════════════════════════════════════════════════════════════

export function spawnBurst(x, y, count = 20) {
  if (!_canvas) return;
  for (let i = 0; i < count; i++) {
    const p     = _createParticle(x, y, 'spark');
    const angle = (Math.PI * 2 / count) * i + _rand(-0.3, 0.3);
    const speed = _rand(1, 5);
    p.vx    = Math.cos(angle) * speed;
    p.vy    = Math.sin(angle) * speed - 2;
    p.life  = _rand(30, 80);
    p.maxLife = p.life;
    p.size  = _rand(1.5, 4);
    _particles.push(p);
  }
}


// ════════════════════════════════════════════════════════════
// XP FLOAT — animated "+X XP" above element
// ════════════════════════════════════════════════════════════

export function spawnXPFloat(sourceEl, xp) {
  const rect = sourceEl?.getBoundingClientRect?.();
  const x    = rect ? rect.left + rect.width / 2  : window.innerWidth  / 2;
  const y    = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;

  const el   = document.createElement('div');
  el.className = 'xp-float-particle';
  el.textContent = `+${xp} XP`;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);

  // Burst at position
  spawnBurst(x, y, 15);

  // Vibrate on mobile
  arenaVibrate([50, 30, 50]);

  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el?.remove(), 2500);
}


// ════════════════════════════════════════════════════════════
// RANK UP CEREMONY
// ════════════════════════════════════════════════════════════

const RANK_DATA = {
  Rookie:   { emoji: '🥉', color: '#CD7F32', glow: 'rgba(205,127,50,0.5)'   },
  Warrior:  { emoji: '🥈', color: '#C0C0C0', glow: 'rgba(192,192,192,0.5)'  },
  Champion: { emoji: '🥇', color: '#D4AF37', glow: 'rgba(212,175,55,0.6)'   },
  Legend:   { emoji: '💎', color: '#4ABFFF', glow: 'rgba(74,191,255,0.6)'   },
};

export function showRankUp(newRankId) {
  document.getElementById('arena-rankup')?.remove();

  const rank    = RANK_DATA[newRankId] ?? RANK_DATA.Warrior;
  const overlay = document.createElement('div');
  overlay.id    = 'arena-rankup';
  overlay.className = 'arena-rankup-overlay';

  overlay.innerHTML = `
    <div class="arena-rankup-card">
      <div class="arena-rankup-ring" style="
        box-shadow: 0 0 60px ${rank.glow}, 0 0 120px ${rank.glow.replace('0.5','0.2')}, 0 0 200px ${rank.glow.replace('0.5','0.1')};
      ">
        <span style="font-size:4rem;filter:drop-shadow(0 0 16px ${rank.glow});">
          ${rank.emoji}
        </span>
      </div>

      <div class="arena-rankup-title">⚔️ Arena ogłasza ⚔️</div>

      <div class="arena-rankup-name" style="color:${rank.color};">
        ${newRankId}
      </div>

      <div class="arena-rankup-announce">
        Wojownik awansował!
      </div>

      <div class="arena-rankup-dismiss">Dotknij aby zamknąć</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Mass burst
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => spawnBurst(cx, cy, 25), i * 400);
  }

  // Vibrate
  arenaVibrate([100, 50, 100, 50, 200]);

  overlay.addEventListener('click', () => overlay.remove());
  setTimeout(() => overlay?.remove(), 8000);
}


// ════════════════════════════════════════════════════════════
// HAPTIC
// ════════════════════════════════════════════════════════════

export function arenaVibrate(pattern = [100]) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch { /* non-critical */ }
}


// ════════════════════════════════════════════════════════════
// 3D TILT on challenge cards (desktop only)
// ════════════════════════════════════════════════════════════

function _initTilt() {
  if (window.matchMedia('(hover: none)').matches) return; // skip on touch

  const handler = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);
    const tiltX = dy * -8;
    const tiltY = dx *  8;
    card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`;
  };

  const reset = (e) => {
    e.currentTarget.style.transform = '';
    e.currentTarget.style.transition = 'transform 0.5s ease';
  };

  // Bind to challenge cards when they appear
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.ch-card:not([data-tilt])').forEach(card => {
      card.dataset.tilt = '1';
      card.addEventListener('mousemove',  handler, { passive: true });
      card.addEventListener('mouseleave', reset,   { passive: true });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function _rand(min, max) {
  return min + Math.random() * (max - min);
}
