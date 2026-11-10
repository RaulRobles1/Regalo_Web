/* Talonario de vales troquelados + canje por WhatsApp */
const VALE_ICONS = { heart: '💙', plane: '✈️', sparkles: '✨', gift: '🎁', cake: '🍰', movie: '🍿' };

function renderVales() {
  const used = new Set(store.get('valesUsados', []));
  $('#vales').innerHTML = CONFIG.vales.map((v, i) => `
    <div class="ticket-wrap reveal" style="--d:${i * 80}ms">
      <article class="ticket t${i % 3} ${used.has(v.id) ? 'used' : ''}" data-id="${esc(v.id)}">
        <div class="ticket-main">
          <span class="stars">✦ ✧ ✦</span>
          <div class="ic">${VALE_ICONS[v.icono] || '💙'}</div>
          <h3>${esc(v.titulo)}</h3>
          <p>${esc(v.descripcion)}</p>
          <div class="stamp">Válido por amor infinito</div>
        </div>
        <div class="ticket-stub">
          <button class="btn" type="button" ${used.has(v.id) ? 'disabled' : ''}>${used.has(v.id) ? 'Canjeado 💙' : 'Canjear vale 💙'}</button>
        </div>
        <div class="ticket-used"><span>CANJEADO</span></div>
      </article>
    </div>`).join('');
  observeReveals();
}

$('#vales').addEventListener('click', e => {
  const btn = e.target.closest('.btn'); if (!btn || btn.disabled) return;
  const card = btn.closest('.ticket');
  const v = CONFIG.vales.find(x => x.id === card.dataset.id); if (!v) return;
  const r = btn.getBoundingClientRect();
  FX.burst({ particleCount: 70, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } });
  const used = new Set(store.get('valesUsados', [])); used.add(v.id); store.set('valesUsados', [...used]);
  const msg = `¡Hola mi amor! 💙 Acabo de canjear mi vale de nuestro 3er aniversario por: ${v.titulo} ✨ ¡Te quiero!`;
  window.open(`https://wa.me/${CONFIG.pareja.telefonoWhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  card.classList.add('used');
  btn.disabled = true; btn.textContent = 'Canjeado 💙';
});
