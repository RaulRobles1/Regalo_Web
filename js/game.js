/* Juego de la canasta: arrastra el balón hacia abajo (tirachinas), mira la trayectoria y suéltalo.
   Escena pintada en canvas: pabellón con guirnaldas, parquet en perspectiva, canasta de cristal,
   balón con sombra y estela, red elástica, corazones, cámara lenta y sacudida al encestar. */
(() => {
  const W = 360, H = 560, MX = 180, SX = 80, SY = 470, CX = 288, RIMY = 235, RW = 46, R0 = 22;  // canasta a la derecha, balón a la izquierda
  // Física y dificultad (ajustables):
  const G = 0.46, KY = 0.165, KX = 0.10, MAXP = 120, MINP = 18, MAXF = 520;
  const BOARD = { x: CX - 56, y: RIMY - 92, w: 112, h: 84 };
  const HORIZON = 300, VPY = 110;
  const PALETTE = ['#e11d48', '#fb7185', '#7dd3fc', '#38bdf8', '#ffffff', '#fecdd3'];
  let cv, ctx, cfg, dpr = 1, ballImg = null, S = null, bg = null, looping = false, last = 0, acc = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const radius = y => (y <= RIMY ? R0 * 0.72 : R0 * (0.72 + 0.28 * clamp((y - RIMY) / (SY - RIMY), 0, 1)));
  const fresh = () => ({
    shots: 0, hits: 0, res: [], phase: 'ready', hidden: false, streak: 0,
    ball: { x: SX, y: SY, vx: 0, vy: 0, rot: 0, scored: false, rim: false, f: 0 },
    drag: null, wait: 0, sway: 0, stretch: 0, flash: 0, shake: 0, cheer: 0, slow: 0,
    t: 0, toast: null, parts: [], path: [], appear: 0
  });

  function rr(x, a, b, w, h, r) {
    x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
  }
  function heart(x, cx, cy, s) {
    x.beginPath(); x.moveTo(cx, cy + s * 0.9);
    x.bezierCurveTo(cx - s * 1.4, cy - s * 0.1, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.35);
    x.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.4, cy - s * 0.1, cx, cy + s * 0.9); x.closePath();
  }

  /* =============== Montaje =============== */
  window.renderGame = function renderGame() {
    const root = document.getElementById('game'); if (!root || !CONFIG.juego) return;
    cfg = CONFIG.juego; S = fresh();
    const t = document.getElementById('game-title'), s = document.getElementById('game-sub');
    if (t) t.textContent = cfg.titulo; if (s) s.textContent = cfg.subtitulo;
    root.innerHTML = `<div class="game-wrap"><div class="game-card">
      <div class="game-stage">
        <canvas id="g-canvas" aria-label="Juego de la canasta"></canvas>
        <div id="g-overlay" class="g-overlay"></div>
      </div>
      <div class="game-foot"><span class="chip" id="g-best"></span><span class="hand">Arrastra desde abajo ↓</span></div>
    </div></div>`;
    cv = document.getElementById('g-canvas');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx = cv.getContext('2d');
    if (cfg.pelotaImg) { ballImg = new Image(); ballImg.src = cfg.pelotaImg; }
    buildBg(); bind(); updateBest();
    const won = store.get('juegoGanado', null);
    if (won) showWin(won.hits, true); else showStart();
    if (!looping) { looping = true; requestAnimationFrame(loop); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildBg);
  };

  function updateBest() {
    const el = document.getElementById('g-best');
    if (el) el.textContent = '🏆 Mejor marca: ' + store.get('juegoBest', 0) + '/' + cfg.tiros;
  }

  /* =============== Pantallas (overlay) =============== */
  function overlay(html) {
    const o = document.getElementById('g-overlay');
    o.innerHTML = '<div class="g-panel">' + html + '</div>'; o.classList.remove('hidden');
  }
  function hideOverlay() { document.getElementById('g-overlay').classList.add('hidden'); }

  function showStart() {
    S.phase = 'ready';
    overlay(`<div class="g-ball">🏀</div>
      <h3>${esc(fill(cfg.textoPanel, { n: cfg.aciertosParaPremio }))}</h3>
      <p class="hand g-sub">${esc(cfg.textoPanelSub)} ❤️</p>
      <div class="g-demo"><svg viewBox="0 0 160 96" class="demo-arc"><path d="M80 82 C 66 6, 128 -14, 122 46" fill="none" stroke="#fb7185" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/></svg><span class="demo-ball">🏀</span><span class="demo-hand">👆</span></div>
      <p class="g-how">Arrastra el balón hacia abajo, mira los puntitos y suelta</p>
      <button class="btn btn-red" id="g-play">¡Jugar! 🏀</button>`);
  }

  function showWin(hits, quiet) {
    S.phase = 'done';
    overlay(`<div class="g-trophy">🏆</div>
      <h3>¡PLENO! ${hits}/${cfg.tiros}</h3>
      <p class="hand g-prize">${esc(cfg.textoPremio)}</p>
      <div class="g-btns"><button class="btn btn-red" id="g-wa">Avisarle por WhatsApp 📲</button>
      <button class="btn" id="g-again">Jugar otra vez 🏀</button></div>`);
    if (!quiet) FX.celebrate(3200);
  }

  function showLose(hits) {
    S.phase = 'done';
    const best = store.get('juegoBest', hits);
    const row = S.res.map(r => (r ? '❤️' : '🤍')).join(' ');
    overlay(`<div class="g-score">${hits}<span>/${cfg.tiros}</span></div>
      <div class="g-row">${row}</div>
      <p class="hand g-prize">${esc(fill(cfg.textoFallo, { n: cfg.aciertosParaPremio }))}</p>
      <p class="g-best">🏆 Mejor marca: ${best}/${cfg.tiros}</p>
      <button class="btn btn-red" id="g-again">Reintentar 🏀</button>`);
  }

  function startGame() {
    S = fresh(); S.phase = 'aim'; hideOverlay();
    toast('¡Tú puedes! ❤️', 'ok');
  }

  /* =============== Entrada =============== */
  function bind() {
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    cv.addEventListener('pointerdown', e => {
      if (S.phase !== 'aim') return;
      const p = pt(e); if (p.y < 250) return;
      S.drag = { sx: p.x, sy: p.y, px: 0, py: 0 };
      cv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (!S.drag) return;
      const p = pt(e); let dx = p.x - S.drag.sx, dy = p.y - S.drag.sy; const L = Math.hypot(dx, dy);
      if (L > MAXP) { dx *= MAXP / L; dy *= MAXP / L; }
      S.drag.px = dx; S.drag.py = dy;
    });
    cv.addEventListener('pointerup', () => {
      const d = S.drag; S.drag = null; if (!d || S.phase !== 'aim') return;
      if (Math.hypot(d.px, d.py) < MINP || d.py <= 0) { toast('Tira del balón hacia abajo 👇', 'ko'); return; }
      shoot(d.px, d.py);
    });
    cv.addEventListener('pointercancel', () => { S.drag = null; });
    document.getElementById('game').addEventListener('click', e => {
      if (e.target.closest('#g-play') || e.target.closest('#g-again')) startGame();
      if (e.target.closest('#g-wa')) {
        const hits = (store.get('juegoGanado', null) || {}).hits || S.hits;
        openWA(fill(cfg.mensajeWhatsApp, { aciertos: hits, tiros: cfg.tiros }));
      }
    });
  }

  function shoot(px, py) {
    const b = S.ball;
    b.x = SX; b.y = SY; b.vx = -px * KX; b.vy = -py * KY; b.scored = false; b.rim = false; b.f = 0;
    S.path = []; S.phase = 'fly';
  }

  /* =============== Física (paso fijo 60 fps) =============== */
  function step() {
    S.t++; S.sway *= 0.96; S.stretch *= 0.9; S.flash *= 0.9; S.shake *= 0.86; if (S.cheer > 0) S.cheer--;
    if (S.appear > 0) S.appear -= 0.08;
    if (S.toast) { S.toast.age++; if (S.toast.age > 80) S.toast = null; }
    S.path.forEach(p => { p.a++; }); if (S.path.length && S.path[0].a > 170) S.path.shift();
    S.parts = S.parts.filter(p => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; return --p.life > 0; });

    if (S.phase === 'fly') {
      const b = S.ball, py0 = b.y;
      b.vy += G; b.x += b.vx; b.y += b.vy; b.rot += b.vx * 0.05; b.f++;
      if (b.f % 2 === 0) S.path.push({ x: b.x, y: b.y, a: 0 });
      // tablero (rebote)
      if (b.x > BOARD.x && b.x < BOARD.x + BOARD.w && b.y > BOARD.y && b.y < BOARD.y + BOARD.h && b.vy < 0) {
        b.vy = -b.vy * 0.5; b.vx *= 0.8; b.rim = true; S.shake = 4; sparks(b.x, b.y, 7, '#ffffff');
      }
      // extremos del aro
      const rr2 = radius(b.y) + 3;
      [CX - RW, CX + RW].forEach(ex => {
        const dx = b.x - ex, dy = b.y - RIMY, d = Math.hypot(dx, dy);
        if (d < rr2 && d > 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot < 0) { b.vx -= 1.55 * dot * nx; b.vy -= 1.55 * dot * ny; b.rim = true; S.shake = 3; sparks(ex, RIMY, 6, '#fdba74'); }
          b.x = ex + nx * rr2; b.y = RIMY + ny * rr2;
        }
      });
      // canasta: cruza el aro de arriba abajo por la boca
      if (!b.scored && py0 < RIMY && b.y >= RIMY && b.vy > 0 && Math.abs(b.x - CX) < RW - 4) {
        b.scored = true; b.vx *= 0.35; onScore();
      }
      if (b.y > H + 60 || b.x < -80 || b.x > W + 80 || b.f > MAXF) endShot();
    } else if (S.phase === 'wait') {
      if (--S.wait <= 0) {
        if (S.shots >= cfg.tiros) endRound();
        else { S.ball = fresh().ball; S.hidden = false; S.phase = 'aim'; S.appear = 1; S.path = []; }
      }
    }
  }

  function sparks(x, y, n, color) {
    for (let i = 0; i < n; i++) S.parts.push({ type: 's', x, y, vx: rand(-3, 3), vy: rand(-4, 1), g: 0.18, life: 22, max: 22, s: rand(1.5, 3), c: color, rot: 0, vr: 0 });
  }
  function hearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      const life = rand(50, 85);
      S.parts.push({ type: 'h', x, y, vx: rand(-3.2, 3.2), vy: rand(-6, -1.5), g: 0.1, life, max: life, s: rand(4, 9), c: PALETTE[Math.floor(Math.random() * PALETTE.length)], rot: rand(-0.5, 0.5), vr: rand(-0.08, 0.08) });
    }
  }

  function stageOrigin() {
    const r = cv.getBoundingClientRect();
    return { x: (r.left + r.width * CX / W) / innerWidth, y: (r.top + r.height * RIMY / H) / innerHeight };
  }

  function onScore() {
    const b = S.ball, swish = !b.rim;
    S.streak++; S.hits++;
    S.sway = 1; S.stretch = 1; S.flash = swish ? 0.55 : 0.35; S.shake = swish ? 2 : 5; S.cheer = 45; S.slow = 26;
    hearts(CX, RIMY + 30, swish ? 34 : 22); sparks(CX, RIMY + 10, 10, '#ffffff');
    const words = swish ? ['¡SWISH! ✨', '¡CANASTA! ❤️', '¡PERFECTO! 💙'] : ['¡CANASTA! ❤️', '¡DENTRO! 🏀'];
    toast(words[Math.floor(Math.random() * words.length)], 'ok', S.streak >= 2 ? '🔥 racha x' + S.streak : '');
    FX.burst({ particleCount: 40, origin: stageOrigin() });
  }

  function endShot() {
    const b = S.ball;
    S.res.push(b.scored); S.shots++;
    if (!b.scored) { S.streak = 0; S.shake = 3; toast(['Casi… 🥺', '¡Uy! 💔', 'Por poco… 🙈'][Math.floor(Math.random() * 3)], 'ko'); }
    S.hidden = true; S.phase = 'wait'; S.wait = 55;
  }

  function endRound() {
    const best = store.get('juegoBest', 0); if (S.hits > best) store.set('juegoBest', S.hits);
    updateBest();
    if (S.hits >= cfg.aciertosParaPremio) { store.set('juegoGanado', { hits: S.hits }); showWin(S.hits, false); }
    else showLose(S.hits);
  }

  function toast(text, kind, sub) { S.toast = { text, kind, sub: sub || '', age: 0 }; }

  /* =============== Fondo estático (se pinta una sola vez) =============== */
  function buildBg() {
    bg = document.createElement('canvas'); bg.width = W * dpr; bg.height = H * dpr;
    const x = bg.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);

    // pared / cielo del pabellón
    let g = x.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, '#6cc4f7'); g.addColorStop(0.5, '#bde6fb'); g.addColorStop(1, '#fbd5e3');
    x.fillStyle = g; x.fillRect(0, 0, W, HORIZON + 2);

    // haces de focos
    [[-10, 0], [370, 0]].forEach(([sx], i) => {
      const beam = x.createLinearGradient(sx, 0, 180, 300);
      beam.addColorStop(0, 'rgba(255,255,255,.35)'); beam.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = beam; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + (i ? -70 : 70), 0); x.lineTo(180 + (i ? 80 : -80), 300); x.lineTo(180 + (i ? 180 : -180), 300); x.closePath(); x.fill();
    });

    // luces bokeh (determinista)
    let seed = 7; const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 26; i++) {
      const bx = r() * W, by = 50 + r() * 230, br = 6 + r() * 20;
      x.globalAlpha = 0.12 + r() * 0.16; x.fillStyle = ['#ffffff', '#fecdd3', '#e0f2fe'][i % 3];
      x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;

    // corazones grandes en la pared
    [[48, 150, 22, '#fb7185'], [150, 118, 18, '#7dd3fc'], [58, 250, 16, '#7dd3fc'], [196, 232, 20, '#fb7185']].forEach(h => {
      x.globalAlpha = 0.35; x.fillStyle = h[3]; heart(x, h[0], h[1], h[2]); x.fill();
    });
    x.globalAlpha = 1;

    // gradas del fondo
    x.fillStyle = 'rgba(40,52,120,.28)'; x.fillRect(0, HORIZON - 22, W, 24);
    x.fillStyle = 'rgba(40,52,120,.18)'; x.fillRect(0, HORIZON - 34, W, 12);

    // suelo de parquet en perspectiva
    g = x.createLinearGradient(0, HORIZON, 0, H);
    g.addColorStop(0, '#f6dcb6'); g.addColorStop(1, '#e4b075');
    x.fillStyle = g; x.fillRect(0, HORIZON, W, H - HORIZON);
    x.strokeStyle = 'rgba(120,70,20,.16)'; x.lineWidth = 1.2;
    for (let xb = -540; xb <= 900; xb += 45) {
      const xh = 180 + (xb - 180) * (HORIZON - VPY) / (H - VPY);
      x.beginPath(); x.moveTo(xb, H); x.lineTo(xh, HORIZON); x.stroke();
    }
    x.strokeStyle = 'rgba(120,70,20,.10)';
    for (let k = 0; k < 9; k++) { const yy = HORIZON + Math.pow(k / 8, 1.7) * (H - HORIZON); x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
    g = x.createLinearGradient(0, HORIZON, 0, HORIZON + 90);
    g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, HORIZON, W, 90);

    // marcas de la cancha
    x.fillStyle = 'rgba(251,113,133,.34)';
    x.beginPath(); x.moveTo(CX - 52, HORIZON); x.lineTo(CX + 52, HORIZON); x.lineTo(CX + 90, 440); x.lineTo(CX - 90, 440); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 3; x.stroke();
    x.beginPath(); x.ellipse(CX, 440, 90, 24, 0, Math.PI, Math.PI * 2); x.stroke();
    x.setLineDash([8, 7]); x.beginPath(); x.ellipse(CX, 440, 90, 24, 0, 0, Math.PI); x.stroke(); x.setLineDash([]);
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3;
    x.beginPath(); x.ellipse(CX, HORIZON, 178, 205, 0, 0, Math.PI); x.stroke();
    x.save(); x.translate(205, 525); x.scale(1, 0.42); x.textAlign = 'center'; x.fillStyle = 'rgba(225,29,72,.42)';
    x.font = '700 46px "Playfair Display", serif'; x.fillText('3 AÑOS ❤', 0, 0); x.restore();

    // bunting (guirnalda de banderines) arriba
    const P0 = [0, 4], P1 = [180, 38], P2 = [360, 4];
    x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(P0[0], P0[1]); x.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); x.stroke();
    const cols = ['#fb7185', '#7dd3fc', '#ffffff', '#e11d48', '#38bdf8'];
    for (let i = 0; i <= 12; i++) {
      const t = (i + 0.5) / 13, a = (1 - t) * (1 - t), b2 = 2 * (1 - t) * t, c = t * t;
      const px = a * P0[0] + b2 * P1[0] + c * P2[0], py = a * P0[1] + b2 * P1[1] + c * P2[1];
      x.fillStyle = cols[i % cols.length];
      x.beginPath(); x.moveTo(px - 9, py); x.lineTo(px + 9, py); x.lineTo(px, py + 19); x.closePath(); x.fill();
    }

    // soporte y tablero de cristal
    let sg = x.createLinearGradient(CX - 8, 0, CX + 8, 0);
    sg.addColorStop(0, '#94a3b8'); sg.addColorStop(0.5, '#e2e8f0'); sg.addColorStop(1, '#94a3b8');
    x.fillStyle = sg; x.fillRect(CX - 7, 0, 14, BOARD.y + 4);
    x.strokeStyle = '#94a3b8'; x.lineWidth = 5; x.lineCap = 'round';
    x.beginPath(); x.moveTo(CX, 70); x.lineTo(BOARD.x + 14, BOARD.y + 4); x.moveTo(CX, 70); x.lineTo(BOARD.x + BOARD.w - 14, BOARD.y + 4); x.stroke();
    x.save(); x.shadowColor = 'rgba(30,64,175,.35)'; x.shadowBlur = 14; x.shadowOffsetY = 6;
    rr(x, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 8);
    g = x.createLinearGradient(BOARD.x, BOARD.y, BOARD.x + BOARD.w, BOARD.y + BOARD.h);
    g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(219,234,254,.55)');
    x.fillStyle = g; x.fill(); x.restore();
    x.strokeStyle = '#cbd5e1'; x.lineWidth = 4; rr(x, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 8); x.stroke();
    x.strokeStyle = '#e11d48'; x.lineWidth = 4; rr(x, CX - 24, RIMY - 50, 48, 36, 3); x.stroke();
    x.fillStyle = '#e11d48'; heart(x, CX, RIMY - 33, 8); x.fill();
    x.fillStyle = 'rgba(255,255,255,.6)';
    x.beginPath(); x.moveTo(BOARD.x + 10, BOARD.y + 4); x.lineTo(BOARD.x + 38, BOARD.y + 4); x.lineTo(BOARD.x + 14, BOARD.y + BOARD.h - 4); x.lineTo(BOARD.x + 4, BOARD.y + BOARD.h - 4); x.closePath(); x.fill();
    x.fillStyle = '#94a3b8'; x.fillRect(CX - 11, BOARD.y + BOARD.h - 1, 22, 11);

    // viñeta
    g = x.createRadialGradient(180, 300, 150, 180, 300, 420);
    g.addColorStop(0, 'rgba(15,23,80,0)'); g.addColorStop(1, 'rgba(15,23,80,.28)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }

  /* =============== Dibujo dinámico =============== */
  function preview(px, py) {
    const pts = []; let x = SX, y = SY, vx = -px * KX, vy = -py * KY;
    for (let f = 1; f <= 69; f++) { vy += G; x += vx; y += vy; if (f % 3 === 0) pts.push({ x, y }); }
    return pts;
  }

  function drawBall(x, cx, cy, r, rot, sq) {
    x.save(); x.translate(cx, cy); x.rotate(rot); if (sq) x.scale(1 + sq, 1 - sq);
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.clip();
    if (ballImg && ballImg.complete && ballImg.naturalWidth) x.drawImage(ballImg, -r, -r, r * 2, r * 2);
    else {
      const g = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
      g.addColorStop(0, '#fed7aa'); g.addColorStop(0.35, '#fb923c'); g.addColorStop(0.78, '#ea580c'); g.addColorStop(1, '#9a3412');
      x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2);
      x.fillStyle = 'rgba(124,45,18,.22)';
      for (let i = 0; i < 26; i++) { const a = i * 2.399, d = r * 0.9 * Math.sqrt((i + 1) / 26); x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, Math.max(0.5, r * 0.035), 0, 7); x.fill(); }
      x.strokeStyle = '#3b1306'; x.lineWidth = Math.max(1.3, r * 0.085); x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, -r); x.lineTo(0, r); x.moveTo(-r, 0); x.lineTo(r, 0); x.stroke();
      x.beginPath(); x.arc(-r * 1.2, 0, r * 0.98, -0.95, 0.95); x.stroke();
      x.beginPath(); x.arc(r * 1.2, 0, r * 0.98, Math.PI - 0.95, Math.PI + 0.95); x.stroke();
    }
    x.restore();
    x.save(); x.translate(cx, cy); if (sq) x.scale(1 + sq, 1 - sq);
    x.strokeStyle = 'rgba(59,19,6,.9)'; x.lineWidth = Math.max(1.2, r * 0.07); x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(-r * 0.34, -r * 0.42, r * 0.28, r * 0.17, -0.7, 0, 7); x.fill();
    x.restore();
  }

  function drawRim(x, front) {
    x.lineCap = 'round';
    x.strokeStyle = '#c2410c'; x.lineWidth = 7;
    x.beginPath(); x.ellipse(CX, RIMY, RW, 9, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); x.stroke();
    x.strokeStyle = '#fb923c'; x.lineWidth = 4;
    x.beginPath(); x.ellipse(CX, RIMY, RW, 9, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.4;
    x.beginPath(); x.ellipse(CX, RIMY - 1, RW, 8, 0, front ? 0.4 : Math.PI + 0.4, front ? 2.7 : Math.PI + 2.7); x.stroke();
  }

  function drawNet(x) {
    const sw = S.sway * Math.sin(S.t * 0.5) * 7, drop = 62 + S.stretch * 16;
    const top = i => CX - RW + i * (2 * RW / 6), bot = i => CX - RW * 0.58 + i * (2 * RW * 0.58 / 6) + sw;
    x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 2; x.lineCap = 'round';
    x.shadowColor = 'rgba(30,64,175,.35)'; x.shadowBlur = 3;
    for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(top(i), RIMY + 6); x.lineTo(bot(i), RIMY + drop); x.stroke(); }
    [0.28, 0.58, 0.88].forEach(row => {
      x.beginPath();
      for (let i = 0; i <= 6; i++) {
        const px = top(i) * (1 - row) + bot(i) * row, py = RIMY + 6 + (drop - 6) * row + (i % 2 ? 4 : -4);
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    });
    x.shadowBlur = 0;
  }

  function drawHUD(x) {
    rr(x, MX - 112, 38, 224, 36, 18);
    x.fillStyle = 'rgba(255,255,255,.38)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.5; x.stroke();
    const n = cfg.tiros, stepX = n > 1 ? 150 / (n - 1) : 0;
    for (let i = 0; i < n; i++) {
      const cx = MX - 75 + i * stepX, cy = 56, cur = i === S.shots && (S.phase === 'aim' || S.phase === 'fly');
      if (i < S.res.length) {
        if (S.res[i]) { x.fillStyle = '#e11d48'; heart(x, cx, cy, 8.5); x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(cx - 3, cy - 3, 1.8, 0, 7); x.fill(); }
        else { x.fillStyle = '#94a3b8'; heart(x, cx, cy, 8); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(cx, cy - 5); x.lineTo(cx - 2, cy); x.lineTo(cx + 2, cy + 2); x.lineTo(cx, cy + 7); x.stroke(); }
      } else {
        const s = cur ? 1 + Math.sin(S.t * 0.2) * 0.12 : 1;
        x.fillStyle = cur ? '#fb923c' : 'rgba(251,146,60,.55)'; x.beginPath(); x.arc(cx, cy, 8 * s, 0, 7); x.fill();
        x.strokeStyle = 'rgba(124,45,18,.8)'; x.lineWidth = 1.2; x.stroke();
        x.beginPath(); x.moveTo(cx - 8 * s, cy); x.lineTo(cx + 8 * s, cy); x.stroke();
      }
    }
    if (S.streak >= 2) {
      x.font = '700 22px Caveat, cursive'; x.textAlign = 'center'; x.fillStyle = '#e11d48'; x.strokeStyle = '#fff'; x.lineWidth = 4; x.lineJoin = 'round';
      const t = '🔥 racha x' + S.streak; x.strokeText(t, MX, 98); x.fillText(t, MX, 98);
    }
  }

  function drawToast(x) {
    const t = S.toast; if (!t) return;
    const a = t.age, pop = a < 12 ? 0.5 + 0.7 * Math.sin((a / 12) * Math.PI * 0.5) : a < 18 ? 1.2 - 0.2 * ((a - 12) / 6) : 1;
    const alpha = a > 58 ? 1 - (a - 58) / 22 : 1, rise = a * 0.45;
    x.save(); x.globalAlpha = Math.max(0, alpha); x.translate(MX, 350 - rise); x.scale(pop, pop);
    x.textAlign = 'center'; x.lineJoin = 'round'; x.font = '700 52px Caveat, cursive';
    x.strokeStyle = '#fff'; x.lineWidth = 9; x.strokeText(t.text, 0, 0);
    const g = x.createLinearGradient(0, -40, 0, 8);
    if (t.kind === 'ok') { g.addColorStop(0, '#fb7185'); g.addColorStop(1, '#be123c'); } else { g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#1d4ed8'); }
    x.fillStyle = g; x.fillText(t.text, 0, 0);
    if (t.sub) { x.font = '700 26px Caveat, cursive'; x.strokeStyle = '#fff'; x.lineWidth = 6; x.strokeText(t.sub, 0, 32); x.fillStyle = '#ea580c'; x.fillText(t.sub, 0, 32); }
    x.restore();
  }

  function drawAim(x) {
    // tirachinas: dos postes y goma elástica
    const d = S.drag && S.phase === 'aim' ? S.drag : null;
    const bx = d ? SX + d.px * 0.45 : SX, by = d ? SY + d.py * 0.45 : SY;
    [-46, 46].forEach(o => {
      const gg = x.createLinearGradient(SX + o - 6, 0, SX + o + 6, 0); gg.addColorStop(0, '#be123c'); gg.addColorStop(0.5, '#fb7185'); gg.addColorStop(1, '#be123c');
      x.fillStyle = gg; rr(x, SX + o - 6, SY - 22, 12, 46, 6); x.fill();
      x.fillStyle = '#fecdd3'; x.beginPath(); x.arc(SX + o, SY - 22, 5, 0, 7); x.fill();
    });
    if (S.phase === 'aim' || S.phase === 'ready' || S.phase === 'wait') {
      x.strokeStyle = 'rgba(190,18,60,.85)'; x.lineWidth = 4; x.lineCap = 'round';
      x.beginPath(); x.moveTo(SX - 46, SY - 20); x.quadraticCurveTo(bx, by + (d ? 6 : 14), SX + 46, SY - 20); x.stroke();
    }
    return { bx, by, d };
  }

  function draw() {
    const x = ctx;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (S.shake > 0.3) x.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
    if (bg) x.drawImage(bg, 0, 0, W, H);

    // hinchas (corazones que saltan al encestar)
    for (let i = 0; i < 10; i++) {
      const fx = 18 + i * 36, jump = S.cheer > 0 ? Math.abs(Math.sin(S.t * 0.35 + i)) * 12 * Math.min(1, S.cheer / 20) : Math.sin(S.t * 0.05 + i) * 1.5;
      x.fillStyle = i % 2 ? '#7dd3fc' : '#fb7185'; heart(x, fx, HORIZON - 18 - jump, 7); x.fill();
    }
    // destellos
    x.fillStyle = '#fff';
    [[60, 90], [300, 80], [110, 170], [260, 160], [40, 210], [330, 215]].forEach((p, i) => {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(S.t * 0.04 + i * 1.7)), s = 2 + a * 2.2;
      x.globalAlpha = a; x.fillRect(p[0] - s / 2, p[1] - 0.6, s, 1.2); x.fillRect(p[0] - 0.6, p[1] - s / 2, 1.2, s);
    });
    x.globalAlpha = 1;

    const b = S.ball, aim = drawAim(x);
    // sombra en el suelo
    if (!S.hidden) {
      const prog = S.phase === 'fly' ? clamp((b.x - SX) / (CX - SX), 0, 1) : 0;
      const sy = lerp(SY + R0 + 10, 352, prog), hgt = S.phase === 'fly' ? clamp((sy - b.y) / 420, 0, 1) : 0;
      x.fillStyle = 'rgba(90,40,10,' + (0.22 - hgt * 0.12) + ')'; x.beginPath();
      x.ellipse(S.phase === 'fly' ? b.x : SX, sy, R0 * (0.95 - hgt * 0.4) * (1 - prog * 0.35), 5 * (1 - prog * 0.3), 0, 0, 7); x.fill();
    }
    drawRim(x, false);
    // estela
    x.lineWidth = 1.4; x.strokeStyle = 'rgba(29,78,216,.85)'; x.fillStyle = '#fff';
    S.path.forEach(p => { x.globalAlpha = Math.max(0, 1 - p.a / 170); x.beginPath(); x.arc(p.x, p.y, 3.8, 0, 7); x.fill(); x.stroke(); });
    x.globalAlpha = 1;
    // balón
    if (!S.hidden) {
      if (aim.d) drawBall(x, aim.bx, aim.by, R0, aim.d.px * 0.01, 0.04 * clamp(Math.hypot(aim.d.px, aim.d.py) / MAXP, 0, 1));
      else if (S.phase === 'fly') drawBall(x, b.x, b.y, radius(b.y), b.rot, 0);
      else { const bob = Math.sin(S.t * 0.07) * 2.2, sc = 1 - Math.max(0, S.appear) * 0.5; drawBall(x, SX, SY + bob, R0 * sc, 0.2, 0); }
    }
    drawRim(x, true); drawNet(x);

    // partículas
    S.parts.forEach(p => {
      const a = clamp(p.life / p.max, 0, 1);
      x.globalAlpha = a; x.fillStyle = p.c;
      if (p.type === 'h') { x.save(); x.translate(p.x, p.y); x.rotate(p.rot); heart(x, 0, 0, p.s); x.fill(); x.restore(); }
      else { x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }
    });
    x.globalAlpha = 1;

    // aro de potencia + trayectoria prevista
    if (aim.d) {
      const L = Math.hypot(aim.d.px, aim.d.py), f = clamp(L / MAXP, 0, 1);
      x.lineWidth = 5; x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.35)';
      x.beginPath(); x.arc(aim.bx, aim.by, R0 + 11, 0, Math.PI * 2); x.stroke();
      const pg = x.createLinearGradient(aim.bx - 30, aim.by, aim.bx + 30, aim.by); pg.addColorStop(0, '#38bdf8'); pg.addColorStop(1, '#e11d48');
      x.strokeStyle = pg; x.beginPath(); x.arc(aim.bx, aim.by, R0 + 11, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); x.stroke();
      if (aim.d.py > 0 && L >= MINP) {
        const pts = preview(aim.d.px, aim.d.py);
        x.shadowBlur = 0;
        pts.forEach((p, i) => {
          x.globalAlpha = 1 - (i / pts.length) * 0.35; x.fillStyle = '#ffffff'; x.strokeStyle = 'rgba(29,78,216,.85)'; x.lineWidth = 1.4;
          x.beginPath(); x.arc(p.x, p.y, Math.max(2.4, 4.4 - i * 0.07), 0, 7); x.fill(); x.stroke();
        });
        x.shadowBlur = 0; x.globalAlpha = 1;
      }
    } else if (S.shots === 0 && S.phase === 'aim') {
      // mano de ayuda
      const k = (Math.sin(S.t * 0.07) + 1) / 2;
      x.font = '34px serif'; x.textAlign = 'center'; x.globalAlpha = 0.95;
      x.fillText('👆', SX + 14 - k * 36, SY + 28 + k * 36);
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.setLineDash([2, 8]);
      x.beginPath(); x.moveTo(SX - 6, SY + 8); x.lineTo(SX - 46, SY + 52); x.stroke(); x.setLineDash([]);
      x.globalAlpha = 1;
    }

    drawHUD(x); drawToast(x);
    if (S.flash > 0.02) { x.globalAlpha = Math.min(0.6, S.flash); x.fillStyle = '#fff'; x.fillRect(-10, -10, W + 20, H + 20); x.globalAlpha = 1; }
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (!cv || !cv.offsetParent) { last = t; return; }
    const dt = Math.min(50, t - last); last = t;
    acc += dt * (S.slow > 0 ? 0.35 : 1);
    if (S.slow > 0) S.slow -= dt / 16.667;
    while (acc >= 16.667) { step(); acc -= 16.667; }
    draw();
  }
})();
