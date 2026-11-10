/* Regalos: ruleta de premios, botón del amor (WhatsApp) y talonario de vales */
const VALE_ICONS = { heart: '❤️', plane: '✈️', sparkles: '✨', gift: '🎁', cake: '🍰', movie: '🍿' };

function renderVales() {
  if (!$('#vales')) return;
  const used = new Set(store.get('valesUsados', []));
  $('#vales').innerHTML = CONFIG.vales.map((v, i) => `
    <div class="ticket-wrap reveal" style="--d:${i * 80}ms">
      <article class="ticket t${i % 3} ${used.has(v.id) ? 'used' : ''}" data-id="${esc(v.id)}">
        <div class="ticket-main">
          <span class="stars">✦ ✧ ✦</span>
          <div class="ic">${VALE_ICONS[v.icono] || '❤️'}</div>
          <h3>${esc(v.titulo)}</h3>
          <p>${esc(v.descripcion)}</p>
          <div class="stamp">Válido por amor infinito</div>
        </div>
        <div class="ticket-stub">
          <button class="btn btn-red" type="button" ${used.has(v.id) ? 'disabled' : ''}>${used.has(v.id) ? 'Canjeado ❤️' : 'Canjear vale ❤️'}</button>
        </div>
        <div class="ticket-used"><span>CANJEADO</span></div>
      </article>
    </div>`).join('');
  renderWheel();
  renderQuick();
  observeReveals();
}

function burstAt(el, opts) {
  const r = el.getBoundingClientRect();
  FX.burst(Object.assign({ particleCount: 70, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } }, opts));
}

/* ---------- Vales ---------- */
if ($('#vales')) $('#vales').addEventListener('click', e => {
  const btn = e.target.closest('.btn'); if (!btn || btn.disabled) return;
  const card = btn.closest('.ticket');
  const v = CONFIG.vales.find(x => x.id === card.dataset.id); if (!v) return;
  burstAt(btn);
  const used = new Set(store.get('valesUsados', [])); used.add(v.id); store.set('valesUsados', [...used]);
  openWA(`¡Hola mi amor! 💙 Acabo de canjear mi vale de nuestro 3er aniversario por: ${v.titulo} ✨ ¡Te quiero!`);
  card.classList.add('used');
  btn.disabled = true; btn.textContent = 'Canjeado ❤️';
});

/* ---------- Ruleta de premios ---------- */
let _rot = 0, _spinning = false;

function drawWheel() {
  const cv = $('#wheel'); if (!cv) return;
  const P = CONFIG.ruleta.premios, n = P.length, S = 280, d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = cv.height = S * d; cv.style.width = cv.style.height = S + 'px';
  const x = cv.getContext('2d'); x.scale(d, d);
  const a = 2 * Math.PI / n, c = S / 2, R = S / 2 - 4;
  const blues = ['#bae6fd', '#7dd3fc'], reds = ['#fecdd3', '#fda4af'];
  for (let i = 0; i < n; i++) {
    x.beginPath(); x.moveTo(c, c);
    x.arc(c, c, R, i * a - Math.PI / 2, (i + 1) * a - Math.PI / 2); x.closePath();
    x.fillStyle = i % 2 ? reds[(i >> 1) % 2] : blues[(i >> 1) % 2];
    x.fill(); x.lineWidth = 3; x.strokeStyle = '#fff'; x.stroke();
    x.save(); x.translate(c, c); x.rotate((i + 0.5) * a);
    x.font = '30px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(P[i].emoji, 0, -R * 0.68);
    x.restore();
  }
}

function renderWheel() {
  const box = $('#wheel-box'); if (!box || !CONFIG.ruleta) return;
  const c = CONFIG.ruleta;
  box.innerHTML = `<div class="glass wheel-card">
    <h3>${esc(c.titulo)}</h3><p class="hand">${esc(c.subtitulo)}</p>
    <div class="wheel-wrap"><div class="wheel-pointer"></div><canvas id="wheel" aria-label="Ruleta de premios"></canvas><button class="wheel-hub" id="spin-hub" aria-label="Girar">❤️</button></div>
    <button class="btn btn-red" id="spin-btn">${esc(c.boton)}</button>
    <div id="wheel-result"></div>
  </div>`;
  drawWheel();
  const today = new Date().toDateString();
  const last = store.get('ruletaPremio', null);
  if (c.unaVezAlDia && last && last.dia === today) { showPrize(last.idx, true); $('#spin-btn').disabled = true; $('#spin-btn').textContent = 'Vuelve mañana 💙'; }
  $('#spin-btn').addEventListener('click', spin);
  $('#spin-hub').addEventListener('click', spin);
}

function spin() {
  const c = CONFIG.ruleta, btn = $('#spin-btn');
  if (_spinning || btn.disabled) return;
  _spinning = true; btn.disabled = true; $('#wheel-result').innerHTML = '';
  const n = c.premios.length, a = 360 / n, idx = Math.floor(Math.random() * n);
  const jitter = (Math.random() - 0.5) * a * 0.7;
  const cur = ((_rot % 360) + 360) % 360;
  const target = (360 - (idx + 0.5) * a + jitter + 720) % 360;
  _rot += 360 * 6 + ((target - cur) + 360) % 360;
  const cv = $('#wheel');
  cv.style.transition = 'transform 4.6s cubic-bezier(.12,.7,.1,1)';
  cv.style.transform = `rotate(${_rot}deg)`;
  setTimeout(() => {
    _spinning = false;
    store.set('ruletaPremio', { dia: new Date().toDateString(), idx });
    showPrize(idx, false);
    if (c.unaVezAlDia) { btn.textContent = 'Vuelve mañana 💙'; } else { btn.disabled = false; btn.textContent = 'Girar otra vez ❤️'; }
  }, 4700);
}

function showPrize(idx, quiet) {
  const p = CONFIG.ruleta.premios[idx];
  $('#wheel-result').innerHTML = `<div class="prize"><span style="font-size:2.2rem">${p.emoji}</span><b>${esc(p.texto)}</b>
    <button class="btn btn-red" id="claim-btn" style="margin-top:.7rem">Reclamar por WhatsApp 📲</button></div>`;
  $('#claim-btn').addEventListener('click', e => {
    burstAt(e.currentTarget);
    openWA(fill(CONFIG.ruleta.mensajeWhatsApp, { premio: p.texto }));
  });
  if (!quiet) FX.celebrate(1800);
}

/* ---------- Botón del amor: mensajes rápidos por WhatsApp ---------- */
function renderQuick() {
  const box = $('#quick-box'); if (!box || !CONFIG.mensajesRapidos) return;
  const q = CONFIG.mensajesRapidos;
  box.innerHTML = `<div class="glass quick-card">
    <h3>${esc(q.titulo)}</h3><p class="hand">${esc(q.subtitulo)}</p>
    <div class="quick-grid">${q.botones.map((b, i) => `<button class="quick-btn" data-i="${i}"><span>${b.emoji}</span>${esc(b.label)}</button>`).join('')}</div>
    <textarea class="field" id="quick-text" rows="3" placeholder="${esc(q.placeholder)}"></textarea>
    <button class="btn btn-red" id="quick-send" style="width:100%;margin-top:.7rem">Enviar por WhatsApp 📲</button>
  </div>`;
  box.addEventListener('click', e => {
    const b = e.target.closest('.quick-btn');
    if (b) { burstAt(b, { particleCount: 40 }); openWA(q.botones[+b.dataset.i].msg); return; }
    if (e.target.closest('#quick-send')) {
      const t = $('#quick-text'), v = t.value.trim();
      if (!v) { t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); t.focus(); return; }
      burstAt(e.target.closest('#quick-send'), { particleCount: 50 });
      openWA('¡Hola mi amor! 💙 ' + v);
      t.value = '';
    }
  });
}
