import { fetchCSV } from '../utils/fetchData.js';
import { featureCollectionFromRows } from '../utils/mapUtils.js';
import { icons } from '../utils/icons.js';

// dimensions: arceaux (stationnement cyclable), places de parking, bornes EV, trafic vélo (tmj), pollution (placeholder: city median)

export default {
	linkTitle: 'Quartiers',
	title: 'Quartiers',
	icon: 'star',
	async mount(root) {
		root.innerHTML = `
			<h2 class="title">${icons.star} Quartiers — Diagramme en étoile</h2>
            <section class="grid">
                <div class="card span-12">
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
            </section>
		`;

		// --- Load data ---
		const quartiersRows = await fetchCSV('./data/quartiers/unions_de_quartier_epsg4326.csv');
		const quartiersFC = featureCollectionFromRows(quartiersRows, { shapeCol: 'geo_shape' });
        quartiersFC.features.forEach(i => i.geometry.coordinates[0].reverse())

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
		const [arceauxRows, parkingRows, evRows, bikeRows, pmRows, pmLocation] = await Promise.all([
			fetchCSV('./data/mobilite_douce/arceaux.csv'),
			fetchCSV('./data/parking/parking.csv'),
			fetchCSV('./data/irve/irve_smmag.csv'),
			fetchCSV('./data/mobilite_douce/comptages_velos_permanents.csv'),
			fetchCSV('./data/air/pm25_neighborhoods.csv'),
			fetchCSV('./data/air/sensor_neighborhood_locations.csv'),
		])
        const pm25 = pmLocation.map(i => {
            return {...i, geo_point_2d: i.lat + ',' + i.long, median: d3.median(pmRows.map(r => r[i.sensorid]))}
        })
		// Aggregate per neighborhood
		const stats = quartiers.map(q => ({
			id: q.id,
			name: q.name,
			arceaux: 0,
			parking_places: 0,
			ev_count: 0,
			bike_tmj: 0,
            pm25: []
		}));

        function matchToNeighborhood(data, dataKey, statsKey){
            for(const r of data){
                const [lon, lat] = r.geo_point_2d.split(',').map(parseFloat)
                if(!lon && !lat) continue;
                for(const s of stats){
                    if(d3.geoContains(quartiers[s.id].feature, [lat, lon])){
                        if(typeof s[statsKey] == 'number'){
                            s[statsKey] += parseFloat(r[dataKey]) || 0;
                        }else{
                            s[statsKey].push(parseFloat(r[dataKey]) || 0);
                        }
                        break;
                    }
                }
            }
        }
        matchToNeighborhood(arceauxRows, 'mob_arce_nb', 'arceaux')
        matchToNeighborhood(parkingRows, 'nb_places', 'parking_places')
        matchToNeighborhood(parkingRows, 'nb_places', 'parking_places')
        matchToNeighborhood(evRows, 'nbre_pdc', 'ev_count')
        matchToNeighborhood(bikeRows, 'tmj_2022', 'bike_tmj')
        matchToNeighborhood(pm25, 'median', 'pm25')

        stats.forEach(s => {s.pm25 = d3.median(s.pm25) || 0}) // Compute median of pm25 for each neighborhood

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
				{ key: 'bike_tmj', label: 'Trafic vélo', value: dataItem.bike_tmj },
				{ key: 'pollution', label: 'PM2.5 médiane', value: dataItem.pm25 }
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
				  .attr('stroke', 'var(--fg-1)')
				  .attr('stroke-dasharray','2,2')
				  .attr('stroke-width', 1);
			}

			// axes and labels
			metrics.forEach((m, i) => {
				const angle = i * angleStep - Math.PI/2;
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				g.append('line').attr('x1',0).attr('y1',0).attr('x2',x).attr('y2',y).attr('stroke','var(--fg-1)');
				const lx = Math.cos(angle) * (radius + 12);
				const ly = Math.sin(angle) * (radius + 12);
				g.append('text').attr('x', lx).attr('y', ly).attr('text-anchor', Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle')
					.attr('alignment-baseline', 'middle')
					.attr('font-size', 12)
                    .attr('fill', 'var(--text-1)')
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
				Trafic vélo (moyen): ${Math.round(dataItem.bike_tmj)}<br>
				PM2.5 (médiane globale): ${Number(dataItem.pm25).toFixed(2)}
			`;
		}

		// initial draw for first neighborhood
		function getStatsForId(id){
			const s = stats.find(x => x.id == id) || stats[0];
			return { ...s, name: quartiers[id].name };
		}

		select.addEventListener('change', e => selected(e.target.value));

        function selected(v){
            const id = parseInt(v);
			const s = getStatsForId(id);
			drawRadar(s);
        }

		// select first (alphabetical) by default
		if (select.options.length) {
			select.value = select.options[0].value;
            selected(select.value)
		}

		// cleanup
		return () => { try { root.innerHTML = ''; } catch {} };
	}
};

