/* Efectos visuales: corazones flotantes, estrellas, rastro al tocar y confeti */
const FX = (() => {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLOATERS = ['💙', '🤍', '🩵', '✨', '🫧', '💗', '⭐', '💙', '🤍'];
  const SPARKS = ['💙', '✨', '🤍', '🩵', '💫'];
  const COLORS = ['#7dd3fc', '#bae6fd', '#ffffff', '#fbcfe8', '#a5b4fc', '#38bdf8'];
  const HEART_PATH = 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z';
  let heartShape = null;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function layer() { return document.getElementById('fx-layer'); }

  function spawnFloater(initial) {
    const l = layer();
    if (!l || l.querySelectorAll('.floater').length > 18) return;
    const el = document.createElement('span');
    const dur = rand(10, 20);
    el.className = 'floater';
    el.textContent = pick(FLOATERS);
    el.style.left = rand(2, 94) + '%';
    el.style.fontSize = rand(11, 28) + 'px';
    el.style.setProperty('--dur', dur + 's');
    el.style.setProperty('--drift', rand(-50, 50) + 'px');
    el.style.setProperty('--op', rand(0.3, 0.8).toFixed(2));
    if (initial) el.style.animationDelay = -rand(0, dur) + 's';
    el.addEventListener('animationend', () => el.remove());
    l.appendChild(el);
  }

  function spark(x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.textContent = pick(SPARKS);
      s.style.left = x + rand(-10, 10) + 'px';
      s.style.top = y + rand(-10, 10) + 'px';
      s.style.fontSize = rand(12, 24) + 'px';
      s.style.setProperty('--dx', rand(-34, 34) + 'px');
      s.addEventListener('animationend', () => s.remove());
      document.body.appendChild(s);
    }
  }

  function initTrail() {
    let last = 0;
    document.addEventListener('pointerdown', e => spark(e.clientX, e.clientY, 3));
    document.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' && !e.buttons) return;
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      spark(e.clientX, e.clientY, 1);
    });
  }

  function initStars() {
    const l = layer();
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = rand(0, 100) + '%';
      s.style.top = rand(0, 100) + '%';
      s.style.animationDelay = -rand(0, 3) + 's';
      s.style.animationDuration = rand(2, 5) + 's';
      l.appendChild(s);
    }
  }

  function shape() {
    if (!heartShape && window.confetti && confetti.shapeFromPath) heartShape = confetti.shapeFromPath({ path: HEART_PATH });
    return heartShape;
  }

  /* Rafaga de corazones azules/blancos/rosa */
  function burst(opts = {}) {
    if (!window.confetti) return;
    const s = shape();
    confetti(Object.assign({
      particleCount: 60, spread: 70, origin: { x: 0.5, y: 0.65 }, colors: COLORS,
      shapes: s ? [s, 'circle'] : ['circle'], scalar: 1.6, ticks: 220, zIndex: 30000
    }, opts));
  }

  /* Gran celebración: cañones laterales + fuegos de corazones */
  function celebrate(ms = 3500) {
    if (!window.confetti) return;
    burst({ particleCount: 140, spread: 110, origin: { x: 0.5, y: 0.55 } });
    const end = Date.now() + ms;
    (function frame() {
      burst({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
      burst({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    const fire = setInterval(() => {
      burst({ particleCount: 40, spread: 360, startVelocity: 25, gravity: 0.6, origin: { x: rand(0.15, 0.85), y: rand(0.15, 0.5) } });
    }, 450);
    setTimeout(() => clearInterval(fire), ms);
  }

  function init() {
    initTrail();
    initStars();
    if (reduce) return;
    for (let i = 0; i < 10; i++) spawnFloater(true);
    setInterval(() => spawnFloater(false), 1300);
  }

  return { init, burst, celebrate, spark };
})();
