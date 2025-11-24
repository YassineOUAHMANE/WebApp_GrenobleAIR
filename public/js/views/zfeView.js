import { fetchCSV } from '../utils/fetchData.js';
import { featureCollectionFromRows, addGeoJSON, fitToGeoJSON, addCircleMarkersFromPointCol } from '../utils/mapUtils.js';

export default {
  linkTitle: 'ZFE',
  title: 'Zone à Faibles Émissions (ZFE)',
  icon: 'car',
  async mount(root) {
    // --- Layout
    root.innerHTML = `
    <h2 class="title">ZFE — périmètre, axes, voies, aires & infrastructures</h2>
    <p>Activez/désactivez les couches et explorez les règles par voie.</p>
        
    <section class="grid">

      <div class="span-3 card" id="controls">
        <h3>Calques</h3>
        <label><input type="checkbox" id="chk-perim" checked> Périmètre</label><br/>
        <label><input type="checkbox" id="chk-axes" checked> Axes</label><br/>
        <label><input type="checkbox" id="chk-voies" checked> Voies</label><br/>
        <label><input type="checkbox" id="chk-aires" checked> Aires</label><br/>
        <label><input type="checkbox" id="chk-infra" checked> Infrastructures</label>
        <hr>
        <h4>Filtre popup “Crit’Air”</h4>
        <small class="muted">Le filtre n’affiche que le contenu du popup des voies/aires pour la catégorie choisie.</small>
        <select id="select-cat" style="margin-top:.5rem; width:100%">
          <option value="vp">Voitures (VP)</option>
          <option value="vul">VUL</option>
          <option value="pl">Poids lourds (PL)</option>
          <option value="autobus_autocars">Autobus / autocars</option>
          <option value="deux_rm">2-roues motorisés</option>
        </select>
        <p class="muted" style="margin-top:.5rem">Survoler une voie met en évidence la géométrie.</p>
      </div>

     <div class="span-9 card" id="map-wrap">
        <div id="zfe-map" class="map-hero"></div>
     </div>


      <div class="span-12 card">
        <h2>Infrastructures — répartition par type</h2>
        <div id="infra-bars" class="chart"></div>
      </div>
    </grid>
    `;

    // --- Init Leaflet
    const map = (function initMap(el) {
      if (!window.L) throw new Error('Leaflet manquant (index.html).');
      const m = L.map(el).setView([45.19, 5.72], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(m);
      return m;
    })(root.querySelector('#zfe-map'));

    const cleanups = [];

    // --- Chargement des CSV
    const [perimRows, axesRows, voiesRows, airesRows, infraRows] = await Promise.all([
      fetchCSV('./data/zfe/perimetre_zfe.csv'),
      fetchCSV('./data/zfe/axes_zfe.csv'),
      fetchCSV('./data/zfe/zfevoies.csv'),
      fetchCSV('./data/zfe/zfeaires.csv'),
      fetchCSV('./data/zfe/infrastructures_zfe.csv'),
    ]);

    // --- Conversions en GeoJSON
    const perimFC = featureCollectionFromRows(perimRows);
    const axesFC  = featureCollectionFromRows(axesRows);
    const voiesFC = featureCollectionFromRows(voiesRows);
    const airesFC = featureCollectionFromRows(airesRows);

    // --- Styles
    const stylePerim = { color: '#29c18c', weight: 2, fillOpacity: 0.08 };
    const styleAxes  = { color: '#2b5cff', weight: 3, opacity: 0.8 };
    const styleVoies = { color: '#ffd166', weight: 2, opacity: 0.9 };
    const styleAires = { color: '#ff6b6b', weight: 2, fillOpacity: 0.07 };

    // --- Catégorie de popup (Crit'Air)
    let currentCat = 'vp';
    const catSelect = root.querySelector('#select-cat');
    catSelect.addEventListener('change', () => { currentCat = catSelect.value; });

    // --- Popups
    const voiePopup = (props) => {
      // props contient toutes les colonnes (sans geo_shape)
      const c = currentCat;
      const crit = props?.[`${c}_critair`];
      const hrs  = props?.[`${c}_horaires`];
      const lines = [];
      if (crit != null && String(crit).trim() !== '' && String(crit).toLowerCase() !== 'nan') {
        lines.push(`<tr><th>Crit’Air</th><td>${crit}</td></tr>`);
      }
      if (hrs != null && String(hrs).trim() !== '' && String(hrs).toLowerCase() !== 'nan') {
        lines.push(`<tr><th>Horaires</th><td>${hrs}</td></tr>`);
      }
      lines.push(`<tr><th>Arrêté</th><td>${props?.url_arrete ? `<a target="_blank" href="${props.url_arrete}">ouvrir</a>` : '—'}</td></tr>`);
      lines.push(`<tr><th>Site</th><td>${props?.url_site ? `<a target="_blank" href="${props.url_site}">ouvrir</a>` : '—'}</td></tr>`);
      return `
        <div style="min-width:220px">
          <strong>Voie</strong><br/>
          <small>${props?.id ?? ''}</small>
          <table class="table" style="margin-top:.25rem">
            ${lines.join('')}
          </table>
        </div>`;
    };

    const airePopup = (props) => {
      const c = currentCat;
      const crit = props?.[`${c}_critair`];
      const hrs  = props?.[`${c}_horaires`];
      return `
        <div style="min-width:220px">
          <strong>Aire ZFE</strong>
          <table class="table" style="margin-top:.25rem">
            <tr><th>Crit’Air</th><td>${crit ?? '—'}</td></tr>
            <tr><th>Horaires</th><td>${hrs ?? '—'}</td></tr>
          </table>
        </div>`;
    };

    const highlightOnHover = (layer, baseStyle, hiStyle = { weight: baseStyle.weight + 2, opacity: 1 }) => {
      layer.on('mouseover', () => layer.setStyle(hiStyle));
      layer.on('mouseout',  () => layer.setStyle(baseStyle));
    };

    // --- Couches (actives par défaut)
    let removePerim = addGeoJSON(map, perimFC, {
      style: stylePerim,
      onEachFeature: (feat, layer) => {
        layer.bindPopup('<strong>Périmètre ZFE</strong>');
      }
    });
    let removeAxes = addGeoJSON(map, axesFC, {
      style: styleAxes,
      onEachFeature: (feat, layer) => {
        layer.bindPopup('<strong>Axe ZFE</strong>');
        highlightOnHover(layer, styleAxes);
      }
    });
    let removeVoies = addGeoJSON(map, voiesFC, {
      style: styleVoies,
      onEachFeature: (feat, layer) => {
        layer.bindPopup(voiePopup(feat.properties));
        highlightOnHover(layer, styleVoies);
      }
    });
    let removeAires = addGeoJSON(map, airesFC, {
      style: styleAires,
      onEachFeature: (feat, layer) => {
        layer.bindPopup(airePopup(feat.properties));
      }
    });

    // Infrastructures (points)
    const colorByType = (t) => ({
      irve: '#29c18c',
      gpl: '#ffb703',
      gnv: '#219ebc',
      gnv_projet: '#8ecae6',
      hydrogene: '#9b5de5'
    }[String(t || '').toLowerCase()] || '#4f7cff');

    let removeInfra = addCircleMarkersFromPointCol(map, infraRows, {
      radius: 6,
      color: (r) => colorByType(r.type),
      popup: (r) => `<strong>${r.libelle || r.nom || r.type}</strong><br/><small>${r.adresse || ''} ${r.code_postal || ''} ${r.commune || ''}</small>`
    });

    cleanups.push(() => { try { map.remove(); } catch {} });

    // Ajuste la vue sur le périmètre
    fitToGeoJSON(map, perimFC);

    // --- Controls (toggles)
    const $ = (sel) => root.querySelector(sel);
    $('#chk-perim').addEventListener('change', e => {
      if (e.target.checked) removePerim = addGeoJSON(map, perimFC, { style: stylePerim, onEachFeature: (f,l)=>l.bindPopup('<strong>Périmètre ZFE</strong>') });
      else { try { removePerim(); } catch {} }
    });
    $('#chk-axes').addEventListener('change', e => {
      if (e.target.checked) removeAxes = addGeoJSON(map, axesFC, { style: styleAxes, onEachFeature: (f,l)=>{ l.bindPopup('<strong>Axe ZFE</strong>'); highlightOnHover(l, styleAxes);} });
      else { try { removeAxes(); } catch {} }
    });
    $('#chk-voies').addEventListener('change', e => {
      if (e.target.checked) removeVoies = addGeoJSON(map, voiesFC, { style: styleVoies, onEachFeature: (f,l)=>{ l.bindPopup(voiePopup(f.properties)); highlightOnHover(l, styleVoies);} });
      else { try { removeVoies(); } catch {} }
    });
    $('#chk-aires').addEventListener('change', e => {
      if (e.target.checked) removeAires = addGeoJSON(map, airesFC, { style: styleAires, onEachFeature: (f,l)=> l.bindPopup(airePopup(f.properties)) });
      else { try { removeAires(); } catch {} }
    });
    $('#chk-infra').addEventListener('change', e => {
      if (e.target.checked) removeInfra = addCircleMarkersFromPointCol(map, infraRows, {
        radius: 6,
        color: (r) => colorByType(r.type),
        popup: (r) => `<strong>${r.libelle || r.nom || r.type}</strong><br/><small>${r.adresse || ''} ${r.code_postal || ''} ${r.commune || ''}</small>`
      });
      else { try { removeInfra(); } catch {} }
    });

    // --- Mini bar chart D3 animé (répartition des infrastructures par type)
    try {
      const d3 = window.d3;
      const byType = Array.from(d3.rollup(infraRows, v => v.length, d => String(d.type || 'inconnu')), ([type, count]) => ({ type, count }))
                          .sort((a,b)=> b.count - a.count);
      const el = root.querySelector('#infra-bars');
      const width = el.clientWidth || 600, height = 320, margin = { t: 20, r: 20, b: 40, l: 120 };

      const svg = d3.select(el).append('svg').attr('viewBox',[0,0,width,height]).attr('width','100%').attr('height','100%');

      const x = d3.scaleLinear().domain([0, d3.max(byType, d => d.count) || 1]).range([margin.l, width - margin.r]);
      const y = d3.scaleBand().domain(byType.map(d => d.type)).range([margin.t, height - margin.b]).padding(0.15);

      svg.append('g').attr('transform', `translate(0,${height - margin.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')));
      svg.append('g').attr('transform', `translate(${margin.l},0)`).call(d3.axisLeft(y));

      const bars = svg.append('g').selectAll('rect').data(byType).join('rect')
        .attr('x', x(0)).attr('y', d => y(d.type))
        .attr('height', y.bandwidth()).attr('width', 0)
        .attr('fill', 'currentColor');

      bars.transition().duration(700).attr('width', d => x(d.count) - x(0));

      const labels = svg.append('g').selectAll('text.count').data(byType).join('text')
        .attr('class','count').attr('x', d => x(d.count) + 6).attr('y', d => y(d.type) + y.bandwidth()/2 + 4)
        .text(d => d.count);

      cleanups.push(() => { try { el.innerHTML = ''; } catch {} });
    } catch {}

    // --- Nettoyage
    return () => {
      try { removePerim(); } catch {}
      try { removeAxes(); } catch {}
      try { removeVoies(); } catch {}
      try { removeAires(); } catch {}
      try { removeInfra(); } catch {}
      cleanups.forEach(fn => { try { fn(); } catch {} });
    };
  }
};
