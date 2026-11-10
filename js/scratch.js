/* Rasca y gana con <canvas> */
function renderScratch() {
  const c = CONFIG.rascaYGana;
  $('#scratch-title').textContent = c.titulo;
  $('#scratch').innerHTML = `
    <div class="scratch-wrap glass">
      <div class="scratch-frame" id="scratch-frame">
        <div class="scratch-msg"><span>🎁</span><p class="hand">${esc(c.mensajeOculto)}</p></div>
        <canvas id="scratch-canvas" aria-label="Zona para rascar"></canvas>
      </div>
    </div>`;
  if (store.get('scratched', false)) { $('#scratch-canvas').classList.add('gone'); return; }
  const start = () => initScratch(c.textoCapa);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
}

function initScratch(label) {
  const cv = $('#scratch-canvas'); if (!cv) return;
  const frame = $('#scratch-frame'), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = frame.clientWidth || 300, h = frame.clientHeight || 200;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  // capa azul cielo metalizada con purpurina
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#7dd3fc'); g.addColorStop(.3, '#e0f2fe'); g.addColorStop(.55, '#7dd3fc'); g.addColorStop(.8, '#bae6fd'); g.addColorStop(1, '#38bdf8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * .8})`;
    const s = Math.random() * 2.4 + .4;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  ctx.fillStyle = '#0369a1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = "700 28px 'Caveat', cursive";
  ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 6;
  ctx.fillText(label, w / 2, h / 2, w - 24);
  ctx.shadowBlur = 0;

  let drawing = false, lastX = 0, lastY = 0, done = false, lastCheck = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const cleared = () => {
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let c = 0, t = 0;
    for (let i = 3; i < d.length; i += 16) { t++; if (d[i] < 40) c++; }
    return c / t;
  };
  const finish = () => {
    if (done) return; done = true;
    cv.classList.add('gone'); store.set('scratched', true);
    const r = frame.getBoundingClientRect();
    FX.burst({ particleCount: 110, spread: 100, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } });
  };
  const scratch = e => {
    if (!drawing || done) return;
    const [x, y] = pos(e);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 38; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke();
    lastX = x; lastY = y;
    const now = performance.now();
    if (now - lastCheck > 200) { lastCheck = now; if (cleared() > .55) finish(); }
  };
  cv.addEventListener('pointerdown', e => { drawing = true; [lastX, lastY] = pos(e); cv.setPointerCapture(e.pointerId); scratch(e); });
  cv.addEventListener('pointermove', scratch);
  const up = () => { drawing = false; if (!done && cleared() > .55) finish(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
