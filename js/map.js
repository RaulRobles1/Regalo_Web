/* Mapa de recuerdos con Leaflet (corazones rojos y azules latiendo como chinchetas) */
let _map = null, _markers = [], _mapReady = false;

function popupHTML(p) {
  return `<div class="pop">${img(p.foto, p.ciudad)}<div><h4>${esc(p.ciudad)}</h4><p>${esc(p.descripcion)}</p></div></div>`;
}

function renderPlaces() {
  $('#places').innerHTML = CONFIG.lugaresMapa.map((p, i) => `
    <button class="place reveal" data-i="${i}" style="--d:${i * 60}ms">
      ${img(p.foto, p.ciudad)}<div><b>${esc(p.ciudad)}</b><span>${esc(p.descripcion)}</span></div>
    </button>`).join('');
  $('#places').addEventListener('click', e => {
    const b = e.target.closest('.place'); if (!b) return;
    const i = +b.dataset.i, p = CONFIG.lugaresMapa[i];
    if (_map && _markers[i]) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      _map.flyTo(p.coords, 12, { duration: 1.2 });
      setTimeout(() => _markers[i].openPopup(), 1300);
    }
  });
}

function fixMapSize() {
  [60, 350, 900].forEach(t => setTimeout(() => _map && _map.invalidateSize(), t));
}

function initMap() {
  if (_mapReady) { fixMapSize(); return; }
  _mapReady = true;
  const box = $('#map');
  if (!window.L) {
    box.innerHTML = '<p style="padding:2rem;text-align:center">No se pudo cargar el mapa 🥺 Mira la lista de abajo ❤️</p>';
    return;
  }
  _map = L.map(box, { zoomControl: false, scrollWheelZoom: false }).setView(CONFIG.lugaresMapa[0].coords, 6);
  L.control.zoom({ position: 'topright' }).addTo(_map);

  // Mapa principal (CARTO). Si fallan varios tiles, cambia solo a OpenStreetMap.
  const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18, attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(_map);
  let errors = 0, swapped = false;
  carto.on('tileerror', () => {
    if (swapped || ++errors < 3) return;
    swapped = true;
    _map.removeLayer(carto);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(_map);
  });

  _markers = CONFIG.lugaresMapa.map((p, i) => {
    const icon = L.divIcon({ className: '', html: `<div class="map-heart">${i % 2 ? '❤️' : '💙'}</div>`, iconSize: [34, 34], iconAnchor: [17, 30], popupAnchor: [0, -28] });
    return L.marker(p.coords, { icon }).addTo(_map).bindPopup(popupHTML(p), { maxWidth: 240 });
  });
  if (CONFIG.lugaresMapa.length > 1) _map.fitBounds(CONFIG.lugaresMapa.map(p => p.coords), { padding: [40, 40], maxZoom: 9 });
  if ('ResizeObserver' in window) new ResizeObserver(() => _map.invalidateSize()).observe(box);
  fixMapSize();
}
