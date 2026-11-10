/* Núcleo: utilidades, almacenamiento, cabecera + contador, pestañas, modal, tema */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

const store = {
  get(k, d) { try { const v = localStorage.getItem('3a_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('3a_' + k, JSON.stringify(v)); } catch (e) { /* sin storage */ } },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith('3a_')).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ok */ } }
};

const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#bae6fd'/><stop offset='1' stop-color='#c7d2fe'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><text x='200' y='175' font-size='90' text-anchor='middle'>💙</text></svg>");
function imgFallback(el) { el.onerror = null; el.src = FALLBACK_IMG; }
const img = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="imgFallback(this)">`;

let _lockId = 0;
function heartLockSVG(open) {
  const id = 'hg' + (++_lockId);
  return `<svg viewBox="0 0 120 120" class="heart-lock ${open ? 'open' : ''}" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#818cf8"/></linearGradient></defs>
    <path transform="scale(5)" fill="url(#${id})" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    <g class="shackle"><path d="M44 58 V46 a16 16 0 0 1 32 0 V58" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g>
    <rect x="36" y="56" width="48" height="34" rx="8" fill="#fff"/>
    <circle cx="60" cy="70" r="5" fill="#38bdf8"/><rect x="58" y="72" width="4" height="10" rx="2" fill="#38bdf8"/>
  </svg>`;
}

/* ---------- Reveal al hacer scroll ---------- */
let _io;
function observeReveals() {
  if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(e => e.classList.add('in')); return; }
  _io = _io || new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); _io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$('.reveal:not(.in)').forEach(e => _io.observe(e));
}

/* ---------- Cabecera + contador ---------- */
function garlandSVG() {
  const N = 9, hearts = ['💙', '🤍', '🩵', '💙', '🤍', '💙', '🩵', '🤍', '💙'];
  let t = '';
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, x = 400 * u, y = (1 - u) ** 2 * 4 + 2 * (1 - u) * u * 56 + u * u * 4;
    t += `<text x="${x.toFixed(1)}" y="${(y + 16).toFixed(1)}" font-size="20" text-anchor="middle" style="animation-delay:${-i * 0.35}s">${hearts[i]}</text>`;
  }
  return `<svg class="garland" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 4 Q200 56 400 4" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-dasharray="4 4"/>${t}</svg>`;
}

function calendarDiff(a, b) {
  const add = (d, y, m) => new Date(d.getFullYear() + y, d.getMonth() + m, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
  let years = 0; while (add(a, years + 1, 0) <= b) years++;
  let months = 0; while (add(a, years, months + 1) <= b) months++;
  let rest = Math.floor((b - add(a, years, months)) / 1000);
  const days = Math.floor(rest / 86400); rest %= 86400;
  const hours = Math.floor(rest / 3600); rest %= 3600;
  return { years, months, days, hours, minutes: Math.floor(rest / 60), seconds: rest % 60 };
}

function nextAnniversary(start, now) {
  let d = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d < today) d = new Date(now.getFullYear() + 1, start.getMonth(), start.getDate());
  return Math.round((d - today) / 86400000);
}
function nextMonthsary(start, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = new Date(now.getFullYear(), now.getMonth(), start.getDate());
  if (d < today) d = new Date(now.getFullYear(), now.getMonth() + 1, start.getDate());
  return Math.round((d - today) / 86400000);
}

function renderHeader() {
  const p = CONFIG.pareja;
  $('#header').innerHTML = `
    <button class="theme-toggle" id="theme-toggle" aria-label="Cambiar modo día/noche">🌙</button>
    ${garlandSVG()}
    <p class="hand kicker">Para ti, ${esc(p.nombreElla)}</p>
    <h1 class="main-title">${esc(p.tituloHeader)}</h1>
    <p class="sub">${esc(p.fraseHeader)}</p>
    <div class="counter glass">
      <span class="sp s1">✨</span><span class="sp s2">✨</span><span class="sp s3">💙</span><span class="sp s4">✨</span>
      <div class="cgrid">
        ${[['years', 'Años'], ['months', 'Meses'], ['days', 'Días'], ['hours', 'Horas'], ['minutes', 'Min'], ['seconds', 'Seg']]
          .map(([k, l]) => `<div class="cbox"><b id="c-${k}">0</b><small>${l}</small></div>`).join('')}
      </div>
      <p class="hand counter-phrase">${esc(p.fraseContador)}</p>
      <div class="mini-stats">
        <span class="chip">📅 <b id="c-total">0</b> días juntos</span>
        <span class="chip" id="c-next"></span>
      </div>
    </div>`;
  tickCounter();
  setInterval(tickCounter, 1000);
  $('#theme-toggle').addEventListener('click', () => {
    const night = !document.body.classList.contains('night');
    store.set('theme', night ? 'night' : 'day');
    applyTheme();
  });
}

function tickCounter() {
  const start = new Date(CONFIG.pareja.fechaInicio), now = new Date();
  if (isNaN(start)) return;
  const d = calendarDiff(start, now);
  Object.keys(d).forEach(k => { const e = $('#c-' + k); if (e) e.textContent = d[k]; });
  $('#c-total').textContent = Math.floor((now - start) / 86400000).toLocaleString('es-ES');
  const a = nextAnniversary(start, now), m = nextMonthsary(start, now);
  $('#c-next').innerHTML = a === 0 ? '🎉 ¡Hoy es nuestro aniversario!' : (m === 0 ? '🎉 ¡Hoy es nuestro mesiversario!' : `🎈 Próximo mesiversario en <b>${m}</b> día${m === 1 ? '' : 's'}`);
}

/* ---------- Tema día/noche ---------- */
function applyTheme() {
  const pref = store.get('theme', null), h = new Date().getHours();
  const night = pref ? pref === 'night' : (h >= 21 || h < 7);
  document.body.classList.toggle('night', night);
  const t = $('#theme-toggle'); if (t) t.textContent = night ? '☀️' : '🌙';
}

/* ---------- Pestañas ---------- */
const TABS = ['home', 'map', 'vales', 'secret'];
function showTab(name) {
  const i = TABS.indexOf(name); if (i < 0) return;
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $('#tab-ind').style.transform = `translateX(${i * 100}%)`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  observeReveals();
  if (name === 'map' && typeof initMap === 'function') initMap();
}

/* ---------- Modal ---------- */
function openModal(html) { $('#modal-body').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); $('#modal-body').innerHTML = ''; }

function initShell() {
  $$('.tab-btn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}
