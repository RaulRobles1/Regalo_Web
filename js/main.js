/* Arranque: intro del sobre y render de todos los módulos */
(function boot() {
  if (/[?&]reset\b/.test(location.search)) store.clear();   // abre index.html?reset para volver a empezar

  initShell();
  FX.init();
  renderHeader();
  applyTheme();
  renderTimeline();
  renderPlaces();
  renderVales();
  renderScratch();
  renderSecret();
  observeReveals();
  setInterval(applyTheme, 10 * 60 * 1000);

  /* Intro */
  const intro = $('#intro');
  $('#intro-to').textContent = 'Para ti, ' + CONFIG.pareja.nombreElla + ' 💙';
  if (store.get('introSeen', false)) { intro.remove(); return; }
  let opened = false;
  const open = () => {
    if (opened) return; opened = true;
    $('#envelope').classList.add('open');
    setTimeout(() => FX.burst({ origin: { x: 0.5, y: 0.5 } }), 700);
    setTimeout(() => intro.classList.add('leaving'), 1900);
    setTimeout(() => { intro.remove(); store.set('introSeen', true); }, 2700);
  };
  $('#seal').addEventListener('click', open);
  $('#envelope').addEventListener('click', open);
})();
