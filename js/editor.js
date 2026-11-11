/* Editor visual del regalo.
   Lee js/config.js (valores base) + js/config.local.js (lo ya guardado), muestra formularios,
   y al guardar escribe SOLO lo que has cambiado en js/config.local.js (+ fotos en assets/fotos/). */
(() => {
  const clone = o => JSON.parse(JSON.stringify(o));
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  function deepMerge(t, s) { Object.keys(s).forEach(k => { if (isObj(s[k]) && isObj(t[k])) deepMerge(t[k], s[k]); else t[k] = s[k]; }); return t; }
  function diff(a, b) {
    if (isObj(a) && isObj(b)) {
      const o = {}; Object.keys(b).forEach(k => { const d = (k in a) ? diff(a[k], b[k]) : b[k]; if (d !== undefined) o[k] = d; });
      return Object.keys(o).length ? o : undefined;
    }
    return JSON.stringify(a) === JSON.stringify(b) ? undefined : b;
  }

  const BASE = clone(CONFIG);
  const S = deepMerge(clone(BASE), window.CONFIG_LOCAL || {});
  const pending = new Map();           // ruta "assets/fotos/x.jpg" -> Blob
  let dirHandle = null, dirty = false;

  /* ---------- Utilidades de interfaz ---------- */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const $ = s => document.querySelector(s);
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = 'toast'; }, err ? 6000 : 3500);
  }
  function touch() { dirty = true; const s = $('#status'); s.textContent = '● Cambios sin guardar'; s.className = 'status dirty'; }
  function clean(msg) { dirty = false; const s = $('#status'); s.textContent = msg || 'Guardado'; s.className = 'status'; }
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  const fld = (label, input, help, cls) => h('div', { class: 'fld ' + (cls || '') }, h('label', {}, label), input, help ? h('span', { class: 'help' }, help) : null);

  function text(obj, key, label, o = {}) {
    const inp = o.area ? h('textarea', { rows: o.rows || 3, placeholder: o.ph || '' }) : h('input', { type: o.type || 'text', placeholder: o.ph || '', min: o.min, max: o.max });
    inp.value = obj[key] == null ? '' : obj[key];
    inp.addEventListener('input', () => { obj[key] = o.type === 'number' ? (inp.value === '' ? '' : Number(inp.value)) : inp.value; touch(); if (o.onInput) o.onInput(inp); });
    return fld(label, inp, o.help, o.cls);
  }
  function lines(obj, key, label, o = {}) {
    const inp = h('textarea', { rows: o.rows || 5, placeholder: o.ph || '' });
    inp.value = [].concat(obj[key] || []).join('\n');
    inp.addEventListener('input', () => { obj[key] = inp.value.split('\n').map(x => x.trim()).filter(Boolean); touch(); });
    return fld(label, inp, o.help || 'Una por línea', o.cls);
  }
  function check(obj, key, label) {
    const c = h('input', { type: 'checkbox' }); c.checked = !!obj[key];
    c.addEventListener('change', () => { obj[key] = c.checked; touch(); });
    return h('label', { class: 'chk' }, c, label);
  }
  function select(obj, key, label, options, o = {}) {
    const s = h('select', {}, options.map(([v, t]) => h('option', { value: v }, t)));
    s.value = obj[key];
    s.addEventListener('change', () => { obj[key] = s.value; touch(); if (o.onChange) o.onChange(s.value); });
    return fld(label, s, o.help, o.cls);
  }

  /* ---------- Fotos: elegir, redimensionar y comprimir ---------- */
  const slug = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'foto';
  function resizeImage(file, max = 1000, q = 0.85) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(b => b ? res(b) : rej(new Error('No se pudo comprimir')), 'image/jpeg', q);
      };
      im.onerror = () => rej(new Error('No se pudo leer la imagen'));
      im.src = url;
    });
  }
  function photo(obj, key, label, o = {}) {
    const thumb = h('img', { class: 'thumb', alt: '' });
    const setThumb = () => { const v = obj[key]; thumb.src = pending.has(v) ? pending.get(v).__url : (v || ''); };
    const path = h('input', { type: 'text', placeholder: 'assets/fotos/mi-foto.jpg  (o una dirección de internet)' });
    path.value = obj[key] || '';
    path.addEventListener('input', () => { obj[key] = path.value.trim(); touch(); setThumb(); });
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true });
    file.addEventListener('change', async () => {
      const f = file.files[0]; if (!f) return;
      try {
        const blob = await resizeImage(f);
        let name = slug(f.name) + '.jpg', p = 'assets/fotos/' + name, n = 2;
        while (pending.has(p) && pending.get(p).__src !== f.name + f.size) { p = 'assets/fotos/' + slug(f.name) + '-' + (n++) + '.jpg'; }
        blob.__url = URL.createObjectURL(blob); blob.__src = f.name + f.size; pending.set(p, blob);
        obj[key] = p; path.value = p; setThumb(); touch();
        toast('Foto lista (' + Math.round(blob.size / 1024) + ' KB) · se copiará al guardar');
      } catch (e) { toast(e.message, true); }
      file.value = '';
    });
    setThumb();
    thumb.addEventListener('error', () => { thumb.removeAttribute('src'); });
    return fld(label, h('div', { class: 'photo' }, thumb, h('div', { class: 'col' }, path,
      h('div', {}, h('button', { type: 'button', class: 'btn small', onclick: () => file.click() }, '🖼️ Elegir foto…'), file))), o.help, o.cls);
  }

  /* ---------- Listas repetibles (añadir / quitar / mover) ---------- */
  function repeater(box, arr, o) {
    function draw(openIdx) {
      box.innerHTML = '';
      arr.forEach((it, i) => {
        const d = h('details', { class: 'item' });
        const tool = (t, title, fn) => h('button', { type: 'button', class: 'tool', title, onclick: e => { e.preventDefault(); e.stopPropagation(); fn(); } }, t);
        d.append(h('summary', {}, h('span', { class: 'ttl' }, o.title(it, i)),
          h('span', { class: 'tools' },
            i > 0 ? tool('↑', 'Subir', () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; touch(); draw(i - 1); }) : null,
            i < arr.length - 1 ? tool('↓', 'Bajar', () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; touch(); draw(i + 1); }) : null,
            arr.length > (o.min || 0) ? tool('🗑', 'Quitar', () => { if (confirm('¿Quitar este elemento?')) { arr.splice(i, 1); touch(); draw(); } }) : null)));
        const body = h('div', { class: 'item-body' }); o.render(body, it, i); d.append(body);
        if (i === openIdx) d.open = true;
        box.append(d);
      });
      if (!o.fixed && arr.length < (o.max || 99)) box.append(h('button', { type: 'button', class: 'btn add', onclick: () => { arr.push(o.make(arr)); touch(); draw(arr.length - 1); } }, o.add || '➕ Añadir'));
    }
    draw();
  }

  /* ---------- Secciones ---------- */
  const sections = [];
  const section = (emoji, title, hint, build) => sections.push({ emoji, title, hint, build });

  section('💙', 'Datos de la pareja', 'nombres, fecha, teléfono, títulos', b => {
    const p = S.pareja;
    const fechaInp = h('input', { type: 'date' }); fechaInp.value = (p.fechaInicio || '').slice(0, 10);
    fechaInp.addEventListener('input', () => { p.fechaInicio = fechaInp.value ? fechaInp.value + 'T00:00:00' : ''; touch(); });
    const warn = h('span', { class: 'warn' });
    const checkTel = i => { const v = i.value.trim(); warn.textContent = /^\d{9,15}$/.test(v) ? '' : 'Solo números, con prefijo de país y sin "+" (ej. 34608832550)'; };
    b.append(h('div', { class: 'grid two' },
      text(p, 'nombreElla', 'Su nombre', { help: 'Sale en el sobre y en la portada' }),
      text(p, 'nombreEl', 'Tu nombre', { help: 'Firma de la carta secreta' }),
      fld('Día que empezasteis', fechaInp, 'Alimenta el contador de tiempo juntos'),
      h('div', { class: 'fld' }, text(p, 'telefonoWhatsapp', 'Tu WhatsApp', { help: 'Prefijo de país y sin "+" · 34 = España', onInput: checkTel }), warn),
      text(p, 'tituloHeader', 'Título de la portada', { cls: 'full' }),
      text(p, 'fraseHeader', 'Frase bajo el título', { cls: 'full' }),
      text(p, 'fraseContador', 'Frase bajo el contador', { cls: 'full' })));
    checkTel({ value: p.telefonoWhatsapp || '' });
  });

  section('📸', 'Recuerdos', 'línea temporal con polaroids', b => {
    S.recuerdosTimeline.forEach(r => { r._modo = !r.bloqueado ? 'libre' : (r.desbloqueoFecha ? 'fecha' : 'pregunta'); if (!Array.isArray(r.respuestaCorrecta)) r.respuestaCorrecta = r.respuestaCorrecta ? [r.respuestaCorrecta] : []; });
    const box = h('div'); b.append(box);
    repeater(box, S.recuerdosTimeline, {
      title: (r, i) => `${i + 1}. ${r.titulo || 'Sin título'}`, add: '➕ Añadir recuerdo',
      make: arr => ({ id: Math.max(0, ...arr.map(x => +x.id || 0)) + 1, fecha: '', titulo: 'Nuevo recuerdo 💙', ubicacion: '', foto: '', textoDetras: '', bloqueado: false, preguntaDesbloqueo: '', respuestaCorrecta: [], _modo: 'libre' }),
      render: (c, r) => {
        const pregunta = h('div', { class: 'grid', hidden: r._modo !== 'pregunta' }, text(r, 'preguntaDesbloqueo', 'Pregunta para desbloquear'), lines(r, 'respuestaCorrecta', 'Respuestas válidas', { rows: 2, help: 'Una por línea · no importan mayúsculas ni tildes' }));
        const fi = h('input', { type: 'date' }); fi.value = (r.desbloqueoFecha || '').slice(0, 10);
        fi.addEventListener('input', () => { r.desbloqueoFecha = fi.value ? fi.value + 'T00:00:00' : ''; touch(); });
        const fecha = h('div', { class: 'grid', hidden: r._modo !== 'fecha' }, fld('Se abre el día', fi, 'Hasta esa fecha no se puede abrir'));
        c.append(h('div', { class: 'grid two' },
          text(r, 'titulo', 'Título de la polaroid'), text(r, 'fecha', 'Fecha (en texto)', { ph: '14 de Febrero 2023' }),
          text(r, 'ubicacion', 'Lugar'),
          select(r, '_modo', 'Visibilidad', [['libre', 'Visible'], ['pregunta', 'Bloqueado con pregunta'], ['fecha', 'Bloqueado hasta una fecha']], { onChange: v => { r.bloqueado = v !== 'libre'; pregunta.hidden = v !== 'pregunta'; fecha.hidden = v !== 'fecha'; } }),
          photo(r, 'foto', 'Foto', { cls: 'full' }),
          text(r, 'textoDetras', 'Carta de detrás', { area: true, rows: 5, cls: 'full', help: 'Se ve al darle la vuelta a la polaroid' }),
          h('div', { class: 'full' }, pregunta, fecha)));
      }
    });
  });

  section('📍', 'Mapa de recuerdos', 'lugares con foto y nota', b => {
    const box = h('div'); b.append(box);
    repeater(box, S.lugaresMapa, {
      title: (l, i) => `${i + 1}. ${l.ciudad || 'Lugar'}`, add: '➕ Añadir lugar',
      make: () => ({ ciudad: 'Nuevo lugar 💙', coords: [40.4168, -3.7038], descripcion: '', foto: '' }),
      render: (c, l) => {
        const lat = h('input', { type: 'number', step: 'any' }), lng = h('input', { type: 'number', step: 'any' });
        lat.value = l.coords[0]; lng.value = l.coords[1];
        const upd = () => { l.coords = [parseFloat(lat.value), parseFloat(lng.value)]; touch(); };
        lat.addEventListener('input', upd); lng.addEventListener('input', upd);
        c.append(h('div', { class: 'grid two' },
          text(l, 'ciudad', 'Nombre del lugar'),
          h('div', { class: 'fld' }, h('label', {}, 'Coordenadas'), h('div', { class: 'grid two' }, lat, lng),
            h('span', { class: 'help' }, 'En Google Maps: clic derecho sobre el sitio → copia el primer número (latitud) y el segundo (longitud).')),
          text(l, 'descripcion', 'Nota romántica', { area: true, cls: 'full' }),
          photo(l, 'foto', 'Foto', { cls: 'full' })));
      }
    });
  });

  section('🫙', 'Bote de razones', 'por qué la quieres', b => {
    b.append(lines(S, 'razones', 'Razones', { rows: 9, help: 'Una por línea · añade todas las que quieras' }));
  });

  section('💘', 'Quiz de la relación', 'preguntas y premio', b => {
    const q = S.quiz;
    b.append(h('div', { class: 'grid two' }, text(q, 'titulo', 'Título'), text(q, 'subtitulo', 'Subtítulo')));
    b.append(h('h3', {}, 'Preguntas'));
    const box = h('div'); b.append(box);
    repeater(box, q.preguntas, {
      title: (p, i) => `${i + 1}. ${p.pregunta || 'Pregunta'}`, add: '➕ Añadir pregunta',
      make: () => ({ pregunta: '', opciones: ['', '', '', ''], correcta: 0, explicacion: '' }),
      render: (c, p) => {
        while (p.opciones.length < 4) p.opciones.push('');
        const opts = h('div', { class: 'grid two' }, p.opciones.map((_, k) => text(p.opciones, k, 'Opción ' + (k + 1))));
        c.append(text(p, 'pregunta', 'Pregunta'), opts,
          select(p, 'correcta', 'Respuesta correcta', [[0, 'Opción 1'], [1, 'Opción 2'], [2, 'Opción 3'], [3, 'Opción 4']], { onChange: v => { p.correcta = +v; } }),
          text(p, 'explicacion', 'Mensaje tras responder'));
        c.querySelector('select').value = String(p.correcta);
      }
    });
    b.append(h('h3', {}, 'Mensajes según la nota'));
    const rbox = h('div'); b.append(rbox);
    const lab = { 0: 'Menos de la mitad', 0.5: 'La mitad o más', 0.8: 'Casi todas (80 %)', 1: 'Todas (pleno)' };
    repeater(rbox, q.resultados, { fixed: true, min: 4, title: r => lab[r.minimo] || ('Desde ' + r.minimo), render: (c, r) => c.append(text(r, 'titulo', 'Título'), text(r, 'mensaje', 'Mensaje')) });
    b.append(h('div', { class: 'grid' }, text(q, 'premio', 'Premio si acierta todas', { area: true, rows: 2 }),
      text(q, 'mensajeWhatsApp', 'Mensaje de WhatsApp', { help: '{puntos} y {total} se rellenan solos', area: true, rows: 2 })));
  });

  section('🏀', 'Juego de la canasta', 'aparece en Secreto, tras abrir la carta', b => {
    const j = S.juego;
    b.append(h('div', { class: 'grid two' },
      text(j, 'titulo', 'Título'), text(j, 'subtitulo', 'Subtítulo'),
      text(j, 'tiros', 'Tiros por partida', { type: 'number', min: 1, max: 12 }),
      text(j, 'aciertosParaPremio', 'Aciertos para ganar', { type: 'number', min: 1, max: 12 }),
      text(j, 'textoPanel', 'Título de inicio', { help: '{n} = aciertos necesarios' }), text(j, 'textoPanelSub', 'Subtítulo de inicio'),
      text(j, 'textoPremio', 'Premio al ganar', { area: true, rows: 2, cls: 'full' }),
      text(j, 'textoFallo', 'Mensaje si no llega', { cls: 'full', help: '{n} = aciertos necesarios' }),
      text(j, 'mensajeWhatsApp', 'Mensaje que te llega por WhatsApp', { area: true, rows: 2, cls: 'full', help: '{aciertos} y {tiros} se rellenan solos' }),
      photo(j, 'pelotaImg', 'Foto para la pelota (opcional)', { cls: 'full', help: 'Vacío = balón de baloncesto dibujado' })));
  });

  section('🎡', 'Ruleta de premios', 'se reclaman por WhatsApp', b => {
    const r = S.ruleta;
    b.append(h('div', { class: 'grid two' }, text(r, 'titulo', 'Título'), text(r, 'subtitulo', 'Subtítulo'), text(r, 'boton', 'Texto del botón'), h('div', { class: 'fld' }, h('label', {}, ' '), check(r, 'unaVezAlDia', 'Solo un giro al día'))));
    const box = h('div'); b.append(box);
    repeater(box, r.premios, {
      title: (p, i) => `${i + 1}. ${p.emoji || ''} ${p.texto || ''}`, add: '➕ Añadir premio', min: 4, max: 12,
      make: () => ({ emoji: '🎁', texto: '' }),
      render: (c, p) => c.append(h('div', { class: 'grid two' }, text(p, 'emoji', 'Emoji'), text(p, 'texto', 'Premio')))
    });
    b.append(text(r, 'mensajeWhatsApp', 'Mensaje de WhatsApp', { area: true, rows: 2, help: '{premio} se rellena solo' }));
  });

  section('💌', 'Botón del amor', 'mensajes rápidos por WhatsApp', b => {
    const m = S.mensajesRapidos;
    b.append(h('div', { class: 'grid two' }, text(m, 'titulo', 'Título'), text(m, 'subtitulo', 'Subtítulo'), text(m, 'placeholder', 'Texto de la caja libre', { cls: 'full' })));
    const box = h('div'); b.append(box);
    repeater(box, m.botones, {
      title: (x, i) => `${i + 1}. ${x.emoji || ''} ${x.label || ''}`, add: '➕ Añadir botón', max: 12,
      make: () => ({ emoji: '💙', label: '', msg: '' }),
      render: (c, x) => c.append(h('div', { class: 'grid two' }, text(x, 'emoji', 'Emoji'), text(x, 'label', 'Texto del botón'), text(x, 'msg', 'Mensaje que se envía', { area: true, rows: 2, cls: 'full' })))
    });
  });

  section('🎟️', 'Vales', 'se canjean por WhatsApp', b => {
    const box = h('div'); b.append(box);
    repeater(box, S.vales, {
      title: (v, i) => `${i + 1}. ${v.titulo || 'Vale'}`, add: '➕ Añadir vale',
      make: arr => ({ id: 'vale-' + (arr.length + 1), titulo: '', descripcion: '', icono: 'heart' }),
      render: (c, v) => c.append(h('div', { class: 'grid two' }, text(v, 'titulo', 'Título'),
        select(v, 'icono', 'Icono', [['heart', '❤️ Corazón'], ['plane', '✈️ Avión'], ['sparkles', '✨ Brillos'], ['gift', '🎁 Regalo'], ['cake', '🍰 Tarta'], ['movie', '🍿 Peli']]),
        text(v, 'descripcion', 'Descripción', { area: true, rows: 2, cls: 'full' })))
    });
  });

  section('✨', 'Rasca y gana', 'sorpresa oculta', b => {
    const r = S.rascaYGana;
    b.append(h('div', { class: 'grid' }, text(r, 'titulo', 'Título'), text(r, 'textoCapa', 'Texto sobre la capa plateada'), text(r, 'mensajeOculto', 'Sorpresa oculta', { area: true, rows: 3 })));
  });

  section('🔐', 'Secreto', 'contraseña, pista y carta', b => {
    const e = S.easterEgg;
    b.append(h('div', { class: 'grid two' },
      text(e, 'tituloSeccion', 'Título', { cls: 'full' }),
      text(e, 'pista', 'Pista que ve ella', { help: 'Ej.: Día: XX-XX-XX · NO escribas aquí la contraseña' }),
      text(e, 'pistaExtra', 'Pista escrita a mano'),
      lines(e, 'passwordsValidas', 'Contraseñas válidas', { rows: 6, cls: 'full', help: 'Una por línea · no importan mayúsculas, tildes, espacios ni símbolos (14/02/2023 = 14022023)' }),
      text(e, 'mensajeError', 'Mensaje si falla', { cls: 'full' }),
      text(e, 'tituloSecreto', 'Título de la carta', { cls: 'full' }),
      text(e, 'mensajeSecreto', 'Carta secreta', { area: true, rows: 7, cls: 'full' }),
      photo(e, 'fotoSecreta', 'Foto secreta', { cls: 'full' })));
  });

  /* ---------- Código QR ---------- */
  function qrCanvas(qr, cv, size) {
    const n = qr.getModuleCount(), q = 4, cell = Math.max(1, Math.floor(size / (n + 2 * q))), px = cell * (n + 2 * q);
    cv.width = cv.height = px; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, px, px); x.fillStyle = '#0b2a4a';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) x.fillRect((c + q) * cell, (r + q) * cell, cell, cell);
  }
  function qrSvg(qr) {
    const n = qr.getModuleCount(), q = 4; let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0b2a4a"/></svg>\n`;
  }
  function download(name, blob) { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  section('🔳', 'Código QR', 'para imprimir y regalar', b => {
    const url = h('input', { type: 'url', value: 'https://raulrobles1.github.io/Regalo_Web/' });
    const cv = h('canvas'); const msg = h('span', { class: 'warn' });
    let qr = null;
    const draw = () => {
      try { qr = qrcode(0, 'H'); qr.addData(url.value.trim()); qr.make(); qrCanvas(qr, cv, 1200); msg.textContent = ''; }
      catch (e) { qr = null; msg.textContent = 'No se pudo generar el QR con esa dirección'; }
    };
    url.addEventListener('input', draw);
    b.append(h('div', { class: 'qr-box' }, cv, h('div', { class: 'qr-side' },
      fld('Dirección a la que lleva el QR', url, 'Pon aquí el enlace de tu web (el de GitHub Pages). Mejor un enlace que no vaya a cambiar.'), msg,
      h('div', {}, h('button', { type: 'button', class: 'btn', onclick: () => qr && cv.toBlob(bl => download('qr-regalo.png', bl)) }, '⬇️ PNG'), ' ',
        h('button', { type: 'button', class: 'btn', onclick: () => qr && download('qr-regalo.svg', new Blob([qrSvg(qr)], { type: 'image/svg+xml' })) }, '⬇️ SVG (vector, ideal para imprimir)')),
      h('span', { class: 'help' }, 'Consejo: imprímelo de al menos 3 × 3 cm, con fondo blanco, y pruébalo con tu móvil antes de regalarlo.'))));
    draw();
  });

  /* ---------- Montaje ---------- */
  const root = $('#editor');
  sections.forEach((s, i) => {
    const body = h('div', { class: 'sec-body' });
    root.append(h('details', { class: 'sec', open: i === 0 }, h('summary', {}, s.emoji + ' ' + s.title, h('small', {}, s.hint)), body));
    s.build(body);
  });

  /* ---------- Guardado ---------- */
  function normalized() {
    const s = clone(S);
    s.recuerdosTimeline.forEach(r => {
      if (r._modo === 'libre') { r.bloqueado = false; delete r.desbloqueoFecha; r.preguntaDesbloqueo = ''; r.respuestaCorrecta = ''; }
      else if (r._modo === 'fecha') { r.bloqueado = true; r.preguntaDesbloqueo = ''; r.respuestaCorrecta = ''; }
      else { r.bloqueado = true; delete r.desbloqueoFecha; r.respuestaCorrecta = [].concat(r.respuestaCorrecta).filter(Boolean); }
      delete r._modo;
    });
    s.vales.forEach((v, i) => { v.id = 'vale-' + (i + 1); });
    s.quiz.preguntas.forEach(p => { p.correcta = Number(p.correcta) || 0; p.opciones = p.opciones.map(o => String(o)); });
    s.lugaresMapa.forEach(l => { l.coords = l.coords.map(Number); });
    s.juego.tiros = Number(s.juego.tiros) || 5; s.juego.aciertosParaPremio = Math.min(Number(s.juego.aciertosParaPremio) || s.juego.tiros, s.juego.tiros);
    return s;
  }
  function configFile() {
    const d = diff(BASE, normalized()) || {};
    return '/* Generado por editor.html el ' + new Date().toLocaleString('es-ES') + '.\n   Lo que hay aquí GANA sobre js/config.js. Para volver a los valores originales deja:  window.CONFIG_LOCAL = {};  */\n'
      + 'window.CONFIG_LOCAL = ' + JSON.stringify(d, null, 2) + ';\n';
  }
  function problems() {
    const p = [], tel = String(S.pareja.telefonoWhatsapp || '');
    if (!/^\d{9,15}$/.test(tel)) p.push('El teléfono debe ser solo números con prefijo de país (ej. 34608832550)');
    if (!S.easterEgg.passwordsValidas.length) p.push('Falta al menos una contraseña válida en Secreto');
    if (S.ruleta.premios.length < 4) p.push('La ruleta necesita al menos 4 premios');
    return p;
  }

  async function pickFolder() {
    if (!window.showDirectoryPicker) { toast('Tu navegador no permite elegir carpeta. Usa “Descargar archivos”.', true); return null; }
    try {
      const dh = await window.showDirectoryPicker({ mode: 'readwrite' });
      try { await dh.getFileHandle('index.html'); }
      catch (e) { if (!confirm('No veo index.html en esa carpeta. ¿Seguro que es la carpeta del proyecto?')) return null; }
      dirHandle = dh; $('#btn-folder').textContent = '📁 ' + dh.name; return dh;
    } catch (e) { return null; }
  }
  async function writeFile(dir, name, data) { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(data); await w.close(); }

  async function save() {
    const pr = problems(); if (pr.length) { toast(pr[0], true); return; }
    if (!dirHandle && !(await pickFolder())) return;
    try {
      const js = await dirHandle.getDirectoryHandle('js', { create: true });
      const assets = await dirHandle.getDirectoryHandle('assets', { create: true });
      const fotos = await assets.getDirectoryHandle('fotos', { create: true });
      for (const [p, blob] of pending) await writeFile(fotos, p.split('/').pop(), blob);
      await writeFile(js, 'config.local.js', configFile());
      const n = pending.size; pending.clear();
      clean('✓ Guardado'); toast('Guardado ✓ ' + (n ? n + ' foto(s) copiada(s) · ' : '') + 'abre index.html para verlo');
    } catch (e) { toast('No se pudo guardar: ' + e.message, true); }
  }
  function downloadAll() {
    const pr = problems(); if (pr.length) { toast(pr[0], true); return; }
    download('config.local.js', new Blob([configFile()], { type: 'text/javascript' }));
    let i = 0; pending.forEach((blob, p) => setTimeout(() => download(p.split('/').pop(), blob), 400 * ++i));
    clean('Archivos descargados'); toast('Pon config.local.js en js/ y las fotos en assets/fotos/');
  }
  $('#btn-folder').addEventListener('click', pickFolder);
  $('#btn-save').addEventListener('click', save);
  $('#btn-dl').addEventListener('click', downloadAll);

  window.__editor = { normalized, configFile, diff: () => diff(BASE, normalized()), pending };   // para pruebas
})();
