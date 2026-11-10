/* Quiz de nuestra historia */
let _qi = 0, _qscore = 0, _qanswered = false;

function renderQuiz() {
  const root = $('#quiz'); if (!root || !CONFIG.quiz) return;
  $('#quiz-sub').textContent = CONFIG.quiz.subtitulo;
  root.innerHTML = '<div class="quiz-wrap"><div class="glass quiz-card" id="quiz-card"></div></div>';
  quizIntro();
  root.addEventListener('click', e => {
    if (e.target.closest('#quiz-start') || e.target.closest('#quiz-again')) { _qi = 0; _qscore = 0; quizQuestion(); return; }
    const o = e.target.closest('.qopt'); if (o) { quizAnswer(o); return; }
    if (e.target.closest('#quiz-next')) { _qi++; _qi < CONFIG.quiz.preguntas.length ? quizQuestion() : quizEnd(); return; }
    if (e.target.closest('#quiz-wa')) {
      const q = CONFIG.quiz;
      openWA(fill(q.mensajeWhatsApp, { puntos: _qscore, total: q.preguntas.length }));
    }
  });
}

function quizIntro() {
  const q = CONFIG.quiz, best = store.get('quizBest', null), total = q.preguntas.length;
  $('#quiz-card').innerHTML = `<div class="quiz-emoji">💘</div><h3>${esc(q.titulo)}</h3>
    <p class="hand" style="font-size:1.4rem;margin:.3rem 0 1rem">${total} preguntas sobre nuestra historia</p>
    ${best != null ? `<p><span class="chip">🏆 Tu mejor marca: ${best}/${total}</span></p>` : ''}
    <button class="btn btn-red" id="quiz-start">¡Empezar! ❤️</button>`;
}

function quizQuestion() {
  const q = CONFIG.quiz, p = q.preguntas[_qi], total = q.preguntas.length;
  _qanswered = false;
  $('#quiz-card').innerHTML = `
    <div class="qprog"><i style="width:${(_qi / total) * 100}%"></i></div>
    <p class="qnum">Pregunta ${_qi + 1} de ${total}</p>
    <h3 class="qtext">${esc(p.pregunta)}</h3>
    <div class="qopts">${p.opciones.map((o, k) => `<button class="qopt" data-k="${k}">${esc(o)}</button>`).join('')}</div>
    <div id="qfeed"></div>`;
}

function quizAnswer(btn) {
  if (_qanswered) return; _qanswered = true;
  const q = CONFIG.quiz, p = q.preguntas[_qi], k = +btn.dataset.k, ok = k === p.correcta;
  $$('.qopt').forEach((b, i) => { b.disabled = true; if (i === p.correcta) b.classList.add('ok'); });
  if (ok) { _qscore++; burstAt(btn, { particleCount: 50 }); }
  else {
    btn.classList.add('bad');
    const card = $('#quiz-card'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    if (navigator.vibrate) navigator.vibrate(50);
  }
  const last = _qi === q.preguntas.length - 1;
  $('#qfeed').innerHTML = `<p class="hand qexp">${ok ? '¡Correcto, mi amor! ❤️' : 'Casi... 🥺'} ${esc(p.explicacion || '')}</p>
    <button class="btn btn-red" id="quiz-next" style="margin-top:.6rem">${last ? 'Ver resultado ❤️' : 'Siguiente 💙'}</button>`;
}

function quizEnd() {
  const q = CONFIG.quiz, total = q.preguntas.length, pct = _qscore / total;
  const res = [...q.resultados].sort((a, b) => b.minimo - a.minimo).find(r => pct >= r.minimo) || q.resultados[0];
  const best = store.get('quizBest', null);
  if (best == null || _qscore > best) store.set('quizBest', _qscore);
  if (pct === 1) FX.celebrate(3000); else if (pct >= 0.5) FX.burst({ particleCount: 120, spread: 100 });
  const hearts = Array.from({ length: total }, (_, i) => i < _qscore ? '❤️' : '🤍').join('');
  $('#quiz-card').innerHTML = `
    <div class="qscore">${_qscore}/${total}</div>
    <div class="qhearts">${hearts}</div>
    <h3>${esc(res.titulo)}</h3>
    <p class="hand" style="font-size:1.45rem;margin:.4rem 0 1rem">${esc(res.mensaje)}</p>
    ${pct === 1 && q.premio ? `<div class="prize"><span style="font-size:2rem">🎁</span><b>${esc(q.premio)}</b></div>` : ''}
    <button class="btn btn-red" id="quiz-wa" style="margin:.8rem .3rem 0">Contarle mi resultado 📲</button>
    <button class="btn" id="quiz-again" style="margin:.8rem .3rem 0">Repetir 💙</button>`;
}
