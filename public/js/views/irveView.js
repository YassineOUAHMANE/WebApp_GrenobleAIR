import { loadCSV, parseCSV } from '../utils/csv.js';

async function loadData() {
  const files = [
    './data/irve/irve_metropole.csv',
    './data/irve/irve_gresivaudan.csv',
    './data/irve/irve_smmag.csv',
    './data/irve/irve_pays_voironnais.csv'
  ];
  const all = [];
  await Promise.all(files.map(async file => {
    const data = await loadCSV(file);
    console.log(data)
    if(data.length > 0){
        all.push(...data);
    }
  }))
  return all.filter(d => {
    const lat = parseFloat(d.consolidated_latitude);
    const lon = parseFloat(d.consolidated_longitude);
    return !isNaN(lat) && !isNaN(lon);
  }).map(d => ({
    nom: d.nom_enseigne || d.nom_station || 'Station',
    lat: parseFloat(d.consolidated_latitude),
    lon: parseFloat(d.consolidated_longitude),
    pdc: parseInt(d.nbre_pdc) || 0
  }));
}

export default {
  title: 'Véhicules Électriques',
  async mount(root) {
    root.innerHTML = '<p>⏳ Chargement...</p>';
    try {
      const data = await loadData();
      const totalPoints = data.reduce((s, d) => s + d.pdc, 0);
      
      root.innerHTML = `
        <div class="span-12" style="background: linear-gradient(135deg, rgba(255,209,102,0.1), rgba(255,165,0,0.1)); border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,209,102,0.2); margin-bottom: 1rem;">
          <h1 style="margin-top: 0; font-size: 2.2rem;">⚡ IRVE - Stations de Recharge</h1>
          <p style="color: var(--text-secondary); margin: 0.5rem 0 0 0;">Carte interactive des stations de recharge électrique</p>
        </div>
        <div class="span-12">
          <div class="kpis">
            <div class="kpi">
              <div class="kpi-icon">⚡</div>
              <div class="label">Total Stations</div>
              <div class="value">${data.length}</div>
            </div>
            <div class="kpi">
              <div class="kpi-icon">🔌</div>
              <div class="label">Points de Charge</div>
              <div class="value">${totalPoints}</div>
            </div>
            <div class="kpi">
              <div class="kpi-icon">📊</div>
              <div class="label">Moy. Points/Station</div>
              <div class="value">${(totalPoints / data.length).toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div class="span-12 card">
          <h3 style="margin-top: 0;">📍 Carte Interactive</h3>
          <div id="map" style="height:600px;width:100%;border-radius:12px;overflow:hidden;margin-top:1rem;"></div>
        </div>
      `;
      
      setTimeout(() => {
        if (window.L) {
          const L = window.L;
          const map = L.map(document.getElementById('map'), {center: [45.188, 5.724], zoom: 10});
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
          
          // Add custom popup style
          const style = document.createElement('style');
          style.textContent = `
            .leaflet-popup-content-wrapper {
              background-color: #252b3a !important;
              border-radius: 8px !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            }
            .leaflet-popup-content {
              color: #ffffff !important;
              margin: 0 !important;
            }
            .leaflet-popup-content strong {
              color: #ffd166 !important;
            }
            .leaflet-popup-tip {
              background-color: #252b3a !important;
            }
          `;
          document.head.appendChild(style);
          
          data.forEach(s => {
            const popup = `<strong>${s.nom}</strong><br>🔌 ${s.pdc} points`;
            L.circleMarker([s.lat, s.lon], {
              radius: Math.sqrt(s.pdc) * 1.5,
              fillColor: '#ffd166',
              color: '#ffa500',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.6
            }).bindPopup(popup).addTo(map);
          });
        }
      }, 100);
    } catch (e) {
      root.innerHTML = '<p>❌ Erreur: ' + e.message + '</p>';
    }
  },
  unmount() {}
};
