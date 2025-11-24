import { loadCSV } from '../utils/csv.js';

export default {
    linkTitle: 'AQI',
    title: 'Qualité de l\'air',
    icon: 'aqi',
    async mount(root) {
        // --- Layout
        root.innerHTML = `
        <h2 class="title">Qualité de l’air — PM2.5</h2>
        <p>Chaque carré représente une journée. La couleur dépend de la médiane PM2.5.</p>
            
        <section class="grid">

            <div class="span-12 card">
                <h2>Résumé</h2>
                <p id="aqi-summary"></p>
                <div id="aqi-bars" style="height:300px"></div>
            </div>

            <div class="span-12 card">
                <div id="aqi-grid"></div>
            </div>

            <div class="span-12 card">
                <h2>PM2.5 Daily Median with Min/Max</h2>
                <div id="pm25-linechart" style="height:300px"></div>
            </div>
        </section>
        `;

        const container = root.querySelector('#aqi-grid');

        // --- Load CSV (supports comments starting with '#')
        const rows = await loadCSV('./data/air/pm25.csv', { comment: '#' });

        // The CSV headers: date,min,max,median,q1,q3,stdev,count
        const parsed = rows.map(r => ({
            date: new Date(r.date),
            median: +r.median,
            min: +r.min,
            max: +r.max
        })).filter(d => !isNaN(d.date));

        // --- Group by year
        const byYear = d3.group(parsed, d => d.date.getUTCFullYear());
        const years = Array.from(byYear.keys()).sort((a, b) => b - a);

        // --- D3 Grid parameters
        const cellSize = 14;
        const cellPadding = 2;

        // PM2.5 thresholds (µg/m³)
        const color = d3.scaleThreshold()
            .domain([5, 10, 15, 20, 25, 30, 40])
            .range([
                '#d4f1f9', // very clean
                '#a9e4f5',
                '#7ad3f0',
                '#f4d35e',
                '#ee964b',
                '#f95738',
                '#d62828',
                '#9d0208'  // very polluted
            ]);

        // --- Build one SVG per year
        years.forEach(year => {
            const data = byYear.get(year);

            console.log(data)

            // Pre-calc day of year
            data.forEach(d => {
                const start = new Date(Date.UTC(year, 0, 1));
                d.dayOfYear = Math.floor((d.date - start) / 86400000);
            });

            // layout: 53 weeks x 7 days calendar grid
            const weeks = d3.max(data, d => Math.floor(d.dayOfYear / 7)) + 1;

            const width = weeks * (cellSize + cellPadding) + 80;
            const height = 7 * (cellSize + cellPadding) + 40;

            // --- Create root group
            const card = document.createElement('div');
            card.style.marginBottom = '2rem';
            container.appendChild(card);

            const title = document.createElement('h3');
            title.textContent = year;
            card.appendChild(title);

            const svg = d3.select(card)
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const g = svg.append('g').attr('transform', 'translate(40,20)');

            function getWeekIndex(date) {
                // Monday as first day
                const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                const day = (d.getUTCDay() + 6) % 7; // 0=Monday, 6=Sunday
                d.setUTCDate(d.getUTCDate() - day);  // back to Monday of that week
                const firstDayOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                const weekIndex = Math.floor((d - firstDayOfYear) / (7 * 86400000));
                return weekIndex;
            }

            // --- Create a tooltip div (hidden initially)
            const tooltip = d3.select(root)
                .append('div')
                .style('position', 'absolute')
                .style('pointer-events', 'none')
                .style('background', 'rgba(0,0,0,0.8)')
                .style('color', '#fff')
                .style('padding', '4px 6px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('opacity', 0);

            // --- Draw squares
            g.selectAll('rect')
                .data(data)
                .enter()
                .append('rect')
                .attr('x', d => getWeekIndex(d.date) * (cellSize + cellPadding))
                .attr('y', d => ((d.date.getUTCDay() + 6) % 7) * (cellSize + cellPadding))
                .attr('width', cellSize)
                .attr('height', cellSize)
                .attr('rx', 2)
                .attr('fill', d => color(d.median))
                // .append('title')
                // .text(d => `${d.date.toISOString().slice(0, 10)} — PM2.5 médiane: ${d.median}`);
                .on('mouseover', function (event, d) {
                    tooltip
                        .style('opacity', 1)
                        .html(`${d.date.toISOString().slice(0, 10)}<br/>PM2.5 médiane: ${d.median ?? 'N/A'}`);
                })
                .on('mousemove', function (event) {
                    tooltip
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY + 10) + 'px');
                })
                .on('mouseout', function () {
                    tooltip.style('opacity', 0);
                });

            // --- Weekday labels
            const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            g.selectAll('text.day')
                .data(weekdays)
                .enter()
                .append('text')
                .attr('x', -6)
                .attr('y', (_, i) => i * (cellSize + cellPadding) + cellSize - 2)
                .attr('text-anchor', 'end')
                .attr('font-size', '10px')
                .attr('fill', 'var(--text-primary)')
                .text(d => d);
        });

        // --- Summary & barchart
        const validMedians = parsed.map(d => d.median).filter(d => d != null);
        const totalDays = validMedians.length;
        const minPM = d3.min(validMedians);
        const maxPM = d3.max(validMedians);

        // Small square style (same as calendar grid)
        const squareSize = 14;
        const squareStyle = `
        display:inline-block;
        width:${squareSize}px;
        height:${squareSize}px;
        border-radius:2px;
        margin-left:4px;
        vertical-align:middle;
        `;

        // Render summary with colored squares
        root.querySelector('#aqi-summary').innerHTML = `
        Total days: <strong>${totalDays}</strong>, 
        Min PM2.5: <strong>${minPM}</strong>
        <span style="background:${color(minPM)}; ${squareStyle}"></span>,
        Max PM2.5: <strong>${maxPM}</strong>
        <span style="background:${color(maxPM)}; ${squareStyle}"></span>
        `;

        // --- Bin counts with colors
        const bins = [
            { range: '<10', count: 0, color: color(5) },       // use threshold color
            { range: '10-15', count: 0, color: color(12.5) },
            { range: '15-20', count: 0, color: color(17.5) },
            { range: '20-25', count: 0, color: color(22.5) },
            { range: '>25', count: 0, color: color(30) }
        ];

        validMedians.forEach(v => {
            if (v < 10) bins[0].count++;
            else if (v < 15) bins[1].count++;
            else if (v < 20) bins[2].count++;
            else if (v < 25) bins[3].count++;
            else bins[4].count++;
        });

        const barContainer = d3.select('#aqi-bars');
        const margin = { t: 20, r: 20, b: 40, l: 40 };
        const width = barContainer.node().clientWidth || 600;
        const height = 300;

        const svgBar = barContainer.append('svg')
            .attr('width', width)
            .attr('height', height);

        const x = d3.scaleBand().domain(bins.map(d => d.range))
            .range([margin.l, width - margin.r]).padding(0.3);

        const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.count / totalDays * 100)]).range([height - margin.b, margin.t]);

        // Axes
        svgBar.append('g').attr('transform', `translate(0,${height - margin.b})`).call(d3.axisBottom(x));
        svgBar.append('g').attr('transform', `translate(${margin.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));

        // Bars
        svgBar.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', d => x(d.range))
            .attr('y', d => y(d.count / totalDays * 100))
            .attr('width', x.bandwidth())
            .attr('height', d => height - margin.b - y(d.count / totalDays * 100))
            .attr('fill', d => d.color)
            .attr('rx', 6); // rounded corners

        // Percentages on top of bars
        svgBar.selectAll('text.percent')
            .data(bins)
            .enter()
            .append('text')
            .attr('x', d => x(d.range) + x.bandwidth() / 2)
            .attr('y', d => y(d.count / totalDays * 100) - 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', 'var(--text-primary)')
            .text(d => Math.round(d.count / totalDays * 100) + '%');

        // Number of days below bars
        svgBar.selectAll('text.count')
            .data(bins)
            .enter()
            .append('text')
            .attr('x', d => x(d.range) + x.bandwidth() / 2)
            .attr('y', height - margin.b + 30)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', 'var(--text-primary)')
            .text(d => d.count);

        //
        function createGraph() {
            const chartContainer = d3.select('#pm25-linechart');
            const margin = { t: 20, r: 20, b: 40, l: 50 };
            const width = chartContainer.node().clientWidth || 800;
            const height = 300;

            const svg = chartContainer.append('svg')
                .attr('width', width)
                .attr('height', height);

            const x = d3.scaleTime()
                .domain(d3.extent(parsed, d => d.date))
                .range([margin.l, width - margin.r]);

            const y = d3.scaleLog()
                .domain([0.01, d3.max(parsed, d => d.max)])
                .range([height - margin.b, margin.t]);

            // Axes
            const xAxis = d3.axisBottom(x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(d => d); // temporarily keep the Date, we will format later

            const xAxisGroup = svg.append('g')
                .attr('transform', `translate(0,${height - margin.b})`)
                .call(xAxis);

            // Replace the tick text with tspans for multi-line labels
            xAxisGroup.selectAll('text')
                .text('') // clear existing text
                .each(function (d) {
                    const text = d3.select(this);
                    if (d.getMonth() === 0) {
                        // January: add month on first line, year on second line
                        text.append('tspan')
                            .attr('x', 0)
                            .attr('dy', '.5em')
                            .text(d3.timeFormat("%b")(d));
                        text.append('tspan')
                            .attr('x', 0)
                            .attr('dy', '1.7em') // vertical offset for second line
                            .text(d.getFullYear());
                    } else {
                        // other months: only month
                        text.append('tspan')
                            .attr('x', 0)
                            .attr('dy', '.5em')
                            .text(d3.timeFormat("%b")(d));
                    }
                });

            svg.append('g')
                .attr('transform', `translate(${margin.l},0)`)
                .call(d3.axisLeft(y)
                    .ticks(5, "~s") // "~s" formats nicely for log scale
                );

            // Line for median
            const medianLine = d3.line()
                .x(d => x(d.date))
                .y(d => y(d.median));

            svg.append('path')
                .datum(parsed)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 2)
                .attr('d', medianLine);

            // Dots for min and max
            svg.selectAll('circle.min')
                .data(parsed)
                .enter()
                .append('circle')
                .attr('class', 'min')
                .attr('cx', d => x(d.date))
                .attr('cy', d => y(Math.max(d.min, 0.01)))
                .attr('r', 1.5)
                .attr('fill', '#d4f1f9');

            svg.selectAll('circle.max')
                .data(parsed)
                .enter()
                .append('circle')
                .attr('class', 'max')
                .attr('cx', d => x(d.date))
                .attr('cy', d => y(Math.max(d.max, 0.01)))
                .attr('r', 1.5)
                .attr('fill', '#f95738');

            // Optional: add a legend
            const legend = svg.append('g')
                .attr('transform', `translate(${width - margin.r - 120},${margin.t})`);

            legend.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 20).attr('y2', 0).attr('stroke', 'steelblue').attr('stroke-width', 2);
            legend.append('text').attr('x', 25).attr('y', 4).text('Median')
                .attr('font-size', '12px')
                .attr('fill', 'var(--text-primary)')
                .attr('alignment-baseline', 'middle');

            legend.append('circle').attr('cx', 10).attr('cy', 20).attr('r', 3).attr('fill', '#d4f1f9');
            legend.append('text').attr('x', 25).attr('y', 24).text('Min')
                .attr('font-size', '12px')
                .attr('fill', 'var(--text-primary)')
                .attr('alignment-baseline', 'middle');

            legend.append('circle').attr('cx', 10).attr('cy', 40).attr('r', 3).attr('fill', '#f95738');
            legend.append('text').attr('x', 25).attr('y', 44).text('Max')
                .attr('font-size', '12px')
                .attr('fill', 'var(--text-primary)')
                .attr('alignment-baseline', 'middle');

        }
        createGraph();

        // Cleanup
        return () => {
            try { container.innerHTML = ''; barContainer.html(''); tooltip.remove(); } catch { }
        };
    }
};
