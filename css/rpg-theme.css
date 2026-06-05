/* ═══════════════════════════════════════════════════════════════════
   WEEKEND WARRIOR SOCIAL — DARK FANTASY RPG SYSTEM
   rpg-theme.css — Animations, @keyframes, Challenges, Ranking,
                   Profile, Quiz, Login/Register, Notifications
   ═══════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   @KEYFRAMES — All animations
   ════════════════════════════════════════════════════════════════════ */

/* Atmospheric background orbs */
@keyframes orb-drift-1 {
  0%   { transform: translate(0,0) scale(1); opacity: .6; }
  100% { transform: translate(5%,8%) scale(1.1); opacity: 1; }
}
@keyframes orb-drift-2 {
  0%   { transform: translate(0,0) scale(1); opacity: .5; }
  100% { transform: translate(-6%,-4%) scale(1.15); opacity: .9; }
}

/* Torch side glows */
@keyframes torch-l {
  0%   { opacity: .6; }
  100% { opacity: 1; }
}
@keyframes torch-r {
  0%   { opacity: .7; }
  100% { opacity: .95; }
}

/* Floating particles */
@keyframes particle-float {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: .6; }
  100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
}

/* Fog drift */
@keyframes fog-drift {
  0%   { transform: translateX(-5%) scaleY(1); opacity: .5; }
  50%  { opacity: .8; }
  100% { transform: translateX(5%) scaleY(1.05); opacity: .5; }
}

/* Skeleton shimmer */
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Card entrance */
@keyframes card-entrance {
  from { opacity: 0; transform: translateY(16px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Hero/stagger entrance */
@keyframes hero-entrance {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Auth form rise */
@keyframes auth-rise {
  from { opacity: 0; transform: translateY(24px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Toast */
@keyframes toast-in {
  from { opacity: 0; transform: translateY(-12px) scale(.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-8px) scale(.96); }
}

/* Dropdown */
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(10px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Scroll unfurl (notifications) */
@keyframes scroll-unfurl {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Badge pulse */
@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--fire-glow); }
  50%       { box-shadow: 0 0 16px var(--fire-glow), 0 0 24px rgba(255,107,0,.15); }
}

/* Streak ring glow */
@keyframes streak-glow {
  0%   { box-shadow: 0 0 16px var(--fire-glow); }
  100% { box-shadow: 0 0 32px var(--fire-glow), 0 0 48px rgba(255,107,0,.1); }
}

/* Step pulse */
@keyframes step-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--gold-glow); }
  50%       { box-shadow: 0 0 0 4px var(--gold-glow-md); }
}

/* Level-up burst */
@keyframes level-up-burst {
  0%   { transform: scale(0.5); opacity: 0; }
  30%  { transform: scale(1.3); opacity: 1; }
  60%  { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}

/* XP gain float */
@keyframes xp-float {
  0%   { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}

/* Badge unlock */
@keyframes badge-unlock {
  0%   { transform: rotate(-10deg) scale(0); opacity: 0; }
  50%  { transform: rotate(5deg) scale(1.2); }
  100% { transform: rotate(0) scale(1); opacity: 1; }
}

/* Gold shimmer on text */
@keyframes gold-shimmer {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Glow pulse */
@keyframes glow-pulse {
  0%, 100% { opacity: .5; }
  50%       { opacity: 1; }
}

/* Rune flicker (quiz answer glow) */
@keyframes rune-glow {
  0%, 100% { box-shadow: 0 0 8px var(--gold-glow); }
  50%       { box-shadow: 0 0 20px var(--gold-glow-md), 0 0 40px var(--gold-glow); }
}

/* Correct flash */
@keyframes correct-flash {
  0%   { background: rgba(42,122,42,.0); }
  30%  { background: rgba(42,122,42,.3); }
  100% { background: rgba(42,122,42,.15); }
}

/* Wrong flash */
@keyframes wrong-flash {
  0%   { background: rgba(139,0,0,.0); }
  30%  { background: rgba(139,0,0,.4); }
  100% { background: rgba(139,0,0,.1); transform: translateX(0); }
}

/* Shake */
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}

/* Modal entrance */
@keyframes modal-in {
  from { opacity: 0; transform: scale(.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ════════════════════════════════════════════════════════════════════
   PARTICLE SYSTEM — CSS only floating embers
   ════════════════════════════════════════════════════════════════════ */
.particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.particle {
  position: absolute;
  width: 3px; height: 3px;
  background: var(--gold-500);
  border-radius: 50%;
  opacity: 0;
  animation: particle-float linear infinite;
  box-shadow: 0 0 6px var(--gold-glow);
}
.particle:nth-child(1)  { left:5%;  bottom:10%; animation-duration:8s;  animation-delay:0s;   width:2px; height:2px; }
.particle:nth-child(2)  { left:12%; bottom:5%;  animation-duration:10s; animation-delay:1s;   }
.particle:nth-child(3)  { left:20%; bottom:15%; animation-duration:7s;  animation-delay:2s;   width:2px; height:2px; background: var(--fire); }
.particle:nth-child(4)  { left:35%; bottom:8%;  animation-duration:9s;  animation-delay:.5s;  }
.particle:nth-child(5)  { left:50%; bottom:12%; animation-duration:11s; animation-delay:3s;   width:2px; height:2px; }
.particle:nth-child(6)  { left:62%; bottom:6%;  animation-duration:8s;  animation-delay:1.5s; background: var(--fire); }
.particle:nth-child(7)  { left:75%; bottom:18%; animation-duration:9s;  animation-delay:4s;   width:2px; height:2px; }
.particle:nth-child(8)  { left:85%; bottom:9%;  animation-duration:10s; animation-delay:2.5s; }
.particle:nth-child(9)  { left:92%; bottom:14%; animation-duration:7s;  animation-delay:.8s;  background: var(--fire); width:2px; height:2px; }
.particle:nth-child(10) { left:28%; bottom:20%; animation-duration:12s; animation-delay:5s;   }

/* ════════════════════════════════════════════════════════════════════
   FOG LAYER
   ════════════════════════════════════════════════════════════════════ */
.fog-layer {
  position: fixed;
  bottom: calc(var(--nav-h) + var(--safe-b));
  left: 0; right: 0;
  height: 80px;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(7,6,10,.3) 60%,
    rgba(7,6,10,.6) 100%
  );
  pointer-events: none;
  z-index: 0;
  animation: fog-drift 20s ease-in-out infinite alternate;
}

/* ════════════════════════════════════════════════════════════════════
   RANKING PAGE
   ════════════════════════════════════════════════════════════════════ */
.ranking-page { max-width: 680px; margin: 0 auto; padding: 0 .875rem; }

.ranking-header {
  text-align: center;
  padding: 1.25rem 1rem 1rem;
}
.ranking-title {
  font-family: var(--font-display);
  font-size: clamp(1.125rem, 4vw, 1.75rem);
  font-weight: 900;
  letter-spacing: .1em;
  color: var(--gold-400);
  text-shadow: 0 0 30px var(--gold-glow-lg);
  margin-bottom: .2rem;
}
.ranking-subtitle {
  font-family: var(--font-heading);
  font-size: .55rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Podium full */
.ranking-podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: .75rem;
  padding: 1.5rem 1rem 1rem;
  position: relative;
}
.ranking-podium::before {
  content: '';
  position: absolute;
  top: 0; left: 25%; right: 25%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-gold), transparent);
}

.podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .375rem;
  transition: transform var(--dur-base) var(--ease-out);
}
.podium-slot:hover { transform: translateY(-4px); }
.podium-slot.rank-1 { z-index: 2; }

.podium-crown-wrap {
  font-size: 1.25rem;
  animation: glow-pulse 3s ease-in-out infinite;
}
.podium-slot.rank-1 .podium-crown-wrap { font-size: 1.5rem; }

.podium-avatar-wrap {
  position: relative;
  border-radius: 50%;
}
.podium-avatar-wrap::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid;
  animation: glow-pulse 2.5s ease-in-out infinite;
}
.podium-slot.rank-1 .podium-avatar-wrap::after { border-color: var(--podium-1); box-shadow: 0 0 20px rgba(255,215,0,.3); }
.podium-slot.rank-2 .podium-avatar-wrap::after { border-color: var(--podium-2); }
.podium-slot.rank-3 .podium-avatar-wrap::after { border-color: var(--podium-3); }

.podium-avatar {
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--gold-300);
  overflow: hidden;
}
.podium-slot.rank-1 .podium-avatar { width: 72px; height: 72px; font-size: 1.25rem; }
.podium-slot.rank-2 .podium-avatar { width: 56px; height: 56px; font-size: 1rem; }
.podium-slot.rank-3 .podium-avatar { width: 52px; height: 52px; font-size: .875rem; }
.podium-avatar img { width: 100%; height: 100%; object-fit: cover; }

.podium-base {
  background: var(--bg-card);
  border: 1px solid;
  border-radius: var(--r-md);
  padding: .5rem .75rem;
  text-align: center;
  min-width: 80px;
}
.podium-slot.rank-1 .podium-base { border-color: rgba(255,215,0,.3); background: rgba(255,215,0,.06); }
.podium-slot.rank-2 .podium-base { border-color: rgba(192,192,192,.3); }
.podium-slot.rank-3 .podium-base { border-color: rgba(205,127,50,.3); }
.podium-name {
  font-family: var(--font-heading);
  font-size: .575rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: .06em;
  margin-bottom: .15rem;
}
.podium-pts {
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 700;
  color: var(--gold-500);
}

/* Ranking list */
.ranking-list { padding: 0 0 1rem; }
.ranking-row {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .625rem .875rem;
  border-bottom: 1px solid var(--border-dim);
  transition: background var(--dur-fast);
  animation: hero-entrance .4s var(--ease-out) both;
  cursor: pointer;
}
.ranking-row:hover { background: rgba(212,175,55,.04); }
.ranking-row.is-me {
  background: rgba(212,175,55,.06);
  border-left: 2px solid var(--gold-500);
}
.rank-number {
  font-family: var(--font-heading);
  font-size: .625rem;
  font-weight: 700;
  color: var(--text-muted);
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}
.rank-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: .65rem;
  font-weight: 700;
  color: var(--gold-300);
  overflow: hidden;
  border: 1.5px solid var(--border-dim);
  flex-shrink: 0;
}
.rank-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rank-info { flex: 1; min-width: 0; }
.rank-name {
  font-family: var(--font-heading);
  font-size: .6875rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: .04em;
}
.rank-sub {
  font-family: var(--font-heading);
  font-size: .5rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--gold-500);
  margin-top: .1rem;
}
.rank-pts {
  font-family: var(--font-heading);
  font-size: .625rem;
  font-weight: 700;
  color: var(--gold-500);
  flex-shrink: 0;
}
.rank-streak {
  font-size: .6875rem;
  color: var(--fire);
  flex-shrink: 0;
}

/* ════════════════════════════════════════════════════════════════════
   PROFILE PAGE
   ════════════════════════════════════════════════════════════════════ */
.profile-hero {
  position: relative;
  text-align: center;
  padding: 1.5rem 1rem 1rem;
  overflow: hidden;
}
.profile-hero::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(180deg, rgba(212,175,55,.08) 0%, transparent 100%);
}

.profile-avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: .875rem;
}
.profile-avatar {
  width: 96px; height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-900), var(--gold-700));
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 900;
  color: var(--gold-300);
  border: 2.5px solid var(--border-active);
  overflow: hidden;
  box-shadow: 0 0 0 6px rgba(212,175,55,.08), 0 0 32px rgba(212,175,55,.2);
  position: relative;
  z-index: 1;
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-level-badge {
  position: absolute;
  bottom: 0; right: -4px;
  background: linear-gradient(135deg, var(--gold-700), var(--gold-400));
  color: #0A0700;
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 900;
  letter-spacing: .06em;
  padding: 3px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
  z-index: 2;
}

.profile-name {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: .06em;
  margin-bottom: .25rem;
}
.profile-rank-tag {
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  font-family: var(--font-heading);
  font-size: .55rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--gold-500);
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.2);
  border-radius: var(--r-sm);
  padding: .25rem .75rem;
  margin-bottom: 1rem;
}
.profile-xp-section { max-width: 280px; margin: 0 auto 1.25rem; }
.profile-xp-label {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-heading);
  font-size: .5rem;
  color: var(--text-muted);
  margin-bottom: .375rem;
  letter-spacing: .06em;
}
.profile-xp-track {
  height: 8px;
  background: rgba(212,175,55,.08);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,.1);
}
.profile-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-700), var(--gold-400), var(--gold-300));
  border-radius: 4px;
  transition: width 1.2s var(--ease-out);
  box-shadow: 0 0 10px rgba(212,175,55,.4);
  position: relative;
}
.profile-xp-fill::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 6px; height: 100%;
  background: rgba(255,255,255,.4);
  border-radius: 0 4px 4px 0;
}

/* Profile stats grid */
.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
  padding: 0 0 .875rem;
}
@media (min-width: 480px) {
  .profile-stats-grid { grid-template-columns: repeat(5, 1fr); }
}
.profile-stat {
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--r-md);
  padding: .75rem .5rem;
  text-align: center;
}
.profile-stat-val {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 900;
  color: var(--gold-400);
  display: block;
  margin-bottom: .2rem;
}
.profile-stat-label {
  font-family: var(--font-heading);
  font-size: .45rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: block;
}

/* Achievements section */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: .625rem;
  padding: .75rem;
}
.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .375rem;
  padding: .75rem .5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--r-md);
  text-align: center;
  transition: all var(--dur-fast);
  cursor: default;
  animation: badge-unlock .5s var(--ease-out) both;
}
.achievement-item:hover {
  border-color: var(--border-gold);
  box-shadow: 0 4px 16px var(--gold-glow);
  transform: translateY(-2px);
}
.achievement-item.locked { opacity: .35; filter: grayscale(1); }
.achievement-icon { font-size: 1.5rem; line-height: 1; }
.achievement-name {
  font-family: var(--font-heading);
  font-size: .45rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--gold-500);
}

/* Challenge history */
.ch-history-item {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .5rem .875rem;
  border-bottom: 1px solid var(--border-dim);
  transition: background var(--dur-fast);
}
.ch-history-item:hover { background: rgba(212,175,55,.03); }
.ch-history-icon {
  font-size: 1.25rem;
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}
.ch-history-info { flex: 1; min-width: 0; }
.ch-history-title {
  font-family: var(--font-heading);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-bright);
}
.ch-history-date {
  font-size: .6875rem;
  color: var(--text-muted);
  font-style: italic;
}
.ch-history-xp {
  font-family: var(--font-heading);
  font-size: .575rem;
  font-weight: 700;
  color: var(--gold-500);
  flex-shrink: 0;
}
.ch-history-result {
  font-size: .7rem;
  flex-shrink: 0;
}

/* ════════════════════════════════════════════════════════════════════
   CHALLENGES PAGE
   ════════════════════════════════════════════════════════════════════ */
.challenges-page { max-width: 780px; margin: 0 auto; padding: 0 .875rem; }
.challenges-header {
  text-align: center;
  padding: 1.25rem 1rem .875rem;
}

/* Challenge grid */
.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: .75rem;
  padding: .5rem 0 1rem;
}

/* Full challenge card (larger than arena mini) */
.ch-full-card {
  background: var(--bg-card);
  border: 1px solid var(--border-panel);
  border-radius: var(--r-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
  position: relative;
  animation: card-entrance .4s var(--ease-out) both;
}
.ch-full-card:hover {
  border-color: var(--border-active);
  box-shadow: 0 8px 32px rgba(212,175,55,.18), 0 0 0 1px rgba(212,175,55,.12);
  transform: translateY(-4px) scale(1.02);
}
.ch-full-card .rpg-ch-num { top: .625rem; left: .625rem; }
.ch-full-img-wrap {
  width: 100%;
  aspect-ratio: 4/5;
  overflow: hidden;
  background: #0D0C0A;
  position: relative;
}
.ch-full-img-wrap::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 55%;
  background: linear-gradient(0deg, rgba(11,9,14,.95) 0%, transparent 100%);
  pointer-events: none;
}
.ch-full-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .8s var(--ease-out);
}
.ch-full-card:hover .ch-full-img { transform: scale(1.08); }
.ch-full-body {
  padding: .75rem .75rem .875rem;
  text-align: center;
}
.ch-full-badge {
  font-size: 1rem;
  margin-bottom: .25rem;
}
.ch-full-title {
  font-family: var(--font-heading);
  font-size: .625rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--text-bright);
  margin-bottom: .375rem;
  line-height: 1.35;
}
.ch-full-xp {
  font-family: var(--font-heading);
  font-size: .75rem;
  font-weight: 900;
  color: var(--gold-500);
  text-shadow: 0 0 10px var(--gold-glow);
  margin-bottom: .5rem;
}
.ch-full-actions {
  display: flex;
  gap: .375rem;
  justify-content: center;
}
.ch-full-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .25rem;
  padding: .375rem .25rem;
  background: rgba(212,175,55,.06);
  border: 1px solid rgba(212,175,55,.15);
  border-radius: var(--r-sm);
  font-family: var(--font-heading);
  font-size: .45rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.ch-full-action:hover { background: rgba(212,175,55,.14); color: var(--gold-500); border-color: var(--border-gold); }
.ch-full-action.primary { color: var(--gold-500); background: rgba(212,175,55,.12); border-color: var(--border-gold); }

/* Challenge modal */
.ch-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.8);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fade-in .2s ease-out;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.ch-modal-backdrop.hidden { display: none; }

.ch-modal {
  width: 100%;
  max-width: 480px;
  background: var(--bg-panel);
  border: 1px solid var(--border-active);
  border-radius: var(--r-xl);
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,.7), 0 0 60px var(--gold-glow);
  animation: modal-in .35s var(--ease-out);
  max-height: 90vh;
  overflow-y: auto;
}
.ch-modal-img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  object-position: top;
}
.ch-modal-body { padding: 1.25rem 1.5rem 1.5rem; }
.ch-modal-badge { font-size: 2rem; text-align: center; margin-bottom: .5rem; }
.ch-modal-title {
  font-family: var(--font-heading);
  font-size: .9375rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--gold-400);
  text-align: center;
  margin-bottom: .75rem;
  text-shadow: 0 0 20px var(--gold-glow);
}
.ch-modal-desc {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-parchment);
  line-height: 1.65;
  text-align: center;
  margin-bottom: 1.25rem;
  font-style: italic;
}
.ch-modal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
  margin-bottom: 1.25rem;
}
.ch-modal-stat {
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--r-md);
  padding: .625rem .5rem;
  text-align: center;
}
.ch-modal-stat-val {
  font-family: var(--font-heading);
  font-size: .875rem;
  font-weight: 900;
  color: var(--gold-400);
  display: block;
}
.ch-modal-stat-label {
  font-family: var(--font-heading);
  font-size: .45rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: block;
  margin-top: .15rem;
}
.ch-modal-actions {
  display: flex;
  gap: .625rem;
}

/* ════════════════════════════════════════════════════════════════════
   QUIZ — PRÓBA WOJOWNIKA
   ════════════════════════════════════════════════════════════════════ */
.quiz-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-void);
  background-image:
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,175,55,.06) 0%, transparent 60%),
    radial-gradient(ellipse 40% 60% at 80% 20%, rgba(107,79,187,.04) 0%, transparent 60%);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fade-in .3s ease-out;
}
.quiz-overlay.hidden { display: none; }

.quiz-container {
  width: 100%;
  max-width: 540px;
  animation: auth-rise .4s var(--ease-out) both;
}

.quiz-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.quiz-eyebrow {
  font-family: var(--font-heading);
  font-size: .5rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--fire);
  margin-bottom: .375rem;
  display: block;
}
.quiz-title {
  font-family: var(--font-display);
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 900;
  letter-spacing: .1em;
  color: var(--gold-400);
  text-shadow: 0 0 30px var(--gold-glow-lg);
}
.quiz-progress-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-top: .875rem;
}
.quiz-progress-track {
  flex: 1;
  height: 6px;
  background: rgba(212,175,55,.1);
  border-radius: 3px;
  overflow: hidden;
}
.quiz-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-700), var(--gold-400));
  border-radius: 3px;
  transition: width .5s var(--ease-out);
  box-shadow: 0 0 8px rgba(212,175,55,.4);
}
.quiz-progress-label {
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  letter-spacing: .08em;
}

/* Parchment question card */
.quiz-parchment {
  background: linear-gradient(135deg, #1C1509 0%, #130F07 60%, #1A1208 100%);
  border: 1px solid var(--border-gold);
  border-radius: var(--r-xl);
  padding: 1.5rem 1.5rem 1.25rem;
  margin-bottom: 1rem;
  position: relative;
  box-shadow:
    inset 0 1px 0 rgba(212,175,55,.1),
    0 8px 32px rgba(0,0,0,.5),
    0 0 0 1px rgba(212,175,55,.06);
}
/* Parchment corner ornaments */
.quiz-parchment::before {
  content: '◈';
  position: absolute;
  top: .5rem; left: .75rem;
  font-size: .5rem;
  color: var(--gold-700);
  opacity: .6;
}
.quiz-parchment::after {
  content: '◈';
  position: absolute;
  top: .5rem; right: .75rem;
  font-size: .5rem;
  color: var(--gold-700);
  opacity: .6;
}
.quiz-q-num {
  font-family: var(--font-heading);
  font-size: .5rem;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--gold-700);
  text-align: center;
  margin-bottom: .625rem;
}
.quiz-question {
  font-family: var(--font-body);
  font-size: clamp(.9375rem, 2.5vw, 1.125rem);
  color: var(--text-bright);
  text-align: center;
  line-height: 1.6;
  font-style: italic;
}

/* Answer rune cards */
.quiz-answers {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.quiz-answer {
  background: var(--bg-card);
  border: 1px solid var(--border-panel);
  border-radius: var(--r-lg);
  padding: .875rem 1rem;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  display: flex;
  align-items: center;
  gap: .875rem;
  position: relative;
  overflow: hidden;
  animation: rune-glow 3s ease-in-out infinite;
  animation-play-state: paused;
}
.quiz-answer:hover {
  border-color: var(--border-active);
  box-shadow: 0 0 20px var(--gold-glow), 0 4px 16px rgba(0,0,0,.4);
  background: var(--bg-card-hover);
  transform: translateX(4px);
  animation-play-state: running;
}
.quiz-answer-rune {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.2);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading);
  font-size: .6rem;
  font-weight: 700;
  color: var(--gold-700);
  flex-shrink: 0;
  transition: all var(--dur-fast);
}
.quiz-answer:hover .quiz-answer-rune {
  background: rgba(212,175,55,.18);
  border-color: var(--border-active);
  color: var(--gold-300);
}
.quiz-answer-text {
  font-family: var(--font-body);
  font-size: .9375rem;
  color: var(--text-parchment);
  line-height: 1.4;
}

/* Answer states */
.quiz-answer.correct {
  border-color: rgba(90,200,90,.5);
  background: rgba(42,122,42,.15);
  animation: correct-flash .4s ease-out;
}
.quiz-answer.correct .quiz-answer-rune {
  background: rgba(42,122,42,.3);
  border-color: rgba(90,200,90,.4);
  color: #90EE90;
}
.quiz-answer.wrong {
  border-color: rgba(200,50,50,.5);
  background: rgba(139,0,0,.1);
  animation: wrong-flash .4s ease-out, shake .4s ease-out;
}
.quiz-answer.wrong .quiz-answer-rune { background: rgba(139,0,0,.3); border-color: rgba(200,50,50,.4); color: #FFA0A0; }

/* Quiz feedback */
.quiz-feedback {
  padding: 1rem 1.5rem;
  border-radius: var(--r-lg);
  text-align: center;
  margin-top: .75rem;
  font-family: var(--font-heading);
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid;
  animation: card-entrance .3s var(--ease-out);
}
.quiz-feedback.correct {
  background: rgba(42,122,42,.15);
  border-color: rgba(90,200,90,.3);
  color: #90EE90;
}
.quiz-feedback.wrong {
  background: rgba(139,0,0,.15);
  border-color: rgba(200,50,50,.3);
  color: #FFA0A0;
}
.quiz-feedback-icon { font-size: 1.5rem; margin-bottom: .375rem; display: block; }

/* Quiz result screen */
.quiz-result {
  text-align: center;
  padding: 2rem 1rem;
  animation: auth-rise .5s var(--ease-out) both;
}
.quiz-result-icon { font-size: 3.5rem; margin-bottom: .875rem; animation: level-up-burst .6s var(--ease-out) both; }
.quiz-result-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--gold-400);
  letter-spacing: .1em;
  text-shadow: 0 0 30px var(--gold-glow-lg);
  margin-bottom: .5rem;
}
.quiz-result-message {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-parchment);
  font-style: italic;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}
.quiz-xp-earned {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  background: rgba(212,175,55,.1);
  border: 1px solid var(--border-gold);
  border-radius: var(--r-xl);
  padding: .625rem 1.5rem;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 900;
  color: var(--gold-400);
  text-shadow: 0 0 20px var(--gold-glow);
  animation: badge-unlock .5s var(--ease-out) .2s both;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 24px var(--gold-glow);
}

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS PANEL (Komnata Posłańców)
   ════════════════════════════════════════════════════════════════════ */
.notif-panel {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 .875rem;
}
.notif-page-header {
  text-align: center;
  padding: 1.25rem 1rem .875rem;
}
.notif-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--gold-500);
  text-shadow: 0 0 20px var(--gold-glow);
}

.notif-full-item {
  display: flex;
  gap: .75rem;
  padding: .875rem 1rem;
  border-bottom: 1px solid var(--border-dim);
  transition: background var(--dur-fast);
  cursor: pointer;
  animation: scroll-unfurl .3s var(--ease-out) both;
  position: relative;
}
.notif-full-item:hover { background: rgba(212,175,55,.04); }
.notif-full-item.unread::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--gold-500);
  border-radius: 0 2px 2px 0;
}
.notif-full-av {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(212,175,55,.08);
  border: 1.5px solid var(--border-dim);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
  overflow: hidden;
}
.notif-full-av img { width: 100%; height: 100%; object-fit: cover; }
.notif-full-body { flex: 1; min-width: 0; }
.notif-full-title {
  font-family: var(--font-heading);
  font-size: .6875rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: .04em;
  margin-bottom: .2rem;
}
.notif-full-text {
  font-size: .8125rem;
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.45;
}
.notif-full-time {
  font-family: var(--font-heading);
  font-size: .5rem;
  color: var(--text-faint);
  margin-top: .25rem;
  letter-spacing: .06em;
}
.notif-full-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--fire);
  box-shadow: 0 0 8px var(--fire-glow);
  align-self: center;
  flex-shrink: 0;
}

/* ════════════════════════════════════════════════════════════════════
   ONBOARDING
   ════════════════════════════════════════════════════════════════════ */
.onboarding-step {
  animation: hero-entrance .5s var(--ease-out) both;
}
.onboarding-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: .875rem;
}
.onboarding-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--gold-400);
  text-align: center;
  margin-bottom: .5rem;
  text-shadow: 0 0 20px var(--gold-glow);
}
.onboarding-desc {
  font-family: var(--font-body);
  font-size: .9375rem;
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
  line-height: 1.65;
  margin-bottom: 1.5rem;
}
.sport-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
  margin-bottom: 1.25rem;
}
.sport-item {
  background: var(--bg-card);
  border: 1.5px solid var(--border-dim);
  border-radius: var(--r-md);
  padding: .875rem .5rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.sport-item:hover { border-color: var(--border-gold); background: rgba(212,175,55,.06); }
.sport-item.selected {
  border-color: var(--border-active);
  background: rgba(212,175,55,.1);
  box-shadow: 0 0 16px var(--gold-glow);
}
.sport-icon { font-size: 1.5rem; margin-bottom: .375rem; }
.sport-label {
  font-family: var(--font-heading);
  font-size: .5rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.sport-item.selected .sport-label { color: var(--gold-500); }

/* ════════════════════════════════════════════════════════════════════
   LEVEL UP EFFECT (overlay)
   ════════════════════════════════════════════════════════════════════ */
.level-up-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.85);
  backdrop-filter: blur(8px);
  animation: fade-in .2s ease-out;
  pointer-events: none;
}
.level-up-overlay.hidden { display: none; }
.level-up-burst {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  color: var(--gold-400);
  letter-spacing: .1em;
  text-shadow: 0 0 60px var(--gold-glow-lg), 0 0 120px rgba(212,175,55,.2);
  text-align: center;
  animation: level-up-burst .8s var(--ease-out) both;
  margin-bottom: .5rem;
}
.level-up-sub {
  font-family: var(--font-heading);
  font-size: .75rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--text-muted);
  animation: hero-entrance .5s var(--ease-out) .3s both;
}

/* XP float indicator */
.xp-float {
  position: fixed;
  font-family: var(--font-heading);
  font-size: .75rem;
  font-weight: 900;
  color: var(--gold-400);
  text-shadow: 0 0 12px var(--gold-glow);
  pointer-events: none;
  z-index: 9997;
  animation: xp-float 1.5s var(--ease-out) forwards;
}

/* ════════════════════════════════════════════════════════════════════
   SCROLLBAR
   ════════════════════════════════════════════════════════════════════ */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-deep); }
::-webkit-scrollbar-thumb {
  background: var(--gold-900);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover { background: var(--gold-700); }

/* ════════════════════════════════════════════════════════════════════
   SELECTION
   ════════════════════════════════════════════════════════════════════ */
::selection {
  background: rgba(212,175,55,.2);
  color: var(--gold-300);
}
