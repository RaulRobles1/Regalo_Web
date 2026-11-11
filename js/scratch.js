/* Rasca y gana: boleto con lámina holográfica en relieve, escamas al rascar, progreso y premio animado */
function renderScratch() {
  const c = CONFIG.rascaYGana, box = $('#scratch'); if (!box) return;
  $('#scratch-title').textContent = c.titulo;
  const d = String(CONFIG.pareja.fechaInicio || '');
  const serial = /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(8, 10) + d.slice(5, 7) + d.slice(2, 4) : '140223';
  box.innerHTML = `
    <div class="tk">
      <div class="tk-head"><span class="tk-logo">🎟️ RASCA Y GANA</span><span class="tk-no">Nº ${esc(serial)}</span></div>
      <div class="tk-sub">❤️ boleto premiado · 100 % de acierto ❤️</div>
      <div class="tk-area" id="scratch-frame">
        <div class="tk-prize" id="tk-prize">
          <div class="tk-rays"></div>
          <div class="tk-gift">🎁</div>
          <p class="tk-msg hand" style="font-size:${String(c.mensajeOculto || '').length > 130 ? '1.25rem' : String(c.mensajeOculto || '').length > 95 ? '1.45rem' : '1.65rem'}">${esc(c.mensajeOculto)}</p>
        </div>
        <canvas id="scratch-canvas" aria-label="Zona para rascar"></canvas>
        <canvas id="flake-canvas" aria-hidden="true"></canvas>
        <div class="tk-shine"></div>
      </div>
      <div class="tk-meter"><i id="tk-bar"></i></div>
      <p class="tk-hint hand" id="tk-hint">${esc(c.textoPista || 'Rasca con el dedo ✨')}</p>
      <div class="tk-after" id="tk-after" hidden><button class="btn btn-red" id="tk-wa" type="button">${esc(c.textoBoton || 'Contarle que ya la vi 📲')}</button> <button class="btn" id="tk-again" type="button">Rascar otra vez 🔄</button></div>
    </div>`;
  $('#tk-wa').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    FX.burst({ particleCount: 50, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } });
    openWA(c.mensajeWhatsApp || '¡Hola mi amor! ❤️ Acabo de rascar mi sorpresa y ya sé lo que me espera 😍💙');
  });
  $('#tk-again').addEventListener('click', () => renderScratch());
  const start = () => initScratch(c);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
}

/* ---------- estado final: premio visible ---------- */
function showPrize(quiet) {
  const cv = $('#scratch-canvas'), fr = $('#scratch-frame'); if (!cv || !fr) return;
  fr.classList.add('done'); cv.classList.add('gone'); $('#tk-prize').classList.add('on');
  $('#tk-bar').style.width = '100%'; $('#tk-after').hidden = false;
  $('#tk-hint').textContent = '¡Sorpresa descubierta! 🎉';
  if (!quiet) { try { navigator.vibrate && navigator.vibrate([30, 50, 30]); } catch (e) { /* sin vibración */ } }
}

function initScratch(cfg) {
  const cv = $('#scratch-canvas'), fc = $('#flake-canvas'), fr = $('#scratch-frame'); if (!cv || !fc || !fr) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = fr.clientWidth || 300, h = fr.clientHeight || 210;
  [cv, fc].forEach(k => { k.width = w * dpr; k.height = h * dpr; });
  const ctx = cv.getContext('2d'), fx = fc.getContext('2d');
  ctx.scale(dpr, dpr); fx.scale(dpr, dpr);
  paintFoil(ctx, w, h, cfg.textoCapa || '✨ Rasca aquí ✨');

  /* --- escamas plateadas que saltan al rascar --- */
  const flakes = []; let raf = 0;
  const PAL = ['#e0f2fe', '#bae6fd', '#ffffff', '#fbcfe8', '#93c5fd', '#fecdd3'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(x, y, n, power) {
    for (let i = 0; i < n; i++) flakes.push({ x, y, vx: rnd(-2, 2) * power, vy: rnd(-3.2, -0.6) * power, g: 0.22, life: rnd(26, 52), max: 52, s: rnd(1.6, 3.8), c: PAL[(Math.random() * PAL.length) | 0], r: rnd(0, 6), vr: rnd(-0.3, 0.3) });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    fx.clearRect(0, 0, w, h);
    for (let i = flakes.length - 1; i >= 0; i--) {
      const p = flakes[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      if (p.life <= 0) { flakes.splice(i, 1); continue; }
      fx.save(); fx.globalAlpha = Math.min(1, p.life / 20); fx.translate(p.x, p.y); fx.rotate(p.r); fx.fillStyle = p.c;
      fx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); fx.restore();
    }
    raf = flakes.length ? requestAnimationFrame(tick) : 0;
    if (!flakes.length) fx.clearRect(0, 0, w, h);
  }

  /* --- rascado con pincel suave --- */
  let drawing = false, lx = 0, ly = 0, done = false, lastCheck = 0, msgStage = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
  function dab(x, y) {
    const r = 25, g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function stroke(x0, y0, x1, y1) {
    ctx.globalCompositeOperation = 'destination-out';
    const dist = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(dist / 6));
    for (let i = 1; i <= steps; i++) dab(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps);
    ctx.globalCompositeOperation = 'source-over';
  }
  function cleared() {
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let c = 0, t = 0;
    for (let i = 3; i < d.length; i += 24) { t++; if (d[i] < 40) c++; }
    return c / t;
  }
  function progress(f) {
    const pct = Math.min(1, f / 0.55);
    $('#tk-bar').style.width = Math.round(pct * 100) + '%';
    const hint = $('#tk-hint');
    if (pct > 0.8 && msgStage < 3) { msgStage = 3; hint.textContent = '¡Casi lo tienes! 👀'; }
    else if (pct > 0.45 && msgStage < 2) { msgStage = 2; hint.textContent = '¡Sigue, sigue… ❤️'; }
    else if (pct > 0.1 && msgStage < 1) { msgStage = 1; hint.textContent = '¡Vas bien! ✨'; }
  }
  function finish() {
    if (done) return; done = true;
    const m = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    for (let i = 0; i < 90; i++) { const x = rnd(0, w), y = rnd(0, h); if (m[(((y * dpr) | 0) * cv.width + ((x * dpr) | 0)) * 4 + 3] > 80) spawn(x, y, 1, 2.2); }
    showPrize(false);
    const r = fr.getBoundingClientRect();
    FX.celebrate(1800);
    FX.burst({ particleCount: 90, spread: 100, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } });
  }
  function move(e) {
    if (!drawing || done) return;
    const [x, y] = pos(e);
    stroke(lx, ly, x, y); spawn(x, y, 2, 1); lx = x; ly = y;
    const now = performance.now();
    if (now - lastCheck > 140) { lastCheck = now; const f = cleared(); progress(f); if (f > 0.55) finish(); }
  }
  cv.addEventListener('pointerdown', e => { if (done) return; drawing = true; [lx, ly] = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); stroke(lx, ly, lx, ly); spawn(lx, ly, 4, 1); });
  cv.addEventListener('pointermove', move);
  const up = () => { drawing = false; if (!done) { const f = cleared(); progress(f); if (f > 0.55) finish(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}

/* ---------- lámina holográfica con relieve de corazones ---------- */
function paintFoil(x, w, h, label) {
  const heart = (cx, cy, s) => {
    x.beginPath(); x.moveTo(cx, cy + s * 0.9);
    x.bezierCurveTo(cx - s * 1.4, cy - s * 0.1, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.35);
    x.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.4, cy - s * 0.1, cx, cy + s * 0.9); x.closePath();
  };
  // metal azul plata
  let g = x.createLinearGradient(0, 0, w, h);
  [[0, '#7fc6f3'], [0.22, '#e9f7ff'], [0.45, '#8fd0f8'], [0.7, '#dcefff'], [1, '#6fb9ec']].forEach(s => g.addColorStop(s[0], s[1]));
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // bandas holográficas rosa y azul
  x.save(); x.translate(w / 2, h / 2); x.rotate(-0.5);
  for (let i = -w; i < w; i += 34) {
    const b = x.createLinearGradient(i, 0, i + 34, 0);
    b.addColorStop(0, 'rgba(251,113,133,0)'); b.addColorStop(0.5, i % 68 ? 'rgba(251,113,133,.22)' : 'rgba(56,189,248,.25)'); b.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = b; x.fillRect(i, -h * 1.5, 34, h * 3);
  }
  x.restore();
  // corazones en relieve (sombra oscura + luz)
  for (let yy = 14, row = 0; yy < h + 16; yy += 26, row++) {
    for (let xx = (row % 2 ? 13 : 0) + 6; xx < w + 16; xx += 26) {
      x.fillStyle = 'rgba(30,64,175,.20)'; heart(xx + 1.1, yy + 1.1, 6); x.fill();
      x.fillStyle = 'rgba(255,255,255,.62)'; heart(xx - 0.5, yy - 0.5, 6); x.fill();
    }
  }
  // purpurina
  for (let i = 0; i < 380; i++) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.9) + ')'; const s = Math.random() * 2.2 + 0.4; x.fillRect(Math.random() * w, Math.random() * h, s, s); }
  // cartel central en relieve
  x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
  const bw = Math.min(w - 40, 270), bh = 64;
  x.fillStyle = 'rgba(255,255,255,.72)'; x.strokeStyle = 'rgba(225,29,72,.55)'; x.lineWidth = 2;
  x.beginPath(); x.roundRect ? x.roundRect(w / 2 - bw / 2, h / 2 - bh / 2, bw, bh, 18) : x.rect(w / 2 - bw / 2, h / 2 - bh / 2, bw, bh); x.fill(); x.stroke();
  x.font = "700 30px Caveat, cursive";
  x.fillStyle = 'rgba(30,64,175,.35)'; x.fillText(label, w / 2 + 1.5, h / 2 + 2, bw - 20);
  x.fillStyle = '#be123c'; x.fillText(label, w / 2, h / 2, bw - 20);
  x.restore();
  // borde biselado
  x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.moveTo(2, h - 2); x.lineTo(2, 2); x.lineTo(w - 2, 2); x.stroke();
  x.strokeStyle = 'rgba(30,64,175,.35)'; x.beginPath(); x.moveTo(w - 2, 2); x.lineTo(w - 2, h - 2); x.lineTo(2, h - 2); x.stroke();
}
