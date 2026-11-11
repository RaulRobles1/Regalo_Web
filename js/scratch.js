/* Rasca y gana: boleto sobrio con lámina plateada mate. Hay que rascar casi toda la zona para descubrirlo. */
const SCRATCH_REVEAL = 0.82;      // fracción de la lámina que hay que rascar (0.82 = 82 %). Súbelo para hacerlo más difícil.

function renderScratch() {
  const c = CONFIG.rascaYGana, box = $('#scratch'); if (!box) return;
  $('#scratch-title').textContent = c.titulo;
  const d = String(CONFIG.pareja.fechaInicio || '');
  const serial = /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(8, 10) + d.slice(5, 7) + d.slice(2, 4) : '140223';
  const msg = String(c.mensajeOculto || '');
  box.innerHTML = `
    <div class="tk">
      <div class="tk-head"><span class="tk-logo">RASCA Y GANA</span><span class="tk-no">N.º ${esc(serial)}</span></div>
      <div class="tk-edition">EDICIÓN ANIVERSARIO</div>
      <div class="tk-area" id="scratch-frame">
        <div class="tk-prize" id="tk-prize">
          <div class="tk-label">PREMIO</div>
          <p class="tk-msg" style="font-size:${msg.length > 130 ? '1.05rem' : msg.length > 95 ? '1.2rem' : '1.4rem'}">${esc(msg)}</p>
        </div>
        <canvas id="scratch-canvas" aria-label="Zona para rascar"></canvas>
        <canvas id="flake-canvas" aria-hidden="true"></canvas>
      </div>
      <p class="tk-hint" id="tk-hint">${esc(c.textoPista || 'Rasque la zona plateada')}</p>
      <div class="tk-after" id="tk-after" hidden>
        <button class="tk-btn" id="tk-wa" type="button">${esc(c.textoBoton || 'Avisar por WhatsApp')}</button>
        <button class="tk-link" id="tk-again" type="button">Rascar otra vez</button>
      </div>
      <div class="tk-foot"><div class="tk-barcode" aria-hidden="true"></div><span class="tk-code">${esc(serial)} 0031 7 4421</span></div>
    </div>`;
  $('#tk-wa').addEventListener('click', () => openWA(c.mensajeWhatsApp || 'Hola, ya he rascado el boleto.'));
  $('#tk-again').addEventListener('click', () => renderScratch());
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => initScratch(c));
}

/* ---------- estado final: premio visible ---------- */
function showPrize() {
  const cv = $('#scratch-canvas'), fr = $('#scratch-frame'); if (!cv || !fr) return;
  fr.classList.add('done'); cv.classList.add('gone'); $('#tk-prize').classList.add('on');
  $('#tk-after').hidden = false; $('#tk-hint').textContent = 'Boleto premiado';
  try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* sin vibración */ }
}

function initScratch(cfg) {
  const cv = $('#scratch-canvas'), fc = $('#flake-canvas'), fr = $('#scratch-frame'); if (!cv || !fc || !fr) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = fr.clientWidth || 300, h = fr.clientHeight || 200;
  [cv, fc].forEach(k => { k.width = w * dpr; k.height = h * dpr; });
  const ctx = cv.getContext('2d'), fx = fc.getContext('2d');
  ctx.scale(dpr, dpr); fx.scale(dpr, dpr);
  paintFoil(ctx, w, h, cfg.textoCapa || 'RASCA AQUÍ');

  /* --- virutas grises de látex --- */
  const flakes = []; let raf = 0;
  const PAL = ['#c3c6cb', '#d9dce0', '#a9adb3', '#eceef0', '#b4b8be'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(x, y, n, power) {
    for (let i = 0; i < n; i++) flakes.push({ x, y, vx: rnd(-1.6, 1.6) * power, vy: rnd(-2.2, -0.3) * power, g: 0.2, life: rnd(18, 38), s: rnd(1, 2.6), c: PAL[(Math.random() * PAL.length) | 0], r: rnd(0, 6), vr: rnd(-0.3, 0.3) });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    fx.clearRect(0, 0, w, h);
    for (let i = flakes.length - 1; i >= 0; i--) {
      const p = flakes[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      if (p.life <= 0) { flakes.splice(i, 1); continue; }
      fx.save(); fx.globalAlpha = Math.min(1, p.life / 14); fx.translate(p.x, p.y); fx.rotate(p.r); fx.fillStyle = p.c;
      fx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); fx.restore();
    }
    raf = flakes.length ? requestAnimationFrame(tick) : 0;
    if (!flakes.length) fx.clearRect(0, 0, w, h);
  }

  /* --- rascado: pincel pequeño (como el canto de una moneda) --- */
  let drawing = false, lx = 0, ly = 0, done = false, lastCheck = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
  function dab(x, y) {
    const r = 15, g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function stroke(x0, y0, x1, y1) {
    ctx.globalCompositeOperation = 'destination-out';
    const dist = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(dist / 4));
    for (let i = 1; i <= steps; i++) dab(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps);
    ctx.globalCompositeOperation = 'source-over';
  }
  function cleared() {
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let c = 0, t = 0;
    for (let i = 3; i < d.length; i += 24) { t++; if (d[i] < 40) c++; }
    return c / t;
  }
  function finish() { if (done) return; done = true; showPrize(); }
  function check() { const f = cleared(); window.__scratchCleared = f; if (f >= SCRATCH_REVEAL) finish(); }
  function move(e) {
    if (!drawing || done) return;
    const [x, y] = pos(e);
    stroke(lx, ly, x, y); spawn(x, y, 1, 1); lx = x; ly = y;
    const now = performance.now();
    if (now - lastCheck > 180) { lastCheck = now; check(); }
  }
  cv.addEventListener('pointerdown', e => { if (done) return; drawing = true; [lx, ly] = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); stroke(lx, ly, lx, ly); spawn(lx, ly, 3, 1); });
  cv.addEventListener('pointermove', move);
  const up = () => { drawing = false; if (!done) check(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}

/* ---------- lámina plateada mate (látex gris con grano) ---------- */
function paintFoil(x, w, h, label) {
  // base gris plata
  let g = x.createLinearGradient(0, 0, w, h);
  [[0, '#a9aeb4'], [0.3, '#cfd2d6'], [0.55, '#b3b7bd'], [0.8, '#c9ccd0'], [1, '#a4a9af']].forEach(s => g.addColorStop(s[0], s[1]));
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // grano fino
  const nz = document.createElement('canvas'); nz.width = nz.height = 128;
  const nx = nz.getContext('2d'), id = nx.createImageData(128, 128);
  for (let i = 0; i < id.data.length; i += 4) { const v = 90 + Math.random() * 150; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  nx.putImageData(id, 0, 0);
  x.save(); x.globalAlpha = 0.28; x.fillStyle = x.createPattern(nz, 'repeat'); x.fillRect(0, 0, w, h); x.restore();
  // micro-líneas horizontales de impresión
  x.fillStyle = 'rgba(255,255,255,.07)'; for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1);
  // brillo suave en diagonal
  g = x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // recuadro punteado impreso
  x.save(); x.setLineDash([5, 4]); x.strokeStyle = 'rgba(70,76,84,.55)'; x.lineWidth = 1.2; x.strokeRect(10.5, 10.5, w - 21, h - 21); x.restore();
  // texto grabado
  x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = "800 28px Quicksand, Arial, sans-serif";
  try { x.letterSpacing = '6px'; } catch (e) { /* navegador sin letterSpacing */ }
  x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText(label, w / 2 + 1.2, h / 2 + 1.6, w - 40);
  x.fillStyle = 'rgba(62,68,76,.85)'; x.fillText(label, w / 2, h / 2, w - 40);
  x.restore();
  // borde
  x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.moveTo(1, h - 1); x.lineTo(1, 1); x.lineTo(w - 1, 1); x.stroke();
  x.strokeStyle = 'rgba(40,46,54,.35)'; x.beginPath(); x.moveTo(w - 1, 1); x.lineTo(w - 1, h - 1); x.lineTo(1, h - 1); x.stroke();
}
