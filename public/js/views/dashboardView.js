/**
 * dashboardView.js — Vue d'accueil avec KPIs animés
 * Statistiques clés, animations entrantes, données en temps réel
 */
import { fetchCSV, fetchJSON } from '../utils/fetchData.js';
import { icons } from '../utils/icons.js';
import { lineColors } from '../utils/mapUtils.js';

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

const loadParkingData = async () => {
    //Parking data
    const raw = await fetchCSV('/data/parking/parking.csv');

    const parkingData = raw.filter(p => parseInt(p['nb_places'] || 0) > 0)
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
            coords: p.geo_point_2d?.split(',').map(parseFloat) || [0, 0]
        }));

    // const zfe = await fetchCSV('./data/zfe/zfeaires.csv');
    // const ZFEPermimeter = featureCollectionFromRows(zfe);

    return { parkingData }
};

const EARTH_RADIUS_KM = 6371; // For converting radians to km

async function loadEVData() {
    const files = [
        //   './data/irve/irve_metropole.csv',
        //   './data/irve/irve_gresivaudan.csv',
        './data/irve/irve_smmag.csv',
        //   './data/irve/irve_pays_voironnais.csv'
    ];
    const all = [];
    await Promise.all(files.map(async file => {
        const data = await fetchCSV(file);
        if (data.length > 0) {
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
    title: 'Tableau de bord',
    icon: 'dashboard',
    async mount(root) {
        const evData = await loadEVData();
        const totalEVPoints = evData.reduce((s, d) => s + d.pdc, 0);

        // Calculer la médiane au lieu de la moyenne
        const sortedPDC = evData.map(d => d.pdc).sort((a, b) => a - b);
        const medianEVPoints = sortedPDC[Math.floor(sortedPDC.length / 2)];

        const { parkingData } = await loadParkingData();
        // Statistiques
        const totalPlaces = parkingData.reduce((sum, d) => sum + d.places, 0);
        const gratuitPlaces = parkingData.filter(d => d.gratuit).reduce((sum, d) => sum + d.places, 0);
        const payantPlaces = totalPlaces - gratuitPlaces;
        const totalPmr = parkingData.reduce((sum, d) => sum + d.pmr, 0);


        //Other data
        const [velos, rawTransport, stops, arceaux, bikeLanesLengthsRows] = await Promise.all([
            fetchCSV('./data/mobilite_douce/comptages_velos_permanents.csv'),
            fetchJSON('./data/transport_public/lignes_tag.geojson'),
            fetchCSV('./data/transport_public/zones_arrets_metropole.csv'),
            fetchCSV('./data/mobilite_douce/arceaux.csv'),
            fetchCSV('./data/mobilite_douce/longueurs_pistes_cyclables.csv')
        ]);

        let totalTransportLength = 0;
        //Get the public transport line lengths
        const transport = rawTransport.features.map(i => {
            const length = d3.geoLength(i.geometry) * EARTH_RADIUS_KM;
            totalTransportLength += length;
            return { ...i, length };
        });
        console.log(transport)

        const totalPistesCyclablesLength = bikeLanesLengthsRows.reduce((sum, row) => {
            const longueur = parseFloat(row.longueur) || 0;
            return sum + longueur;
        }, 0) / 1000;


        const velosCount = velos.length;
        const arceauxCount = arceaux.length;
        const transportLinesCount = transport.length;
        const transportStopsCount = stops.length;

        root.innerHTML = `
        <h2 class="title">${icons.dashboard} Tableau de bord</h2>
        <p>Statistiques clés</p>
        <section class="grid">

        <div class="span-12 card animate-fade-in" style="animation-delay:0.1s">
            <h2 style="margin-top:0">${icons.parking} Parkings</h2>
            <div class="kpis" id="kpis-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
            <div class="kpi">
                <h3 class="kpi-icon">${icons.parking}</h3>
                <div class="label">Total places</div>
                <div class="value">${totalPlaces}</div>
            </div>
            <div class="kpi">
                <h3 class="kpi-icon">$</h3>
                <div class="label">Places payantes</div>
                <div class="value">${payantPlaces}</div>
            </div>
            <div class="kpi">
                <h3 class="kpi-icon">${icons.check}</h3>
                <div class="label">Places gratuites</div>
                <div class="value">${gratuitPlaces}</div>
            </div>
            <div class="kpi">
                <h3 class="kpi-icon">♿</h3>
                <div class="label">Places PMR</div>
                <div class="value">${totalPmr}</div>
            </div>
            </div>
        </div>

        <div class="span-12 card animate-fade-in" style="animation-delay:0.1s">
            <h2 style="margin-top:0">${icons.bike} Vélos</h2>
            <div class="kpis" id="kpis-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.dashboard}</h2>
                    <div class="label">Compteurs de passage</div>
                    <div class="value">${velosCount}</div>
                </div>
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.parking}</h2>
                    <div class="label">Arceaux</div>
                    <div class="value">${arceauxCount}</div>
                </div>
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.bikePath}</h2>
                    <div class="label">Km de pistes cyclables</div>
                    <div class="value">${Math.round(totalPistesCyclablesLength)}</div>
                </div>
            </div>
        </div>

        <div class="span-12 card animate-fade-in" style="animation-delay:0.1s">
            <h2 style="margin-top:0">${icons.ev} Voitures électriques</h2>
            <div class="kpis" id="kpis-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.parking}</h2>
                    <div class="label">Stations IRVE</div>
                    <div class="value">${evData.length}</div>
                </div>
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.ev}</h2>
                    <div class="label">Points de charge</div>
                    <div class="value">${totalEVPoints}</div>
                </div>
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.chart}</h2>
                    <div class="label">Médiane points de charge/Station</div>
                    <div class="value">${medianEVPoints}</div>
                </div>
            </div>
        </div>

        <div class="span-12 card animate-fade-in" style="animation-delay:0.1s">
            <h2 style="margin-top:0">${icons.publicTransport} Transports en commun</h2>
            <div class="kpis" id="kpis-container" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.publicTransport}</h2>
                    <div class="label">Lignes de transport</div>
                    <div class="value">${transportLinesCount}</div>
                </div>
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.location}</h2>
                    <div class="label">Stations</div>
                    <div class="value">${transportStopsCount}</div>
                </div>
                <div class="kpi">
                    <h2 class="kpi-icon">${icons.chart}</h2>
                    <div class="label">km de lignes</div>
                    <div class="value">${totalTransportLength.toFixed(2)}</div>
                </div>
            </div>
        </div>

        <div class="span-12 card animate-fade-in" style="animation-delay:0.3s">
            <h2 style="margin-top:0;">Répartition des lignes de transport les plus longues en KM</h2>
            <p>Dans le graphique sont représentées les 15 lignes de transport les plus longues de la métropole grenobloise</p>
            <div id="summary-chart" class="chart" style="height:360px; min-height: 360px;"></div>
        </div>
    </section>
    `;

        function drawTransportRanking() {

            const container = document.getElementById("summary-chart");
            const width = container.clientWidth;
            const height = container.clientHeight;

            const margin = { top: 20, right: 30, bottom: 20, left: 130 };

            const svg = d3.select("#summary-chart")
                .html("") // clear previous render
                .append("svg")
                .attr("viewBox", [0, 0, width, height])
                .style("width", "100%")
                .style("height", "100%");

            // -------- Sort by length descending --------
            const data = [...transport]
                .sort((a, b) => b.length - a.length).filter((_, k) => k < 15);

            // -------- Scales --------
            const y = d3.scaleBand()
                .domain(data.map(d => d.properties.CODE.replaceAll('SEM_', '')))
                .range([margin.top, height - margin.bottom])
                .padding(0.3);

            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.length)]).nice()
                .range([margin.left, width - margin.right]);

            // -------- Bars --------
            svg.append("g")
                .selectAll("rect")
                .data(data)
                .join("rect")
                .attr("x", x(0))
                .attr("y", d => y(d.properties.CODE.replaceAll('SEM_', '')))
                .attr("height", y.bandwidth())
                .attr("width", 0)
                .attr("fill", "#5b8def")
                .transition()
                .duration(800)
                .attr("width", d => x(d.length) - x(0))
                .attr("rx", 6)
                .attr("ry", 6)
                .attr("fill", d => lineColors[d.properties.CODE] || "#5b8def")

            // -------- Y axis (names) --------
            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y).tickSize(0));

            // -------- X axis (km scale) --------
            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d.toFixed(1)} km`));

            // -------- Value labels --------
            svg.append("g")
                .selectAll("text")
                .data(data)
                .join("text")
                .attr("x", d => x(d.length) + 6)
                .attr("y", d => y(d.properties.CODE.replaceAll('SEM_', '')) + y.bandwidth() / 2)
                .attr("dominant-baseline", "middle")
                .attr("fill", "#333")
                .attr("font-size", 12)
                .text(d => `${d.length.toFixed(2)} km`);
        }

        drawTransportRanking();
    }
};
