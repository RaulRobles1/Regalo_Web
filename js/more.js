/* Inicio: nota del día, recorrido del regalo y números · Cartas: «Abre cuando…» */

/* ---------- Nota del día ---------- */
function renderDaily() {
  const box = $('#daily'), list = CONFIG.notasDelDia || []; if (!box || !list.length) return;
  const now = new Date(), day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  const fecha = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  box.innerHTML = `<article class="daily">
    <span class="daily-pin" aria-hidden="true"></span>
    <p class="daily-date">${esc(fecha)}</p>
    <p class="daily-text hand">${esc(list[day % list.length])}</p>
    <p class="daily-foot">Nota de hoy · mañana hay otra</p>
  </article>`;
}

/* ---------- Recorrido del regalo ---------- */
function journeySteps() {
  const u = new Set(store.get('unlocked', []));
  const locked = CONFIG.recuerdosTimeline.filter(r => r.bloqueado && r.preguntaDesbloqueo);
  const secret = store.get('secretOpen', false);
  const steps = [];
  if (locked.length) steps.push({ tab: 'historia', txt: 'Desbloquea los recuerdos secretos', done: locked.every(r => u.has(r.id)) });
  if ((CONFIG.abreCuando || []).length) steps.push({ tab: 'cartas', txt: 'Abre una carta', done: store.get('cartasLeidas', []).length > 0 });
  if ((CONFIG.razones || []).length) steps.push({ tab: 'cartas', txt: 'Saca una razón del bote', done: store.get('razonVista', false) });
  if (CONFIG.quiz) steps.push({ tab: 'vales', go: 'sec-quiz', txt: 'Completa el quiz', done: store.get('quizBest', null) != null });
  if (CONFIG.ruleta) steps.push({ tab: 'vales', go: 'sec-ruleta', txt: 'Gira la ruleta', done: !!store.get('ruletaPremio', null) });
  steps.push({ tab: 'vales', go: 'sec-rasca', txt: 'Rasca el boleto', done: store.get('rascaVisto', false) });
  steps.push({ tab: 'secret', txt: 'Descubre el secreto', done: secret });
  if (CONFIG.juego) steps.push({ tab: 'secret', txt: secret ? 'Gana el reto de la canasta' : 'Un reto oculto…', done: !!store.get('juegoGanado', null) });
  return steps;
}

function renderJourney() {
  const box = $('#journey'); if (!box) return;
  const steps = journeySteps(), n = steps.filter(s => s.done).length, all = n === steps.length, C = 2 * Math.PI * 34;
  box.innerHTML = `<div class="glass journey">
    <div class="jr-top">
      <svg class="jr-ring" viewBox="0 0 80 80" aria-hidden="true">
        <defs><linearGradient id="jrg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#e11d48"/></linearGradient></defs>
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(125,211,252,.35)" stroke-width="8"/>
        <circle cx="40" cy="40" r="34" fill="none" stroke="url(#jrg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - n / steps.length)}" transform="rotate(-90 40 40)"/>
        <text x="40" y="46" text-anchor="middle" class="jr-num">${n}/${steps.length}</text>
      </svg>
      <div><b class="jr-title">${all ? '¡Todo descubierto!' : 'Sorpresas descubiertas'}</b>
      <p class="jr-sub">${all ? 'Ya puedes abrir la sorpresa final.' : 'Complétalas todas para abrir la sorpresa final.'}</p></div>
    </div>
    <ul class="jr-list">${steps.map((s, i) => `<li><button class="jr-step ${s.done ? 'done' : ''}" data-i="${i}"><span class="jr-check">${s.done ? '✓' : ''}</span><span class="jr-txt">${esc(s.txt)}</span><span class="jr-go">›</span></button></li>`).join('')}</ul>
    <button class="jr-final ${all ? 'open' : ''}" id="jr-final" ${all ? '' : 'disabled'}>
      <span class="jr-final-ic">${all ? '🎁' : '🔒'}</span>
      <span><b>Sorpresa final</b><small>${all ? 'Toca para abrirla' : `Te faltan ${steps.length - n}`}</small></span>
    </button>
  </div>`;
  box.querySelectorAll('.jr-step').forEach(b => b.addEventListener('click', () => {
    const s = steps[+b.dataset.i]; showTab(s.tab);
    if (s.go) setTimeout(() => { const t = document.getElementById(s.go); if (t) t.scrollIntoView({ block: 'start' }); }, 80);
  }));
  $('#jr-final').addEventListener('click', openFinal);
}

function openFinal() {
  const f = CONFIG.final || {}, first = !store.get('finalVisto', false);
  openModal(`<div class="letter-paper final">
    <p class="lp-kicker">Sorpresa final</p>
    <h3>${esc(f.titulo || '')}</h3>
    <div class="lp-body">${esc(f.mensaje || '')}</div>
    <p class="hand lp-sign">${esc(CONFIG.pareja.nombreEl)}</p>
    <button class="btn btn-red" id="final-wa" style="margin-top:1rem">${esc(f.boton || 'Avisarle')} 📲</button>
  </div>`);
  $('#final-wa').addEventListener('click', () => openWA(f.mensajeWhatsApp || 'He completado todo el regalo ❤️'));
  FX.celebrate(first ? 4000 : 1500);
  if (first) store.set('finalVisto', true);
}

/* ---------- Nosotros en números ---------- */
function renderNumbers() {
  const box = $('#numbers'); if (!box) return;
  const start = new Date(CONFIG.pareja.fechaInicio), ms = Date.now() - start, days = Math.max(0, Math.floor(ms / 86400000));
  const items = [
    { valor: days, texto: 'días juntos' },
    { valor: Math.floor(days / 7), texto: 'fines de semana' },
    { valor: days * 24, texto: 'horas a tu lado' }
  ].concat(CONFIG.numeros || []);
  box.innerHTML = items.map((it, i) => `<div class="num-card n${i % 2}"><b class="num-val" data-v="${esc(it.valor)}">${typeof it.valor === 'number' ? '0' : esc(it.valor)}</b><span>${esc(it.texto)}</span></div>`).join('');
  const run = () => box.querySelectorAll('.num-val').forEach(el => {
    const target = Number(el.dataset.v); if (!isFinite(target) || el.dataset.done) return; el.dataset.done = 1;
    const t0 = performance.now(), dur = 1400;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e).toLocaleString('es-ES');
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  });
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { run(); io.disconnect(); } }, { threshold: 0.3 }); io.observe(box); } else run();
}

/* ---------- Cartas «Abre cuando…» ---------- */
function renderLetters() {
  const box = $('#letters'), list = CONFIG.abreCuando || []; if (!box) return;
  const read = new Set(store.get('cartasLeidas', []));
  box.innerHTML = list.map((c, i) => `<button class="env ${read.has(c.id) ? 'read' : ''} reveal" data-id="${esc(c.id)}" style="--d:${i * 50}ms">
      <span class="env-flap2" aria-hidden="true"></span>
      <span class="env-emoji">${esc(c.emoji || '💌')}</span>
      <span class="env-k">Abre cuando</span>
      <span class="env-t">${esc(c.titulo)}</span>
      <span class="env-state">${read.has(c.id) ? 'Leída' : 'Sin abrir'}</span>
    </button>`).join('');
  observeReveals();
}

function openLetter(c) {
  openModal(`<div class="letter-paper">
    <p class="lp-kicker">Abre cuando ${esc(c.titulo)}</p>
    <div class="lp-emoji">${esc(c.emoji || '💌')}</div>
    <div class="lp-body">${esc(c.texto)}</div>
    <p class="hand lp-sign">${esc(CONFIG.pareja.nombreEl)}</p>
  </div>`);
  const read = new Set(store.get('cartasLeidas', []));
  if (!read.has(c.id)) { read.add(c.id); store.set('cartasLeidas', [...read]); renderLetters(); $$('#letters .reveal').forEach(e => e.classList.add('in')); }
}

function renderMore() {
  renderDaily(); renderJourney(); renderNumbers(); renderLetters();
  const lb = $('#letters');
  if (lb) lb.addEventListener('click', e => {
    const b = e.target.closest('.env'); if (!b) return;
    const c = (CONFIG.abreCuando || []).find(x => x.id === b.dataset.id); if (c) openLetter(c);
  });
  document.addEventListener('regalo:cambio', e => { if (e.detail !== 'theme') renderJourney(); });
}
