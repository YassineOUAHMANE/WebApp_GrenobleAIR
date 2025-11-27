import { fetchCSV } from '../utils/fetchData.js';
import { featureCollectionFromRows } from '../utils/mapUtils.js';
import { icons } from '../utils/icons.js';

// dimensions: arceaux (stationnement cyclable), places de parking, bornes EV, trafic vélo (tmj), pollution (placeholder: city median)

export default {
	linkTitle: 'Quartiers',
	title: 'Quartiers',
	icon: 'chart',
	async mount(root) {
		root.innerHTML = `
			<h2 class="title">${icons.chart} Quartiers — Diagramme en étoile</h2>
			<div class="card">
				<p>Choisissez un quartier pour afficher un diagramme en étoile comparant plusieurs dimensions (arceaux, parkings, bornes VE, trafic vélo, pollution).</p>
				<div style="display:flex; gap:1rem; align-items:flex-start;">
					<div style="flex:0 0 320px;">
						<label>Quartier</label>
						<select id="quartier-select" style="width:100%; padding:.4rem; margin-bottom:1rem;"></select>
						<div id="quartier-info" style="font-size:0.9rem; color:var(--text-primary);"></div>
					</div>
					<div id="radar-container" style="flex:1; min-height:360px;"></div>
				</div>
			</div>
		`;

		// --- Load data ---
		const quartiersRows = await fetchCSV('./data/quartiers/unions_de_quartier_epsg4326.csv');
		const quartiersFC = featureCollectionFromRows(quartiersRows, { shapeCol: 'geo_shape' });

		// helper: index quartiers by name
		function pickLabel(props = {}, row = {}){
			const tries = [
				'sdec_libel', 'SDEC_LIBEL', 'sdec_libel ',
				'dec_nom', 'DEC_NOM', 'dec_nom '
			];
			for(const k of tries){
				if(props && typeof props[k] !== 'undefined' && String(props[k]).trim()) return String(props[k]).trim();
				if(row && typeof row[k] !== 'undefined' && String(row[k]).trim()) return String(row[k]).trim();
			}
			// fallback any property that looks like a name
			for(const k of Object.keys(props || {})){
				const v = String(props[k] || '').trim();
				if(v && /[A-Za-zÀ-ÖØ-öø-ÿ\- ]{2,}/.test(v)) return v;
			}
			return null;
		}

		const quartiers = quartiersFC.features.map((f, i) => ({
			id: i,
			name: pickLabel(f.properties, quartiersRows[i]) || `Q${i}`,
			feature: f
		}));

		// Load other datasets in parallel
		const [arceauxRows, parkingRows, evRows, bikeRows, pmRows] = await Promise.all([
			fetchCSV('./data/parking/stationnement_cyclable_sur_le_territoire_du_SMMAG.csv'),
			fetchCSV('./data/parking/parking.csv'),
			fetchCSV('./data/irve/irve_normalise_etalab.csv'),
			fetchCSV('./data/mobilite_douce/comptages_velos_permanents.csv'),
			fetchCSV('./data/air/pm25.csv')
		]).catch(err => { console.warn('Erreur chargement datasets', err); return [[],[],[],[],[]]; });

		// compute a placeholder pollution value: median of pm25 medians
		let pollutionGlobal = 0;
		try {
			const medians = pmRows.map(r => parseFloat(r.median)).filter(n => !isNaN(n));
			pollutionGlobal = medians.length ? d3.mean(medians) : 0;
		} catch(e) { pollutionGlobal = 0 }

		// Helper: test if lon/lat inside feature (geojson); use d3.geoContains
		function inside(feature, lon, lat){
			try { return d3.geoContains(feature, [parseFloat(lon), parseFloat(lat)]); } catch { return false }
		}

		// Aggregate per quartier
		const stats = quartiers.map(q => ({
			id: q.id,
			name: q.name,
			arceaux: 0,
			parking_places: 0,
			ev_count: 0,
			bike_tmj: 0,
			bike_count: 0,
			pollution: pollutionGlobal
		}));

		// Arceaux: stationnement_cyclable has columns 'lon','lat' and 'capacite'
		for(const r of arceauxRows){
			const lon = r.lon || r.xlong || r.longitude;
			const lat = r.lat || r.ylat || r.latitude;
			const cap = parseFloat(r.capacite) || 0;
			if(!lon || !lat) continue;
			for(const s of stats){ if(inside(quartiers[s.id].feature, lon, lat)){ s.arceaux += cap; break } }
		}

		// Parking places: parking.csv has geo_point_2d as "lat,lon" and nb_places
		for(const r of parkingRows){
			const p = (r.geo_point_2d || r.geo_point || '').split(',').map(s => s.trim());
			if(p.length < 2) continue;
			const lat = parseFloat(p[0]), lon = parseFloat(p[1]);
			const places = parseFloat(r.nb_places) || 0;
			for(const s of stats){ if(inside(quartiers[s.id].feature, lon, lat)){ s.parking_places += places; break } }
		}

		// EV: irve file has coordonneesxy as "lon,lat" and nbre_pdc
		for(const r of evRows){
			const c = (r.coordonneesxy || r.coordonnees || r.coordonneesxy || '').replace(/"/g,'').split(',').map(s=>s.trim());
			if(c.length < 2) continue;
			const lon = parseFloat(c[0]), lat = parseFloat(c[1]);
			const n = parseFloat(r.nbre_pdc) || parseFloat(r.nb_pdc) || 0;
			for(const s of stats){ if(inside(quartiers[s.id].feature, lon, lat)){ s.ev_count += n; break } }
		}

		// Bike counters: use tmj_2022 (fallback tmj_2021/2019) and geo_point_2d "lat, lon"
		for(const r of bikeRows){
			const p = (r.geo_point_2d || '').replace(/"/g,'').split(',').map(s => s.trim());
			if(p.length < 2) continue;
			const lat = parseFloat(p[0]);
			const lon = parseFloat(p[1]);
			const tmj = parseFloat(r.tmj_2022) || parseFloat(r.tmj_2021) || parseFloat(r.tmj_2019) || 0;
			for(const s of stats){ if(inside(quartiers[s.id].feature, lon, lat)){ s.bike_tmj += tmj; s.bike_count += 1; break } }
		}

		// Finalize bike average
		stats.forEach(s => { s.bike_avg = s.bike_count ? s.bike_tmj / s.bike_count : 0; s.pollution = pollutionGlobal; });

		// Prepare select options (alphabetical order by name)
		const select = root.querySelector('#quartier-select');
		const sortedQuartiers = [...quartiers].sort((a, b) => {
			try { return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }); } catch(e) { return String(a.name).localeCompare(String(b.name)); }
		});
		sortedQuartiers.forEach(q => {
			const opt = document.createElement('option');
			opt.value = q.id; // keep original id so stats mapping stays valid
			opt.textContent = q.name;
			select.appendChild(opt);
		});

		// Draw radar chart
		const container = d3.select(root.querySelector('#radar-container'));

		function drawRadar(dataItem){
			container.html('');
			const margin = {t:20,r:20,b:20,l:20};
			const width = Math.max(380, container.node().clientWidth || 600) - margin.l - margin.r;
			const height = 360 - margin.t - margin.b;
			const svg = container.append('svg').attr('width', width + margin.l + margin.r).attr('height', height + margin.t + margin.b);
			const g = svg.append('g').attr('transform', `translate(${(width/2)+margin.l},${(height/2)+margin.t})`);

			// metrics and values
			const metrics = [
				{ key: 'arceaux', label: 'Arceaux', value: dataItem.arceaux },
				{ key: 'parking_places', label: 'Places parking', value: dataItem.parking_places },
				{ key: 'ev_count', label: 'Bornes VE', value: dataItem.ev_count },
				{ key: 'bike_avg', label: 'Trafic vélo', value: dataItem.bike_avg },
				{ key: 'pollution', label: 'PM2.5 médiane', value: dataItem.pollution }
			];

			// compute global maxima across all quartiers for normalization
			const maxima = {};
			for(const m of metrics.map(d=>d.key)) maxima[m] = d3.max(stats, s => s[m] || 0) || 1;

			const radius = Math.min(width, height) / 2 * 0.9;
			const angleStep = (Math.PI * 2) / metrics.length;

			// grid circles
			const levels = 4;
			for(let lvl=levels; lvl>0; lvl--){
				g.append('circle')
				  .attr('r', radius * (lvl/levels))
				  .attr('fill', 'none')
				  .attr('stroke', '#ddd')
				  .attr('stroke-dasharray','2,2')
				  .attr('stroke-width', 1);
			}

			// axes and labels
			metrics.forEach((m, i) => {
				const angle = i * angleStep - Math.PI/2;
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				g.append('line').attr('x1',0).attr('y1',0).attr('x2',x).attr('y2',y).attr('stroke','#bbb');
				const lx = Math.cos(angle) * (radius + 12);
				const ly = Math.sin(angle) * (radius + 12);
				g.append('text').attr('x', lx).attr('y', ly).attr('text-anchor', Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle')
					.attr('alignment-baseline', 'middle')
					.attr('font-size', 12)
					.text(m.label);
			});

			// polygon points
			const points = metrics.map((m,i)=>{
				const normalized = maxima[m.key] ? (m.value / maxima[m.key]) : 0;
				const r = normalized * radius;
				const angle = i * angleStep - Math.PI/2;
				return [Math.cos(angle)*r, Math.sin(angle)*r];
			});

			// draw filled polygon
			const line = d3.line().curve(d3.curveLinearClosed);
			g.append('path').attr('d', line(points))
				.attr('fill', 'rgba(59,130,246,0.25)')
				.attr('stroke', 'steelblue')
				.attr('stroke-width', 2);

			// draw points
			g.selectAll('circle.point').data(points).enter().append('circle')
				.attr('class','point')
				.attr('cx', d=>d[0]).attr('cy', d=>d[1])
				.attr('r', 4).attr('fill','steelblue');

			// show raw values as small list
			const info = root.querySelector('#quartier-info');
			info.innerHTML = `<strong>${dataItem.name}</strong><br>
				Arceaux: ${Math.round(dataItem.arceaux)}<br>
				Places parking: ${Math.round(dataItem.parking_places)}<br>
				Bornes VE: ${Math.round(dataItem.ev_count)}<br>
				Trafic vélo (moyen): ${Math.round(dataItem.bike_avg)}<br>
				PM2.5 (médiane globale): ${Number(dataItem.pollution).toFixed(1)}
			`;
		}

		// initial draw for first quartier
		function getStatsForId(id){
			const s = stats.find(x => x.id == id) || stats[0];
			return { ...s, name: quartiers[id].name };
		}

		select.addEventListener('change', (e)=>{
			const id = parseInt(e.target.value);
			const s = getStatsForId(id);
			drawRadar(s);
		});

		// select first (alphabetical) by default
		if (select.options.length) {
			select.value = select.options[0].value;
			drawRadar(getStatsForId(parseInt(select.value)));
		}

		// cleanup
		return () => { try { root.innerHTML = ''; } catch {} };
	}
};

