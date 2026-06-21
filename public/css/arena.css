/* ═══════════════════════════════════════════════════════════════════
   WEEKEND WARRIOR SOCIAL — DARK FANTASY RPG SYSTEM
   arena.css — Arena layout, character card, challenge cards, panels
   ═══════════════════════════════════════════════════════════════════ */

/* ── RPG 3-column layout ─────────────────────────────────────────── */
.rpg-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: .75rem;
  padding: .75rem .75rem 0;
  position: relative;
  z-index: 1;
  align-items: start;
}

@media (min-width: 768px) {
  .rpg-layout {
    grid-template-columns: 220px 1fr;
    padding: 1rem 1rem 0;
  }
}
@media (min-width: 1100px) {
  .rpg-layout {
    grid-template-columns: 220px 1fr 240px;
    padding: 1rem 1.25rem 0;
  }
}

/* Sidebar hidden on mobile unless toggled */
.rpg-sidebar-left,
.rpg-sidebar-right {
  display: none;
}
@media (min-width: 768px) {
  .rpg-sidebar-left {
    display: block;
    position: sticky;
    top: calc(68px + var(--safe-t));
  }
}
@media (min-width: 1100px) {
  .rpg-sidebar-right {
    display: block;
    position: sticky;
    top: calc(68px + var(--safe-t));
  }
}

/* ── Arena header ────────────────────────────────────────────────── */
.rpg-arena-header {
  text-align: center;
  padding: 1.25rem 1rem 1rem;
  position: relative;
}
.rpg-brand-title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 900;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--gold-400);
  text-shadow: 0 0 40px var(--gold-glow-lg), 0 2px 4px rgba(0,0,0,.5);
  line-height: 1;
}
.rpg-brand-sub {
  font-family: var(--font-heading);
  font-size: clamp(.5rem, 1.5vw, .75rem);
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: .2rem;
}
.rpg-swords {
  font-size: 1rem;
  color: var(--gold-700);
  margin: .375rem 0;
  letter-spacing: .5rem;
  /* SVG crossed swords via pseudo */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .375rem;
}
.rpg-swords::before,
.rpg-swords::after {
  content: '⚔';
  font-size: .875rem;
  opacity: .6;
}
.rpg-swords::before { transform: scaleX(-1); }

.rpg-section-title {
  font-family: var(--font-heading);
  font-size: clamp(.75rem, 2vw, 1rem);
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--gold-500);
  text-shadow: 0 0 20px var(--gold-glow);
  margin-bottom: .25rem;
}

/* ── Challenge cards carousel ────────────────────────────────────── */
.rpg-cards-scroll {
  display: flex;
  gap: .625rem;
  overflow-x: auto;
  padding: .25rem .75rem .75rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.rpg-cards-scroll::-webkit-scrollbar { display: none; }

.rpg-ch-card {
  flex-shrink: 0;
  width: 160px;
  background: var(--bg-card);
  border: 1px solid var(--border-panel);
  border-radius: var(--r-lg);
  overflow: hidden;
  scroll-snap-align: start;
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
  position: relative;
  animation: card-entrance .5s var(--ease-out) both;
}
.rpg-ch-card:hover {
  border-color: var(--border-active);
  box-shadow: 0 8px 32px rgba(212,175,55,.2), 0 0 0 1px rgba(212,175,55,.15);
  transform: translateY(-4px) scale(1.02);
}
/* First card highlighted */
.rpg-ch-card:first-child {
  border-color: var(--border-active);
  box-shadow: 0 4px 24px rgba(212,175,55,.15);
}
.rpg-ch-card:first-child::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(212,175,55,.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

/* Card number badge */
.rpg-ch-num {
  position: absolute;
  top: .5rem; left: .5rem;
  z-index: 3;
  width: 22px; height: 22px;
  background: linear-gradient(135deg, var(--gold-700), var(--gold-400));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: .55rem;
  font-weight: 900;
  color: #0A0700;
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
}

/* Card image */
.rpg-ch-img-wrap {
  width: 100%;
  aspect-ratio: 3/4;
  overflow: hidden;
  background: #0D0C0A;
  position: relative;
}
.rpg-ch-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .6s var(--ease-out);
}
.rpg-ch-card:hover .rpg-ch-img { transform: scale(1.06); }

/* Gradient overlay on image */
.rpg-ch-img-wrap::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(180deg, transparent, rgba(11,9,14,.9));
  pointer-events: none;
}

/* Card body */
.rpg-ch-body {
  padding: .625rem .625rem .75rem;
  text-align: center;
}
.rpg-ch-orn {
  font-size: .4rem;
  color: var(--gold-700);
  margin-bottom: .25rem;
  letter-spacing: .3rem;
}
.rpg-ch-title {
  font-family: var(--font-heading);
  font-size: .575rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-bright);
  margin-bottom: .25rem;
  line-height: 1.3;
}
.rpg-ch-xp {
  font-family: var(--font-heading);
  font-size: .625rem;
  font-weight: 900;
  color: var(--gold-500);
  text-shadow: 0 0 10px var(--gold-glow);
  margin-bottom: .375rem;
}
.rpg-ch-actions {
  display: flex;
  gap: .375rem;
  justify-content: center;
}
.rpg-ch-action-btn {
  width: 28px; height: 28px;
  border-radius: var(--r-sm);
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.15);
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.rpg-ch-action-btn:hover { background: rgba(212,175,55,.18); border-color: var(--border-gold); }
.rpg-ch-action-btn.primary {
  background: rgba(212,175,55,.15);
  border-color: rgba(212,175,55,.3);
}

/* ── Character card (sidebar) ────────────────────────────────────── */
.rpg-char-card {
  padding: 1.125rem .875rem 1rem;
}
.rpg-char-avatar-wrap {
  position: relative;
  width: 80px; height: 80px;
  margin: 0 auto .75rem;
}
.rpg-char-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--gold-300);
  border: 2px solid var(--border-active);
  overflow: hidden;
  box-shadow: 0 0 0 4px rgba(212,175,55,.1), 0 0 24px rgba(212,175,55,.15);
}
.rpg-char-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rpg-level-badge {
  position: absolute;
  bottom: -4px; right: -4px;
  background: linear-gradient(135deg, var(--gold-700), var(--gold-400));
  color: #0A0700;
  font-family: var(--font-heading);
  font-size: .45rem;
  font-weight: 900;
  letter-spacing: .06em;
  padding: 2px 6px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.rpg-char-name {
  font-family: var(--font-heading);
  font-size: .8125rem;
  font-weight: 700;
  color: var(--text-bright);
  text-align: center;
  letter-spacing: .06em;
  margin-bottom: .2rem;
}
.rpg-char-rank {
  font-family: var(--font-heading);
  font-size: .525rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--gold-500);
  text-align: center;
  margin-bottom: .75rem;
}

/* XP bar */
.rpg-xp-label {
  font-family: var(--font-heading);
  font-size: .45rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: .25rem;
}
.rpg-xp-track {
  height: 7px;
  background: rgba(212,175,55,.08);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,.1);
  margin-bottom: .25rem;
}
.rpg-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-700), var(--gold-400), var(--gold-300));
  border-radius: 4px;
  transition: width 1s var(--ease-out);
  box-shadow: 0 0 8px rgba(212,175,55,.4);
  position: relative;
}
.rpg-xp-fill::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 4px; height: 100%;
  background: rgba(255,255,255,.4);
  border-radius: 0 4px 4px 0;
}
.rpg-xp-text {
  font-family: var(--font-heading);
  font-size: .45rem;
  color: var(--text-muted);
  text-align: right;
  margin-bottom: .75rem;
}

/* Achievement badge */
.rpg-achievement-badge {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: rgba(212,175,55,.06);
  border: 1px solid rgba(212,175,55,.15);
  border-radius: var(--r-md);
  padding: .5rem .625rem;
}
.rpg-badge-icon { font-size: 1.125rem; }
.rpg-badge-label {
  font-family: var(--font-heading);
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--gold-500);
}

/* Stats table */
.rpg-stats-table {
  width: 100%;
  border-collapse: collapse;
}
.rpg-stats-table tr {
  border-bottom: 1px solid rgba(212,175,55,.06);
}
.rpg-stats-table tr:last-child { border-bottom: none; }
.rpg-stats-table td {
  padding: .3125rem .125rem;
  font-size: .6875rem;
  font-family: var(--font-body);
}
.rpg-stats-table td:first-child { color: var(--text-muted); }
.rpg-stats-table td:last-child {
  text-align: right;
  font-family: var(--font-heading);
  font-size: .625rem;
  font-weight: 700;
  color: var(--text-bright);
}
.rpg-stats-table td.fire { color: var(--fire); }

/* ── Scroll / received challenge cards ───────────────────────────── */
.rpg-scroll-card {
  background: var(--bg-card);
  border: 1px solid var(--border-panel);
  border-radius: var(--r-md);
  padding: .625rem .75rem;
  position: relative;
  transition: border-color var(--dur-fast);
  /* Parchment feel */
  background-image: linear-gradient(135deg, rgba(139,100,20,.05) 0%, transparent 60%);
}
.rpg-scroll-card:hover { border-color: var(--border-gold); }
.rpg-scroll-header {
  display: flex;
  gap: .625rem;
  margin-bottom: .5rem;
}
.rpg-scroll-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: .7rem;
  font-weight: 700;
  color: var(--gold-300);
  border: 1.5px solid var(--border-dim);
  overflow: hidden;
  flex-shrink: 0;
}
.rpg-scroll-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rpg-scroll-from {
  font-family: var(--font-body);
  font-size: .75rem;
  color: var(--text-muted);
  line-height: 1.4;
}
.rpg-scroll-from strong { color: var(--text-bright); font-weight: 600; }
.rpg-scroll-ch-name {
  font-family: var(--font-heading);
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--gold-500);
}
.rpg-scroll-xp {
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 700;
  color: var(--gold-500);
  margin-top: .1rem;
}
.rpg-scroll-actions {
  display: flex;
  gap: .375rem;
  margin-top: .375rem;
}

/* ── Active challenge ────────────────────────────────────────────── */
.rpg-active-ch {
  display: flex;
  gap: .625rem;
  margin-bottom: .625rem;
}
.rpg-active-thumb {
  width: 64px; height: 64px;
  border-radius: var(--r-md);
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--border-panel);
}
.rpg-active-info { flex: 1; }
.rpg-active-title {
  font-family: var(--font-heading);
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-bright);
  margin-bottom: .2rem;
}
.rpg-active-from {
  font-size: .6875rem;
  color: var(--text-muted);
  font-style: italic;
}
.rpg-active-xp {
  font-family: var(--font-heading);
  font-size: .75rem;
  font-weight: 900;
  color: var(--gold-500);
  text-align: center;
  text-shadow: 0 0 12px var(--gold-glow);
  margin-bottom: .25rem;
}

/* Step tracker */
.rpg-step-line {
  flex: 1;
  height: 2px;
  background: var(--border-dim);
  align-self: center;
  margin: 0 .25rem;
}
.rpg-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .2rem;
}
.rpg-step-icon {
  width: 26px; height: 26px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem;
  background: var(--bg-card);
  border: 1.5px solid var(--border-dim);
}
.rpg-step-label {
  font-family: var(--font-heading);
  font-size: .4rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.rpg-step.done .rpg-step-icon {
  background: rgba(42,122,42,.3);
  border-color: rgba(90,200,90,.4);
  color: #90EE90;
}
.rpg-step.current .rpg-step-icon {
  background: rgba(212,175,55,.15);
  border-color: var(--border-active);
  color: var(--gold-400);
  box-shadow: 0 0 12px var(--gold-glow);
  animation: step-pulse 2s ease-in-out infinite;
}
.rpg-step.locked .rpg-step-icon { opacity: .4; }

/* ── Streak card ─────────────────────────────────────────────────── */
.rpg-streak-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem .875rem 1.125rem;
  text-align: center;
}
.rpg-streak-ring {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--fire) 0%, var(--fire-bright) 50%, var(--gold-700) 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  margin-bottom: .625rem;
  box-shadow: 0 0 24px var(--fire-glow), 0 0 8px rgba(0,0,0,.5);
  position: relative;
  animation: streak-glow 2.5s ease-in-out infinite alternate;
}
.rpg-streak-ring::before {
  content: '';
  position: absolute;
  inset: 5px;
  background: var(--bg-panel);
  border-radius: 50%;
}
.rpg-streak-num {
  position: relative;
  font-family: var(--font-heading);
  font-size: 1.375rem;
  font-weight: 900;
  color: var(--gold-300);
  line-height: 1;
  text-shadow: 0 0 20px rgba(212,175,55,.5);
}
.rpg-streak-unit {
  position: relative;
  font-family: var(--font-heading);
  font-size: .35rem;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--text-muted);
  text-transform: uppercase;
}
.rpg-streak-label {
  font-family: var(--font-heading);
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--fire);
  margin-bottom: .25rem;
}
.rpg-streak-sub {
  font-size: .75rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ── Mini ranking / Podium ───────────────────────────────────────── */
.rpg-mini-podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: .5rem;
  padding: .875rem .75rem .625rem;
}
.rpg-podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .25rem;
  transition: transform var(--dur-fast);
}
.rpg-podium-item:hover { transform: translateY(-2px); }
.rpg-podium-crown { font-size: .875rem; line-height: 1; }
.rpg-podium-avatar {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--gold-300);
  border: 2px solid;
  flex-shrink: 0;
}
.rpg-podium-item.p1 .rpg-podium-avatar {
  width: 54px; height: 54px;
  font-size: .9rem;
  border-color: var(--podium-1);
  box-shadow: 0 0 16px rgba(255,215,0,.3);
}
.rpg-podium-item.p2 .rpg-podium-avatar {
  width: 44px; height: 44px;
  font-size: .75rem;
  border-color: var(--podium-2);
}
.rpg-podium-item.p3 .rpg-podium-avatar {
  width: 40px; height: 40px;
  font-size: .7rem;
  border-color: var(--podium-3);
}
.rpg-podium-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rpg-podium-name {
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--text-bright);
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpg-podium-xp {
  font-family: var(--font-heading);
  font-size: .45rem;
  font-weight: 700;
  color: var(--text-muted);
}
.rpg-rank-row {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .375rem .875rem;
  border-top: 1px solid var(--border-dim);
  transition: background var(--dur-fast);
}
.rpg-rank-row:hover { background: rgba(212,175,55,.03); }
.rpg-rank-pos {
  font-family: var(--font-heading);
  font-size: .55rem;
  font-weight: 700;
  color: var(--text-muted);
  width: 16px;
  text-align: center;
}
.rpg-rank-mini-av {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 700;
  color: var(--gold-300);
  overflow: hidden;
  border: 1px solid var(--border-dim);
}
.rpg-rank-mini-av img { width: 100%; height: 100%; object-fit: cover; }
.rpg-rank-name {
  flex: 1;
  font-family: var(--font-heading);
  font-size: .6rem;
  font-weight: 600;
  color: var(--text-parchment);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpg-rank-pts {
  font-family: var(--font-heading);
  font-size: .55rem;
  font-weight: 700;
  color: var(--gold-500);
}

/* ── Right sidebar notifications ─────────────────────────────────── */
.rpg-notif-item {
  display: flex;
  gap: .625rem;
  padding: .625rem .875rem;
  border-bottom: 1px solid var(--border-dim);
  cursor: pointer;
  transition: background var(--dur-fast);
  position: relative;
  animation: scroll-unfurl var(--dur-base) var(--ease-out) both;
}
.rpg-notif-item:last-child { border-bottom: none; }
.rpg-notif-item:hover { background: rgba(212,175,55,.04); }
.rpg-notif-av {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(212,175,55,.08);
  border: 1px solid var(--border-dim);
  display: flex; align-items: center; justify-content: center;
  font-size: .875rem;
  flex-shrink: 0;
}
.rpg-notif-body { flex: 1; min-width: 0; }
.rpg-notif-name {
  font-family: var(--font-heading);
  font-size: .575rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: .04em;
}
.rpg-notif-action {
  font-size: .6875rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: .1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpg-notif-time {
  font-family: var(--font-heading);
  font-size: .45rem;
  color: var(--text-faint);
  margin-top: .2rem;
  letter-spacing: .06em;
}
.rpg-notif-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--fire);
  box-shadow: 0 0 8px var(--fire-glow);
  align-self: center;
  flex-shrink: 0;
  animation: badge-pulse 2s ease-in-out infinite;
}

/* ── Buttons in RPG panels ───────────────────────────────────────── */
.rpg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .375rem;
  font-family: var(--font-heading);
  font-size: .575rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  border-radius: var(--r-md);
  padding: .5rem 1rem;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  text-decoration: none;
  border: none;
  position: relative;
  overflow: hidden;
}
.rpg-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background var(--dur-fast);
}
.rpg-btn:hover::after { background: rgba(255,255,255,.06); }
.rpg-btn:active { transform: scale(.97); }

.rpg-btn-gold {
  background: linear-gradient(135deg, var(--gold-900) 0%, var(--gold-700) 40%, var(--gold-500) 100%);
  color: #0A0700;
  box-shadow: 0 4px 16px rgba(212,175,55,.25), 0 2px 4px rgba(0,0,0,.4);
}
.rpg-btn-gold:hover {
  box-shadow: 0 6px 28px rgba(212,175,55,.45), 0 2px 4px rgba(0,0,0,.4);
  transform: translateY(-1px);
}
.rpg-btn-outline {
  background: transparent;
  color: var(--gold-500);
  border: 1px solid var(--border-gold);
}
.rpg-btn-outline:hover {
  border-color: var(--border-active);
  box-shadow: 0 0 16px var(--gold-glow);
  color: var(--gold-300);
}

/* ── Mobile-only hero/character strip ────────────────────────────── */
@media (max-width: 767px) {
  #mobile-hero {
    display: block !important;
    padding: .625rem .875rem .25rem;
  }
  .mobile-char-strip {
    display: flex;
    align-items: center;
    gap: .75rem;
    background: var(--bg-panel);
    border: 1px solid var(--border-panel);
    border-radius: var(--r-lg);
    padding: .75rem .875rem;
  }
  .mobile-char-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-heading);
    font-size: .875rem;
    font-weight: 700;
    color: var(--gold-300);
    border: 1.5px solid var(--border-active);
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 0 14px rgba(212,175,55,.2);
  }
  .mobile-char-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mobile-char-info { flex: 1; min-width: 0; }
  .mobile-char-name {
    font-family: var(--font-heading);
    font-size: .7rem;
    font-weight: 700;
    color: var(--text-bright);
    letter-spacing: .04em;
  }
  .mobile-char-rank {
    font-family: var(--font-heading);
    font-size: .5rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--gold-500);
    margin-bottom: .3rem;
  }
  .mobile-xp-track {
    height: 5px;
    background: rgba(212,175,55,.08);
    border-radius: 3px;
    overflow: hidden;
  }
  .mobile-xp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-700), var(--gold-400));
    border-radius: 3px;
    box-shadow: 0 0 6px rgba(212,175,55,.3);
    transition: width 1s var(--ease-out);
  }
  .mobile-char-level {
    font-family: var(--font-heading);
    font-size: .5rem;
    font-weight: 700;
    color: var(--gold-500);
    background: rgba(212,175,55,.1);
    border: 1px solid rgba(212,175,55,.2);
    border-radius: var(--r-sm);
    padding: 2px 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* ── Bottom grid ─────────────────────────────────────────────────── */
@media (min-width: 600px) {
  #rpg-bottom-grid {
    grid-template-columns: 1fr 1fr !important;
  }
}
