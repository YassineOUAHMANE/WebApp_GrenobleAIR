/**
 * parkingView.js - Vue des bulles de stationnement
 * Graphique des top parkings avec bulles et filtres
 */

import { fetchCSV } from "../utils/fetchData.js";

export default {
    title: 'Stationnement',
    icon: 'parking',
    async mount(root) {
        const d3 = window.d3;

        root.innerHTML = `
        <h2 class="title" style="margin-bottom: 0.5rem;">🅿️ Stationnement</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Top 10 parkings par capacité</p>
        
        <section class="grid">            
            <!-- FILTRES (Colonne gauche) -->
            <div class="card" style="height: fit-content; grid-column: span 3;">
                <h2 style="margin-top: 0; font-size: 1.2rem; margin-bottom: 1.5rem;">🔍 Filtres</h2>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.8rem; font-size: 0.95rem;">💰 Tarif:</label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-tarif" value="gratuit"> ✅ Gratuit
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                    <input type="checkbox" class="filter-tarif" value="payant"> 💳 Payant
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
            <div id="bubble-chart" style="min-height: 400px; max-height: 570px; border: 1px solid rgba(79,124,255,0.2); border-radius: 8px; background: linear-gradient(135deg, rgba(79,124,255,0.05), rgba(41,193,140,0.05)); padding: 0; overflow: hidden;"></div>
            </div>
        </section>

        <div id="bubble-tooltip" style="position: fixed; display: none; background: white; border: 1px solid rgba(79,124,255,0.3); padding: 1rem; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); max-width: 320px; pointer-events: none; z-index: 99999; font-size: 0.95rem; top: 0; left: 0;"></div>
        `;

        let allData = [];
        let filters = { service: new Set() };

        const loadData = async () => {
            const raw = await fetchCSV('/data/parking/parking.csv');

            allData = raw
                .filter(p => parseInt(p['nb_places'] || 0) > 0)
                .map(p => ({
                    nom: p['nom'] || '—',
                    places: parseInt(p['nb_places'] || 0) || 0,
                    gratuit: p['gratuit'] === '1' || p['gratuit'] === '1.0',
                    type: p['type_ouvrage'] || 'enclos_en_surface',
                    commune: p['commune'] || '—',
                    velo: parseInt(p['nb_velo'] || 0) || 0,
                    elec: parseInt(p['nb_voitures_electriques'] || 0) || 0,
                    pmr: parseInt(p['nb_pmr'] || 0) || 0,
                    covoit: parseInt(p['nb_covoit'] || 0) || 0,
                }));

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
                .attr('r', d => Math.max(15, Math.min(60, (d.places / maxPlaces) * 60)))
                .attr('fill', d => d.gratuit ? '#29c18c' : '#ffd166')
                .attr('opacity', 0.8)
                .attr('stroke', 'white')
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
                const bubbleRadius = Math.max(15, Math.min(60, (d.places / maxPlaces) * 60));
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
              <div style="margin: 0.3rem 0;">🏗️ ${d.type === 'enclos_en_surface' ? 'Surface' : 'Ouvrage'}</div>
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


        return () => {
            try { root.innerHTML = ''; } catch { }
        };
    }
};
