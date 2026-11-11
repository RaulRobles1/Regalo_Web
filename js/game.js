/* Juego de la canasta: arrastra el balón hacia abajo (tirachinas), mira la trayectoria y suéltalo */
(() => {
  const W = 360, H = 560, SX = 180, SY = 470, CX = 180, RIMY = 195, RW = 46, R0 = 22;
  // Constantes de física y dificultad (ajustables):
  const G = 0.55, K = 0.19, KX = 0.6, MAXP = 120, MINP = 18, MAXF = 420;
  const BOARD = { x: CX - 56, y: RIMY - 92, w: 112, h: 84 };
  let cv, ctx, cfg, dpr = 1, ballImg = null, S = null, looping = false, last = 0, acc = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const radius = y => (y <= RIMY ? R0 * 0.62 : R0 * (0.62 + 0.38 * clamp((y - RIMY) / (SY - RIMY), 0, 1)));
  const fresh = () => ({ shots: 0, hits: 0, res: [], phase: 'aim', hidden: false, ball: { x: SX, y: SY, vx: 0, vy: 0, rot: 0, scored: false, f: 0 }, drag: null, wait: 0, sway: 0, t: 0 });

  function rr(x, a, b, w, h, r) {
    x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
  }

  window.renderGame = function renderGame() {
    const root = document.getElementById('game'); if (!root || !CONFIG.juego) return;
    cfg = CONFIG.juego; S = fresh();
    const t = document.getElementById('game-title'), s = document.getElementById('game-sub');
    if (t) t.textContent = cfg.titulo; if (s) s.textContent = cfg.subtitulo;
    root.innerHTML = `<div class="game-wrap"><div class="glass game-card">
      <div class="game-top"><div class="game-hud" id="g-hud"></div><span class="chip" id="g-score"></span></div>
      <div class="game-stage"><canvas id="g-canvas" aria-label="Juego de la canasta"></canvas><div id="g-toast"></div></div>
      <p class="game-hint hand">Arrastra hacia abajo y suelta para lanzar 🏀</p>
      <div id="g-end"></div>
    </div></div>`;
    cv = document.getElementById('g-canvas');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx = cv.getContext('2d');
    if (cfg.pelotaImg) { ballImg = new Image(); ballImg.src = cfg.pelotaImg; }
    bind(); updateHud();
    const won = store.get('juegoGanado', null);
    if (won) showWin(won.hits, true);
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  };

  /* ---------- Entrada ---------- */
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
    const up = () => {
      const d = S.drag; S.drag = null; if (!d || S.phase !== 'aim') return;
      if (Math.hypot(d.px, d.py) < MINP || d.py <= 0) { toast('Tira del balón hacia abajo 👇', 'ko'); return; }
      shoot(d.px, d.py);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', () => { S.drag = null; });
    document.getElementById('g-end').addEventListener('click', e => {
      if (e.target.closest('#g-wa')) {
        const hits = (store.get('juegoGanado', null) || {}).hits || S.hits;
        openWA(fill(cfg.mensajeWhatsApp, { aciertos: hits, tiros: cfg.tiros }));
      }
      if (e.target.closest('#g-again')) { S = fresh(); document.getElementById('g-end').innerHTML = ''; updateHud(); }
    });
  }

  function shoot(px, py) {
    const b = S.ball;
    b.x = SX; b.y = SY; b.vx = -px * K * KX; b.vy = -py * K; b.scored = false; b.f = 0;
    S.phase = 'fly';
  }

  /* ---------- Física (paso fijo 60 fps) ---------- */
  function step() {
    S.t++; S.sway *= 0.96;
    if (S.phase === 'fly') {
      const b = S.ball, py0 = b.y;
      b.vy += G; b.x += b.vx; b.y += b.vy; b.rot += b.vx * 0.05; b.f++;
      // tablero (rebote)
      if (b.x > BOARD.x && b.x < BOARD.x + BOARD.w && b.y > BOARD.y && b.y < BOARD.y + BOARD.h && b.vy < 0) { b.vy = -b.vy * 0.5; b.vx *= 0.8; }
      // extremos del aro
      const rr2 = radius(b.y) + 3;
      [CX - RW, CX + RW].forEach(ex => {
        const dx = b.x - ex, dy = b.y - RIMY, d = Math.hypot(dx, dy);
        if (d < rr2 && d > 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot < 0) { b.vx -= 1.55 * dot * nx; b.vy -= 1.55 * dot * ny; }
          b.x = ex + nx * rr2; b.y = RIMY + ny * rr2;
        }
      });
      // canasta: cruza el aro de arriba abajo por la boca
      if (!b.scored && py0 < RIMY && b.y >= RIMY && b.vy > 0 && Math.abs(b.x - CX) < RW - 4) {
        b.scored = true; b.vx *= 0.35; S.sway = 1; onScore();
      }
      if (b.y > H + 60 || b.x < -80 || b.x > W + 80 || b.f > MAXF) endShot();
    } else if (S.phase === 'wait') {
      if (--S.wait <= 0) {
        if (S.shots >= cfg.tiros) endRound();
        else { S.ball = fresh().ball; S.hidden = false; S.phase = 'aim'; }
      }
    }
  }

  function stageOrigin() {
    const r = cv.getBoundingClientRect();
    return { x: (r.left + r.width * CX / W) / innerWidth, y: (r.top + r.height * RIMY / H) / innerHeight };
  }

  function onScore() {
    toast('¡CANASTA! ❤️', 'ok');
    FX.burst({ particleCount: 55, origin: stageOrigin() });
  }

  function endShot() {
    const b = S.ball;
    S.res.push(b.scored); S.shots++; if (b.scored) S.hits++;
    if (!b.scored) toast('Casi… 🥺', 'ko');
    S.hidden = true; S.phase = 'wait'; S.wait = 45;
    updateHud();
  }

  function endRound() {
    S.phase = 'done';
    const best = store.get('juegoBest', 0); if (S.hits > best) store.set('juegoBest', S.hits);
    if (S.hits >= cfg.aciertosParaPremio) { store.set('juegoGanado', { hits: S.hits }); showWin(S.hits, false); }
    else showResult(S.hits);
  }

  function showWin(hits, quiet) {
    document.getElementById('g-end').innerHTML = `<div class="prize"><span style="font-size:2.4rem">🏆</span><b>${esc(cfg.textoPremio)}</b>
      <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.8rem">
        <button class="btn btn-red" id="g-wa">Avisarle por WhatsApp 📲</button>
        <button class="btn" id="g-again">Jugar otra vez 🏀</button></div></div>`;
    if (!quiet) FX.celebrate(3200);
  }

  function showResult(hits) {
    const best = store.get('juegoBest', hits);
    document.getElementById('g-end').innerHTML = `<div class="prize"><b style="font-size:1.8rem">${hits}/${cfg.tiros}</b>
      <p class="hand" style="margin:.2rem 0 0;font-size:1.4rem">${esc(fill(cfg.textoFallo, { n: cfg.aciertosParaPremio }))}</p>
      <p style="margin:.3rem 0 0;font-size:.85rem">🏆 Mejor marca: ${best}/${cfg.tiros}</p>
      <button class="btn btn-red" id="g-again" style="margin-top:.8rem">Reintentar 🏀</button></div>`;
  }

  function updateHud() {
    const icons = Array.from({ length: cfg.tiros }, (_, i) => i < S.res.length ? (S.res[i] ? '❤️' : '🤍') : '<span class="pend">🏀</span>').join('');
    document.getElementById('g-hud').innerHTML = icons;
    document.getElementById('g-score').textContent = `Aciertos: ${S.hits}/${cfg.aciertosParaPremio}`;
  }

  function toast(text, kind) {
    const el = document.getElementById('g-toast'); if (!el) return;
    el.className = ''; void el.offsetWidth; el.textContent = text; el.className = 'show ' + kind;
  }

  /* ---------- Dibujo ---------- */
  function preview(px, py) {
    const pts = []; let x = SX, y = SY, vx = -px * K * KX, vy = -py * K;
    for (let f = 1; f <= 48; f++) { vy += G; x += vx; y += vy; if (f % 3 === 0) pts.push({ x, y }); }
    return pts;
  }

  function drawBall(x, cx, cy, r, rot) {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.clip();
    if (ballImg && ballImg.complete && ballImg.naturalWidth) x.drawImage(ballImg, -r, -r, r * 2, r * 2);
    else {
      const g = x.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
      g.addColorStop(0, '#fdba74'); g.addColorStop(1, '#ea580c');
      x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2);
      x.strokeStyle = '#431407'; x.lineWidth = Math.max(1.4, r * 0.09);
      x.beginPath(); x.moveTo(0, -r); x.lineTo(0, r); x.moveTo(-r, 0); x.lineTo(r, 0); x.stroke();
      x.beginPath(); x.arc(-r * 1.15, 0, r * 0.95, -0.9, 0.9); x.stroke();
      x.beginPath(); x.arc(r * 1.15, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9); x.stroke();
    }
    x.restore();
    x.save(); x.translate(cx, cy); x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2);
    x.strokeStyle = '#431407'; x.lineWidth = Math.max(1.4, r * 0.09); x.stroke(); x.restore();
  }

  function draw() {
    const x = ctx;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);

    // panel discontinuo (como la zona de "soltar archivos")
    rr(x, 20, 20, 320, 204, 18); x.fillStyle = '#ffffff'; x.fill();
    x.setLineDash([7, 6]); x.strokeStyle = '#cbd5e1'; x.lineWidth = 2; x.stroke(); x.setLineDash([]);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#27476e';
    x.font = '28px serif'; x.fillText('❤️', CX, 62);
    x.font = '700 19px Quicksand, sans-serif'; x.fillText(fill(cfg.textoPanel, { n: cfg.aciertosParaPremio }), CX, 88);
    x.font = '500 12px Quicksand, sans-serif'; x.fillStyle = '#94a3b8'; x.fillText(cfg.textoPanelSub, CX, 104);

    // corazones decorativos
    x.globalAlpha = 0.4; x.font = '22px serif';
    [[42, 310, '💙'], [318, 340, '❤️'], [58, 400, '❤️'], [304, 420, '💙'], [180, 330, '✨']].forEach(h => x.fillText(h[2], h[0], h[1]));
    x.globalAlpha = 1;

    // tablero
    rr(x, BOARD.x, BOARD.y + 6, BOARD.w, BOARD.h - 10, 6); x.fillStyle = '#fff'; x.fill();
    x.strokeStyle = '#f97316'; x.lineWidth = 3; x.stroke();
    x.strokeRect(CX - 20, RIMY - 46, 40, 30);
    x.beginPath(); x.moveTo(CX, RIMY - 10); x.lineTo(CX, RIMY - 2); x.stroke();

    // aro (mitad de atrás)
    x.strokeStyle = '#f97316'; x.lineWidth = 5;
    x.beginPath(); x.ellipse(CX, RIMY, RW, 9, 0, Math.PI, Math.PI * 2); x.stroke();

    // sombra y balón
    const b = S.ball;
    if (S.phase === 'aim' || S.phase === 'wait') { x.fillStyle = 'rgba(0,0,0,.10)'; x.beginPath(); x.ellipse(SX, SY + R0 + 6, R0 * 0.9, 5, 0, 0, Math.PI * 2); x.fill(); }
    if (!S.hidden) {
      if (S.drag && S.phase === 'aim') {
        const d = S.drag, bx = SX + d.px * 0.45, by = SY + d.py * 0.45;
        x.strokeStyle = 'rgba(251,113,133,.7)'; x.lineWidth = 3; x.lineCap = 'round';
        x.beginPath(); x.moveTo(SX - 40, SY - 8); x.lineTo(bx, by); x.lineTo(SX + 40, SY - 8); x.stroke();
        drawBall(x, bx, by, R0, d.px * 0.01);
      } else drawBall(x, b.x, b.y, S.phase === 'fly' ? radius(b.y) : R0, b.rot);
    }

    // aro (mitad de delante) y red
    x.strokeStyle = '#f97316'; x.lineWidth = 5;
    x.beginPath(); x.ellipse(CX, RIMY, RW, 9, 0, 0, Math.PI); x.stroke();
    const sw = S.sway * Math.sin(S.t * 0.5) * 7;
    const top = i => CX - RW + i * (2 * RW / 6), bot = i => CX - RW * 0.6 + i * (2 * RW * 0.6 / 6) + sw;
    x.strokeStyle = 'rgba(100,116,139,.85)'; x.lineWidth = 1.6;
    for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(top(i), RIMY + 5); x.lineTo(bot(i), RIMY + 64); x.stroke(); }
    [0.35, 0.7].forEach(row => {
      x.beginPath();
      for (let i = 0; i <= 6; i++) {
        const px = top(i) * (1 - row) + bot(i) * row, py = RIMY + 5 + 59 * row + (i % 2 ? 4 : -4);
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    });

    // trayectoria prevista (puntitos) y mano de ayuda
    if (S.drag && S.phase === 'aim' && S.drag.py > 0 && Math.hypot(S.drag.px, S.drag.py) >= MINP) {
      preview(S.drag.px, S.drag.py).forEach((p, i, a) => {
        x.globalAlpha = 0.95 - (i / a.length) * 0.6;
        x.fillStyle = i % 2 ? '#7dd3fc' : '#fb7185';
        x.beginPath(); x.arc(p.x, p.y, Math.max(2, 4.5 - i * 0.14), 0, Math.PI * 2); x.fill();
      });
      x.globalAlpha = 1;
    } else if (S.shots === 0 && !S.drag && S.phase === 'aim') {
      x.font = '30px serif'; x.globalAlpha = 0.9;
      x.fillText('👇', SX + 56, SY + 12 + Math.sin(S.t * 0.12) * 8);
      x.globalAlpha = 1;
    }
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (!cv || !cv.offsetParent) { last = t; return; }
    acc += Math.min(50, t - last); last = t;
    while (acc >= 16.667) { step(); acc -= 16.667; }
    draw();
  }
})();
