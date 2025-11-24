import { fetchCSV } from '../utils/fetchData.js';
import { lineChart, simpleTable } from '../utils/chartUtils.js';

export default {
  title: 'À propos',
  async mount(root) {
    root.innerHTML = `
      <div class="span-12 card"><h1>À propos</h1></div>
      <div class="span-6 card">
        <h2>Occupation moyenne</h2>
        <div id="chart-occup" class="chart"></div>
      </div>
      <div class="span-6 card">
        <h2>Dernières mesures</h2>
        <div id="table-last"></div>
      </div>
    `;

    const cleanups = [];

    try {
      const time = await fetchCSV('./data/parking/disponibilité_parking.csv'); // {date, taux}
      const chartEl = root.querySelector('#chart-occup');
      cleanups.push(lineChart(chartEl, time, {
        x: d => new Date(d.date),
        y: d => Number(d.taux),
        xLabel: 'Date', yLabel: 'Taux %', formatY: v => `${v}%`
      }));
    } catch {}

    try {
      const last = await fetchCSV('./data/parking/disponibilité_parking.csv'); // {nom, taux, date}
      const latest = last.sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0, 12);
      cleanups.push(simpleTable(root.querySelector('#table-last'), latest, { columns: ['date','nom','taux'] }));
    } catch {}

    return () => cleanups.forEach(fn => { try { fn(); } catch {} });
  }
};
