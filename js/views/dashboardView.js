import { fetchCSV } from '../utils/fetchData.js';
import { lineChart, simpleTable } from '../utils/chartUtils.js';

export default {
  title: 'Tableau de bord',
  async mount(root, { state }) {
    // Layout
    root.innerHTML = `
      <div class="span-12 card">
        <h1>Vue d’ensemble</h1>
        <p class="muted">Synthèse des indicateurs clés — dernière mise à jour issue des fichiers CSV.</p>
      </div>

      <div class="span-4 card kpi" id="kpi1">
        <div class="label">Occup. parkings (médiane)</div>
        <div class="value" id="kpi-occup">—</div>
        <div class="hint muted">Aujourd’hui</div>
      </div>
      <div class="span-4 card kpi" id="kpi2">
        <div class="label">Trajets vélo (J-7)</div>
        <div class="value" id="kpi-bike">—</div>
        <div class="hint muted">Capteurs</div>
      </div>
      <div class="span-4 card kpi" id="kpi3">
        <div class="label">Indice ATMO</div>
        <div class="value" id="kpi-atmo">—</div>
        <div class="hint muted">Plus bas = meilleur</div>
      </div>

      <div class="span-6 card">
        <h2>Évolution mobilités douces</h2>
        <div class="chart" id="chart-mobilite"></div>
      </div>
      <div class="span-6 card">
        <h2>Top parkings par occupation</h2>
        <div id="table-parking"></div>
      </div>
    `;

    // --- Demo data bindings (adapt paths to your CSVs) ---
    // These are robust to missing files: they'll just no-op.
    let cleanups = [];

    try {
      const mobilite = await fetchCSV('./data/mobilite_douce/trends.csv'); // expect {date, count}
      const parseDate = d => (d.date instanceof Date ? d.date : new Date(d.date));
      const chartEl = root.querySelector('#chart-mobilite');
      cleanups.push(lineChart(chartEl, mobilite, {
        x: d => parseDate(d), y: d => d.count,
        xLabel: 'Date', yLabel: 'Comptages'
      }));
      const last = mobilite.at(-1);
      if (last) root.querySelector('#kpi-bike .value').textContent = Intl.NumberFormat('fr-FR').format(last.count);
    } catch {}

    try {
      const parking = await fetchCSV('./data/parking/occupation.csv'); // expect {nom, taux, date}
      const kpi = median(parking.map(d => Number(d.taux))).toFixed(0) + '%';
      root.querySelector('#kpi-occup .value').textContent = kpi;

      const top = parking.sort((a,b) => b.taux - a.taux).slice(0, 8);
      const tableEl = root.querySelector('#table-parking');
      cleanups.push(simpleTable(tableEl, top, { columns: ['nom', 'taux'] }));
    } catch {}

    try {
      const qa = await fetchCSV('./data/qualite_air/daily_atmo.csv'); // expect {date, atmo}
      const last = qa.at(-1);
      if (last) root.querySelector('#kpi-atmo .value').textContent = last.atmo;
    } catch {}

    function median(arr) {
      if (!arr.length) return 0;
      const a = [...arr].sort((x,y)=>x-y), mid = Math.floor(a.length/2);
      return a.length % 2 ? a[mid] : (a[mid-1] + a[mid]) / 2;
    }

    // return cleanup
    return () => cleanups.forEach(fn => { try { fn(); } catch {} });
  }
};
