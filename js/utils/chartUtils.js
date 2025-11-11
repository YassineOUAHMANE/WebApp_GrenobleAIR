// Minimal d3 chart helpers. Each returns a cleanup function.
export function lineChart(el, data, { x, y, xLabel, yLabel, formatX, formatY } = {}) {
  const d3 = window.d3;
  el.innerHTML = '';
  const width = el.clientWidth || 600, height = el.clientHeight || 320, margin = { t: 20, r: 20, b: 40, l: 48 };

  const svg = d3.select(el).append('svg')
    .attr('viewBox', [0,0,width,height])
    .attr('width', '100%').attr('height', '100%');

  const X = data.map(d => x(d));
  const Y = data.map(d => y(d));

  const xScale = d3.scaleUtc().domain(d3.extent(X)).range([margin.l, width - margin.r]);
  const yScale = d3.scaleLinear().domain([0, d3.max(Y) || 1]).nice().range([height - margin.b, margin.t]);

  const line = d3.line().x((_, i) => xScale(X[i])).y((_, i) => yScale(Y[i]));

  svg.append('g').attr('transform', `translate(0,${height - margin.b})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(formatX || d3.timeFormat('%d/%m')));

  svg.append('g').attr('transform', `translate(${margin.l},0)`)
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(formatY || d3.format('~s')));

  svg.append('path').attr('d', line(data)).attr('fill', 'none').attr('stroke', 'currentColor').attr('stroke-width', 2);

  if (xLabel) svg.append('text').attr('x', width - margin.r).attr('y', height - 6).attr('text-anchor', 'end').text(xLabel);
  if (yLabel) svg.append('text').attr('x', margin.l).attr('y', margin.t - 6).attr('text-anchor', 'start').text(yLabel);

  const resize = () => lineChart(el, data, { x, y, xLabel, yLabel, formatX, formatY }); // naive; redraw
  window.addEventListener('resize', resize);
  return () => { window.removeEventListener('resize', resize); el.innerHTML = ''; };
}

export function simpleTable(el, rows, { columns } = {}) {
  el.innerHTML = '';
  const table = document.createElement('table'); table.className = 'table';
  const thead = document.createElement('thead'); const tbody = document.createElement('tbody');
  table.append(thead, tbody);
  const cols = columns || Object.keys(rows[0] || {});
  thead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
  tbody.innerHTML = rows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('');
  el.appendChild(table);
  return () => { el.innerHTML = ''; };
}
