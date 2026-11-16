/* Pestaña Juegos: «Parejas» (memoria) · Pestaña Historia: álbum con visor */

/* ---------- Parejas ---------- */
function renderMemory() {
  const box = $('#memory'), m = CONFIG.memoria; if (!box) return;
  if (!m || !(m.fichas || []).length) { const s = $('#sec-memoria'); if (s) s.hidden = true; box.hidden = true; return; }
  $('#mem-title').textContent = m.titulo || 'Parejas'; $('#mem-sub').textContent = m.subtitulo || '';
  const isImg = v => /[\/.]/.test(v) && /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(v) || /^https?:/.test(v);
  const deck = m.fichas.flatMap((v, i) => [{ k: i, v }, { k: i, v }]);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  let open = [], moves = 0, found = 0, lock = false;
  const best = store.get('memoriaBest', null);
  box.innerHTML = `<div class="glass mem-card">
    <div class="mem-top"><span class="chip">Intentos: <b id="mem-moves">0</b></span><span class="chip">${best != null ? '🏆 Mejor: ' + best : 'Parejas: ' + m.fichas.length}</span></div>
    <div class="mem-grid c${deck.length > 12 ? 4 : 4}">${deck.map((c, i) => `<button class="mem" data-i="${i}" aria-label="Ficha"><span class="mem-in"><span class="mem-back">❤</span><span class="mem-front">${isImg(c.v) ? img(c.v, '') : esc(c.v)}</span></span></button>`).join('')}</div>
    <div id="mem-end"></div></div>`;
  box.querySelector('.mem-grid').addEventListener('click', e => {
    const b = e.target.closest('.mem'); if (!b || lock || b.classList.contains('on') || b.classList.contains('ok')) return;
    b.classList.add('on'); open.push(b); if (open.length < 2) return;
    moves++; $('#mem-moves').textContent = moves;
    const [a, c] = open; open = [];
    if (deck[+a.dataset.i].k === deck[+c.dataset.i].k) {
      a.classList.add('ok'); c.classList.add('ok'); found++; burstAt(c, { particleCount: 22 });
      if (found === m.fichas.length) {
        if (best == null || moves < best) store.set('memoriaBest', moves);
        setTimeout(() => {
          FX.celebrate(1800);
          $('#mem-end').innerHTML = `<div class="prize"><b>${esc(m.mensajeFinal || '¡Completado!')}</b><p style="margin:.3rem 0 0;font-size:.9rem">Lo has hecho en ${moves} intentos.</p>
            <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.7rem"><button class="btn btn-red" id="mem-wa">Contárselo 📲</button><button class="btn" id="mem-again">Otra vez</button></div></div>`;
          $('#mem-wa').addEventListener('click', () => openWA(fill(m.mensajeWhatsApp || 'He encontrado todas las parejas en {intentos} intentos', { intentos: moves })));
          $('#mem-again').addEventListener('click', renderMemory);
        }, 500);
      }
    } else { lock = true; setTimeout(() => { a.classList.remove('on'); c.classList.remove('on'); lock = false; }, 850); }
  });
}

/* ---------- Álbum ---------- */
let _gi = 0;
function renderGallery() {
  const box = $('#gallery'), list = CONFIG.galeria || []; if (!box) return;
  if (!list.length) { $('#gallery-sec').hidden = true; return; }
  box.innerHTML = list.map((g, i) => `<button class="gal reveal r${i % 3}" data-i="${i}" style="--d:${(i % 6) * 50}ms">${img(g.foto, g.pie || 'Foto')}${g.pie ? `<span class="hand">${esc(g.pie)}</span>` : ''}</button>`).join('');
  box.addEventListener('click', e => { const b = e.target.closest('.gal'); if (b) openPhoto(+b.dataset.i); });
  document.addEventListener('keydown', e => { if (!$('#lightbox')) return; if (e.key === 'ArrowRight') openPhoto(_gi + 1); if (e.key === 'ArrowLeft') openPhoto(_gi - 1); });
}
function openPhoto(i) {
  const list = CONFIG.galeria; _gi = (i + list.length) % list.length; const g = list[_gi];
  openModal(`<div class="lightbox" id="lightbox">
    <button class="lb-nav prev" aria-label="Anterior">‹</button>
    <figure>${img(g.foto, g.pie || 'Foto')}${g.pie ? `<figcaption class="hand">${esc(g.pie)}</figcaption>` : ''}<span class="lb-count">${_gi + 1} / ${list.length}</span></figure>
    <button class="lb-nav next" aria-label="Siguiente">›</button></div>`);
  const lb = $('#lightbox'); let x0 = null;
  lb.querySelector('.prev').addEventListener('click', () => openPhoto(_gi - 1));
  lb.querySelector('.next').addEventListener('click', () => openPhoto(_gi + 1));
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 45) openPhoto(_gi + (dx < 0 ? 1 : -1)); });
}

function renderPlay() { renderMemory(); renderGallery(); }
