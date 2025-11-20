/**
 * mobiliteView.js - Vue de mobilité douce avec timeline interactive
 * Analyse des comptages vélo 2019-2022 avec slider année
 */

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim() || '';
    });
    return obj;
  });
};

const loadCSV = async (path) => {
  try {
    const res = await fetch(path);
    if (!res.ok) return [];
    const text = await res.text();
    return parseCSV(text);
  } catch (err) {
    console.warn(`Failed to load ${path}:`, err);
    return [];
  }
};

export default {
  title: 'Mobilité Douce',
  async mount(root) {
    const d3 = window.d3;
    
    root.innerHTML = `
      <div class="span-12" style="background: linear-gradient(135deg, rgba(41,193,140,0.1), rgba(79,124,255,0.1)); border-radius: 16px; padding: 2rem; border: 1px solid rgba(41,193,140,0.2); margin-bottom: 1rem; animation: fadeIn 0.6s ease;">
        <h1 style="margin-top: 0; font-size: 2.2rem;">🚴 Mobilité Douce - Comptages Vélo</h1>
        <p style="color: var(--text-secondary); margin: 0.5rem 0 0 0;">Évolution des comptages cyclistes 2019-2022 - 24 capteurs permanents</p>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.1s">
        <h2 style="margin-top:0">📅 Sélectionner une année</h2>
        <div style="display: flex; gap: 1rem; align-items: center; margin: 1.5rem 0;">
          <input type="range" id="year-slider" min="2019" max="2022" value="2022" style="flex: 1; height: 8px; cursor: pointer; accent-color: var(--primary);">
          <div style="min-width: 100px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary);" id="year-display">2022</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">TMJ (Trafic Moyen Journalier)</div>
          </div>
        </div>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.2s">
        <h2 style="margin-top:0">📊 Vue d'ensemble</h2>
        <div class="kpis" id="kpis-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="kpi">
            <div class="kpi-icon">🚴</div>
            <div class="label">Capteurs actifs</div>
            <div class="value" id="kpi-capteurs">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">📈</div>
            <div class="label">Trafic moyen</div>
            <div class="value" id="kpi-moyen">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">⬆️</div>
            <div class="label">Trafic max</div>
            <div class="value" id="kpi-max">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">📍</div>
            <div class="label">Région</div>
            <div class="value" id="kpi-region">—</div>
          </div>
        </div>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.3s">
        <h3 style="margin-top:0">📊 Top 10 capteurs par trafic</h3>
        <div id="chart-top10" class="chart" style="height:450px;"></div>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.4s">
        <h3 style="margin-top:0">📈 Évolution 2019-2022</h3>
        <div id="chart-evolution" class="chart" style="height:350px;"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.5s">
        <h3 style="margin-top:0">🏙️ Répartition par territoire</h3>
        <div id="chart-territoire" class="chart" style="height:300px;"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.5s">
        <h3 style="margin-top:0">🌍 Répartition par type d'axe</h3>
        <div id="chart-axe" class="chart" style="height:300px;"></div>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.6s">
        <h3 style="margin-top:0">📋 Détail des capteurs</h3>
        <div id="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead style="background: linear-gradient(135deg, rgba(79,124,255,0.1), rgba(41,193,140,0.1)); border-bottom: 2px solid var(--primary);">
              <tr>
                <th style="padding: 1rem; text-align: left;">📍 Capteur</th>
                <th style="padding: 1rem; text-align: left;">🏘️ Commune</th>
                <th style="padding: 1rem; text-align: left;">🌐 Type d'axe</th>
                <th style="padding: 1rem; text-align: center;">Trafic année</th>
              </tr>
            </thead>
            <tbody id="table-body">
            </tbody>
          </table>
        </div>
      </div>
    `;

    let rawData = [];
    try {
      rawData = await loadCSV('./data/mobilite_douce/comptages_velos_permanents.csv');
    } catch (err) {
      console.error('Error loading mobilité data:', err);
      return () => {};
    }

    if (!rawData.length) return () => {};

    // Parser les données
    const data = rawData
      .filter(d => d.nom_post && d.tmj_2019)
      .map(d => {
        const tmj2019 = parseFloat(d.tmj_2019) || 0;
        const tmj2020 = parseFloat(d.tmj_2020) || 0;
        const tmj2021 = parseFloat(d.tmj_2021) || 0;
        const tmj2022 = parseFloat(d.tmj_2022) || 0;
        
        return {
          nom: d.nom_post.replace(/^\(.*?\)\s*/, ''),
          commune: d.nom_comm,
          territoire: d.territoire,
          typeAxe: d.type_axe || 'unknown',
          tmj: { 2019: tmj2019, 2020: tmj2020, 2021: tmj2021, 2022: tmj2022 },
          tmjo: { 
            2019: parseFloat(d.tmjo_2019) || 0,
            2020: parseFloat(d.tmjo_2020) || 0,
            2021: parseFloat(d.tmjo_2021) || 0,
            2022: parseFloat(d.tmjo_2022) || 0
          },
          tmjwe: {
            2019: parseFloat(d.tmjwe_2019) || 0,
            2020: parseFloat(d.tmjwe_2020) || 0,
            2021: parseFloat(d.tmjwe_2021) || 0,
            2022: parseFloat(d.tmjwe_2022) || 0
          }
        };
      });

    // Filtrer données valides
    const validData = data.filter(d => d.tmj[2022] > 0).sort((a, b) => b.tmj[2022] - a.tmj[2022]);

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

    // Initialiser KPIs
    const updateKPIs = (year) => {
      const yearData = validData.filter(d => d.tmj[year] > 0);
      const avgTmj = d3.mean(yearData, d => d.tmj[year]);
      const maxTmj = d3.max(yearData, d => d.tmj[year]);
      
      root.querySelector('#kpi-capteurs').textContent = yearData.length;
      root.querySelector('#kpi-moyen').textContent = Math.round(avgTmj).toLocaleString();
      root.querySelector('#kpi-max').textContent = Math.round(maxTmj).toLocaleString();
      
      const territories = new Set(validData.map(d => d.territoire));
      root.querySelector('#kpi-region').textContent = territories.size + ' régions';
    };

    updateKPIs(2022);

    // ===== GRAPHIQUE 1: Top 10 =====
    const updateTop10Chart = (year) => {
      const el = root.querySelector('#chart-top10');
      el.innerHTML = '';

      const top10 = validData.slice(0, 10);
      const w = el.clientWidth || 900, h = 450;
      const m = { t: 20, r: 40, b: 100, l: 250 };

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      const x = d3.scaleLinear()
        .domain([0, d3.max(top10, d => d.tmj[year]) || 1])
        .range([m.l, w - m.r]);

      const y = d3.scaleBand()
        .domain(top10.map(d => d.nom.substring(0, 35)))
        .range([m.t, h - m.b])
        .padding(0.35);

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).ticks(5))
        .style('color', 'var(--text-secondary)');

      svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .style('color', 'var(--text-secondary)');

      // Barres
      svg.append('g').selectAll('rect')
        .data(top10)
        .join('rect')
        .attr('x', x(0))
        .attr('y', d => y(d.nom.substring(0, 35)))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', '#29c18c')
        .attr('fill-opacity', 0.85)
        .attr('rx', 6)
        .on('mouseover', function() {
          d3.select(this).transition().duration(150).attr('fill-opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).transition().duration(150).attr('fill-opacity', 0.85);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 80)
        .attr('width', d => x(d.tmj[year]) - x(0));

      // Valeurs
      svg.append('g').selectAll('text')
        .data(top10)
        .join('text')
        .attr('x', d => x(d.tmj[year]) + 8)
        .attr('y', d => y(d.nom.substring(0, 35)) + y.bandwidth() / 2 + 5)
        .attr('font-size', '0.9rem')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(d => Math.round(d.tmj[year]).toLocaleString())
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 80 + 700)
        .style('opacity', 1);
    };

    // ===== GRAPHIQUE 2: Évolution 2019-2022 =====
    const updateEvolutionChart = () => {
      const el = root.querySelector('#chart-evolution');
      el.innerHTML = '';

      const years = [2019, 2020, 2021, 2022];
      const evolutionData = years.map(year => ({
        year,
        avg: d3.mean(validData, d => d.tmj[year]),
        max: d3.max(validData, d => d.tmj[year]),
        min: d3.min(validData, d => d.tmj[year])
      }));

      const w = el.clientWidth || 900, h = 350;
      const m = { t: 20, r: 40, b: 60, l: 60 };

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      const x = d3.scaleLinear()
        .domain([2019, 2022])
        .range([m.l, w - m.r]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(evolutionData, d => d.max) || 1])
        .range([h - m.b, m.t]);

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).tickValues(years))
        .style('color', 'var(--text-secondary)');

      svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).ticks(5))
        .style('color', 'var(--text-secondary)');

      // Ligne moyenne
      const lineAvg = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.avg));

      const pathAvg = svg.append('path')
        .attr('d', lineAvg(evolutionData))
        .attr('fill', 'none')
        .attr('stroke', '#4f7cff')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', function() { return this.getTotalLength(); })
        .attr('stroke-dashoffset', function() { return this.getTotalLength(); });

      pathAvg.transition()
        .duration(1500)
        .ease(d3.easeQuadInOut)
        .attr('stroke-dashoffset', 0);

      // Points
      svg.append('g').selectAll('circle')
        .data(evolutionData)
        .join('circle')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.avg))
        .attr('r', 0)
        .attr('fill', '#4f7cff')
        .attr('fill-opacity', 0.85)
        .transition()
        .duration(1500)
        .delay((d, i) => i * 300)
        .attr('r', 6);

      // Étiquettes
      svg.append('g').selectAll('text')
        .data(evolutionData)
        .join('text')
        .attr('x', d => x(d.year))
        .attr('y', d => y(d.avg) - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '0.9rem')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(d => Math.round(d.avg).toLocaleString())
        .style('opacity', 0)
        .transition()
        .duration(1500)
        .delay((d, i) => i * 300 + 800)
        .style('opacity', 1);
    };

    updateEvolutionChart();

    // ===== GRAPHIQUE 3: Territoire =====
    const updateTerritoireChart = (year) => {
      const el = root.querySelector('#chart-territoire');
      el.innerHTML = '';

      const territoireData = d3.rollup(validData, v => d3.sum(v, d => d.tmj[year]), d => d.territoire);
      const chartData = Array.from(territoireData, ([label, value]) => ({
        label,
        value
      })).sort((a, b) => b.value - a.value);

      const w = el.clientWidth || 400, h = 300;
      const radius = Math.min(w, h) / 2 - 40;

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%');

      const pie = d3.pie().value(d => d.value);
      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const colors = d3.scaleOrdinal()
        .domain(chartData.map(d => d.label))
        .range(['#4f7cff', '#29c18c', '#ffd166', '#ff6b6b', '#a78bfa']);

      const g = svg.append('g')
        .attr('transform', `translate(${w / 2},${h / 2})`);

      const slices = g.selectAll('g')
        .data(pie(chartData))
        .join('g');

      slices.append('path')
        .attr('fill', d => colors(d.data.label))
        .attr('fill-opacity', 0.85)
        .attr('d', arc)
        .on('mouseover', function() {
          d3.select(this).transition().duration(150).attr('fill-opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).transition().duration(150).attr('fill-opacity', 0.85);
        })
        .transition()
        .duration(1000)
        .attrTween('d', function(d) {
          const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return t => arc(interpolate(t));
        });
    };

    // ===== GRAPHIQUE 4: Type d'axe =====
    const updateAxeChart = (year) => {
      const el = root.querySelector('#chart-axe');
      el.innerHTML = '';

      const axeData = d3.rollup(validData, v => d3.sum(v, d => d.tmj[year]), d => d.typeAxe);
      const chartData = Array.from(axeData, ([label, value]) => ({
        label,
        value
      })).sort((a, b) => b.value - a.value);

      const w = el.clientWidth || 400, h = 300;
      const m = { t: 20, r: 30, b: 60, l: 100 };

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      const x = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) || 1])
        .range([m.l, w - m.r]);

      const y = d3.scaleBand()
        .domain(chartData.map(d => d.label.substring(0, 20)))
        .range([m.t, h - m.b])
        .padding(0.3);

      svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).ticks(4))
        .style('color', 'var(--text-secondary)');

      svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .style('color', 'var(--text-secondary)');

      svg.append('g').selectAll('rect')
        .data(chartData)
        .join('rect')
        .attr('x', x(0))
        .attr('y', d => y(d.label.substring(0, 20)))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', '#ffd166')
        .attr('fill-opacity', 0.85)
        .attr('rx', 6)
        .transition()
        .duration(900)
        .delay((d, i) => i * 100)
        .attr('width', d => x(d.value) - x(0));
    };

    // ===== TABLE: Détail des capteurs =====
    const updateTable = (year) => {
      const tbody = root.querySelector('#table-body');
      tbody.innerHTML = '';

      validData.forEach(d => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        row.style.transition = 'background-color 0.3s';
        row.onmouseover = () => row.style.backgroundColor = 'rgba(79,124,255,0.1)';
        row.onmouseout = () => row.style.backgroundColor = 'transparent';
        
        row.innerHTML = `
          <td style="padding: 1rem; font-weight: 600;">${d.nom}</td>
          <td style="padding: 1rem;">${d.commune}</td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-secondary);">${d.typeAxe}</td>
          <td style="padding: 1rem; text-align: center; font-weight: 700; color: var(--primary);">${Math.round(d.tmj[year]).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
      });
    };

    updateTable(2022);

    // ===== EVENT LISTENER: Slider =====
    const slider = root.querySelector('#year-slider');
    const yearDisplay = root.querySelector('#year-display');

    const handleYearChange = () => {
      const year = parseInt(slider.value);
      yearDisplay.textContent = year;
      
      updateKPIs(year);
      updateTop10Chart(year);
      updateTerritoireChart(year);
      updateAxeChart(year);
      updateTable(year);
    };

    slider.addEventListener('input', handleYearChange);

    // Affichage initial
    updateTop10Chart(2022);
    updateTerritoireChart(2022);
    updateAxeChart(2022);

    return () => {
      try { root.innerHTML = ''; } catch {}
    };
  }
};
