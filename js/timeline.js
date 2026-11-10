/* Línea temporal: polaroids, cápsulas bloqueadas y modal con flip 3D */
function isLocked(r, unlocked) { return r.bloqueado && !unlocked.has(r.id); }

function renderTimeline() {
  const box = $('#timeline');
  const unlocked = new Set(store.get('unlocked', []));
  box.innerHTML = CONFIG.recuerdosTimeline.map((r, i) => {
    const locked = isLocked(r, unlocked);
    const cover = `<div class="lock-cover"><div class="lock-wrap"><span class="bow">🎀</span>${heartLockSVG(false)}</div><p>¡Toca para desbloquear este recuerdo! ✨</p></div>`;
    return `<article class="tl-item reveal" style="--d:${i * 60}ms">
      <span class="tl-node">${i % 2 ? '❤️' : '💙'}</span>
      <div class="polaroid ${i % 2 ? 'rot-r' : 'rot-l'} washi-${i % 4} ${locked ? 'is-locked' : ''}" data-id="${esc(r.id)}" role="button" tabindex="0"
           aria-label="${locked ? 'Recuerdo bloqueado' : esc(r.titulo)}">
        <span class="washi"></span>
        <div class="photo">${locked ? cover : img(r.foto, r.titulo)}</div>
        <p class="hand date">${esc(r.fecha)}</p>
        <h3 class="hand title">${locked ? 'Recuerdo secreto 🔒' : esc(r.titulo)}</h3>
        ${locked ? '' : '<button class="btn btn-sm" type="button">Leer recuerdo 💙</button>'}
      </div>
    </article>`;
  }).join('');
  observeReveals();
}

function openMemory(r) {
  openModal(`
    <div class="flip" id="flip">
      <div class="flip-inner">
        <div class="face front">
          <div class="photo">${img(r.foto, r.titulo)}</div>
          <div class="cap"><p class="hand date">${esc(r.fecha)}</p><p class="hand title">${esc(r.titulo)}</p></div>
        </div>
        <div class="face back">
          <span class="corner c-tl">💙</span><span class="corner c-tr">❤️</span><span class="corner c-bl">❤️</span><span class="corner c-br">💙</span>
          <div class="postmark hand">📍 ${esc(r.ubicacion)} · ${esc(r.fecha)}</div>
          <h3 class="back-title">${esc(r.titulo)}</h3>
          <p class="back-text">${esc(r.textoDetras)}</p>
        </div>
      </div>
    </div>
    <p class="tap-hint">Toca la tarjeta para darle la vuelta ✨</p>`);
  const flip = $('#flip');
  flip.addEventListener('click', () => flip.classList.toggle('flipped'));
  setTimeout(() => flip.classList.add('flipped'), 700);
}

function openUnlock(r) {
  const when = r.desbloqueoFecha ? new Date(r.desbloqueoFecha) : null;
  if (when && when > new Date()) {
    const txt = when.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    openModal(`<div class="modal-card glass"><div class="secret-lock">${heartLockSVG(false)}</div>
      <h3>Todavía no, amor ❤️</h3><p class="hand q">Este recuerdo se abrirá el ${esc(txt)} ✨</p></div>`);
    return;
  }
  if (!r.preguntaDesbloqueo) { unlockMemory(r); return; }
  openModal(`<div class="modal-card glass" id="unlock-card">
    <div class="secret-lock" style="width:84px;height:84px">${heartLockSVG(false)}</div>
    <h3>Cápsula bloqueada</h3>
    <p class="hand q">${esc(r.preguntaDesbloqueo)}</p>
    <form id="unlock-form" autocomplete="off">
      <input class="field" id="unlock-input" placeholder="Tu respuesta, amor…" aria-label="Respuesta">
      <button class="btn btn-red" style="margin-top:.8rem;width:100%" type="submit">Desbloquear ❤️</button>
    </form>
    <p class="err" id="unlock-err" hidden>Mmm, esa no es… prueba otra vez 🥺💙</p>
  </div>`);
  const input = $('#unlock-input'); input.focus();
  $('#unlock-form').addEventListener('submit', e => {
    e.preventDefault();
    const ok = [].concat(r.respuestaCorrecta).some(a => norm(a) && norm(a) === norm(input.value));
    if (ok) { unlockMemory(r); return; }
    const card = $('#unlock-card');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    $('#unlock-err').hidden = false;
    if (navigator.vibrate) navigator.vibrate(60);
  });
}

function unlockMemory(r) {
  const list = new Set(store.get('unlocked', [])); list.add(r.id);
  store.set('unlocked', [...list]);
  FX.burst({ particleCount: 120, spread: 90 });
  renderTimeline();
  closeModal();
  setTimeout(() => openMemory(r), 500);
}

(function bindTimeline() {
  const box = document.getElementById('timeline');
  const act = el => {
    const p = el.closest('.polaroid'); if (!p) return;
    const r = CONFIG.recuerdosTimeline.find(x => String(x.id) === p.dataset.id); if (!r) return;
    isLocked(r, new Set(store.get('unlocked', []))) ? openUnlock(r) : openMemory(r);
  };
  box.addEventListener('click', e => act(e.target));
  box.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(e.target); } });
})();
