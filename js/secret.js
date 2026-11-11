/* Easter egg: carta secreta con contraseña */
function renderSecret() {
  if (store.get('secretOpen', false)) { renderLetter(false); revealGame(false); } else renderSecretForm();
}

function renderSecretForm() {
  const c = CONFIG.easterEgg;
  $('#secret').innerHTML = `
    <div class="secret-card" id="secret-card">
      <span class="deco" style="top:10px;left:14px">✨</span><span class="deco" style="top:14px;right:16px;animation-delay:-1s">💙</span>
      <span class="deco" style="bottom:12px;left:18px;animation-delay:-2s">🤍</span><span class="deco" style="bottom:10px;right:14px;animation-delay:-.5s">✨</span>
      <div class="secret-lock" id="secret-lock">${heartLockSVG(false)}</div>
      <h2>${esc(c.tituloSeccion)}</h2>
      <div class="hint-tag">${esc(c.pista)}</div>
      <p class="hand hint-extra">${esc(c.pistaExtra)}</p>
      <form class="secret-form" id="secret-form" autocomplete="off">
        <label for="secret-input">${esc(c.labelInput)}</label>
        <input class="field" id="secret-input" placeholder="${esc(c.placeholder)}" inputmode="text">
        <button class="btn" type="submit">${esc(c.boton)}</button>
      </form>
      <p class="err" id="secret-err" hidden>🥺 ${esc(c.mensajeError)}</p>
    </div>`;
  $('#secret-form').addEventListener('submit', e => {
    e.preventDefault();
    const val = norm($('#secret-input').value);
    if (val && c.passwordsValidas.some(p => norm(p) === val)) { unlockSecret(); return; }
    const card = $('#secret-card');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    $('#secret-err').hidden = false;
    if (navigator.vibrate) navigator.vibrate(80);
  });
}

function unlockSecret() {
  store.set('secretOpen', true);
  $('#secret-lock .heart-lock').classList.add('open');
  $('#secret-err').hidden = true;
  FX.celebrate(3800);
  setTimeout(() => renderLetter(true), 1500);
  setTimeout(() => revealGame(true), 1500 + (CONFIG.easterEgg.mensajeSecreto.length * 30) + 900);
}

function renderLetter(animate) {
  const c = CONFIG.easterEgg, p = CONFIG.pareja;
  $('#secret').innerHTML = `
    <div class="letter-card">
      <div class="frame-row">💙 🤍 💙 🤍 💙 🤍 💙</div>
      <h3>${esc(c.tituloSecreto)}</h3>
      <div class="polaroid rot-l washi-1"><span class="washi"></span><div class="photo">${img(c.fotoSecreta, 'Nuestra foto secreta')}</div></div>
      <p class="letter-text ${animate ? 'typing' : ''}" id="typed">${animate ? '' : esc(c.mensajeSecreto)}</p>
      <p class="hand sign">Siempre tuyo, ${esc(p.nombreEl)} 💙</p>
      <div class="frame-row b">💙 🤍 💙 🤍 💙 🤍 💙</div>
    </div>`;
  if (!animate) return;
  const el = $('#typed'), text = c.mensajeSecreto; let i = 0;
  (function type() {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(type, 30); else el.classList.remove('typing');
  })();
}

/* El juego de la canasta se desbloquea junto con la carta secreta */
function revealGame(animate) {
  const sec = document.getElementById('game-section'); if (!sec || !sec.hidden) return;
  sec.hidden = false;
  if (animate) { sec.classList.add('game-in'); FX.burst({ particleCount: 50, origin: { x: 0.5, y: 0.85 } }); }
}
