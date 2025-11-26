import { loadCSV } from '../utils/csv.js';

export default async function createChart(container) {
    const d3 = window.d3;
    if (!d3) throw new Error('D3.js non disponible');

    // Charger les données
    const parkingData = await loadCSV('./data/parking/parking.csv');
    const disponibiliteData = await loadCSV('./data/parking/disponibilité_parking.csv');

    // Préparer les données
    const data = parkingData
        .filter(d => d.nb_places && parseInt(d.nb_places) > 0)
        .map(d => {
            const places = parseInt(d.nb_places) || 0;
            // Trouver les places libres correspondantes
            const dispo = disponibiliteData.find(disp => disp.nsv_id === d.nom || disp._key === d.nom);
            const placesLibres = dispo && dispo.nb_places_libres ? parseInt(dispo.nb_places_libres) : Math.floor(places * 0.3);
            
            return {
                nom: d.nom,
                places: places,
                placesLibres: Math.max(0, Math.min(placesLibres, places))
            };
        })
        .sort((a, b) => b.places - a.places);

    // Dimensions
    const margin = { top: 20, right: 20, bottom: 40, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = data.length * 30 - margin.top - margin.bottom;

    // SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Échelles
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.places)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(data.map(d => d.nom))
        .range([0, height])
        .padding(0.2);

    // Axes
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append('g')
        .call(d3.axisLeft(yScale));

    // Barres totales (claires)
    g.selectAll('.bar-total')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar-total')
        .attr('x', 0)
        .attr('y', d => yScale(d.nom))
        .attr('width', d => xScale(d.places))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#ccc');

    // Barres places libres (plus foncées)
    g.selectAll('.bar-libres')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar-libres')
        .attr('x', 0)
        .attr('y', d => yScale(d.nom))
        .attr('width', d => xScale(d.placesLibres))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#666');
}
