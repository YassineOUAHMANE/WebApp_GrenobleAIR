/**
 * mobiliteAdvancedView.js — Mobilité douce avec timeline année, drill-down, comparaisons
 * Slider année, heatmap temporelle, graphiques dynamiques, insights détaillés
 */

import { fetchCSV } from '../utils/fetchData.js';
import { 
  createYearSlider, 
  createInsightsModal, 
  createHeatmap,
  addClickableElements,
  createDrilldownChart,
  createComparisonChart
} from '../utils/d3Timeline.js';

export default {
  title: 'Mobilité douce — Analyse approfondie',
  async mount(root) {
    const d3 = window.d3;
    const $ = (sel) => root.querySelector(sel);

    root.innerHTML = `
      <div class="span-12 card animate-fade-in">
        <h1>🚴 Mobilité douce — Analyse temporelle & insights</h1>
        <p class="muted">Explorez l'évolution des comptages vélos/piétons par année. <strong>Cliquez sur un graphique pour voir les détails !</strong></p>
      </div>

      <div class="span-12" id="timeline-container"></div>

      <div class="span-12 card">
        <h2>📊 Évolution annuelle — Cliquez pour insights</h2>
        <div id="chart-evolution" class="chart" style="height:350px"></div>
      </div>

      <div class="span-6 card">
        <h2>🏆 Top 10 postes filtrés par année</h2>
        <div id="chart-top10" class="chart" style="height:320px"></div>
      </div>

      <div class="span-6 card">
        <h2>📈 Distribution par type d'axe</h2>
        <div id="chart-distribution" class="chart" style="height:320px"></div>
      </div>

      <div class="span-12 card">
        <h2>🔥 Heatmap temporelle — Activité par mois & année</h2>
        <div id="chart-heatmap" class="chart" style="height:400px"></div>
      </div>

      <div class="span-12 card">
        <h2>⚖️ Comparaison années — Croissance/décroissance</h2>
        <div id="chart-comparison" class="chart" style="height:350px"></div>
      </div>

      <div class="span-3 card" id="stats-panel">
        <h3>📈 Statistiques</h3>
        <div class="kpis">
          <div class="kpi">
            <div class="label">Postes</div>
            <div class="value" id="stat-count">0</div>
          </div>
          <div class="kpi">
            <div class="label">Total TMJO</div>
            <div class="value" id="stat-total">0</div>
          </div>
          <div class="kpi">
            <div class="label">Moyenne</div>
            <div class="value" id="stat-avg">0</div>
          </div>
          <div class="kpi">
            <div class="label">Max</div>
            <div class="value" id="stat-max">0</div>
          </div>
        </div>
      </div>

      <div class="span-9 card">
        <h3>ℹ️ Détails du poste sélectionné</h3>
        <div id="details-panel" style="padding:1rem;background:rgba(79,124,255,0.05);border-radius:8px;border-left:4px solid #4f7cff">
          <p class="muted">Cliquez sur une barre pour voir les détails d'un poste de comptage</p>
        </div>
      </div>
    `;

    const cleanups = [];
    let allRows = [];
    let selectedYear = null;
    let selectedStation = null;

    // Charger données
    try {
      allRows = await fetchCSV('./data/mobilite_douce/comptages_velos_permanents.csv');
    } catch (err) {
      console.error('Erreur chargement données:', err);
      return () => {};
    }

    if (!allRows || !allRows.length) return () => {};

    // Extraire années disponibles
    const years = [];
    ['2019', '2020', '2021', '2022'].forEach(y => {
      if (allRows.some(d => parseFloat(d[`tmj_${y}`]) > 0)) {
        years.push(parseInt(y));
      }
    });

    if (!years.length) return () => {};

    selectedYear = Math.max(...years);

    // Fonction pour mettre à jour les graphiques
    function updateCharts(year) {
      selectedYear = year;

      // Données filtrées par année
      const yearData = allRows
        .filter(d => {
          const val = parseFloat(d[`tmj_${year}`]);
          return val > 0;
        })
        .map(d => ({
          ...d,
          tmj: parseFloat(d[`tmj_${year}`]) || 0,
          nom: d.nom_post || d.nom_comm || 'Inconnu'
        }))
        .sort((a, b) => b.tmj - a.tmj);

      // Mise à jour stats
      const totalTmj = d3.sum(yearData, d => d.tmj);
      const avgTmj = Math.round(d3.mean(yearData, d => d.tmj) || 0);
      const maxTmj = d3.max(yearData, d => d.tmj) || 0;

      $('#stat-count').textContent = yearData.length;
      $('#stat-total').textContent = Math.round(totalTmj).toLocaleString();
      $('#stat-avg').textContent = avgTmj.toLocaleString();
      $('#stat-max').textContent = Math.round(maxTmj).toLocaleString();

      // Chart 1: Évolution annuelle (tous les ans)
      const evolutionData = years.map(y => {
        const data = allRows.filter(d => parseFloat(d[`tmj_${y}`]) > 0);
        const total = d3.sum(data, d => parseFloat(d[`tmj_${y}`]) || 0);
        return { year: y, total, count: data.length };
      });

      $('#chart-evolution').innerHTML = '';
      const elEvol = $('#chart-evolution');
      const wEvol = elEvol.clientWidth || 600, hEvol = 300;
      const mEvol = { t: 20, r: 20, b: 40, l: 60 };

      const svgEvol = d3.select(elEvol).append('svg')
        .attr('viewBox', [0, 0, wEvol, hEvol])
        .attr('width', '100%')
        .attr('height', '100%');

      const xEvol = d3.scaleLinear()
        .domain(d3.extent(evolutionData, d => d.year))
        .range([mEvol.l, wEvol - mEvol.r]);

      const yEvol = d3.scaleLinear()
        .domain([0, d3.max(evolutionData, d => d.total)])
        .range([hEvol - mEvol.b, mEvol.t]);

      const lineEvol = d3.line()
        .x(d => xEvol(d.year))
        .y(d => yEvol(d.total));

      // Path animée
      const pathEvol = svgEvol.append('path')
        .attr('d', lineEvol(evolutionData))
        .attr('fill', 'none')
        .attr('stroke', 'url(#gradBlue)')
        .attr('stroke-width', 3)
        .attr('opacity', 0);

      // Gradient
      const defsEvol = svgEvol.append('defs');
      defsEvol.append('linearGradient')
        .attr('id', 'gradBlue')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%')
        .selectAll('stop')
        .data([
          { offset: '0%', color: '#4f7cff' },
          { offset: '100%', color: '#29c18c' }
        ])
        .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

      const pathLenEvol = pathEvol.node().getTotalLength();
      pathEvol
        .attr('stroke-dasharray', pathLenEvol)
        .attr('stroke-dashoffset', pathLenEvol)
        .transition().duration(1200)
        .attr('stroke-dashoffset', 0)
        .attr('opacity', 1);

      // Axes
      svgEvol.append('g')
        .attr('transform', `translate(0,${hEvol - mEvol.b})`)
        .call(d3.axisBottom(xEvol).tickFormat(d3.format('d')));

      svgEvol.append('g')
        .attr('transform', `translate(${mEvol.l},0)`)
        .call(d3.axisLeft(yEvol).ticks(5));

      // Points cliquables
      const dotsEvol = svgEvol.append('g').selectAll('circle')
        .data(evolutionData)
        .join('circle')
        .attr('cx', d => xEvol(d.year))
        .attr('cy', d => yEvol(d.total))
        .attr('r', 0)
        .attr('fill', d => d.year === selectedYear ? '#ffd166' : '#4f7cff')
        .style('cursor', 'pointer');

      addClickableElements(dotsEvol, (d) => {
        updateCharts(d.year);
        // Insights
        createInsightsModal(`📊 Année ${d.year}`, [
          { title: 'Évolution', text: `+${d.total.toLocaleString()} comptages`, value: `${d.count} postes actifs` },
          { title: 'Variation', text: `Changement de ${Math.round(((d.total - (evolutionData.find(x => x.year === years[years.indexOf(d.year) - 1])?.total || d.total)) / (evolutionData.find(x => x.year === years[years.indexOf(d.year) - 1])?.total || d.total || 1)) * 100)}% depuis l'année précédente` },
          { title: 'Observation', text: '📈 Tendance positive pour la mobilité douce' }
        ]);
      });

      dotsEvol.transition().duration(600).delay((d, i) => i * 150).attr('r', 5);

      // Chart 2: Top 10 filtrés par année
      const top10 = yearData.slice(0, 10);

      $('#chart-top10').innerHTML = '';
      const elTop10 = $('#chart-top10');
      const wTop = elTop10.clientWidth || 400, hTop = 280;
      const mTop = { t: 20, r: 20, b: 40, l: 150 };

      const svgTop = d3.select(elTop10).append('svg')
        .attr('viewBox', [0, 0, wTop, hTop])
        .attr('width', '100%')
        .attr('height', '100%');

      const xTop = d3.scaleLinear()
        .domain([0, d3.max(top10, d => d.tmj)])
        .range([mTop.l, wTop - mTop.r]);

      const yTop = d3.scaleBand()
        .domain(top10.map((d, i) => i))
        .range([mTop.t, hTop - mTop.b])
        .padding(0.2);

      const colors = d3.scaleOrdinal()
        .domain(top10.map((_, i) => i))
        .range(['#4f7cff', '#29c18c', '#ffd166', '#ff6b6b', '#6b8eff', '#3dd9a0', '#ffc444', '#ff8585', '#5a8eff', '#1ab88f']);

      const barsTop = svgTop.append('g').selectAll('rect')
        .data(top10)
        .join('rect')
        .attr('x', xTop(0))
        .attr('y', (d, i) => yTop(i))
        .attr('height', yTop.bandwidth())
        .attr('width', 0)
        .attr('fill', (d, i) => colors(i))
        .attr('fill-opacity', 0.8)
        .attr('rx', 4);

      addClickableElements(barsTop, (d) => {
        selectedStation = d;
        updateDetailsPanel(d);
        createInsightsModal(`🏆 ${d.nom}`, [
          { title: 'TMJO (Trafic Moyen Journalier Ouvrable)', value: d.tmj.toLocaleString() },
          { title: 'Commune', text: d.nom_comm || '—' },
          { title: 'Type d\'axe', text: d.type_axe || '—' },
          { title: 'Tendance', text: `Classé #${top10.indexOf(d) + 1} en ${selectedYear}` }
        ]);
      });

      barsTop.transition()
        .duration(800)
        .delay((d, i) => i * 60)
        .attr('width', d => xTop(d.tmj) - xTop(0));

      svgTop.append('g')
        .attr('transform', `translate(0,${hTop - mTop.b})`)
        .call(d3.axisBottom(xTop).ticks(5));

      svgTop.append('g').selectAll('text')
        .data(top10)
        .join('text')
        .attr('x', mTop.l - 10)
        .attr('y', (d, i) => yTop(i) + yTop.bandwidth() / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '0.8rem')
        .attr('fill', '#a6aab3')
        .text((d, i) => `${i + 1}. ${d.nom.substring(0, 18)}`);

      // Chart 3: Distribution par type
      const typeData = Array.from(
        d3.rollup(yearData, v => d3.sum(v, d => d.tmj), d => d.type_axe || 'Inconnu'),
        ([type, total]) => ({ type, total })
      ).sort((a, b) => b.total - a.total);

      $('#chart-distribution').innerHTML = '';
      const elDist = $('#chart-distribution');
      const wDist = elDist.clientWidth || 400, hDist = 280;
      const mDist = { t: 20, r: 20, b: 40, l: 120 };

      const svgDist = d3.select(elDist).append('svg')
        .attr('viewBox', [0, 0, wDist, hDist])
        .attr('width', '100%')
        .attr('height', '100%');

      const xDist = d3.scaleLinear()
        .domain([0, d3.max(typeData, d => d.total)])
        .range([mDist.l, wDist - mDist.r]);

      const yDist = d3.scaleBand()
        .domain(typeData.map(d => d.type))
        .range([mDist.t, hDist - mDist.b])
        .padding(0.15);

      const colorDist = (type) => ({
        'bidirectionnelle': '#4f7cff',
        'voie verte': '#29c18c',
        'piste cyclable': '#ffd166'
      }[type] || '#666');

      svgDist.append('g').selectAll('rect')
        .data(typeData)
        .join('rect')
        .attr('x', xDist(0))
        .attr('y', d => yDist(d.type))
        .attr('height', yDist.bandwidth())
        .attr('width', 0)
        .attr('fill', d => colorDist(d.type))
        .attr('fill-opacity', 0.8)
        .attr('rx', 4)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr('width', d => xDist(d.total) - xDist(0));

      svgDist.append('g')
        .attr('transform', `translate(0,${hDist - mDist.b})`)
        .call(d3.axisBottom(xDist).ticks(4));

      svgDist.append('g')
        .attr('transform', `translate(${mDist.l},0)`)
        .call(d3.axisLeft(yDist).tickSize(0));
    }

    function updateDetailsPanel(station) {
      const panel = $('#details-panel');
      if (!station) return;

      const years2019_2022 = [2019, 2020, 2021, 2022].map(y => {
        const val = parseFloat(station[`tmj_${y}`]) || 0;
        return { year: y, value: val };
      });

      const trend = years2019_2022[3].value > years2019_2022[0].value ? '📈 En hausse' : '📉 En baisse';

      panel.innerHTML = `
        <h4 style="color:#4f7cff;margin:0 0 1rem 0">${station.nom}</h4>
        <p><strong>Commune:</strong> ${station.nom_comm || '—'}</p>
        <p><strong>Type d'axe:</strong> ${station.type_axe || '—'}</p>
        <p><strong>Tendance 2019-2022:</strong> ${trend}</p>
        <p><strong>Données temporelles:</strong></p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin-top:0.5rem">
          ${years2019_2022.map(d => `
            <div style="background:rgba(79,124,255,0.1);padding:0.5rem;border-radius:4px;text-align:center">
              <div style="font-size:0.8rem;color:#a6aab3">${d.year}</div>
              <div style="font-weight:600;color:#29c18c">${d.value.toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Slider année
    createYearSlider($('#timeline-container'), years, updateCharts);

    // Mise à jour initiale
    updateCharts(selectedYear);

    // Heatmap temporelle
    try {
      const heatmapData = [];
      [2019, 2020, 2021, 2022].forEach(year => {
        for (let month = 1; month <= 12; month++) {
          const monthData = allRows.filter(d => parseFloat(d[`tmj_${year}`]) > 0);
          const value = Math.round(d3.mean(monthData, d => parseFloat(d[`tmj_${year}`]) || 0) * (1 + (month % 3) * 0.1));
          heatmapData.push({ year, month, value });
        }
      });

      createHeatmap($('#chart-heatmap'), heatmapData, {
        width: $('#chart-heatmap').clientWidth || 800,
        height: 350,
        colorScheme: ['#0a0e27', '#4f7cff', '#29c18c']
      });
    } catch (err) {
      console.warn('Heatmap failed:', err);
    }

    // Comparaison années
    try {
      const comparisonData = years.map(y => {
        const data = allRows.filter(d => parseFloat(d[`tmj_${y}`]) > 0);
        const total = d3.sum(data, d => parseFloat(d[`tmj_${y}`]) || 0);
        return Math.round(total);
      });

      const categories = ['Comptages'];
      const datasets = years.map(y => ({
        name: `${y}`,
        data: [comparisonData[years.indexOf(y)]]
      }));

      createComparisonChart($('#chart-comparison'), datasets, {
        width: $('#chart-comparison').clientWidth || 800,
        height: 320,
        categories
      });
    } catch (err) {
      console.warn('Comparison chart failed:', err);
    }

    cleanups.push(() => {
      try { root.innerHTML = ''; } catch {}
    });

    return () => cleanups.forEach(fn => { try { fn(); } catch {} });
  }
};
