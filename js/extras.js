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
    _lastRazon = i;
    const slip = $('#jar-slip');
    slip.hidden = false;
    slip.style.animation = 'none'; void slip.offsetWidth; slip.style.animation = '';
    slip.innerHTML = `<p class="hand" style="margin:0;font-size:1.2rem">Razón nº ${i + 1}</p><p class="slip-text">${esc(list[i])}</p>`;
    burstAt(e.currentTarget, { particleCount: 45 });
  });
}
