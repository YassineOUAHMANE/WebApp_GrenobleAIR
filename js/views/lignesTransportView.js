// js/views/lignesTransportLeafletView.js
import { fetchCSV } from '../utils/fetchData.js';
import { featureCollectionFromRows } from '../utils/mapUtils.js';

export default {
  title: 'Lignes de transport (TAG) — carte réelle',
  async mount(root) {
    const d3 = window.d3;
    root.innerHTML = `
      <div class="span-12 card">
        <h1>Lignes de transport — Réseau TAG</h1>
        <p class="muted">Fond de carte OSM (Leaflet), filtres Tram/Bus, recherche par code, stats & longueurs.</p>
      </div>

      <div class="span-3 card" id="panel">
        <h3>Filtres</h3>
        <label><input type="checkbox" id="chk-tram" checked> Tram</label><br/>
        <label><input type="checkbox" id="chk-bus"> Bus</label>
        <label style="display:block;margin-top:.75rem">Recherche par code</label>
        <input id="search" placeholder="ex: SEM_A" style="width:100%;padding:.4rem;border-radius:8px;border:1px solid #333;background:var(--panel);color:var(--text)"/>
        <div id="stats" style="margin-top:1rem"></div>
      </div>

      <div class="span-9 card">
        <div id="leaflet-wrap" style="height:72vh;min-height:520px;border-radius:16px;overflow:hidden">
          <div id="leaflet-map" style="height:100%"></div>
        </div>
      </div>

      <div class="span-12 card">
        <h2>Longueur totale par mode</h2>
        <div id="bar-wrap" class="chart"></div>
      </div>
    `;

    const cleanups = [];
    const $ = (sel) => root.querySelector(sel);

    // ---------- Data ----------
    const rows = await fetchCSV('./data/transport_public/lignes_du_transport_du_réseaux_Tag.csv');

    const isTram = (code) => /^SEM_[A-E]$/.test(String(code || '').trim());
    // Build FeatureCollection with mode property
    const features = [];
    for (const r of rows) {
      const s = r?.geo_shape;
      if (!s) continue;
      try {
        const geom = JSON.parse(String(s));
        const props = {
          id: r.id,
          code: r.code,
          pmr: +r.pmr === 1,
          type: r.type,
          mode: isTram(r.code) ? 'Tram' : 'Bus'
        };
        features.push({ type: 'Feature', geometry: geom, properties: props });
      } catch {}
    }
    const fc = { type: 'FeatureCollection', features };

    // ---------- Map (Leaflet + OSM) ----------
    if (!window.L) throw new Error('Leaflet manquant (index.html).');

    const map = L.map('leaflet-map', {
      preferCanvas: true,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 80
    }).setView([45.188, 5.724], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const canvasRenderer = L.canvas({ padding: 0.5 });

    cleanups.push(() => { try { map.remove(); } catch {} });

    // Styles
    const colorByMode = (m) => (m === 'Tram' ? '#29c18c' : '#2b5cff');
    const weightByMode = (m) => (m === 'Tram' ? 4 : 2);
    const dashByMode = (m) => (m === 'Bus' ? '6 6' : null);

    // Split features by mode
    const tramFC = { type: 'FeatureCollection', features: features.filter(f => f.properties.mode === 'Tram') };
    const busFC  = { type: 'FeatureCollection', features: features.filter(f => f.properties.mode === 'Bus')  };

    const popupHTML = (p) =>
      `<strong>${p.code}</strong><br/>Mode : ${p.mode}<br/>PMR : ${p.pmr ? 'Oui' : 'Non'}`;

    let tramLayer = L.geoJSON(tramFC, {
      renderer: canvasRenderer,
      style: f => ({ color: colorByMode(f.properties.mode), weight: weightByMode(f.properties.mode), opacity: 0.95 }),
      onEachFeature: (f, layer) => {
        layer.bindTooltip(popupHTML(f.properties), { sticky: true });
      }
    }).addTo(map);

    let busLayer = L.geoJSON(busFC, {
      renderer: canvasRenderer,
      style: f => ({ color: colorByMode(f.properties.mode), weight: weightByMode(f.properties.mode), opacity: 0.9, dashArray: dashByMode(f.properties.mode) }),
      onEachFeature: (f, layer) => {
        layer.bindTooltip(popupHTML(f.properties), { sticky: true });
      }
    }); // NOT added by default

    // Fit bounds on all lines
    try {
      const tmp = L.geoJSON(fc);
      const b = tmp.getBounds();
      if (b && b.isValid()) map.fitBounds(b, { padding: [20,20] });
    } catch {}

    // ---------- Filters ----------
    const chkTram = $('#chk-tram');
    const chkBus  = $('#chk-bus');

    chkTram.addEventListener('change', () => {
      if (chkTram.checked) tramLayer.addTo(map); else map.removeLayer(tramLayer);
      updateStats(); updateBars();
    });

    chkBus.addEventListener('change', () => {
      if (chkBus.checked) busLayer.addTo(map); else map.removeLayer(busLayer);
      updateStats(); updateBars();
    });

    // ---------- Search (code) ----------
    const searchInput = $('#search');

    function highlightByCode(q) {
      const qlc = String(q || '').trim().toLowerCase();
      const apply = (layer) => layer && layer.eachLayer((l) => {
        const p = l.feature?.properties || {};
        const match = qlc && String(p.code || '').toLowerCase().includes(qlc);
        const baseW = weightByMode(p.mode);
        l.setStyle({
          weight: match ? baseW + 2 : baseW,
          opacity: match ? 1 : 0.9
        });
        if (match) l.bringToFront();
      });
      apply(tramLayer);
      apply(busLayer);
    }
    searchInput.addEventListener('input', () => highlightByCode(searchInput.value));

    // ---------- Stats + bar chart ----------
    const R = 6371; // km
    const lengthsKm = features.map(f => ({
      mode: f.properties.mode,
      code: f.properties.code,
      km: d3.geoLength(f) * R
    }));

    function visibleModes() {
      return new Set([ ...(chkTram.checked ? ['Tram'] : []), ...(chkBus.checked ? ['Bus'] : []) ]);
    }

    function updateStats() {
      const active = visibleModes();
      const vis = lengthsKm.filter(d => active.has(d.mode));
      const kmTot = d3.sum(vis, d => d.km);
      const nLines = features.filter(f => active.has(f.properties.mode)).length;
      $('#stats').innerHTML = `
        <div class="muted">Lignes visibles : <strong>${nLines}</strong></div>
        <div class="muted">Longueur totale : <strong>${kmTot.toFixed(1)} km</strong></div>
      `;
    }

    function updateBars() {
      const active = visibleModes();
      const byMode = Array.from(
        d3.rollup(lengthsKm.filter(d => active.has(d.mode)), v => d3.sum(v, d => d.km), d => d.mode),
        ([mode, km]) => ({ mode, km })
      ).sort((a,b)=> b.km - a.km);

      const el = d3.select('#bar-wrap');
      el.selectAll('*').remove();

      const W = el.node().clientWidth || 600, H = 300;
      const m = { t: 20, r: 20, b: 40, l: 80 };

      const svg = el.append('svg').attr('viewBox',[0,0,W,H]).attr('width','100%').attr('height','100%');
      const x = d3.scaleLinear().domain([0, d3.max(byMode, d => d.km) || 1]).range([m.l, W - m.r]);
      const y = d3.scaleBand().domain(byMode.map(d => d.mode)).range([m.t, H - m.b]).padding(0.12);

      svg.append('g').attr('transform',`translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d.toFixed(1)} km`));
      svg.append('g').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y));

      const bars = svg.append('g').selectAll('rect').data(byMode).join('rect')
        .attr('x', x(0)).attr('y', d => y(d.mode)).attr('height', y.bandwidth()).attr('width', 0)
        .attr('fill', d => colorByMode(d.mode));

      bars.transition().duration(600).attr('width', d => x(d.km) - x(0));

      svg.append('g').selectAll('text.label').data(byMode).join('text')
        .attr('x', d => x(d.km) + 6).attr('y', d => y(d.mode) + y.bandwidth()/2 + 4)
        .text(d => `${d.km.toFixed(1)} km`);
    }

    updateStats();
    updateBars();

    // Invalidate size once visible
    requestAnimationFrame(() => map.invalidateSize());
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    cleanups.push(() => window.removeEventListener('resize', onResize));

    // ---------- Cleanup ----------
    return () => {
      cleanups.forEach(fn => { try { fn(); } catch {} });
    };
  }
};
