/**
 * parkingView.js - Vue des bulles de stationnement
 * Graphique des top parkings avec bulles et filtres
 */

import { fetchCSV } from "../utils/fetchData.js";
import { featureCollectionFromRows } from '../utils/mapUtils.js';
import { icons } from "../utils/icons.js";

export default {
    title: 'Stationnement',
    icon: 'parking',
    async mount(root) {
        const d3 = window.d3;

        root.innerHTML = `
        <h2 class="title" style="margin-bottom: 0.5rem;">${icons.parking} Stationnement</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Top 10 parkings par capacité</p>
        
        <section class="grid">            
            <!-- FILTRES (Colonne gauche) -->
            <div class="card" style="height: fit-content; grid-column: span 3;">
                <h2 style="margin-top: 0; font-size: 1.2rem; margin-bottom: 1.5rem;">Filtres</h2>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.8rem; font-size: 0.95rem;">💰 Tarif:</label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-tarif" value="gratuit" checked> Gratuit <span class="color-box" style="background-color: #1fa371"></span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-tarif" value="payant" checked> Payant <span class="color-box" style="background-color: #3551d5"></span>
                    </label>
                </div>

                <div>
                    <label style="font-weight: 600; display: block; margin-bottom: 0.8rem; font-size: 0.95rem;">🛎️ Services:</label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-service" value="velo"> 🚴 Vélos
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-service" value="elec"> 🔌 Voitures électriques
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-service" value="pmr"> ♿ PMR
                    </label>
                </div>
            </div>

            <!-- GRAPHIQUE (Colonne droite) -->
            <div class="card" style="grid-column: span 9;">
                <h2 style="margin-top: 0; margin-bottom: 1rem;">🏆 Top 10 Parkings</h2>
                <div id="bubble-chart" style="min-height: 400px; max-height: 570px; border: 1px solid rgba(79,124,255,0.2); border-radius: 1rem; padding: 0; overflow: hidden;"></div>
            </div>

            <!-- SANKEY -->
            <div class="span-12 card">
                <h2>Diagramme de Sankey </h2>
                <p>Ce diagramme de Sankey représente la répartition des places de stationnement selon différents critères.
                    Les flux montrent :
                    <ul style="padding-left: 1rem">
                        <li>La distinction entre stationnements gratuits et payants.</li>
                        <li>La localisation par rapport à la Zone à Faibles Émissions (ZFE), avec les flux "Intra-ZFE" et "Extra-ZFE".</li>
                        <li>Les types de parkings (ouvrages ou enclos en surface), et la répartition des places dédiées à l'électrique, à l'autopartage et aux PMR.</li>
                        <li>Les 10 plus grands parkings de la métropole grenobloise, les flux restants sont regroupés sous "Autres".</li>
                    </ul>
                </p>
                <div id="sankey-graph" style="min-height: 400px; max-height: 570px; padding: 0; overflow: hidden;"></div>
            </div>
        </section>

        <div id="bubble-tooltip" style="position: fixed; display: none; background: white; border: 1px solid rgba(79,124,255,0.3); padding: 1rem; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); max-width: 320px; pointer-events: none; z-index: 99999; font-size: 0.95rem; top: 0; left: 0;"></div>
        `;

        // The bubble graph

        let allData = [];
        let filters = { service: new Set() };

        let ZFEPermimeter;

        const loadData = async () => {

            //Parking data
            const raw = await fetchCSV('./data/parking/parking.csv');

            allData = raw
                .filter(p => parseInt(p['nb_places'] || 0) > 0)
                .map(p => ({
                    nom: p['nom'] || '—',
                    places: parseInt(p['nb_places'] || 0) || 0,
                    gratuit: parseInt(p['gratuit']) == 1,
                    type: p['type_ouvrage'].replaceAll('_', ' ') || 'enclos en surface',
                    commune: p['commune'] || '—',
                    velo: parseInt(p['nb_velo'] || 0) || 0,
                    elec: parseInt(p['nb_voitures_electriques'] || 0) || 0,
                    pmr: parseInt(p['nb_pmr'] || 0) || 0,
                    covoit: parseInt(p['nb_covoit'] || 0) || 0,
                    coords: p.geo_point_2d?.split(',').map(parseFloat) || [0,0]
                }));

            const zfe = await fetchCSV('./data/zfe/zfeaires.csv');
            ZFEPermimeter = featureCollectionFromRows(zfe);
            console.log(ZFEPermimeter);

            setupFilters();
            renderBubbles();
        };

        const applyFilters = () => {
            let result = [...allData];

            // Tarif: checkboxes (on peut avoir les deux)
            const tarifGratuit = root.querySelector('input.filter-tarif[value="gratuit"]').checked;
            const tarifPayant = root.querySelector('input.filter-tarif[value="payant"]').checked;

            if (tarifGratuit || tarifPayant) {
                result = result.filter(p => {
                    if (tarifGratuit && p.gratuit) return true;
                    if (tarifPayant && !p.gratuit) return true;
                    return false;
                });
            }

            // Services: checkboxes
            if (filters.service.size > 0) {
                result = result.filter(p => {
                    for (let service of filters.service) {
                        if (service === 'velo' && p.velo === 0) return false;
                        if (service === 'elec' && p.elec === 0) return false;
                        if (service === 'pmr' && p.pmr === 0) return false;
                    }
                    return true;
                });
            }
            return result;
        };

        const renderBubbles = () => {
            const filtered = applyFilters();
            const top10 = filtered.sort((a, b) => b.places - a.places).slice(0, 10);

            const container = root.querySelector('#bubble-chart');
            if (!container) return;

            const w = container.clientWidth;
            const h = container.clientHeight;

            container.innerHTML = '';
            const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);

            if (top10.length === 0) {
                svg.append('text')
                    .attr('x', w / 2)
                    .attr('y', h / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dy', '0.3em')
                    .style('fill', '#999')
                    .text('Aucun parking ne correspond aux filtres');
                return;
            }

            const maxPlaces = Math.max(...top10.map(p => p.places));
            const minPlaces = Math.min(...top10.map(p => p.places));

            // Bubbles
            const bubbles = svg.selectAll('circle')
                .data(top10, d => d.nom)
                .join('circle')
                .attr('cx', -50)
                .attr('cy', h / 2)
                .attr('r', d => Math.max(15, Math.min(60, Math.sqrt(d.places / maxPlaces) * 60)))
                .attr('fill', d => d.gratuit ? "#29c18c" : "#4f7cff")
                .attr('stroke', d => d.gratuit ? "#1fa371" : "#3551d5")
                .attr('stroke-width', 3)
                .style('cursor', 'pointer');

            bubbles
                .transition()
                .duration(1000)
                .delay((d, i) => i * 80)
                .attr('cx', d => 80 + (((d.places - minPlaces) / (maxPlaces - minPlaces)) * (w - 160)))
                .style('pointer-events', 'none')
                .on('end', () => {
                    bubbles.style('pointer-events', 'auto');
                });

            // Labels (numbers inside bubbles)
            svg.selectAll('text.label')
                .data(top10, d => d.nom)
                .join('text')
                .attr('class', 'label')
                .attr('x', -50)
                .attr('y', h / 2)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.3em')
                .attr('font-size', d => Math.max(11, Math.min(16, (d.places / maxPlaces) * 16)))
                .attr('font-weight', 'bold')
                .attr('fill', 'white')
                .attr('pointer-events', 'none')
                .text(d => d.places)
                .style('opacity', 0)
                .transition()
                .duration(1000)
                .delay((d, i) => i * 80 + 300)
                .style('opacity', 1)
                .attr('x', d => 80 + (((d.places - minPlaces) / (maxPlaces - minPlaces)) * (w - 160)));

            // Tooltip
            const tooltip = root.querySelector('#bubble-tooltip');
            const maxRadius = Math.max(...top10.map(d => Math.max(15, Math.min(60, (d.places / maxPlaces) * 60))));
            const largeThreshold = maxRadius * 0.7;
            let tooltipTimeout = null;
            let lastX = 0, lastY = 0;

            const positionTooltip = (x, y, bubbleRadius) => {
                lastX = x;
                lastY = y;

                // Attendre que le DOM soit à jour avant de calculer
                requestAnimationFrame(() => {
                    const rect = tooltip.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    let adjustedX = x;
                    let adjustedY = y - rect.height - 15; // Placer au-dessus de la souris

                    if (bubbleRadius >= largeThreshold) {
                        adjustedX = x - rect.width - 15;
                    } else {
                        if (x + rect.width + 15 > viewportWidth - 10) {
                            adjustedX = x - rect.width - 15;
                        } else {
                            adjustedX = x + 15;
                        }
                    }

                    // Vérifier les limites verticales
                    if (adjustedY < 10) {
                        adjustedY = y + 15;
                    }
                    if (adjustedY + rect.height > viewportHeight - 10) {
                        adjustedY = viewportHeight - rect.height - 10;
                    }

                    // Vérifier les limites horizontales
                    if (adjustedX < 10) {
                        adjustedX = 10;
                    }
                    if (adjustedX + rect.width > viewportWidth - 10) {
                        adjustedX = viewportWidth - rect.width - 10;
                    }

                    tooltip.style.left = adjustedX + 'px';
                    tooltip.style.top = adjustedY + 'px';
                });
            };

            bubbles.on('mouseenter', function (event, d) {
                const bubbleRadius = Math.max(15, Math.min(60, Math.sqrt(d.places / maxPlaces) * 60));
                d3.select(this)
                    .transition().duration(150)
                    .attr('r', bubbleRadius * 1.2)
                    .attr('opacity', 1)
                    .attr('stroke-width', 4);

                // Afficher le tooltip après 300ms pour éviter les mouvements rapides
                tooltipTimeout = setTimeout(() => {
                    tooltip.innerHTML = `
            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.8rem; color: #333;">${d.nom}</div>
            <div style="margin-bottom: 0.6rem; color: #666;">📍 <strong>${d.commune}</strong></div>
            <div style="border-top: 1px solid #eee; padding-top: 0.6rem; margin-bottom: 0.6rem; color: #555;">
              <div style="margin: 0.3rem 0;">🅿️ <strong>${d.places} places</strong></div>
              <div style="margin: 0.3rem 0;">${d.gratuit ? '✓ Gratuit' : '💳 Payant'}</div>
              <div style="margin: 0.3rem 0;">🏗️ ${d.type === 'enclos en surface' ? 'Surface' : 'Ouvrage'}</div>
            </div>
            <div style="font-size: 0.9rem; color: #666;">
              <div style="margin: 0.2rem 0;">🚴 Vélos: <strong>${d.velo}</strong></div>
              <div style="margin: 0.2rem 0;">🔌 Voitures électriques: <strong>${d.elec}</strong></div>
              <div style="margin: 0.2rem 0;">♿ PMR: <strong>${d.pmr}</strong></div>
            </div>
          `;

                    tooltip.style.display = 'block';
                    const x = event.clientX + 15;
                    const y = event.clientY + 15;
                    positionTooltip(x, y, bubbleRadius);
                }, 300);
            })
                .on('mouseleave', function () {
                    clearTimeout(tooltipTimeout);
                    d3.select(this).transition().duration(150)
                        .attr('r', dd => Math.max(15, Math.min(60, (dd.places / maxPlaces) * 60)))
                        .attr('opacity', 0.8)
                        .attr('stroke-width', 3);
                    tooltip.style.display = 'none';
                })
                .on('mousemove', function (event, d) {
                    const bubbleRadius = Math.max(15, Math.min(60, (d.places / maxPlaces) * 60));
                    // Seulement repositionner le tooltip, ne pas changer le contenu
                    if (tooltip.style.display === 'block') {
                        positionTooltip(event.clientX + 15, event.clientY + 15, bubbleRadius);
                    }
                });
        };

        const setupFilters = () => {
            root.querySelectorAll('input.filter-tarif').forEach(cb => {
                cb.addEventListener('change', renderBubbles);
            });

            root.querySelectorAll('.filter-service').forEach(cb => {
                cb.addEventListener('change', () => {
                    filters.service.clear();
                    root.querySelectorAll('.filter-service:checked').forEach(c => filters.service.add(c.value));
                    renderBubbles();
                });
            });
        };

        await loadData();


        // The sankey graph
        const container = root.querySelector('#sankey-graph');
        // if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);

        const sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeAlign(d3.sankeyJustify) // d3.sankeyLeft, etc.
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[1, 5], [w - 1, h - 5]]);

        //Nodes : the vertices of the sankey graph
        const data = {}
        data.nodes = [
            { name: 'Total', category: 'Total' },
            { name: 'Gratuit', category: 'Gratuit/Payant' },
            { name: 'Payant', category: 'Gratuit/Payant' },
            { name: 'Intra-ZFE', category: 'ZFE' },
            { name: 'Extra-ZFE', category: 'ZFE' },
            { name: 'Electrique', category: 'Special' },
            { name: 'Autopartage', category: 'Special' },
            { name: 'PMR', category: 'Special' },
            { name: 'Autres', category: 'Parkings' },
        ]
        console.log(allData)
        const types = new Set(allData.map(i => i.type))
        types.forEach(i => data.nodes.push({ name: i, category: 'Type' })); // Get types of parkings

        const biggestParkings = allData.map(i => [i.nom, i.places]).sort((a,b) => b[1] - a[1]).filter((_,k) => k < 10).map(i => i[0]);//Find the 10 biggest parkings
        console.log(biggestParkings)

        console.log(data.nodes)

        //Links
        data.links = [];
        function setupLinks() {
            let links = {
                gratuit: 0,
                payant: 0,
                gratuitInZFE: 0,
                payantInZFE: 0,
                gratuitOutZFE: 0,
                payantOutZFE: 0,
                elecAutres: 0,
                partAutres: 0,
                PMRAutres: 0,

            };
            types.forEach(i => {
                links['InZFE' + i] = 0; 
                links['OutZFE' + i] = 0
                links[i + 'Elec'] = 0;
                links[i + 'Part'] = 0;
                links[i + 'PMR'] = 0;
                links[i + 'Autres'] = 0;
            }); // Get types of parkings

            allData.forEach(i => {
                const inZFE = d3.geoContains(ZFEPermimeter.features[0], [i.coords[1], i.coords[0]])
                console.log(inZFE)
                links[i.gratuit ? 'gratuit' : 'payant'] += i.places;
                links[(i.gratuit ? 'gratuit' : 'payant') + (inZFE ? 'InZFE' : 'OutZFE')] += i.places;
                links[(inZFE ? 'InZFE' : 'OutZFE') + i.type] += i.places;

                links[i.type + 'Elec'] += i.elec;
                links[i.type + 'Part'] += i.covoit;
                links[i.type + 'PMR'] += i.pmr;

                const isParkingCategorized = biggestParkings.includes(i.nom);
                if(isParkingCategorized){
                    data.nodes.push({name: i.nom, category: 'Parkings'});
                }
                if(i.elec > 0){
                    if(isParkingCategorized){
                        data.links.push({source: 'Electrique', target: i.nom, value: i.elec});
                    }else{
                        links.elecAutres += i.elec
                    }
                }
                if(i.covoit > 0){
                    if(isParkingCategorized){
                        data.links.push({source: 'Autopartage', target: i.nom, value: i.covoit});
                    }else{
                        links.partAutres += i.covoit
                    }
                }
                if(i.pmr > 0){
                    if(isParkingCategorized){
                        data.links.push({source: 'PMR', target: i.nom, value: i.pmr});
                    }else{
                        links.PMRAutres += i.pmr
                    }
                }

                const otherSpots = i.places - i.elec - i.covoit - i.pmr;
                if(isParkingCategorized){
                    data.links.push({source: i.type, target: i.nom, value: otherSpots});
                }else{
                    links[i.type + 'Autres'] += otherSpots;
                }
            })
            console.log(links)
            data.links.push({ source: 'Total', target: 'Gratuit', value: links.gratuit })
            data.links.push({ source: 'Total', target: 'Payant', value: links.payant })
            data.links.push({ source: 'Gratuit', target: 'Intra-ZFE', value: links.gratuitInZFE })
            data.links.push({ source: 'Gratuit', target: 'Extra-ZFE', value: links.gratuitOutZFE })
            data.links.push({ source: 'Payant', target: 'Intra-ZFE', value: links.payantInZFE })
            data.links.push({ source: 'Payant', target: 'Extra-ZFE', value: links.payantOutZFE })
            data.links.push({ source: 'PMR', target: 'Autres', value: links.PMRAutres })
            data.links.push({ source: 'Autopartage', target: 'Autres', value: links.partAutres })
            data.links.push({ source: 'Electrique', target: 'Autres', value: links.elecAutres })
            types.forEach(i => {
                data.links.push({ source: 'Intra-ZFE', target: i, value: links['InZFE' + i]});
                data.links.push({ source: 'Extra-ZFE', target: i, value: links['OutZFE' + i]});
                data.links.push({ source: i, target: 'Electrique', value: links[i + 'Elec']});
                data.links.push({ source: i, target: 'Autopartage', value: links[i + 'Part']});
                data.links.push({ source: i, target: 'PMR', value: links[i + 'PMR']});
                
                data.links.push({ source: i, target: 'Autres', value: links[i + 'Autres']});
            }); // Get types of parkings
            console.log(data.links)

        }
        setupLinks();

        console.log({
            nodes: data.nodes.map(d => Object.assign({}, d)),
            links: data.links.map(d => Object.assign({}, d))
        })


        const { nodes, links } = sankey({
            nodes: data.nodes.map(d => Object.assign({}, d)),
            links: data.links.map(d => Object.assign({}, d))
        });

        // Defines a color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Creates the rects that represent the nodes.
        const rect = svg.append("g")
            .attr("stroke", "#000")
            .selectAll()
            .data(nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => color(d.category));

        // Adds a title on the nodes.
        rect.append("title")
            .text(d => `${d.name}\n${d.value}`);

        // Creates the paths that represent the links.
        const link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke-opacity", 0.5)
            .selectAll()
            .data(links)
            .join("g")

        function uid(d) {
            const source = d.source.name.replaceAll(' ', '_').replaceAll('\'', '')
            const target = d.target.name.replaceAll(' ', '_').replaceAll('\'', '')
            return `link-${source}-${target}`;
        }

        const gradient = link.append("linearGradient")
            .attr("id", d => d.uid = uid(d))
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d => d.source.x1)
            .attr("x2", d => d.target.x0);
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d => color(d.source.category));
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d => color(d.target.category));

        link.append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => `url(#${d.uid})`)
            .attr("stroke-width", d => Math.max(1, d.width));

        link.append("title")
            .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);

        // Adds labels on the nodes.
        svg.append("g")
            .selectAll()
            .data(nodes)
            .join("text")
            .attr("x", d => d.x0 < w / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("font-size", ".5rem")
            .attr("fill", "var(--text-1)")
            .attr("text-anchor", d => d.x0 < w / 2 ? "start" : "end")
            .text(d => d.name);


        return () => {
            try { root.innerHTML = ''; } catch { }
        };
    }
};
