/**
 * parkingView.js - Vue complète du stationnement
 * Graphiques interactifs: tarifs, types, services, top parkings
 */

import { loadCSV } from "../utils/csv.js";

export default {
  title: 'Stationnement',
  async mount(root) {
    const d3 = window.d3;
    
    root.innerHTML = `
      <div class="span-12" style="background: linear-gradient(135deg, rgba(79,124,255,0.1), rgba(41,193,140,0.1)); border-radius: 16px; padding: 2rem; border: 1px solid rgba(79,124,255,0.2); margin-bottom: 1rem; animation: fadeIn 0.6s ease;">
        <h1 style="margin-top: 0; font-size: 2.2rem;">🅿️ Stationnement</h1>
        <p style="color: var(--text-secondary); margin: 0.5rem 0 0 0;">Analyse détaillée des parkings - 68 parkings, 12,022 places</p>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.1s">
        <h2 style="margin-top:0">📊 Vue d'ensemble</h2>
        <div class="kpis" id="kpis-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="kpi">
            <div class="kpi-icon">🅿️</div>
            <div class="label">Total places</div>
            <div class="value" id="kpi-total">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">💰</div>
            <div class="label">Places payantes</div>
            <div class="value" id="kpi-payant">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">✅</div>
            <div class="label">Places gratuites</div>
            <div class="value" id="kpi-gratuit">—</div>
          </div>
          <div class="kpi">
            <div class="kpi-icon">♿</div>
            <div class="label">Places PMR</div>
            <div class="value" id="kpi-pmr">—</div>
          </div>
        </div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.2s">
        <h3 style="margin-top:0">💳 Répartition par tarification</h3>
        <div id="chart-tarif" class="chart" style="height:300px;"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.2s">
        <h3 style="margin-top:0">🏗️ Répartition par structure (Surface vs Ouvrage)</h3>
        <div id="chart-type" class="chart" style="height:300px;"></div>
      </div>

      <div class="span-12 card animate-fade-in" style="animation-delay:0.3s">
        <h3 style="margin-top:0">🏆 Top 15 parkings (par capacité)</h3>
        <div id="chart-top15" class="chart" style="height:400px;"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.4s">
        <h3 style="margin-top:0">🚴 Places vélo disponibles</h3>
        <div id="chart-velo" class="chart" style="height:300px;"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.4s">
        <h3 style="margin-top:0">⚡ Installations spécialisées</h3>
        <div id="chart-services" class="chart" style="height:300px;"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.5s; display: flex; flex-direction: column; min-height: 650px;">
        <h3 style="margin-top:0">🗺️ Carte - Tous les parkings</h3>
        <div id="parking-map" style="flex: 1; min-height: 600px; border-radius: 8px; border: 1px solid rgba(79,124,255,0.2); overflow: hidden; background: linear-gradient(135deg, rgba(79,124,255,0.05), rgba(41,193,140,0.05));"></div>
      </div>

      <div class="span-6 card animate-fade-in" style="animation-delay:0.5s; display: flex; flex-direction: column; min-height: 650px;">
        <h3 style="margin-top:0">💬 Top Parkings</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center;">
          <button class="btn btn-primary bubble-filter-btn" data-filter="gratuit" style="cursor: pointer; background: linear-gradient(135deg, var(--secondary), #35d49f); color: white;">Top Gratuits (10)</button>
          <button class="btn bubble-filter-btn" data-filter="payant" style="cursor: pointer; background: linear-gradient(135deg, var(--accent), #ffd166); color: #333;">Top Payants (10)</button>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-left: auto;">
            Taille = Places | Clic = Détails
          </div>
        </div>
        <div id="bubble-chart" style="flex: 1; min-height: 600px; border-radius: 8px; border: 1px solid rgba(79,124,255,0.2); overflow: hidden; background: linear-gradient(135deg, rgba(79,124,255,0.05), rgba(41,193,140,0.05));"></div>
      </div>
    `;

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

    let rawData = [];
    try {
      rawData = await loadCSV('./data/parking/parking.csv');
    } catch (err) {
      console.error('Error loading parking data:', err);
      return () => {};
    }

    if (!rawData.length) return () => {};

    // Parser les données
    const data = rawData
      .filter(d => d.nb_places && parseInt(d.nb_places) > 0)
      .map(d => {
        // Vérifier si le parking est gratuit (valeur 1 ou 1.0 dans colonne gratuit)
        const gratuitValue = (d.gratuit || '').trim();
        const isGratuit = gratuitValue === '1' || gratuitValue === '1.0' || parseFloat(gratuitValue) === 1;
        return {
          nom: d.nom,
          places: parseInt(d.nb_places) || 0,
          pmr: parseInt(d.nb_pmr) || 0,
          velo: parseInt(d.nb_velo) || 0,
          covoit: parseInt(d.nb_covoit) || 0,
          elec: parseInt(d.nb_voitures_electriques) || 0,
          moto: parseInt(d.nb_2r_el) || 0,
          autopartage: parseInt(d.nb_autopartage) || 0,
          type_ouvrage: d.type_ouvrage || 'unknown',
          gratuit: isGratuit,
          commune: d.commune,
          geo_point_2d: d.geo_point_2d || '0,0'
        };
      });

    // Statistiques
    const totalPlaces = data.reduce((sum, d) => sum + d.places, 0);
    const gratuitPlaces = data.filter(d => d.gratuit).reduce((sum, d) => sum + d.places, 0);
    const payantPlaces = totalPlaces - gratuitPlaces;
    const totalPmr = data.reduce((sum, d) => sum + d.pmr, 0);

    // Animer les KPIs
    setTimeout(() => {
      animateCounter(root.querySelector('#kpi-total'), totalPlaces, 1200);
      animateCounter(root.querySelector('#kpi-payant'), payantPlaces, 1200);
      animateCounter(root.querySelector('#kpi-gratuit'), gratuitPlaces, 1200);
      animateCounter(root.querySelector('#kpi-pmr'), totalPmr, 1200);
    }, 200);

    // ===== GRAPHIQUE 1: Tarification =====
    (() => {
      const chartData = [
        { label: 'Payant', value: payantPlaces, color: '#4f7cff', pct: ((payantPlaces / totalPlaces) * 100).toFixed(1) },
        { label: 'Gratuit', value: gratuitPlaces, color: '#29c18c', pct: ((gratuitPlaces / totalPlaces) * 100).toFixed(1) }
      ];

      const el = root.querySelector('#chart-tarif');
      const w = el.clientWidth || 400, h = 300;
      const radius = Math.min(w, h) / 2 - 40;

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%');

      const pie = d3.pie().value(d => d.value);
      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const g = svg.append('g')
        .attr('transform', `translate(${w / 2},${h / 2})`);

      const slices = g.selectAll('g')
        .data(pie(chartData))
        .join('g');

      slices.append('path')
        .attr('fill', d => d.data.color)
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

      slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '1rem')
        .attr('font-weight', '700')
        .attr('fill', 'white')
        .text(d => `${d.data.pct}%`)
        .style('opacity', 0)
        .transition()
        .duration(1200)
        .delay(600)
        .style('opacity', 1);

      // Légende
      g.selectAll('.legend')
        .data(chartData)
        .join('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${radius + 20}, ${-radius + i * 40})`)
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => d.color)
        .attr('rx', 2);

      g.selectAll('.legend')
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', '0.9rem')
        .attr('fill', 'var(--text-primary)')
        .text(d => `${d.label}: ${d.value.toLocaleString()}`);
    })();

    // ===== GRAPHIQUE 2: Type d'ouvrage =====
    (() => {
      const typeData = d3.rollup(data, v => d3.sum(v, d => d.places), d => d.type_ouvrage);
      const chartData = Array.from(typeData, ([label, value]) => ({
        label: label === 'enclos_en_surface' ? 'Surface (plein air)' : 'Ouvrage (multi-étage)',
        value,
        color: label === 'enclos_en_surface' ? '#ffd166' : '#ff6b6b'
      }));

      const el = root.querySelector('#chart-type');
      const w = el.clientWidth || 400, h = 300;
      const radius = Math.min(w, h) / 2 - 40;

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%');

      const pie = d3.pie().value(d => d.value);
      const arc = d3.arc().innerRadius(0).outerRadius(radius);

      const g = svg.append('g')
        .attr('transform', `translate(${w / 2},${h / 2})`);

      const slices = g.selectAll('g')
        .data(pie(chartData))
        .join('g');

      slices.append('path')
        .attr('fill', d => d.data.color)
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

      slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '1rem')
        .attr('font-weight', '700')
        .attr('fill', 'white')
        .text(d => `${((d.data.value / totalPlaces) * 100).toFixed(1)}%`)
        .style('opacity', 0)
        .transition()
        .duration(1200)
        .delay(600)
        .style('opacity', 1);

      // Légende détaillée
      g.selectAll('.legend-rect')
        .data(chartData)
        .join('rect')
        .attr('class', 'legend-rect')
        .attr('x', radius + 20)
        .attr('y', (d, i) => -radius + i * 45)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => d.color)
        .attr('rx', 2);

      g.selectAll('.legend-text')
        .data(chartData)
        .join('text')
        .attr('class', 'legend-text')
        .attr('x', radius + 40)
        .attr('y', (d, i) => -radius + i * 45 + 10)
        .attr('font-size', '0.85rem')
        .attr('fill', 'var(--text-primary)')
        .text(d => `${d.label}`);

      g.selectAll('.legend-pct')
        .data(chartData)
        .join('text')
        .attr('class', 'legend-pct')
        .attr('x', radius + 40)
        .attr('y', (d, i) => -radius + i * 45 + 25)
        .attr('font-size', '0.75rem')
        .attr('fill', 'var(--text-secondary)')
        .text(d => `${d.value.toLocaleString()} places (${((d.value / totalPlaces) * 100).toFixed(1)}%)`);
    })();

    // ===== GRAPHIQUE 3: Top 15 =====
    (() => {
      const top15 = data.sort((a, b) => b.places - a.places).slice(0, 15);

      const el = root.querySelector('#chart-top15');
      const w = el.clientWidth || 900, h = 400;
      const m = { t: 20, r: 40, b: 100, l: 200 };

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      const x = d3.scaleLinear()
        .domain([0, d3.max(top15, d => d.places) || 1])
        .range([m.l, w - m.r]);

      const y = d3.scaleBand()
        .domain(top15.map(d => d.nom.substring(0, 30)))
        .range([m.t, h - m.b])
        .padding(0.3);

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
        .data(top15)
        .join('rect')
        .attr('x', x(0))
        .attr('y', d => y(d.nom.substring(0, 30)))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', '#4f7cff')
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
        .attr('width', d => x(d.places) - x(0));

      // Valeurs
      svg.append('g').selectAll('text')
        .data(top15)
        .join('text')
        .attr('x', d => x(d.places) + 8)
        .attr('y', d => y(d.nom.substring(0, 30)) + y.bandwidth() / 2 + 5)
        .attr('font-size', '0.9rem')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(d => d.places.toLocaleString())
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 80 + 700)
        .style('opacity', 1);
    })();

    // ===== GRAPHIQUE 4: Vélos =====
    (() => {
      const veloData = data.filter(d => d.velo > 0).sort((a, b) => b.velo - a.velo).slice(0, 10);

      const el = root.querySelector('#chart-velo');
      const w = el.clientWidth || 400, h = 300;
      const m = { t: 20, r: 30, b: 60, l: 150 };

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      const x = d3.scaleLinear()
        .domain([0, d3.max(veloData, d => d.velo) || 1])
        .range([m.l, w - m.r]);

      const y = d3.scaleBand()
        .domain(veloData.map(d => d.nom.substring(0, 25)))
        .range([m.t, h - m.b])
        .padding(0.3);

      svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).ticks(3))
        .style('color', 'var(--text-secondary)');

      svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .style('color', 'var(--text-secondary)');

      svg.append('g').selectAll('rect')
        .data(veloData)
        .join('rect')
        .attr('x', x(0))
        .attr('y', d => y(d.nom.substring(0, 25)))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', '#29c18c')
        .attr('fill-opacity', 0.85)
        .attr('rx', 4)
        .transition()
        .duration(900)
        .delay((d, i) => i * 100)
        .attr('width', d => x(d.velo) - x(0));
    })();

    // ===== GRAPHIQUE 5: Services =====
    (() => {
      const servicesData = [
        { label: 'Vélos', value: data.reduce((s, d) => s + d.velo, 0), color: '#29c18c', icon: '🚴' },
        { label: 'Covoiturage', value: data.reduce((s, d) => s + d.covoit, 0), color: '#ffd166', icon: '🚗' },
        { label: 'Électrique', value: data.reduce((s, d) => s + d.elec, 0), color: '#ff6b6b', icon: '⚡' },
        { label: 'Autopartage', value: data.reduce((s, d) => s + d.autopartage, 0), color: '#4f7cff', icon: '🔄' }
      ].filter(d => d.value > 0);

      const el = root.querySelector('#chart-services');
      const w = el.clientWidth || 400, h = 300;
      const m = { t: 20, r: 30, b: 60, l: 100 };

      const svg = d3.select(el).append('svg')
        .attr('viewBox', [0, 0, w, h])
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background', 'transparent');

      const x = d3.scaleLinear()
        .domain([0, d3.max(servicesData, d => d.value) || 1])
        .range([m.l, w - m.r]);

      const y = d3.scaleBand()
        .domain(servicesData.map(d => d.label))
        .range([m.t, h - m.b])
        .padding(0.4);

      svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).ticks(4))
        .style('color', 'var(--text-secondary)');

      svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .style('color', 'var(--text-secondary)');

      svg.append('g').selectAll('rect')
        .data(servicesData)
        .join('rect')
        .attr('x', x(0))
        .attr('y', d => y(d.label))
        .attr('height', y.bandwidth())
        .attr('width', 0)
        .attr('fill', d => d.color)
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
        .delay((d, i) => i * 150)
        .attr('width', d => x(d.value) - x(0));

      svg.append('g').selectAll('text')
        .data(servicesData)
        .join('text')
        .attr('x', d => x(d.value) + 8)
        .attr('y', d => y(d.label) + y.bandwidth() / 2 + 5)
        .attr('font-size', '0.95rem')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(d => d.value.toLocaleString())
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150 + 800)
        .style('opacity', 1);
    })();

    // ===== GRAPHIQUE 6: Carte Leaflet + Bulles Animation Gauche =====
    (() => {
      const d3 = window.d3;
      const L = window.L; // Leaflet
      
      // ===== CARTE LEAFLET =====
      const initMap = () => {
        const mapEl = root.querySelector('#parking-map');
        
        // Centre sur Grenoble (latitude, longitude)
        const mapCenter = [45.1885, 5.7245];
        
        const map = L.map(mapEl, {
          center: mapCenter,
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true
        });
        
        // Ajouter le tileset sombre (CartoDB Dark)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB | © OpenStreetMap contributors',
          maxZoom: 19,
          className: 'map-tiles'
        }).addTo(map);
        
        // Créer les markers pour chaque parking
        const addParking = (parking) => {
          // Extraire lat/lon de geo_point_2d (format: "lat,lon")
          if (!parking.geo_point_2d) return;
          
          const coords = parking.geo_point_2d.split(',').map(c => parseFloat(c.trim()));
          if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;
          
          const lat = coords[0];
          const lon = coords[1];
          const color = parking.gratuit ? '#29c18c' : '#4f7cff';
          const radius = Math.sqrt(parking.places) * 0.7; // Rayon basé sur places
          
          // Créer un marker personnalisé
          const marker = L.circleMarker([lat, lon], {
            radius: Math.min(radius, 20), // Max 20px
            fillColor: color,
            color: parking.gratuit ? '#1fa371' : '#3551d5',
            weight: 2.5,
            opacity: 0.85,
            fillOpacity: 0.75,
            className: 'parking-marker'
          }).addTo(map);
          
          // Popup au click
          marker.bindPopup(`
            <div style="width: 220px;">
              <strong>${parking.nom}</strong><br/>
              <strong>${parking.places}</strong> places<br/>
              ${parking.commune}<br/>
              <span style="color: ${color}; font-weight: bold;">
                ${parking.gratuit ? '✓ Gratuit' : '💰 Payant'}
              </span>
            </div>
          `, { maxWidth: 250 });
          
          // Hover effet avec tooltip
          marker.on('mouseover', function(e) {
            this.setRadius(Math.min(radius * 1.2, 24));
            this.setStyle({ opacity: 1, fillOpacity: 0.9, weight: 3 });
            
            // Créer le tooltip
            const services = [];
            if (parking.nb_velo) services.push(`🚲 ${parking.nb_velo}`);
            if (parking.nb_covoit) services.push('🤝');
            if (parking.nb_voitures_electriques) services.push(`⚡ ${parking.nb_voitures_electriques}`);
            if (parking.nb_autopartage) services.push('🚗');
            if (parking.nb_pmr) services.push(`♿ ${parking.nb_pmr}`);
            
            const tooltip = document.createElement('div');
            tooltip.className = 'map-marker-tooltip';
            
            let tooltipHTML = `
              <div style="font-weight: 600; margin-bottom: 0.4rem; color: white;">${parking.nom}</div>
              <div style="margin-bottom: 0.4rem; opacity: 0.85;">
                <strong>${parking.places}</strong> places · 
                <span style="color: ${color}; font-weight: 600;">
                  ${parking.gratuit ? '✓ Gratuit' : '💰 Payant'}
                </span>
              </div>
              <div style="opacity: 0.7; font-size: 0.75rem;">${parking.commune}</div>
            `;
            
            if (services.length > 0) {
              tooltipHTML += `<div style="opacity: 0.8; font-size: 0.75rem; margin-top: 0.4rem;">${services.join(' ')}</div>`;
            }
            
            tooltip.innerHTML = tooltipHTML;
            
            Object.assign(tooltip.style, {
              position: 'fixed',
              background: 'linear-gradient(135deg, rgba(15, 16, 25, 0.99) 0%, rgba(26, 30, 45, 0.99) 100%)',
              color: '#f0f1f3',
              padding: '0.9rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              zIndex: '9999',
              pointerEvents: 'none',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
              border: `1px solid ${parking.gratuit ? 'rgba(41, 193, 140, 0.4)' : 'rgba(79, 124, 255, 0.4)'}`,
              borderLeft: `4px solid ${parking.gratuit ? '#29c18c' : '#4f7cff'}`,
              maxWidth: '260px',
              whiteSpace: 'normal',
              left: Math.min(e.originalEvent.clientX + 15, window.innerWidth - 280) + 'px',
              top: (e.originalEvent.clientY - 100) + 'px'
            });
            
            document.body.appendChild(tooltip);
            marker._tooltip = tooltip;
          });
          
          marker.on('mouseout', function() {
            this.setRadius(Math.min(radius, 20));
            this.setStyle({ opacity: 0.85, fillOpacity: 0.75, weight: 2.5 });
            
            if (marker._tooltip) {
              marker._tooltip.remove();
              delete marker._tooltip;
            }
          });
        };
        
        // Ajouter tous les parkings sur la carte
        data.forEach(parking => addParking(parking));
        
        return map;
      };
      
      // ===== BULLES AVEC ANIMATION GAUCHE VERS DROITE - ORDONNÉES PAR TAILLE =====
      const createBubbleChart = (filteredData) => {
        const el = root.querySelector('#bubble-chart');
        el.innerHTML = '';
        
        // Afficher seulement les top 10 du filtre actuel
        let topData = [...filteredData]
          .sort((a, b) => b.places - a.places)
          .slice(0, 10);
        
        if (topData.length === 0) {
          el.innerHTML = '<p style="padding: 2rem; color: var(--text-secondary);">Aucun parking à afficher</p>';
          return;
        }
        
        const w = el.clientWidth || 600;
        const h = el.clientHeight || 600;
        
        const svg = d3.select(el).append('svg')
          .attr('viewBox', [0, 0, w, h])
          .attr('width', '100%')
          .attr('height', '100%')
          .style('background', 'transparent')
          .style('pointer-events', 'none'); // Désactiver pendant l'animation
        
        // Créer les nœuds avec positions X BASÉES SUR LA TAILLE
        // Les grandes bulles à droite-haut, les petites à gauche-bas
        const maxPlaces = topData[0].places;
        const minPlaces = topData[topData.length - 1].places;
        const maxRadius = Math.sqrt(maxPlaces) * 0.8;
        
        const nodes = topData.map((d, i) => {
          // X basé sur places: petites à gauche, grandes à droite
          // Zone réduite pour éviter que les bulles sortent
          const normalizedPlaces = (d.places - minPlaces) / (maxPlaces - minPlaces);
          const baseX = 80 + (normalizedPlaces * (w - 160)); // De 80 à w-80
          
          // Ajouter un offset vertical basé sur l'index pour éviter les chevauchements
          const offsetX = (i % 2 === 0) ? -25 : 25;
          const xPosition = baseX + offsetX;
          
          // Y basé sur places: petites en bas, grandes en haut
          const yPosition = Math.max(maxRadius + 20, h - 60 - (normalizedPlaces * (h - 100)));
          
          // Offset Y alterné pour plus de séparation
          const offsetY = (i % 2 === 0) ? -15 : 15;
          const finalY = yPosition + offsetY;
          
          return {
            ...d,
            x: xPosition,
            y: finalY,
            radius: Math.sqrt(d.places) * 0.8,
            vx: 0,
            vy: 0
          };
        });
        
        // Pas de simulation - garder les positions fixes calculées
        // (évite que les bulles sortent de la zone visible)
        
        // Bulles - Démarrer de la gauche
        const bubbles = svg.selectAll('circle')
          .data(nodes, d => d.nom)
          .join('circle')
          .attr('cx', -50) // Démarrer en dehors à gauche
          .attr('cy', d => d.y)
          .attr('r', d => d.radius)
          .attr('fill', d => d.gratuit ? '#29c18c' : '#4f7cff')
          .attr('opacity', 0.85)
          .attr('stroke', d => d.gratuit ? '#1fa371' : '#3551d5')
          .attr('stroke-width', 2.5)
          .style('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))');
        
        // Animation entrée depuis la gauche
        bubbles
          .transition()
          .duration(1400)
          .ease(d3.easeQuadInOut)
          .delay((d, i) => i * 40)
          .attr('cx', d => d.x)
          .on('end', function() {
            // Réactiver pointer-events après l'animation
            svg.style('pointer-events', 'auto');
          });
        
        // Ajouter les nombre de places à côté
        const placeLabels = svg.selectAll('text.places-label')
          .data(nodes, d => d.nom + '-places')
          .join('text')
          .attr('class', 'places-label')
          .attr('x', -50)
          .attr('y', d => d.y + d.radius + 18)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('fill', d => d.gratuit ? '#29c18c' : '#4f7cff')
          .attr('pointer-events', 'none')
          .text(d => `${d.places}`)
          .style('opacity', 0);
        
        // Animer les labels de places
        placeLabels
          .transition()
          .duration(1400)
          .ease(d3.easeQuadInOut)
          .delay((d, i) => i * 40)
          .attr('x', d => d.x)
          .style('opacity', 0.9);
        
        // Les positions sont fixes, donc pas de mise à jour nécessaire
        
        // Hover effects
        bubbles
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(150)
              .attr('r', d => d.radius * 1.3)
              .attr('opacity', 1)
              .attr('stroke-width', 3.5)
              .style('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))');
            
            // Tooltip avec infos détaillées
            const services = [];
            if (d.nb_velo) services.push(`🚲 ${d.nb_velo}`);
            if (d.nb_covoit) services.push('🤝');
            if (d.nb_voitures_electriques) services.push(`⚡ ${d.nb_voitures_electriques}`);
            if (d.nb_autopartage) services.push('🚗');
            if (d.nb_pmr) services.push(`♿ ${d.nb_pmr}`);
            
            // Créer le tooltip avec positionnement fixe
            const tooltip = document.createElement('div');
            tooltip.className = 'bubble-hover-tooltip';
            let tooltipHTML = `
              <div style="font-weight: 600; margin-bottom: 0.4rem; color: white;">${d.nom}</div>
              <div style="margin-bottom: 0.4rem; opacity: 0.85;">
                <strong>${d.places}</strong> places · 
                <span style="color: ${d.gratuit ? '#29c18c' : '#4f7cff'}; font-weight: 600;">
                  ${d.gratuit ? '✓ Gratuit' : '💰 Payant'}
                </span>
              </div>
              <div style="opacity: 0.7; font-size: 0.75rem;">${d.commune}</div>
            `;
            
            // Ajouter les services seulement s'il y en a
            if (services.length > 0) {
              tooltipHTML += `<div style="opacity: 0.8; font-size: 0.75rem; margin-top: 0.4rem;">Services: ${services.join(' ')}</div>`;
            }
            
            tooltip.innerHTML = tooltipHTML;
            
            // Appliquer les styles
            Object.assign(tooltip.style, {
              position: 'fixed',
              background: 'linear-gradient(135deg, rgba(15, 16, 25, 0.99) 0%, rgba(26, 30, 45, 0.99) 100%)',
              color: '#f0f1f3',
              padding: '0.9rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              zIndex: '9999',
              pointerEvents: 'none',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
              border: `1px solid ${d.gratuit ? 'rgba(41, 193, 140, 0.4)' : 'rgba(79, 124, 255, 0.4)'}`,
              borderLeft: `4px solid ${d.gratuit ? '#29c18c' : '#4f7cff'}`,
              maxWidth: '260px',
              whiteSpace: 'normal',
              left: Math.min(event.clientX + 15, window.innerWidth - 280) + 'px',
              top: (event.clientY - 100) + 'px'
            });
            
            // Retirer le tooltip au démarrage de l'animation pour éviter le blocage
            setTimeout(() => {
              document.querySelectorAll('.bubble-hover-tooltip').forEach(t => {
                if (t !== tooltip) t.remove();
              });
            }, 50);
            
            document.body.appendChild(tooltip);
          })
          .on('mouseout', function(event, d) {
            d3.select(this)
              .transition()
              .duration(150)
              .attr('r', d => d.radius)
              .attr('opacity', 0.85)
              .attr('stroke-width', 2.5)
              .style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))');
            
            document.querySelectorAll('.bubble-hover-tooltip').forEach(t => t.remove());
          })
          .on('click', function(event, d) {
            showParkingDetails(d);
          });
        
        // Ajouter une légende
        const legend = svg.append('g')
          .attr('transform', `translate(20, ${h - 40})`);
        
        // Gratuit ou Payant
        const isGratuit = topData.some(d => d.gratuit);
        const isPayant = topData.some(d => !d.gratuit);
        
        if (isGratuit) {
          legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 5)
            .attr('fill', '#29c18c');
          
          legend.append('text')
            .attr('x', 12)
            .attr('y', 4)
            .attr('font-size', '11px')
            .attr('fill', 'var(--text-secondary)')
            .text(`Gratuits (${topData.filter(d => d.gratuit).length})`);
        }
        
        if (isPayant) {
          const offset = isGratuit ? 140 : 0;
          legend.append('circle')
            .attr('cx', offset)
            .attr('cy', 0)
            .attr('r', 5)
            .attr('fill', '#4f7cff');
          
          legend.append('text')
            .attr('x', offset + 12)
            .attr('y', 4)
            .attr('font-size', '11px')
            .attr('fill', 'var(--text-secondary)')
            .text(`Payants (${topData.filter(d => !d.gratuit).length})`);
        }
        
        // Arrêter la simulation après quelques secondes
        setTimeout(() => simulation.stop(), 3000);
      };
      
      // Boutons de filtre
      const bubbleFilterBtns = root.querySelectorAll('.bubble-filter-btn');
      
      bubbleFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          bubbleFilterBtns.forEach(b => b.classList.remove('btn-primary'));
          btn.classList.add('btn-primary');
          
          const filter = btn.dataset.filter;
          let filteredData = data;
          
          if (filter === 'gratuit') {
            filteredData = data.filter(d => d.gratuit);
          } else if (filter === 'payant') {
            filteredData = data.filter(d => !d.gratuit);
          }
          
          createBubbleChart(filteredData);
        });
      });
      
      // Initialiser la carte et les bulles
      initMap();
      
      // Initialiser avec Top Gratuits par défaut
      const gratuitBtn = root.querySelector('[data-filter="gratuit"]');
      if (gratuitBtn) {
        gratuitBtn.classList.add('btn-primary');
        createBubbleChart(data.filter(d => d.gratuit));
      }
    })();

    return () => {
      try { root.innerHTML = ''; } catch {}
    };
  }
};
