/* Juego de la canasta (vista lateral, física real).
   Arrastra hacia atrás para apuntar: los puntitos enseñan el recorrido. El balón rebota en el tablero,
   en el aro y en el suelo. La canasta cambia de sitio en cada tiro y en el último se mueve. */
(() => {
  const W = 360, H = 560, FLOOR = 500, R = 19, SX = 62, SY = FLOOR - R;
  // Física y dificultad (ajustables):
  const G = 0.42, K = 0.165, MAXP = 115, MINP = 16, RIMW = 62, RIMR = 3, MAXF = 560;
  // Posición de la canasta en cada tiro: x = cara del tablero, y = altura del aro, amp = cuánto sube y baja
  const LEVELS = [
    { x: 300, y: 285, label: 'Calentamiento' },
    { x: 318, y: 225, label: 'Un poco más alto' },
    { x: 258, y: 300, label: 'Tiro corto' },
    { x: 326, y: 180, label: 'Desde lejos' },
    { x: 304, y: 240, amp: 40, label: '¡Se mueve!' }
  ];
  const PALETTE = ['#e11d48', '#fb7185', '#7dd3fc', '#38bdf8', '#ffffff', '#fecdd3'];
  let cv, ctx, cfg, dpr = 1, ballImg = null, S = null, bg = null, looping = false, last = 0, acc = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const level = i => LEVELS[i % LEVELS.length];
  const hoopY = (lv, t) => lv.y + (lv.amp ? lv.amp * Math.sin(t * 0.026) : 0);
  const newBall = () => ({ x: SX, y: SY, vx: 0, vy: 0, rot: 0, scored: false, touched: false, bounces: 0, f: 0 });
  const fresh = () => ({ shots: 0, hits: 0, res: [], phase: 'ready', hidden: false, streak: 0, ball: newBall(), drag: null, wait: 0,
    sway: 0, stretch: 0, flash: 0, shake: 0, cheer: 0, slow: 0, t: 0, toast: null, parts: [], path: [], appear: 0, intro: 0 });

  /* =============== Sonido (sintetizado, sin archivos) =============== */
  let AC = null, soundOn = true;
  function audio() { if (!soundOn) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } return AC; }
  function tone(f, dur, type, vol, to, delay) {
    const a = audio(); if (!a) return; const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    const a = audio(); if (!a) return; const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq || 2400; g.gain.value = vol || 0.2;
    s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  const SFX = {
    throw: () => noise(0.16, 0.12, 900), bounce: v => tone(95, 0.14, 'sine', clamp(v / 40, 0.05, 0.3), 55), rim: () => tone(620, 0.12, 'triangle', 0.12, 480),
    board: () => tone(180, 0.1, 'square', 0.08, 120), swish: () => noise(0.32, 0.28, 3200), miss: () => tone(240, 0.3, 'sine', 0.1, 150),
    score: () => { tone(660, 0.12, 'triangle', 0.14); tone(880, 0.18, 'triangle', 0.14, null, 0.1); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'triangle', 0.15, null, i * 0.11))
  };

  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function heart(x, cx, cy, s) { x.beginPath(); x.moveTo(cx, cy + s * 0.9); x.bezierCurveTo(cx - s * 1.4, cy - s * 0.1, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.35); x.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.4, cy - s * 0.1, cx, cy + s * 0.9); x.closePath(); }

  /* =============== Física: un paso del balón. Devuelve el evento ocurrido =============== */
  function stepBall(b, hx, hy) {
    const py0 = b.y; let ev = null;
    b.vy += G; b.x += b.vx; b.y += b.vy; b.f++;
    // extremos del aro (punta y unión con el tablero)
    for (const ex of [hx - RIMW, hx - 3]) {
      const dx = b.x - ex, dy = b.y - hy, d = Math.hypot(dx, dy), min = R + RIMR;
      if (d < min && d > 0) {
        const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
        if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; ev = { type: 'rim', v: -dot }; b.touched = true; }
        b.x = ex + nx * min; b.y = hy + ny * min;
      }
    }
    // tablero (vertical)
    if (b.x + R > hx && b.x < hx + 4 && b.y > hy - 82 && b.y < hy + 16 && b.vx > 0) { b.x = hx - R; b.vx = -b.vx * 0.55; ev = { type: 'board', v: Math.abs(b.vx) }; b.touched = true; }
    // canasta: cruza el aro de arriba abajo entre la punta y el tablero
    if (!b.scored && py0 < hy && b.y >= hy && b.vy > 0 && b.x > hx - RIMW + 7 && b.x < hx - 7) { b.scored = true; b.vx *= 0.4; ev = { type: 'score' }; }
    // suelo
    if (b.y > FLOOR - R) { b.y = FLOOR - R; if (b.vy > 1.2) ev = ev || { type: 'floor', v: b.vy }; b.vy = -b.vy * 0.55; b.vx *= 0.82; b.bounces++; if (Math.abs(b.vy) < 1.2) b.vy = 0; }
    return ev;
  }
  /* Simula un tiro entero (para las pruebas y el ajuste de dificultad) */
  function simulate(px, py, lv, t0) {
    const b = newBall(); b.vx = -px * K; b.vy = -py * K;
    for (let f = 0; f < MAXF; f++) { stepBall(b, lv.x, hoopY(lv, t0 + f + 1)); if (b.scored) return { scored: true, clean: !b.touched }; if (b.bounces > 0 || b.x < -40 || b.x > W + 40) break; }
    return { scored: false };
  }
  function solve(lv, t0) {
    let best = null;
    for (let py = 30; py <= MAXP; py += 2) for (let px = -MAXP; px <= 0; px += 2) {
      if (Math.hypot(px, py) > MAXP) continue;
      const ok = d => simulate(px + d[0], py + d[1], lv, t0).scored;
      if (!ok([0, 0])) continue;
      const robust = [[2, 0], [-2, 0], [0, 2], [0, -2], [4, 0], [-4, 0], [0, 4], [0, -4]].filter(ok).length;
      if (!best || robust > best.robust) best = { px, py, robust };
    }
    return best;
  }

  /* =============== Montaje =============== */
  window.renderGame = function renderGame() {
    const root = document.getElementById('game'); if (!root || !CONFIG.juego) return;
    cfg = CONFIG.juego; S = fresh(); soundOn = store.get('sonido', true);
    const t = document.getElementById('game-title'), s = document.getElementById('game-sub');
    if (t) t.textContent = cfg.titulo; if (s) s.textContent = cfg.subtitulo;
    root.innerHTML = `<div class="game-wrap"><div class="game-card">
      <div class="game-stage"><canvas id="g-canvas" aria-label="Juego de la canasta"></canvas><div id="g-overlay" class="g-overlay"></div></div>
      <div class="game-foot"><span class="chip" id="g-best"></span><button class="g-sound" id="g-sound" type="button" aria-label="Sonido"></button></div>
    </div></div>`;
    cv = document.getElementById('g-canvas'); dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx = cv.getContext('2d');
    if (cfg.pelotaImg) { ballImg = new Image(); ballImg.src = cfg.pelotaImg; }
    buildBg(); bind(); updateBest(); updateSound();
    const won = store.get('juegoGanado', null);
    if (won) showWin(won.hits, true); else showStart();
    if (!looping) { looping = true; requestAnimationFrame(loop); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildBg);
  };
  function updateBest() { const el = document.getElementById('g-best'); if (el) el.textContent = '🏆 Mejor marca: ' + store.get('juegoBest', 0) + '/' + cfg.tiros; }
  function updateSound() { const el = document.getElementById('g-sound'); if (el) el.textContent = soundOn ? '🔊 Sonido' : '🔇 Silencio'; }

  /* =============== Pantallas =============== */
  function overlay(html) { const o = document.getElementById('g-overlay'); o.innerHTML = '<div class="g-panel">' + html + '</div>'; o.classList.remove('hidden'); }
  function hideOverlay() { document.getElementById('g-overlay').classList.add('hidden'); }
  function showStart() {
    S.phase = 'ready';
    overlay(`<div class="g-ball">🏀</div>
      <h3>${esc(fill(cfg.textoPanel, { n: cfg.aciertosParaPremio }))}</h3>
      <p class="hand g-sub">${esc(cfg.textoPanelSub)}</p>
      <ul class="g-rules"><li>Arrastra <b>hacia atrás</b> y apunta con los puntitos</li><li>Suelta para lanzar: el balón rebota de verdad</li><li>La canasta <b>cambia de sitio</b> en cada tiro</li></ul>
      <button class="btn btn-red" id="g-play">¡Jugar! 🏀</button>`);
  }
  function showWin(hits, quiet) {
    S.phase = 'done';
    overlay(`<div class="g-trophy">🏆</div><h3>¡PLENO! ${hits}/${cfg.tiros}</h3><p class="hand g-prize">${esc(cfg.textoPremio)}</p>
      <div class="g-btns"><button class="btn btn-red" id="g-wa">Avisarle por WhatsApp 📲</button><button class="btn" id="g-again">Jugar otra vez 🏀</button></div>`);
    if (!quiet) { FX.celebrate(3200); SFX.win(); }
  }
  function showLose(hits) {
    S.phase = 'done';
    overlay(`<div class="g-score">${hits}<span>/${cfg.tiros}</span></div><div class="g-row">${S.res.map(r => (r ? '❤️' : '🤍')).join(' ')}</div>
      <p class="hand g-prize">${esc(fill(cfg.textoFallo, { n: cfg.aciertosParaPremio }))}</p>
      <p class="g-best">🏆 Mejor marca: ${store.get('juegoBest', hits)}/${cfg.tiros}</p><button class="btn btn-red" id="g-again">Reintentar 🏀</button>`);
  }
  function startGame() { S = fresh(); S.phase = 'aim'; S.intro = 90; hideOverlay(); audio(); }

  /* =============== Entrada =============== */
  function bind() {
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    cv.addEventListener('pointerdown', e => { if (S.phase !== 'aim') return; const p = pt(e); S.drag = { sx: p.x, sy: p.y, px: 0, py: 0 }; cv.setPointerCapture(e.pointerId); e.preventDefault(); audio(); });
    cv.addEventListener('pointermove', e => {
      if (!S.drag) return; const p = pt(e); let dx = p.x - S.drag.sx, dy = p.y - S.drag.sy; const L = Math.hypot(dx, dy);
      if (L > MAXP) { dx *= MAXP / L; dy *= MAXP / L; } S.drag.px = dx; S.drag.py = dy;
    });
    cv.addEventListener('pointerup', () => {
      const d = S.drag; S.drag = null; if (!d || S.phase !== 'aim') return;
      if (Math.hypot(d.px, d.py) < MINP) return;
      if (d.py <= 0 && d.px >= 0) { toast('Arrastra hacia atrás 👈', 'ko'); return; }
      shoot(d.px, d.py);
    });
    cv.addEventListener('pointercancel', () => { S.drag = null; });
    document.getElementById('game').addEventListener('click', e => {
      if (e.target.closest('#g-play') || e.target.closest('#g-again')) startGame();
      if (e.target.closest('#g-wa')) openWA(fill(cfg.mensajeWhatsApp, { aciertos: (store.get('juegoGanado', null) || {}).hits || S.hits, tiros: cfg.tiros }));
      if (e.target.closest('#g-sound')) { soundOn = !soundOn; store.set('sonido', soundOn); updateSound(); if (soundOn) SFX.score(); }
    });
  }
  function shoot(px, py) { const b = S.ball = newBall(); b.vx = -px * K; b.vy = -py * K; S.path = []; S.phase = 'fly'; S.intro = 0; SFX.throw(); }

  /* =============== Bucle de juego (paso fijo 60 fps) =============== */
  function step() {
    S.t++; S.sway *= 0.96; S.stretch *= 0.9; S.flash *= 0.9; S.shake *= 0.86; if (S.cheer > 0) S.cheer--; if (S.intro > 0) S.intro--;
    if (S.appear > 0) S.appear -= 0.08;
    if (S.toast) { S.toast.age++; if (S.toast.age > 80) S.toast = null; }
    S.path.forEach(p => { p.a++; }); if (S.path.length && S.path[0].a > 150) S.path.shift();
    S.parts = S.parts.filter(p => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; return --p.life > 0; });
    const lv = level(S.shots), hy = hoopY(lv, S.t);
    if (S.phase === 'fly') {
      const b = S.ball, ev = stepBall(b, lv.x, hy); b.rot += b.vx * 0.06;
      if (b.f % 2 === 0 && !b.scored) S.path.push({ x: b.x, y: b.y, a: 0 });
      if (ev) {
        if (ev.type === 'rim') { S.shake = 3; sparks(b.x, hy, 5, '#fdba74'); SFX.rim(); }
        else if (ev.type === 'board') { S.shake = 4; sparks(lv.x, b.y, 6, '#ffffff'); SFX.board(); }
        else if (ev.type === 'floor') { SFX.bounce(ev.v); sparks(b.x, FLOOR, 3, 'rgba(120,70,20,.5)'); }
        else if (ev.type === 'score') onScore(lv, hy);
      }
      if ((b.scored && b.bounces >= 1) || (!b.scored && b.bounces >= 2) || b.x < -50 || b.x > W + 50 || b.f > MAXF || (b.bounces && Math.abs(b.vx) < 0.15 && b.vy === 0)) endShot();
    } else if (S.phase === 'wait') {
      if (--S.wait <= 0) { if (S.shots >= cfg.tiros) endRound(); else { S.ball = newBall(); S.hidden = false; S.phase = 'aim'; S.appear = 1; S.path = []; S.intro = 90; } }
    }
  }
  function sparks(x, y, n, c) { for (let i = 0; i < n; i++) S.parts.push({ type: 's', x, y, vx: rand(-3, 3), vy: rand(-4, 1), g: 0.18, life: 22, max: 22, s: rand(1.5, 3), c, rot: 0, vr: 0 }); }
  function hearts(x, y, n) { for (let i = 0; i < n; i++) { const life = rand(50, 85); S.parts.push({ type: 'h', x, y, vx: rand(-3.2, 3.2), vy: rand(-6, -1.5), g: 0.1, life, max: life, s: rand(4, 9), c: PALETTE[(Math.random() * PALETTE.length) | 0], rot: rand(-0.5, 0.5), vr: rand(-0.08, 0.08) }); } }
  function onScore(lv, hy) {
    const clean = !S.ball.touched; S.streak++; S.hits++;
    S.sway = 1; S.stretch = 1; S.flash = clean ? 0.5 : 0.3; S.shake = clean ? 2 : 5; S.cheer = 50; S.slow = 24;
    hearts(lv.x - RIMW / 2, hy + 26, clean ? 30 : 20); clean ? SFX.swish() : SFX.score();
    const w = clean ? ['¡LIMPIA! ✨', '¡PERFECTA! 💙', '¡CANASTA! ❤️'] : ['¡CANASTA! ❤️', '¡DENTRO! 🏀'];
    toast(w[(Math.random() * w.length) | 0], 'ok', S.streak >= 2 ? '🔥 racha x' + S.streak : '');
    const r = cv.getBoundingClientRect();
    FX.burst({ particleCount: 30, origin: { x: (r.left + r.width * (lv.x - RIMW / 2) / W) / innerWidth, y: (r.top + r.height * hy / H) / innerHeight } });
    try { navigator.vibrate && navigator.vibrate(20); } catch (e) { /* sin vibración */ }
  }
  function endShot() {
    const b = S.ball; S.res.push(b.scored); S.shots++;
    if (!b.scored) { S.streak = 0; SFX.miss(); toast(['Casi… 🥺', '¡Uy! 💔', 'Por poco… 🙈'][(Math.random() * 3) | 0], 'ko'); }
    S.hidden = true; S.phase = 'wait'; S.wait = 50;
  }
  function endRound() {
    if (S.hits > store.get('juegoBest', 0)) store.set('juegoBest', S.hits); updateBest();
    if (S.hits >= cfg.aciertosParaPremio) { store.set('juegoGanado', { hits: S.hits }); showWin(S.hits, false); } else showLose(S.hits);
  }
  function toast(text, kind, sub) { S.toast = { text, kind, sub: sub || '', age: 0 }; }

  /* =============== Fondo estático =============== */
  function buildBg() {
    bg = document.createElement('canvas'); bg.width = W * dpr; bg.height = H * dpr;
    const x = bg.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    let g = x.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#6cc4f7'); g.addColorStop(0.55, '#bde6fb'); g.addColorStop(1, '#fbd5e3');
    x.fillStyle = g; x.fillRect(0, 0, W, FLOOR);
    // focos
    [[-10, 1], [370, -1]].forEach(([sx, dir]) => { const beam = x.createLinearGradient(sx, 0, 180, 380); beam.addColorStop(0, 'rgba(255,255,255,.32)'); beam.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = beam; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + dir * 70, 0); x.lineTo(180 + dir * 60, 420); x.lineTo(180 - dir * 90, 420); x.closePath(); x.fill(); });
    // bokeh
    let seed = 11; const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 24; i++) { x.globalAlpha = 0.1 + r() * 0.14; x.fillStyle = ['#fff', '#fecdd3', '#e0f2fe'][i % 3]; x.beginPath(); x.arc(r() * W, 60 + r() * 330, 6 + r() * 20, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    // pancarta en la pared
    x.save(); x.translate(118, 150); x.rotate(-0.04); rr(x, -86, -30, 172, 60, 10); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill(); x.strokeStyle = 'rgba(225,29,72,.5)'; x.lineWidth = 2; x.stroke();
    x.textAlign = 'center'; x.fillStyle = '#be123c'; x.font = '700 26px "Playfair Display", serif'; x.fillText('3 AÑOS', 0, 2); x.font = '700 16px Caveat, cursive'; x.fillStyle = '#1d4ed8'; x.fillText('y los que quedan', 0, 21); x.restore();
    // gradas
    x.fillStyle = 'rgba(40,52,120,.16)'; x.fillRect(0, FLOOR - 74, W, 26); x.fillStyle = 'rgba(40,52,120,.24)'; x.fillRect(0, FLOOR - 48, W, 48);
    // banderines
    const P0 = [0, 4], P1 = [180, 40], P2 = [360, 4], cols = ['#fb7185', '#7dd3fc', '#ffffff', '#e11d48', '#38bdf8'];
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(P0[0], P0[1]); x.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); x.stroke();
    for (let i = 0; i <= 12; i++) { const t = (i + 0.5) / 13, a = (1 - t) * (1 - t), b2 = 2 * (1 - t) * t, c = t * t, px = a * P0[0] + b2 * P1[0] + c * P2[0], py = a * P0[1] + b2 * P1[1] + c * P2[1]; x.fillStyle = cols[i % 5]; x.beginPath(); x.moveTo(px - 9, py); x.lineTo(px + 9, py); x.lineTo(px, py + 19); x.closePath(); x.fill(); }
    // parqué
    g = x.createLinearGradient(0, FLOOR, 0, H); g.addColorStop(0, '#f1cf9f'); g.addColorStop(1, '#d9a366'); x.fillStyle = g; x.fillRect(0, FLOOR, W, H - FLOOR);
    x.strokeStyle = 'rgba(120,70,20,.2)'; x.lineWidth = 1; for (let i = 0; i <= 9; i++) { x.beginPath(); x.moveTo(i * 40 + 10, FLOOR); x.lineTo(i * 46 - 20, H); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, FLOOR, W, 3); x.fillStyle = 'rgba(225,29,72,.5)'; x.fillRect(0, FLOOR + 22, W, 3);
    // marca de tiro
    x.fillStyle = 'rgba(225,29,72,.35)'; x.beginPath(); x.ellipse(SX, FLOOR + 10, 30, 7, 0, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke();
    // viñeta
    g = x.createRadialGradient(180, 290, 160, 180, 290, 430); g.addColorStop(0, 'rgba(15,23,80,0)'); g.addColorStop(1, 'rgba(15,23,80,.26)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  }

  /* =============== Dibujo =============== */
  function drawBall(x, cx, cy, r, rot, sq) {
    x.save(); x.translate(cx, cy); x.rotate(rot); if (sq) x.scale(1 + sq, 1 - sq);
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.clip();
    if (ballImg && ballImg.complete && ballImg.naturalWidth) x.drawImage(ballImg, -r, -r, r * 2, r * 2);
    else {
      const g = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05); g.addColorStop(0, '#fed7aa'); g.addColorStop(0.35, '#fb923c'); g.addColorStop(0.78, '#ea580c'); g.addColorStop(1, '#9a3412');
      x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2);
      x.strokeStyle = '#3b1306'; x.lineWidth = Math.max(1.3, r * 0.085); x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, -r); x.lineTo(0, r); x.moveTo(-r, 0); x.lineTo(r, 0); x.stroke();
      x.beginPath(); x.arc(-r * 1.2, 0, r * 0.98, -0.95, 0.95); x.stroke(); x.beginPath(); x.arc(r * 1.2, 0, r * 0.98, Math.PI - 0.95, Math.PI + 0.95); x.stroke();
    }
    x.restore();
    x.save(); x.translate(cx, cy); x.strokeStyle = 'rgba(59,19,6,.9)'; x.lineWidth = Math.max(1.2, r * 0.07); x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(-r * 0.34, -r * 0.42, r * 0.28, r * 0.17, -0.7, 0, 7); x.fill(); x.restore();
  }
  function drawHoopBack(x, hx, hy) {
    // poste y brazo
    let g = x.createLinearGradient(hx + 16, 0, hx + 28, 0); g.addColorStop(0, '#94a3b8'); g.addColorStop(0.5, '#e2e8f0'); g.addColorStop(1, '#8492a6');
    x.fillStyle = g; x.fillRect(hx + 18, hy - 50, 10, FLOOR - hy + 50); x.fillRect(hx + 6, hy - 44, 16, 8); x.fillRect(hx + 6, hy - 8, 16, 8);
    x.fillStyle = '#64748b'; rr(x, hx + 6, FLOOR - 10, 34, 12, 4); x.fill();
    // tablero
    x.save(); x.shadowColor = 'rgba(30,64,175,.35)'; x.shadowBlur = 10; x.shadowOffsetX = -3;
    g = x.createLinearGradient(hx, 0, hx + 8, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cbd5e1'); x.fillStyle = g; rr(x, hx, hy - 82, 8, 98, 3); x.fill(); x.restore();
    x.fillStyle = '#e11d48'; x.fillRect(hx, hy - 46, 3, 34);
  }
  function drawHoopFront(x, hx, hy) {
    const tip = hx - RIMW, sw = S.sway * Math.sin(S.t * 0.5) * 6, drop = 46 + S.stretch * 14;
    // red
    x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 1.8; x.lineCap = 'round'; x.shadowColor = 'rgba(30,64,175,.4)'; x.shadowBlur = 3;
    const top = i => tip + 3 + i * ((RIMW - 6) / 5), bot = i => tip + 14 + i * ((RIMW - 28) / 5) + sw;
    for (let i = 0; i <= 5; i++) { x.beginPath(); x.moveTo(top(i), hy + 3); x.lineTo(bot(i), hy + drop); x.stroke(); }
    [0.3, 0.62, 0.95].forEach(row => { x.beginPath(); for (let i = 0; i <= 5; i++) { const px = top(i) * (1 - row) + bot(i) * row, py = hy + 3 + (drop - 3) * row + (i % 2 ? 3 : -3); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); });
    x.shadowBlur = 0;
    // aro
    x.strokeStyle = '#c2410c'; x.lineWidth = 7; x.beginPath(); x.moveTo(tip, hy); x.lineTo(hx, hy); x.stroke();
    x.strokeStyle = '#fb923c'; x.lineWidth = 4; x.beginPath(); x.moveTo(tip, hy); x.lineTo(hx, hy); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(tip + 2, hy - 1.5); x.lineTo(hx - 4, hy - 1.5); x.stroke();
  }
  function drawHUD(x) {
    rr(x, 180 - 112, 44, 224, 34, 17); x.fillStyle = 'rgba(255,255,255,.42)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.5; x.stroke();
    const n = cfg.tiros, sx = n > 1 ? 150 / (n - 1) : 0;
    for (let i = 0; i < n; i++) {
      const cx = 105 + i * sx, cy = 61, cur = i === S.shots && (S.phase === 'aim' || S.phase === 'fly');
      if (i < S.res.length) { if (S.res[i]) { x.fillStyle = '#e11d48'; heart(x, cx, cy, 8.5); x.fill(); } else { x.fillStyle = '#94a3b8'; heart(x, cx, cy, 8); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(cx, cy - 5); x.lineTo(cx - 2, cy); x.lineTo(cx + 2, cy + 2); x.lineTo(cx, cy + 7); x.stroke(); } }
      else { const s = cur ? 1 + Math.sin(S.t * 0.2) * 0.12 : 1; x.fillStyle = cur ? '#fb923c' : 'rgba(251,146,60,.5)'; x.beginPath(); x.arc(cx, cy, 8 * s, 0, 7); x.fill(); x.strokeStyle = 'rgba(124,45,18,.8)'; x.lineWidth = 1.2; x.stroke(); }
    }
    // rótulo del tiro
    if (S.intro > 0 && S.phase === 'aim') {
      const a = Math.min(1, S.intro / 20), lv = level(S.shots), txt = `Tiro ${S.shots + 1} · ${lv.label}`;
      x.globalAlpha = a; x.font = '700 15px Quicksand, sans-serif'; x.textAlign = 'center'; const w = x.measureText(txt).width + 26;
      rr(x, 180 - w / 2, 88, w, 28, 14); x.fillStyle = 'rgba(20,33,61,.78)'; x.fill(); x.fillStyle = '#fff'; x.fillText(txt, 180, 107); x.globalAlpha = 1;
    } else if (S.streak >= 2) { x.font = '700 22px Caveat, cursive'; x.textAlign = 'center'; x.fillStyle = '#e11d48'; x.strokeStyle = '#fff'; x.lineWidth = 4; x.lineJoin = 'round'; const t = '🔥 racha x' + S.streak; x.strokeText(t, 180, 106); x.fillText(t, 180, 106); }
  }
  function drawToast(x) {
    const t = S.toast; if (!t) return;
    const a = t.age, pop = a < 12 ? 0.5 + 0.7 * Math.sin((a / 12) * Math.PI * 0.5) : a < 18 ? 1.2 - 0.2 * ((a - 12) / 6) : 1, alpha = a > 58 ? 1 - (a - 58) / 22 : 1;
    x.save(); x.globalAlpha = Math.max(0, alpha); x.translate(180, 400 - a * 0.45); x.scale(pop, pop); x.textAlign = 'center'; x.lineJoin = 'round'; x.font = '700 48px Caveat, cursive';
    x.strokeStyle = '#fff'; x.lineWidth = 9; x.strokeText(t.text, 0, 0);
    const g = x.createLinearGradient(0, -40, 0, 8); if (t.kind === 'ok') { g.addColorStop(0, '#fb7185'); g.addColorStop(1, '#be123c'); } else { g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#1d4ed8'); }
    x.fillStyle = g; x.fillText(t.text, 0, 0);
    if (t.sub) { x.font = '700 26px Caveat, cursive'; x.strokeStyle = '#fff'; x.lineWidth = 6; x.strokeText(t.sub, 0, 32); x.fillStyle = '#ea580c'; x.fillText(t.sub, 0, 32); }
    x.restore();
  }
  function dot(x, px, py, r, a) { x.globalAlpha = a; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); x.stroke(); }

  function draw() {
    const x = ctx; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (S.shake > 0.3) x.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
    if (bg) x.drawImage(bg, 0, 0, W, H);
    // público
    for (let i = 0; i < 12; i++) { const fx = 14 + i * 30, row = i % 2, jump = S.cheer > 0 ? Math.abs(Math.sin(S.t * 0.35 + i)) * 12 * Math.min(1, S.cheer / 20) : Math.sin(S.t * 0.05 + i) * 1.5; x.fillStyle = i % 2 ? '#7dd3fc' : '#fb7185'; heart(x, fx, FLOOR - 34 - row * 24 - jump, 8); x.fill(); }
    const lv = level(Math.min(S.shots, cfg.tiros - 1)), hy = hoopY(lv, S.t), b = S.ball, d = S.drag && S.phase === 'aim' ? S.drag : null;
    drawHoopBack(x, lv.x, hy);
    // recorrido real del balón
    x.lineWidth = 1.4; x.strokeStyle = 'rgba(29,78,216,.85)'; x.fillStyle = '#fff';
    S.path.forEach(p => dot(x, p.x, p.y, 3.6, Math.max(0, 1 - p.a / 150))); x.globalAlpha = 1;
    // balón y sombra
    if (!S.hidden) {
      const bx = d ? SX + d.px * 0.35 : S.phase === 'fly' ? b.x : SX, by = d ? Math.min(SY + d.py * 0.35, FLOOR + 6) : S.phase === 'fly' ? b.y : SY + (S.phase === 'aim' ? Math.sin(S.t * 0.07) * 1.5 : 0);
      const hgt = clamp((FLOOR - by) / 400, 0, 1);
      x.fillStyle = 'rgba(90,40,10,' + (0.25 - hgt * 0.17) + ')'; x.beginPath(); x.ellipse(bx, FLOOR + 8, R * (1 - hgt * 0.5), 5 * (1 - hgt * 0.4), 0, 0, 7); x.fill();
      if (d) { x.strokeStyle = 'rgba(190,18,60,.8)'; x.lineWidth = 3; x.setLineDash([2, 6]); x.lineCap = 'round'; x.beginPath(); x.moveTo(SX, SY); x.lineTo(bx, by); x.stroke(); x.setLineDash([]); }
      drawBall(x, bx, by, R * (1 - Math.max(0, S.appear) * 0.5), S.phase === 'fly' ? b.rot : 0.2, 0);
      if (d) {
        const L = Math.hypot(d.px, d.py), f = clamp(L / MAXP, 0, 1);
        x.lineWidth = 5; x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.arc(bx, by, R + 10, 0, 7); x.stroke();
        const pg = x.createLinearGradient(bx - 30, by, bx + 30, by); pg.addColorStop(0, '#38bdf8'); pg.addColorStop(1, '#e11d48'); x.strokeStyle = pg; x.beginPath(); x.arc(bx, by, R + 10, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); x.stroke();
        // recorrido previsto: puntitos hasta el primer rebote
        if (L >= MINP && !(d.py <= 0 && d.px >= 0)) {
          const pb = newBall(); pb.vx = -d.px * K; pb.vy = -d.py * K; x.fillStyle = '#fff'; x.strokeStyle = 'rgba(29,78,216,.85)'; x.lineWidth = 1.4;
          for (let i = 1; i <= 96; i++) { const ev = stepBall(pb, lv.x, hy); if (i % 4 === 0) dot(x, pb.x, pb.y, Math.max(2.2, 4.2 - i * 0.02), 1 - i / 150); if (ev || pb.x > W + 20) break; }
          x.globalAlpha = 1;
        }
      } else if (S.shots === 0 && S.phase === 'aim' && S.intro <= 0) {
        const k = (Math.sin(S.t * 0.07) + 1) / 2; x.font = '32px serif'; x.textAlign = 'center'; x.fillText('👆', SX + 6 - k * 30, SY + 44 + k * 24);
      }
    }
    drawHoopFront(x, lv.x, hy);
    S.parts.forEach(p => { x.globalAlpha = clamp(p.life / p.max, 0, 1); x.fillStyle = p.c; if (p.type === 'h') { x.save(); x.translate(p.x, p.y); x.rotate(p.rot); heart(x, 0, 0, p.s); x.fill(); x.restore(); } else { x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); } });
    x.globalAlpha = 1;
    drawHUD(x); drawToast(x);
    if (S.flash > 0.02) { x.globalAlpha = Math.min(0.6, S.flash); x.fillStyle = '#fff'; x.fillRect(-10, -10, W + 20, H + 20); x.globalAlpha = 1; }
  }
  function loop(t) {
    requestAnimationFrame(loop);
    if (!cv || !cv.offsetParent) { last = t; return; }
    const dt = Math.min(50, t - last); last = t; acc += dt * (S.slow > 0 ? 0.4 : 1); if (S.slow > 0) S.slow -= dt / 16.667;
    while (acc >= 16.667) { step(); acc -= 16.667; }
    draw();
  }
  // Para las pruebas automáticas: resolver y lanzar un tiro exacto
  window.__game = { state: () => S, levels: LEVELS, solve: i => solve(level(i), S ? S.t : 0), solveNow: () => solve(level(S.shots), S.t), shoot: (px, py) => { if (S.phase === 'aim') shoot(px, py); } };
})();
