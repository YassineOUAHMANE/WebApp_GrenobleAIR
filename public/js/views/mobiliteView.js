import { fetchCSV } from '../utils/fetchData.js';

export default {
    title: 'Mobilité Douce',
    icon: 'bike',
    async mount(root) {
        // --- Layout
        root.innerHTML = `
        <h2 class="title">Mobilité Douce — Comptages Vélo</h2>
            
        <section class="grid">
            <!-- Vue d'ensemble - toute la largeur -->
            <div class="span-12 card" style="margin-bottom: 1rem;">
                <h2 style="margin-bottom: 1.5rem;">Vue d'ensemble</h2>
                
                <div style="display: flex; align-items: flex-start; gap: 2rem;">
                    <!-- Section Comptage -->
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <h3 style="font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); margin: 0;">Flux vélos</h3>
                            <div style="display: flex; gap: 0.25rem; border: 1px solid var(--border-color); border-radius: 4px; padding: 0.125rem; background: var(--bg-secondary);">
                                <button class="year-btn" data-year="2019" style="padding: 0.35rem 0.75rem; border: none; border-radius: 3px; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: inherit;">
                                    2019
                                </button>
                                <button class="year-btn" data-year="2020" style="padding: 0.35rem 0.75rem; border: none; border-radius: 3px; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: inherit;">
                                    2020
                                </button>
                                <button class="year-btn" data-year="2021" style="padding: 0.35rem 0.75rem; border: none; border-radius: 3px; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: inherit;">
                                    2021
                                </button>
                                <button class="year-btn" data-year="2022" style="padding: 0.35rem 0.75rem; border: none; border-radius: 3px; background: transparent; color: var(--text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: inherit;">
                                    2022
                                </button>
                            </div>
                        </div>
                        <div id="traffic-stats" style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <!-- Traffic stats will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Séparateur vertical -->
                    <div style="width: 1px; background: var(--border-color); align-self: stretch; margin: 0 0.5rem;"></div>
                    
                    <!-- Section Pistes Cyclables -->
                    <div style="flex: 1;">
                        <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);">Pistes Cyclables</h3>
                        <div id="bike-lanes-stats">
                            <!-- Bike lanes stats will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Séparateur vertical -->
                    <div style="width: 1px; background: var(--border-color); align-self: stretch; margin: 0 0.5rem;"></div>
                    
                    <!-- Section Vélo / Trotinettes libre service -->
                    <div style="flex: 1;">
                        <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);">Vélos et trotinettes électriques en libre service disponibles en temps réel</h3>
                        <div id="vehicles-stats">
                            <!-- Vehicles stats will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Évolution par compteur - toute la largeur -->
            <div class="span-12 card" style="margin-bottom: 1rem;">
                <h2 style="margin-bottom: 1rem;">Évolution du nombre journalier de cyclistes par compteur</h2>
                <div id="mini-charts-container"></div>
            </div>

            <!-- Évolution globale - à gauche -->
            <div class="span-6 card" style="margin-bottom: 1rem;">
                <h2 style="margin-bottom: 1rem;">Évolution du nombre journalier de cyclistes recensés par les compteurs</h2>
                <div id="evolution-chart"></div>
            </div>

            <!-- Répartition pistes cyclables - à droite -->
            <div class="span-6 card" style="margin-bottom: 1rem;">
                <h2 style="margin-bottom: 1rem;">Répartition des pistes cyclables par type d'axe</h2>
                <div id="bike-lanes-chart"></div>
            </div>
        </section>
        `;

        // --- Load CSV files
        const rows = await fetchCSV('./data/mobilite_douce/comptages_velos_permanents.csv');
        const bikeLanesLengthsRows = await fetchCSV('./data/mobilite_douce/longueurs_pistes_cyclables.csv');

        // --- Parse data and filter only counters with data for all years 2019-2022
        const data = rows
            .filter(d => {
                const tmj2019 = parseFloat(d.tmj_2019) || 0;
                const tmj2020 = parseFloat(d.tmj_2020) || 0;
                const tmj2021 = parseFloat(d.tmj_2021) || 0;
                const tmj2022 = parseFloat(d.tmj_2022) || 0;
                // Keep only counters with data for all years
                return tmj2019 > 0 && tmj2020 > 0 && tmj2021 > 0 && tmj2022 > 0;
            })
            .map(d => ({
                nom: d.nom_post.replace(/^\(.*?\)\s*/, ''),
                total: {
                    2019: parseFloat(d.tmj_2019) || 0,
                    2020: parseFloat(d.tmj_2020) || 0,
                    2021: parseFloat(d.tmj_2021) || 0,
                    2022: parseFloat(d.tmj_2022) || 0
                },
                weekday: {
                    2019: parseFloat(d.tmjo_2019) || 0,
                    2020: parseFloat(d.tmjo_2020) || 0,
                    2021: parseFloat(d.tmjo_2021) || 0,
                    2022: parseFloat(d.tmjo_2022) || 0
                },
                weekend: {
                    2019: parseFloat(d.tmjwe_2019) || 0,
                    2020: parseFloat(d.tmjwe_2020) || 0,
                    2021: parseFloat(d.tmjwe_2021) || 0,
                    2022: parseFloat(d.tmjwe_2022) || 0
                },
                peakDay: {
                    2019: parseFloat(d.jour_de_pointe_2019) || 0,
                    2020: parseFloat(d.jour_de_pointe_2020) || 0,
                    2021: parseFloat(d.jour_de_pointe_2021) || 0,
                    2022: parseFloat(d.jour_de_pointe_2022) || 0
                }
            }));


        const years = [2019, 2020, 2021, 2022];
        const chartContainer = d3.select('#evolution-chart');
        const miniChartsContainer = d3.select('#mini-charts-container');
        
        // State for expanded mini chart
        let expandedCounter = null;

        // --- Function to update evolution chart
        const updateEvolutionChart = () => {
            // Calculate evolution data for weekday and weekend
            const weekdayData = years.map(year => {
                const totalTmj = d3.sum(data, d => d.weekday[year]);
                return {
                    year,
                    value: totalTmj
                };
            });

            const weekendData = years.map(year => {
                const totalTmj = d3.sum(data, d => d.weekend[year]);
                return {
                    year,
                    value: totalTmj
                };
            });

            // Clear existing chart
            chartContainer.selectAll('*').remove();
            // Remove existing tooltip
            d3.select('body').selectAll('.evolution-tooltip').remove();

            // Create chart dimensions
            const margin = { t: 20, r: 40, b: 60, l: 70 };
            const evolutionContainerWidth = chartContainer.node().clientWidth || 900;
            const width = Math.max(evolutionContainerWidth, 300);
            const height = 350;

            const evolutionSvg = chartContainer.append('svg')
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('width', '100%')
                .attr('height', height)
                .style('display', 'block')
                .style('max-width', '100%');

            // Find max value for Y scale
            const maxValue = d3.max([...weekdayData, ...weekendData], d => d.value);

            const x = d3.scaleLinear()
                .domain([2019, 2022])
                .range([margin.l, width - margin.r]);

            const y = d3.scaleLinear()
                .domain([0, maxValue * 1.1])
                .nice()
                .range([height - margin.b, margin.t]);

            // Axes
            evolutionSvg.append('g')
                .attr('transform', `translate(0,${height - margin.b})`)
                .call(d3.axisBottom(x).tickValues(years).tickFormat(d => d));

            evolutionSvg.append('g')
                .attr('transform', `translate(${margin.l},0)`)
                .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format('~s')(d)));

            // Line generator
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.value))
                .curve(d3.curveMonotoneX);

            // Weekday line (blue)
            evolutionSvg.append('path')
                .datum(weekdayData)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 3)
                .attr('d', line);

            // Weekend line (orange)
            evolutionSvg.append('path')
                .datum(weekendData)
                .attr('fill', 'none')
                .attr('stroke', '#ff7f0e')
                .attr('stroke-width', 3)
                .attr('d', line);

            // Create tooltip
            const tooltip = d3.select('body').append('div')
                .attr('class', 'evolution-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.85)')
                .style('color', '#fff')
                .style('padding', '0.5rem 0.75rem')
                .style('border-radius', '4px')
                .style('font-size', '0.85rem')
                .style('pointer-events', 'none')
                .style('opacity', 0)
                .style('z-index', 1000);

            // Weekday points
            evolutionSvg.append('g').selectAll('circle')
                .data(weekdayData)
                .enter()
                .append('circle')
                .attr('cx', d => x(d.year))
                .attr('cy', d => y(d.value))
                .attr('r', 5)
                .attr('fill', 'steelblue')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                    tooltip.html(Math.round(d.value).toLocaleString())
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0);
                });

            // Weekend points
            evolutionSvg.append('g').selectAll('circle')
                .data(weekendData)
                .enter()
                .append('circle')
                .attr('cx', d => x(d.year))
                .attr('cy', d => y(d.value))
                .attr('r', 5)
                .attr('fill', '#ff7f0e')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                    tooltip.html(Math.round(d.value).toLocaleString())
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0);
                });

            // Calculate and display percentage changes for weekday (from 2020)
            weekdayData.forEach((d, i) => {
                if (i > 0 && d.year >= 2020) {
                    const prevValue = weekdayData[i - 1].value;
                    const change = prevValue > 0 ? ((d.value - prevValue) / prevValue) * 100 : 0;
                    const sign = change >= 0 ? '+' : '';
                    const color = change >= 0 ? '#1a9850' : '#d73027';
                    
                    evolutionSvg.append('text')
                        .attr('x', x(d.year))
                        .attr('y', y(d.value) - 20)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '0.75rem')
                        .attr('font-weight', '600')
                        .attr('fill', color)
                        .text(`${sign}${change.toFixed(1)}%`);
                }
            });

            // Calculate and display percentage changes for weekend (from 2020)
            weekendData.forEach((d, i) => {
                if (i > 0 && d.year >= 2020) {
                    const prevValue = weekendData[i - 1].value;
                    const change = prevValue > 0 ? ((d.value - prevValue) / prevValue) * 100 : 0;
                    const sign = change >= 0 ? '+' : '';
                    const color = change >= 0 ? '#1a9850' : '#d73027';
                    
                    evolutionSvg.append('text')
                        .attr('x', x(d.year))
                        .attr('y', y(d.value) - 20)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '0.75rem')
                        .attr('font-weight', '600')
                        .attr('fill', color)
                        .text(`${sign}${change.toFixed(1)}%`);
                }
            });

            // Legend
            const legend = evolutionSvg.append('g')
                .attr('transform', `translate(${width - margin.r - 150}, ${margin.t + 10})`);

            legend.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 0)
                .attr('y2', 0)
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 3);

            legend.append('text')
                .attr('x', 25)
                .attr('y', 0)
                .attr('dy', '0.35em')
                .attr('font-size', '0.85rem')
                .attr('fill', 'var(--text-primary)')
                .text('Semaine');

            legend.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 20)
                .attr('y2', 20)
                .attr('stroke', '#ff7f0e')
                .attr('stroke-width', 3);

            legend.append('text')
                .attr('x', 25)
                .attr('y', 20)
                .attr('dy', '0.35em')
                .attr('font-size', '0.85rem')
                .attr('fill', 'var(--text-primary)')
                .text('Week-end');

            // Y-axis label
            evolutionSvg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', margin.l - 40)
                .attr('x', -height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '0.9rem')
                .attr('fill', 'var(--text-secondary)')
                .text('Nombre journalier moyen de cyclistes');
        };

        // --- Function to update mini charts
        const updateMiniCharts = () => {
            // Clear existing mini charts
            miniChartsContainer.selectAll('*').remove();
            // Remove existing mini chart tooltip
            d3.select('body').selectAll('.mini-chart-tooltip').remove();

            // Filter and sort: get top 8 counters by weekday traffic in 2022
            const topCounters = [...data]
                .sort((a, b) => b.weekday[2022] - a.weekday[2022])
                .slice(0, 8);

            // Create shared tooltip for all mini charts
            const miniTooltip = d3.select('body').append('div')
                .attr('class', 'mini-chart-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.85)')
                .style('color', '#fff')
                .style('padding', '0.5rem 0.75rem')
                .style('border-radius', '4px')
                .style('font-size', '0.75rem')
                .style('pointer-events', 'none')
                .style('opacity', 0)
                .style('z-index', 1000);

            // Create legend (always visible, even when expanded)
            const legend = miniChartsContainer.append('div')
                .style('display', 'flex')
                .style('justify-content', 'center')
                .style('align-items', 'center')
                .style('gap', '2rem')
                .style('padding', '1rem 0')
                .style('flex-wrap', 'wrap');

            // Legend item for weekday
            const legendItem1 = legend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '0.5rem');
            legendItem1.append('div')
                .style('width', '30px')
                .style('height', '3px')
                .style('background', 'steelblue');
            legendItem1.append('span')
                .style('font-size', '0.85rem')
                .style('color', 'var(--text-primary)')
                .text('Semaine');

            // Legend item for weekend
            const legendItem2 = legend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '0.5rem');
            legendItem2.append('div')
                .style('width', '30px')
                .style('height', '3px')
                .style('background', '#ff7f0e');
            legendItem2.append('span')
                .style('font-size', '0.85rem')
                .style('color', 'var(--text-primary)')
                .text('Week-end');

            // Legend item for peak day
            const legendItem3 = legend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '0.5rem');
            const peakDayLine = legendItem3.append('svg')
                .attr('width', 30)
                .attr('height', 3)
                .style('display', 'block');
            peakDayLine.append('line')
                .attr('x1', 0)
                .attr('x2', 30)
                .attr('y1', 1.5)
                .attr('y2', 1.5)
                .attr('stroke', '#d73027')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '5,5');
            legendItem3.append('span')
                .style('font-size', '0.85rem')
                .style('color', 'var(--text-primary)')
                .text('Jour de pointe');

            // If a counter is expanded, show only the expanded chart
            if (expandedCounter !== null) {
                const counter = expandedCounter;
                
                // Get dimensions from evolution chart container for consistency
                const evolutionContainerWidth = chartContainer.node().clientWidth || 900;
                const expandedWidth = Math.max(evolutionContainerWidth, 300);
                const expandedHeight = 350;
                const expandedMargin = { t: 20, r: 40, b: 60, l: 70 };

                // Create expanded chart container
                const expandedDiv = miniChartsContainer.append('div')
                    .style('background', 'var(--bg-secondary)')
                    .style('border-radius', '8px')
                    .style('padding', '1.5rem')
                    .style('border', '2px solid steelblue')
                    .style('width', '100%')
                    .style('box-sizing', 'border-box')
                    .style('cursor', 'pointer')
                    .style('position', 'relative')
                    .on('click', () => {
                        expandedCounter = null;
                        updateMiniCharts();
                    });

                // Add close indicator
                expandedDiv.append('div')
                    .style('position', 'absolute')
                    .style('top', '1rem')
                    .style('right', '1rem')
                    .style('background', 'rgba(0, 0, 0, 0.1)')
                    .style('padding', '0.5rem 0.75rem')
                    .style('border-radius', '4px')
                    .style('font-size', '0.75rem')
                    .style('color', 'var(--text-secondary)')
                    .text('Cliquer pour réduire');

                // Add title
                expandedDiv.append('h3')
                    .style('margin', '0 0 1rem 0')
                    .style('font-size', '1.2rem')
                    .style('font-weight', '600')
                    .style('color', 'var(--text-primary)')
                    .style('text-align', 'center')
                    .text(counter.nom);

                // Prepare data
                const weekdayData = years.map(year => ({
                    year,
                    value: counter.weekday[year]
                }));
                const weekendData = years.map(year => ({
                    year,
                    value: counter.weekend[year]
                }));
                const peakDayData = years.map(year => ({
                    year,
                    value: counter.peakDay[year]
                }));

                // Find max value for Y scale
                const maxValue = Math.max(
                    d3.max(weekdayData, d => d.value),
                    d3.max(weekendData, d => d.value),
                    d3.max(peakDayData, d => d.value)
                );

                // Create SVG
                const svg = expandedDiv.append('svg')
                    .attr('viewBox', `0 0 ${expandedWidth} ${expandedHeight}`)
                .attr('width', '100%')
                    .attr('height', expandedHeight)
                .style('display', 'block')
                .style('max-width', '100%');

                // Scales
                const xScale = d3.scaleLinear()
                .domain([2019, 2022])
                    .range([expandedMargin.l, expandedWidth - expandedMargin.r]);

                const yScale = d3.scaleLinear()
                .domain([0, maxValue * 1.1])
                .nice()
                    .range([expandedHeight - expandedMargin.b, expandedMargin.t]);

                // X axis
                svg.append('g')
                    .attr('transform', `translate(0,${expandedHeight - expandedMargin.b})`)
                    .call(d3.axisBottom(xScale).tickValues(years).tickFormat(d => d));

                // Y axis
                svg.append('g')
                    .attr('transform', `translate(${expandedMargin.l},0)`)
                    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d3.format('~s')(d)));

            // Line generator
            const line = d3.line()
                    .x(d => xScale(d.year))
                    .y(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

                // Weekday line
                svg.append('path')
                    .datum(weekdayData)
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', 3)
                    .attr('d', line);

                // Weekend line
                svg.append('path')
                    .datum(weekendData)
                    .attr('fill', 'none')
                    .attr('stroke', '#ff7f0e')
                    .attr('stroke-width', 3)
                    .attr('d', line);

                // Peak day line
                svg.append('path')
                    .datum(peakDayData)
                    .attr('fill', 'none')
                    .attr('stroke', '#d73027')
                    .attr('stroke-width', 3)
                    .attr('stroke-dasharray', '5,5')
                    .attr('d', line);

                // Weekday points
                svg.append('g').selectAll('circle')
                    .data(weekdayData)
                .enter()
                    .append('circle')
                    .attr('cx', d => xScale(d.year))
                    .attr('cy', d => yScale(d.value))
                    .attr('r', 5)
                    .attr('fill', 'steelblue')
                    .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 1);
                        miniTooltip.html(Math.round(d.value).toLocaleString())
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });

                // Weekend points
                svg.append('g').selectAll('circle')
                    .data(weekendData)
                .enter()
                    .append('circle')
                    .attr('cx', d => xScale(d.year))
                    .attr('cy', d => yScale(d.value))
                    .attr('r', 5)
                    .attr('fill', '#ff7f0e')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 1);
                        miniTooltip.html(Math.round(d.value).toLocaleString())
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });

                // Peak day points
                svg.append('g').selectAll('circle')
                    .data(peakDayData)
                .enter()
                .append('circle')
                    .attr('cx', d => xScale(d.year))
                    .attr('cy', d => yScale(d.value))
                    .attr('r', 5)
                    .attr('fill', '#d73027')
                .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 1);
                        miniTooltip.html(Math.round(d.value).toLocaleString())
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });

                // Calculate and display percentage changes for weekday (from 2020)
                weekdayData.forEach((d, i) => {
                    if (i > 0 && d.year >= 2020) {
                        const prevValue = weekdayData[i - 1].value;
                        const change = prevValue > 0 ? ((d.value - prevValue) / prevValue) * 100 : 0;
                        const sign = change >= 0 ? '+' : '';
                        const color = change >= 0 ? '#1a9850' : '#d73027';
                        
                        svg.append('text')
                            .attr('x', xScale(d.year))
                            .attr('y', yScale(d.value) - 20)
                            .attr('text-anchor', 'middle')
                            .attr('font-size', '0.75rem')
                            .attr('font-weight', '600')
                            .attr('fill', color)
                            .text(`${sign}${change.toFixed(1)}%`);
                    }
                });

                // Calculate and display percentage changes for weekend (from 2020)
                weekendData.forEach((d, i) => {
                    if (i > 0 && d.year >= 2020) {
                        const prevValue = weekendData[i - 1].value;
                        const change = prevValue > 0 ? ((d.value - prevValue) / prevValue) * 100 : 0;
                        const sign = change >= 0 ? '+' : '';
                        const color = change >= 0 ? '#1a9850' : '#d73027';
                        
                        svg.append('text')
                            .attr('x', xScale(d.year))
                            .attr('y', yScale(d.value) - 20)
                            .attr('text-anchor', 'middle')
                            .attr('font-size', '0.75rem')
                            .attr('font-weight', '600')
                            .attr('fill', color)
                            .text(`${sign}${change.toFixed(1)}%`);
                    }
                });

            // Y-axis label
                svg.append('text')
                .attr('transform', 'rotate(-90)')
                    .attr('y', expandedMargin.l - 40)
                    .attr('x', -expandedHeight / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '0.9rem')
                .attr('fill', 'var(--text-secondary)')
                    .text('Nombre journalier moyen de cyclistes');

                return; // Exit early, don't show mini charts
            }

            // Create container for mini charts grid
            // Calculate responsive number of columns based on container width
            const containerWidth = miniChartsContainer.node().clientWidth || 1200;
            let chartsPerRow;
            if (containerWidth < 600) {
                chartsPerRow = 1; // 1 column on very small screens
            } else if (containerWidth < 900) {
                chartsPerRow = 2; // 2 columns on small screens
            } else if (containerWidth < 1200) {
                chartsPerRow = 3; // 3 columns on medium screens
            } else {
                chartsPerRow = 4; // 4 columns on large screens
            }
            const chartHeight = 180;
            const margin = { t: 40, r: 10, b: 40, l: 50 };

            // Create a wrapper div for the grid
            const gridWrapper = miniChartsContainer.append('div')
                .style('display', 'grid')
                .style('grid-template-columns', `repeat(${chartsPerRow}, 1fr)`)
                .style('gap', '1.5rem')
                .style('padding', '0.5rem')
                .style('width', '100%')
                .style('box-sizing', 'border-box');

            // Find max value across top counters and all types (including peak day) for consistent Y scale
            const maxValue = d3.max(topCounters, counter => 
                Math.max(
                    d3.max(years, year => counter.weekday[year]),
                    d3.max(years, year => counter.weekend[year]),
                    d3.max(years, year => counter.peakDay[year])
                )
            );

            // Create a mini chart for each counter
            topCounters.forEach(counter => {
                // Prepare data for weekday, weekend, and peak day
                const weekdayData = years.map(year => ({
                    year,
                    value: counter.weekday[year]
                }));

                const weekendData = years.map(year => ({
                    year,
                    value: counter.weekend[year]
                }));

                const peakDayData = years.map(year => ({
                    year,
                    value: counter.peakDay[year]
                }));

                // Create container for this mini chart
                const chartDiv = gridWrapper.append('div')
                    .style('background', 'var(--bg-secondary)')
                    .style('border-radius', '8px')
                    .style('padding', '0.75rem')
                    .style('border', '1px solid var(--border-color)')
                    .style('width', '100%')
                    .style('box-sizing', 'border-box')
                    .style('overflow', 'hidden')
                    .style('min-width', '0') // Allow flex shrinking
                    .style('cursor', 'pointer')
                    .style('transition', 'transform 0.2s')
                    .on('mouseenter', function() {
                        d3.select(this)
                            .style('transform', 'scale(1.06)');
                    })
                    .on('mouseleave', function() {
                        d3.select(this)
                            .style('transform', 'scale(1)');
                    })
                    .on('click', function() {
                        if (expandedCounter === counter) {
                            // If clicking the same chart, collapse it
                            expandedCounter = null;
                        } else {
                            // Expand this chart
                            expandedCounter = counter;
                        }
                        updateMiniCharts();
                    });

                // Add title
                chartDiv.append('h3')
                    .style('margin', '0 0 0.5rem 0')
                    .style('font-size', '0.85rem')
                    .style('font-weight', '600')
                    .style('color', 'var(--text-primary)')
                    .style('text-align', 'center')
                    .style('white-space', 'nowrap')
                    .style('overflow', 'hidden')
                    .style('text-overflow', 'ellipsis')
                    .text(counter.nom);

                // Use a reference width for viewBox calculations
                // The SVG will scale to fit the container width
                const referenceWidth = 250;
                const chartWidth = referenceWidth;

                // Create SVG with responsive width using viewBox
                const svg = chartDiv.append('svg')
                    .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`)
                    .attr('width', '100%')
                    .attr('height', chartHeight)
                    .attr('preserveAspectRatio', 'xMidYMid meet')
                    .style('display', 'block')
                    .style('max-width', '100%');

                // Scales (using reference width)
                const xScale = d3.scaleLinear()
                    .domain([2019, 2022])
                    .range([margin.l, chartWidth - margin.r]);

                const yScale = d3.scaleLinear()
                    .domain([0, maxValue * 1.1])
                    .nice()
                    .range([chartHeight - margin.b, margin.t]);

                // X axis
                svg.append('g')
                    .attr('transform', `translate(0,${chartHeight - margin.b})`)
                    .call(d3.axisBottom(xScale).tickValues(years).tickFormat(d => d))
                    .selectAll('text')
                    .attr('font-size', '0.65rem')
                    .attr('fill', 'var(--text-secondary)');

                // Y axis
                svg.append('g')
                    .attr('transform', `translate(${margin.l},0)`)
                    .call(d3.axisLeft(yScale).ticks(4).tickFormat(d => d3.format('~s')(d)))
                    .selectAll('text')
                    .attr('font-size', '0.65rem')
                    .attr('fill', 'var(--text-secondary)');

                // Line generator
                const line = d3.line()
                    .x(d => xScale(d.year))
                    .y(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

                // Weekday line (blue)
                svg.append('path')
                    .datum(weekdayData)
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', 2)
                    .attr('d', line);

                // Weekend line (orange)
                svg.append('path')
                    .datum(weekendData)
                    .attr('fill', 'none')
                    .attr('stroke', '#ff7f0e')
                    .attr('stroke-width', 2)
                    .attr('d', line);

                // Peak day line (red)
                svg.append('path')
                    .datum(peakDayData)
                    .attr('fill', 'none')
                    .attr('stroke', '#d73027')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,5')
                    .attr('d', line);

                // Weekday points
                svg.append('g').selectAll('circle')
                    .data(weekdayData)
                .enter()
                    .append('circle')
                    .attr('cx', d => xScale(d.year))
                    .attr('cy', d => yScale(d.value))
                    .attr('r', 3)
                    .attr('fill', 'steelblue')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 1);
                        miniTooltip.html(Math.round(d.value).toLocaleString())
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });

                // Weekend points
                svg.append('g').selectAll('circle')
                    .data(weekendData)
                    .enter()
                    .append('circle')
                    .attr('cx', d => xScale(d.year))
                    .attr('cy', d => yScale(d.value))
                    .attr('r', 3)
                    .attr('fill', '#ff7f0e')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 1);
                        miniTooltip.html(Math.round(d.value).toLocaleString())
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });

                // Peak day points
                svg.append('g').selectAll('circle')
                    .data(peakDayData)
                    .enter()
                    .append('circle')
                    .attr('cx', d => xScale(d.year))
                    .attr('cy', d => yScale(d.value))
                    .attr('r', 3)
                    .attr('fill', '#d73027')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 1);
                        miniTooltip.html(Math.round(d.value).toLocaleString())
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        miniTooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });
                });
        };

        // Store vehicles data globally
        let vehiclesData = { velos: 0, trotinettes: 0 };

        // Calculate total bike lanes length in kilometers
        const calculateTotalBikeLanesLength = () => {
            let totalMeters = 0;
            bikeLanesLengthsRows.forEach(row => {
                const longueur = parseFloat(row.longueur) || 0;
                totalMeters += longueur;
            });
            return totalMeters / 1000; // Convert to kilometers
        };

        // --- Function to update traffic statistics
        const updateTrafficStats = (year) => {
            const yearInt = parseInt(year);
            const trafficContainer = root.querySelector('#traffic-stats');
            
            // Count active counters
            const yearColumn = `tmj_${yearInt}`;
            const activeCounters = rows.filter(d => {
                const value = parseFloat(d[yearColumn]) || 0;
                return value > 0;
            }).length;
            
            // Calculate average weekday traffic
            const avgWeekdayTraffic = data.length > 0 
                ? d3.mean(data, d => d.weekday[yearInt])
                : 0;
            
            // Calculate average weekend traffic
            const avgWeekendTraffic = data.length > 0 
                ? d3.mean(data, d => d.weekend[yearInt])
                : 0;
            
            trafficContainer.innerHTML = `
                <div style="text-align: left;">
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.2rem;">${activeCounters}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Compteurs actifs</div>
                </div>
                <div style="text-align: left;">
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.2rem;">${Math.round(avgWeekdayTraffic).toLocaleString()}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Trafic en semaine</div>
                </div>
                <div style="text-align: left;">
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.2rem;">${Math.round(avgWeekendTraffic).toLocaleString()}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Trafic en week-end</div>
                </div>
            `;
        };

        // --- Function to update bike lanes statistics
        const updateBikeLanesStats = () => {
            const bikeLanesContainer = root.querySelector('#bike-lanes-stats');
            const totalBikeLanesKm = calculateTotalBikeLanesLength();
            
            bikeLanesContainer.innerHTML = `
                <div style="text-align: left;">
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.2rem;">${totalBikeLanesKm.toFixed(1)} km</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Kilomètres totaux</div>
                </div>
            `;
        };

        // --- Function to update vehicles statistics
        const updateVehiclesStats = () => {
            const vehiclesContainer = root.querySelector('#vehicles-stats');
            
            vehiclesContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="text-align: left;">
                        <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.2rem;">${vehiclesData.velos}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Vélos électriques</div>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.2rem;">${vehiclesData.trotinettes}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Trottinettes électriques</div>
                    </div>
                </div>
            `;
        };

        // --- Initialize stats
        updateTrafficStats('2022');
        updateBikeLanesStats();
        updateVehiclesStats();

        // --- Add event listeners to year buttons and set active state
        const yearButtons = root.querySelectorAll('.year-btn');
        let currentActiveYear = root.querySelector('.year-btn[data-year="2022"]');
        
        // Set initial active state for year buttons
        if (currentActiveYear) {
            currentActiveYear.style.background = 'steelblue';
            currentActiveYear.style.color = '#fff';
        }

        yearButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedYear = e.target.getAttribute('data-year');
                
                // Update active state
                if (currentActiveYear) {
                    currentActiveYear.style.background = 'transparent';
                    currentActiveYear.style.color = 'var(--text-primary)';
                }
                
                e.target.style.background = 'steelblue';
                e.target.style.color = '#fff';
                currentActiveYear = e.target;
                
                // Update traffic stats
                updateTrafficStats(selectedYear);
            });

            // Add hover effect
            button.addEventListener('mouseenter', function() {
                if (this !== currentActiveYear) {
                    this.style.background = 'rgba(70, 130, 180, 0.1)';
                }
            });

            button.addEventListener('mouseleave', function() {
                if (this !== currentActiveYear) {
                    this.style.background = 'transparent';
                }
            });
        });

        // --- Function to create bike lanes bar chart
        const createBikeLanesChart = () => {
            const chartContainer = d3.select('#bike-lanes-chart');
            chartContainer.selectAll('*').remove();

            // Define order and display names
            const typeOrder = ['chronovelo', 'voieverte', 'veloamenage', 'velononamenage', 'velodifficile'];
            const typeDisplayNames = {
                'chronovelo': 'Chronovélo',
                'voieverte': 'Voie verte',
                'veloamenage': 'Chaussée aménagée',
                'velononamenage': 'Chaussée non aménagée',
                'velodifficile': 'Voie difficile'
            };

            // Define colors (from best to worst)
            const typeColors = {
                'chronovelo': 'rgb(246,211,75)',
                'voieverte': 'rgb(65,159,60)',
                'veloamenage': 'rgb(70,130,180)',       // Bleu (steelblue)
                'velononamenage': 'rgb(150,170,200)',   // Bleu moins saturé
                'velodifficile': 'rgb(200,100,100)'     // Rouge clair
            };

            // Sum lengths by type (convert from meters to kilometers)
            const typeLengths = {};
            bikeLanesLengthsRows.forEach(row => {
                const type = row.type || 'Inconnu';
                const longueur = parseFloat(row.longueur) || 0;
                typeLengths[type] = (typeLengths[type] || 0) + longueur;
            });

            // Convert to array, convert to kilometers, and sort by predefined order
            const chartData = typeOrder
                .filter(type => typeLengths[type] !== undefined)
                .map(type => ({ 
                    type,
                    displayName: typeDisplayNames[type] || type,
                    lengthKm: typeLengths[type] / 1000,
                    color: typeColors[type] || '#999'
                }));

            // Chart dimensions
            const margin = { t: 20, r: 20, b: 100, l: 60 };
            const containerWidth = chartContainer.node().clientWidth || 500;
            const width = Math.max(containerWidth, 300);
            const height = 380;

            const svg = chartContainer.append('svg')
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('width', '100%')
                .attr('height', height)
                .style('display', 'block')
                .style('max-width', '100%');

            // Scales
            const xScale = d3.scaleBand()
                .domain(chartData.map(d => d.displayName))
                .range([margin.l, width - margin.r])
                .padding(0.2);

            const maxLength = d3.max(chartData, d => d.lengthKm);
            const yScale = d3.scaleLinear()
                .domain([0, maxLength * 1.1])
                .nice()
                .range([height - margin.b, margin.t]);

            // X axis
            svg.append('g')
                .attr('transform', `translate(0,${height - margin.b})`)
                .call(d3.axisBottom(xScale))
                .selectAll('text')
                .attr('x', 0)
                .attr('y', 15)
                .attr('dy', '0.35em')
                .style('text-anchor', 'middle')
                .attr('font-size', '0.75rem')
                .attr('fill', 'var(--text-secondary)')
                .each(function(d) {
                    const text = d3.select(this);
                    const words = d.split(' ');
                    const lineHeight = 1.3;
                    const y = text.attr('y');
                    const x = text.attr('x');
                    
                    text.text(null);
                    
                    let tspan = text.append('tspan')
                        .attr('x', x)
                        .attr('y', y)
                        .text(words[0]);
                    
                    for (let i = 1; i < words.length; i++) {
                        tspan = text.append('tspan')
                            .attr('x', x)
                            .attr('y', parseFloat(y) + (i * lineHeight * 14))
                            .text(words[i]);
                    }
                });

            // Y axis
            svg.append('g')
                .attr('transform', `translate(${margin.l},0)`)
                .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d3.format('.1f')(d)))
                .selectAll('text')
                .attr('font-size', '0.75rem')
                .attr('fill', 'var(--text-secondary)');

            // Bars
            svg.append('g')
                .selectAll('rect')
                .data(chartData)
                .enter()
                .append('rect')
                .attr('x', d => xScale(d.displayName))
                .attr('y', d => yScale(d.lengthKm))
                .attr('width', xScale.bandwidth())
                .attr('height', d => height - margin.b - yScale(d.lengthKm))
                .attr('fill', d => d.color)
                .attr('rx', 4)
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('opacity', 0.8);
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('opacity', 1);
                });

            // Value labels on bars
            svg.append('g')
                .selectAll('text')
                .data(chartData)
                .enter()
                .append('text')
                .attr('x', d => xScale(d.displayName) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.lengthKm) - 5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '0.75rem')
                .attr('font-weight', '600')
                .attr('fill', 'var(--text-primary)')
                .text(d => d.lengthKm.toFixed(1) + ' km');

            // Y-axis label
            svg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', margin.l - 40)
                .attr('x', -height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '0.9rem')
                .attr('fill', 'var(--text-secondary)')
                .text('Longueur totale (km)');
        };

        // --- Initialize charts
        updateEvolutionChart();
        updateMiniCharts();
        createBikeLanesChart();

        // --- Add resize listener to recalculate mini charts layout
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateMiniCharts();
            }, 250); // Debounce resize events
        });

        // --- Load vehicles data
        try {
            const url = "https://data.mobilites-m.fr/api/gbfs/voi_grenoble/free_bike_status";
            const res = await fetch(url);
            const json = await res.json();

            const bikes = json.data.bikes || [];
            vehiclesData.velos = 0;
            vehiclesData.trotinettes = 0;

            for (const v of bikes) {
                if (v.vehicle_type_id === "voi_bike") vehiclesData.velos++;
                if (v.vehicle_type_id === "voi_scooter") vehiclesData.trotinettes++;
            }

            // Update vehicles stats
            updateVehiclesStats();
        } catch (err) {
            console.error('Error loading vehicles data:', err);
            // Keep default values (0) and update anyway
            updateVehiclesStats();
        }

        // --- Cleanup
        return () => {
            try { root.innerHTML = ''; } catch { }
        };
    }
};
