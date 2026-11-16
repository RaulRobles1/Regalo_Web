/* Bote de razones por las que te quiero */
let _lastRazon = -1;

function renderJar() {
  const box = $('#jar'); if (!box || !CONFIG.razones || !CONFIG.razones.length) return;
  box.innerHTML = `<div class="glass jar-card">
    <div class="jar-lid"></div>
    <div class="jar-glass">
      <span class="jh h1">❤️</span><span class="jh h2">💙</span><span class="jh h3">❤️</span>
      <span class="jh h4">💙</span><span class="jh h5">❤️</span><span class="jh h6">🤍</span>
    </div>
    <button class="btn btn-red" id="jar-btn" style="margin-top:1.1rem">Sácame una razón ❤️</button>
    <div class="slip" id="jar-slip" hidden></div>
  </div>`;
  $('#jar-btn').addEventListener('click', e => {
    const list = CONFIG.razones; let i;
    do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === _lastRazon);
    _lastRazon = i; if (!store.get('razonVista', false)) store.set('razonVista', true);
    const slip = $('#jar-slip');
    slip.hidden = false;
    slip.style.animation = 'none'; void slip.offsetWidth; slip.style.animation = '';
    slip.innerHTML = `<p class="hand" style="margin:0;font-size:1.2rem">Razón nº ${i + 1}</p><p class="slip-text">${esc(list[i])}</p>`;
    burstAt(e.currentTarget, { particleCount: 45 });
  });
}

function burstAt(el, opts) {
  const r = el.getBoundingClientRect();
  FX.burst(Object.assign({ particleCount: 70, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } }, opts));
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
