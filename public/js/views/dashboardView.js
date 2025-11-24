/**
 * dashboardView.js — Vue d'accueil avec KPIs animés
 * Statistiques clés, animations entrantes, données en temps réel
 */
import { loadCSV } from '../utils/csv.js';

const animateCounter = (element, finalValue, duration = 1000) => {
  let currentValue = 0;
  const increment = finalValue / (duration / 30);
  const interval = setInterval(() => {
    currentValue += increment;
    if (currentValue >= finalValue) {
      currentValue = finalValue;
      clearInterval(interval);
    }
    element.textContent = Math.floor(currentValue).toLocaleString();
  }, 30);
};

export default {
  title: 'Tableau de bord',
  async mount(root) {
    root.innerHTML = `
      <div class="span-12" style="background: linear-gradient(135deg, rgba(79,124,255,0.1), rgba(41,193,140,0.1)); border-radius: 16px; padding: 2rem; border: 1px solid rgba(79,124,255,0.2); margin-bottom: 1rem; animation: fadeIn 0.6s ease;">
        <h1 style="margin-top: 0; font-size: 2.2rem;">📊 Tableau de bord</h1>
        <p style="color: var(--text-secondary); font-size: 1.1rem; margin: 0.5rem 0 0 0;">Mobilité & Environnement Grenoble-Alpes Métropole</p>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.15s">
        <h2 style="margin-top:0; margin-bottom: 1.5rem">🎯 Statistiques en direct</h2>
        <div class="kpis" id="kpis-container">
          <div class="kpi">
            <div class="kpi-icon">🅿️</div>
            <div class="label">Places de parking</div>
            <div class="value" id="kpi-parking">—</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;" id="kpi-parking-sub">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">🚴</div>
            <div class="label">Comptages vélos</div>
            <div class="value" id="kpi-velos">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">🚌</div>
            <div class="label">Lignes de transport</div>
            <div class="value" id="kpi-transport">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">⚡</div>
            <div class="label">Stations de recharge</div>
            <div class="value" id="kpi-irve">—</div>
          </div>
        </div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.3s">
        <h3 style="margin-top:0">� Explorez les données</h3>
        <div style="display: grid; gap: 0.75rem;">
          <a href="#/parking" style="padding: 1rem; background: linear-gradient(135deg, rgba(79,124,255,0.15), transparent); border: 1px solid rgba(79,124,255,0.3); border-radius: 12px; color: inherit; transition: all 0.3s; display: flex; align-items: center; gap: 0.75rem; text-decoration: none;">
            <span style="font-size: 2rem;">🅿️</span>
            <div>
              <div style="font-weight: 600; color: var(--primary);">Stationnement</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Répartition & disponibilité</div>
            </div>
          </a>
          <a href="#/mobilite" style="padding: 1rem; background: linear-gradient(135deg, rgba(41,193,140,0.15), transparent); border: 1px solid rgba(41,193,140,0.3); border-radius: 12px; color: inherit; transition: all 0.3s; display: flex; align-items: center; gap: 0.75rem; text-decoration: none;">
            <span style="font-size: 2rem;">🚴</span>
            <div>
              <div style="font-weight: 600; color: var(--secondary);">Mobilité douce</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Vélos & piétons</div>
            </div>
          </a>
          <a href="#/lignes" style="padding: 1rem; background: linear-gradient(135deg, rgba(255,209,102,0.15), transparent); border: 1px solid rgba(255,209,102,0.3); border-radius: 12px; color: inherit; transition: all 0.3s; display: flex; align-items: center; gap: 0.75rem; text-decoration: none;">
            <span style="font-size: 2rem;">🚌</span>
            <div>
              <div style="font-weight: 600; color: var(--accent);">Transport public</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Lignes TAG & arrêts</div>
            </div>
          </a>
        </div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.45s">
        <h3 style="margin-top:0">✨ Caractéristiques</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="padding-left: 0.75rem; border-left: 4px solid var(--primary);">
            <div style="font-weight: 600; color: var(--primary);">⚡ Temps réel</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">Données actualisées automatiquement</div>
          </div>
          <div style="padding-left: 0.75rem; border-left: 4px solid var(--secondary);">
            <div style="font-weight: 600; color: var(--secondary);">📊 Visualisations</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">Graphiques animés et interactifs</div>
          </div>
          <div style="padding-left: 0.75rem; border-left: 4px solid var(--accent);">
            <div style="font-weight: 600; color: var(--accent);">🎨 Design moderne</div>
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">Interface élégante et responsive</div>
          </div>
        </div>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.6s">
        <h2 style="margin-top:0;">📈 Vue d'ensemble</h2>
        <div id="summary-chart" class="chart" style="height:360px; min-height: 360px;"></div>
      </div>
    `;

    const d3 = window.d3;
    const cleanups = [];

    // Charger les données et remplir les KPIs
    try {
      const [parking, velos, transport, irve] = await Promise.all([
        loadCSV('./data/parking/parking.csv'),
        loadCSV('./data/mobilite_douce/comptages_velos_permanents.csv'),
        loadCSV('./data/transport_public/lignes_du_transport_du_réseaux_Tag.csv'),
        loadCSV('./data/irve/irve_normalise_etalab.csv')
      ]);

      // Calculer les statistiques
      const parkingCount = parking.reduce((sum, row) => {
        const nb = parseInt(row.nb_places) || 0;
        return sum + nb;
      }, 0);

      const parkingNumber = parking.filter(row => row.nb_places && parseInt(row.nb_places) > 0).length;

      const velosCount = velos.length;
      const transportCount = transport.length;
      const irveCount = irve.length;

      // Animer les KPIs
      setTimeout(() => {
        animateCounter(root.querySelector('#kpi-parking'), parkingCount, 1200);
        root.querySelector('#kpi-parking-sub').textContent = `${parkingNumber} parkings`;
        animateCounter(root.querySelector('#kpi-velos'), velosCount, 1200);
        animateCounter(root.querySelector('#kpi-transport'), transportCount, 1200);
        animateCounter(root.querySelector('#kpi-irve'), irveCount, 1200);
      }, 200);

      // Créer le graphique résumé
      const summaryData = [
        { label: 'Parkings', count: parkingNumber, color: '#4f7cff', icon: '🅿️' },
        { label: 'Comptages vélos', count: velosCount, color: '#29c18c', icon: '🚴' },
        { label: 'Lignes transport', count: transportCount, color: '#ffd166', icon: '🚌' },
        { label: 'Stations IRVE', count: irveCount, color: '#ff6b6b', icon: '⚡' }
      ];

      const chartEl = root.querySelector('#summary-chart');
      const w = chartEl.clientWidth || 800;
      const h = 360;
      const m = { t: 40, r: 40, b: 70, l: 180 };

      const svg = d3.select(chartEl).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      // Utiliser une échelle logarithmique pour mieux visualiser les différences
      const maxVal = Math.max(...summaryData.map(d => d.count)) || 1;
      const x = d3.scaleLog()
        .domain([1, maxVal * 1.5])
        .range([m.l, w - m.r]);

      const y = d3.scaleBand()
        .domain(summaryData.map(d => d.label))
        .range([m.t, h - m.b])
        .padding(0.45);

      // Axes stylisés
      const axisBottomGroup = svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d >= 1000 ? (d / 1000).toFixed(0) + 'k' : Math.round(d)))
        .style('color', 'var(--text-secondary)');
      
      axisBottomGroup.selectAll('line').style('stroke', 'rgba(79,124,255,0.1)');
      axisBottomGroup.selectAll('text').style('font-size', '0.85rem').style('fill', 'var(--text-secondary)');

      const axisLeftGroup = svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .style('color', 'var(--text-secondary)');
      
      axisLeftGroup.selectAll('text').style('font-size', '0.95rem').style('font-weight', '600').style('fill', 'var(--text-primary)');

      // Barres avec gradient
      svg.append('g').selectAll('rect')
        .data(summaryData)
        .join('rect')
        .attr('x', x(1))
        .attr('y', d => y(d.label))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', d => d.color)
        .attr('fill-opacity', 0.85)
        .attr('rx', 8)
        .attr('ry', 8)
        .on('mouseover', function (e, d) {
          d3.select(this).transition().duration(150)
            .attr('fill-opacity', 1)
            .attr('filter', 'drop-shadow(0 8px 16px rgba(79,124,255,0.3))');
        })
        .on('mouseout', function (e, d) {
          d3.select(this).transition().duration(150)
            .attr('fill-opacity', 0.85)
            .attr('filter', 'none');
        })
        .transition()
        .duration(1200)
        .delay((d, i) => i * 250)
        .attr('width', d => x(d.count) - x(1));

      // Valeurs avec icônes
      svg.append('g').selectAll('text')
        .data(summaryData)
        .join('text')
        .attr('x', d => x(d.count) + 16)
        .attr('y', d => y(d.label) + y.bandwidth() / 2 + 6)
        .attr('font-size', '1.1rem')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(d => d.count.toLocaleString())
        .style('opacity', 0)
        .transition()
        .duration(1200)
        .delay((d, i) => i * 250 + 900)
        .style('opacity', 1);

    } catch (err) {
      console.error('Dashboard error:', err);
    }

    cleanups.push(() => {
      try { root.innerHTML = ''; } catch {}
    });

    return () => cleanups.forEach(fn => { try { fn(); } catch {} });
  }
};
