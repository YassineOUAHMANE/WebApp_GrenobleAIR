import { fetchCSV, fetchJSON } from "../utils/fetchData.js";
import { featureCollectionFromRows } from '../utils/mapUtils.js';
import { icons } from '../utils/icons.js'

const lineColors = {
    SEM_A: "rgb(37,106,196)",
    SEM_B: "rgb(65,159,60)",
    SEM_C: "rgb(208,1,120)",
    SEM_D: "rgb(214,138,31)",
    SEM_E: "rgb(110,56,213)",
    SEM_C1: "rgb(246,211,75)",
    SEM_C2: "rgb(246,211,75)",
    SEM_C3: "rgb(246,211,75)",
    SEM_C4: "rgb(246,211,75)",
    SEM_C5: "rgb(246,211,75)",
    SEM_C6: "rgb(246,211,75)",
    SEM_C6N: "rgb(246,211,75)",
    SEM_C7: "rgb(246,211,75)",
    SEM_C8: "rgb(246,211,75)",
    SEM_C10: "rgb(238,125,0)",
    SEM_C11: "rgb(238,125,0)",
    SEM_C12: "rgb(238,125,0)",
    SEM_C13: "rgb(238,125,0)",
    SEM_C14: "rgb(238,125,0)",
};

export default {
    title: 'Carte',
    icon: 'map',
    async mount(root) {
        root.innerHTML = `
            <style>
                /* --- Sidebar --- */
                .layer-selector {
                    width: 30%;
                    background: var(--bg-2);
                    padding: .5rem;
                    position: relative;
                    transition: transform 0.25s ease;
                    z-index: 50;
                }
            
                .layer-selector.closed {
                    // transform: translateX(-100%);
                    width: 0; padding: 0;
                    overflow: hidden;
                }
            
                .layer-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            
                .layer-close {
                    cursor: pointer;
                    font-size: 1.5rem;
                    font-weight: bold; 
                    color: var(--text-1);
                    padding-left: 0.5rem;
                }
            
                .layer-open {
                    position: absolute;
                    font-size: 1.5rem;
                    font-weight: bold; 
                    left: 0;
                    top: 0;
                    padding: .5rem;
                    cursor: pointer;
                    color: var(--text-1);
                    display: none;
                }
            
                .layer-selector.closed + .layer-open {
                    display: block;
                }
            
                /* --- Checkbox + label row --- */
                .layer-selector label {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    margin: 0.4rem 0;
                    font-size: 0.95rem;
                }
                .layer-selector label svg {
                    width: 1.25em; height: 1.25em;
                }
            
                .layer-selector label input {
                    transform: scale(1.2);
                }

                .layer-selector label input:not(:checked) ~ .color-box,
                .layer-selector label input:not(:checked) ~ .color-box {
                    display: none; 
                }

                .tram-bus-colors {
                    display: flex;
                    flex-wrap: wrap; 
                    gap: 0.4rem;
                }

                .tram-bus-colors .color-box {
                    display: inline-flex;        /* inline so they break like words */
                    justify-content: center;     /* center text horizontally */
                    align-items: center;         /* center vertically */
                    padding: 0.4rem;             /* creates the square shape */
                    min-width: 2rem;             /* ensures it's at least a square */
                    min-height: 2rem;
                    border-radius: 6px;
                    color: white;                /* for visibility */
                    font-weight: 600;
                    text-align: center;
                    box-sizing: border-box;
                    line-height: 1.2;
                    font-size: 0.9rem;
                }
            </style>
            <div style="display: flex; width: 100%; height: 100%; position: relative;">
                <div class="layer-selector" id="sidebar">
                    <div class="layer-title">
                        Légende
                        <span class="layer-close" id="closeSidebar">×</span>
                    </div>

                    <label><input type="checkbox" id="toggleParking"> ${icons.parking} Parkings <span class="color-box" style="background: #1fa371;"></span><span class="color-box" style="background: #3551d5;"></span></label>
                    <label><input type="checkbox" id="toggleBike"> ${icons.bike} Compteurs de Vélos <span class="color-box" style="background: #e8d400"></span></label>
                    <label><input type="checkbox" id="toggleBikeParking"> ${icons.bike} Arceaux Vélo <span class="color-box" style="background: red"></span></label>
                    <label><input type="checkbox" id="toggleZFE" checked> ${icons.car} ZFE <span class="color-box" style="background: rgb(190, 3, 252)"></span></label>
                    <label><input type="checkbox" id="toggleTramBus" checked> ${icons.publicTransport} Transports en commun</label>
                    <label><input type="checkbox" id="toggleEV"> ${icons.ev} Bornes de recharge VE <span class="color-box" style="background: green;"></span></label>
                    <div class="tram-bus-colors">
                        ${Object.entries(lineColors).map(i => `<span class="color-box" style="background: ${i[1]}; display: inline-block;">${i[0].replace('SEM_', '')}</span>`).join('')}
                    </div>
                </div>
                <div class="layer-open" id="openSidebar">☰</div>
                <div id='map' style="flex: 1; overflow: hidden;"></div>
            </div>
        `

        //Sidebar functionality
        const sidebar = document.getElementById('sidebar');
        const closeSidebar = document.getElementById('closeSidebar');
        const openSidebar = document.getElementById('openSidebar');

        closeSidebar.onclick = () => {
            sidebar.classList.add('closed');
        };

        openSidebar.onclick = () => {
            sidebar.classList.remove('closed');
        };


        //Map
        const elem = document.getElementById('map');
        let width = elem.clientWidth,
            height = elem.clientHeight,
            minZoom = 11,
            lonCenter = 5.7249, latCenter = 45.1885; // Center around Grenoble
        let currentZoom = minZoom;   // The zoom for OSM tiles
        let currentCenter = [lonCenter, latCenter];

        // Observe map size changes
        const resizeObserver = new ResizeObserver(() => {
            // console.log("Resized", elem.clientWidth, elem.clientHeight)
            width = elem.clientWidth;
            height = elem.clientHeight;
            setupMap();
            draw()
        });
        resizeObserver.observe(document.getElementById('map'));

        // Convert lon/lat to OSM tile numbers
        function lonLatToTile(lon, lat, zoom) {
            const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
            const y = Math.floor(
                (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2
                * Math.pow(2, zoom)
            );
            return [x, y];
        }

        const TILE_SIZE = 256;

        function computeTileRadius(width, height, zoom) {
            // Number of tiles that fit half the screen in each direction
            const scale = Math.pow(2, zoom);
            const radiusX = Math.ceil(width / TILE_SIZE / 2) + 1;  // +1 to cover edges
            const radiusY = Math.ceil(height / TILE_SIZE / 2) + 1;
            return Math.max(radiusX, radiusY);
        }

        // Create SVG
        const svg = d3.select("#map")
            .append("svg")
            .attr("display", "block") // to avoid the gap underneath 

        // Zoom behavior
        let zoom;

        function setupMap(){
            svg.attr("width", width).attr("height", height)
            zoom = d3.zoom()
                .scaleExtent([1, 8.5]) // Limit zooming
                .translateExtent([[0, 0], [width, height]]) // Limit panning
                .on("zoom", zoomed);
            svg.call(zoom);

        }
        setupMap();
        
        const transformLayer = svg.append("g")

        const mapLayer = transformLayer.append("g"); // To hold the map tiles
        const waterFillLayer = mapLayer.append("g"); 

        // ZFE layer
        const zfeLayer = transformLayer.append("g")
            .attr("class", "zfe-layer")
            // .style("display", "none");

        document.getElementById("toggleZFE").addEventListener("change", (e) => {
            zfeLayer.style("display", e.target.checked ? null : "none");
        });
        
        // Tram/Bus layer
        const tramBusLayer = transformLayer.append("g")
            .attr("class", "public-transport-layer")
            // .style("display", "none");
        // document.querySelector('.tram-bus-colors').style.display = "none";

        document.getElementById("toggleTramBus").addEventListener("change", (e) => {
            tramBusLayer.style("display", e.target.checked ? null : "none");
            document.querySelector('.tram-bus-colors').style.display =  e.target.checked ? null : "none";
        });

        // PARKING layer
        const parkingLayer = transformLayer.append("g")
            .attr("class", "parking-layer")
            .style("display", "none"); // hidden by default if using checkbox

        document.getElementById("toggleParking").addEventListener("change", (e) => { // Layer display functionality
            parkingLayer.style("display", e.target.checked ? null : "none");
        });

        // BIKE layer
        const bikeLayer = transformLayer.append("g")
            .attr("class", "bike-layer")
            .style("display", "none");

        document.getElementById("toggleBike").addEventListener("change", (e) => {
            bikeLayer.style("display", e.target.checked ? null : "none");
        });
        
        // EV layer
        const evLayer = transformLayer.append("g")
            .attr("class", "ev-layer")
            .style("display", "none");

        document.getElementById("toggleEV").addEventListener("change", (e) => {
            evLayer.style("display", e.target.checked ? null : "none");
        });
        
        // Bike parking layer
        const bikeParkingLayer = transformLayer.append("g")
            .attr("class", "bike-parking-layer")
            .style("display", "none");

        document.getElementById("toggleBikeParking").addEventListener("change", (e) => {
            bikeParkingLayer.style("display", e.target.checked ? null : "none");
        });
        

        // Projection in screen pixels
        const projection = d3.geoMercator()
            .center([lonCenter, latCenter])
            .scale((256 * Math.pow(2, currentZoom)) / (2 * Math.PI))
            .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection);

        function zoomed(event) {
            const transform = event.transform;
            transformLayer.attr("transform", transform); // Apply transform to layer

            // ---- 1. Convert current screen center back to lon/lat ----
            const screenCenter = [width / 2, height / 2];
            const mapCenter = transform.invert(screenCenter); // undo pan/zoom
            let [lon, lat] = projection.invert(mapCenter);   // geo coords

            currentCenter = [lon, lat];

            // ---- 2. Detect when zoom level changed ----
            const zoomLevel = minZoom + Math.floor(Math.log2(transform.k));
            if (zoomLevel !== currentZoom) {
                console.log("Changed zoom level!", zoomLevel, transform.k);
                currentZoom = zoomLevel;
                draw();
            }

            // ---- 3. Detect when panning leaves the radius area ----
            maybeReloadTiles();
        }

        let lastTileX = null;
        let lastTileY = null;
        function maybeReloadTiles() {
            const [lon, lat] = currentCenter;
            const [tx, ty] = lonLatToTile(lon, lat, currentZoom);

            if (tx !== lastTileX || ty !== lastTileY) {
                lastTileX = tx;
                lastTileY = ty;
                draw();
            }
        }

        // Compute tiles to fetch around center
        function getTilesAround(centerX, centerY, zoom, radius = 2) {
            const tiles = [];
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    tiles.push([centerX + dx, centerY + dy, zoom]);
                }
            }
            return tiles;
        }

        const notFound = {}; //For debugging missing tiles
        async function draw() {
            // Compute center tile
            const [lon, lat] = currentCenter;
            const [centerTileX, centerTileY] = lonLatToTile(lon, lat, currentZoom);

            // Compute radius based on current width/height
            const radius = computeTileRadius(width, height, currentZoom);
            console.log("Radius ", radius)

            const tilesToLoad = getTilesAround(centerTileX, centerTileY, currentZoom, radius);

            const tilesData = await Promise.all(
                tilesToLoad.map(async d => {
                    const layers = await fetchTileJson(d[0], d[1], d[2]);
                    if (!layers) {
                        notFound[`${d[0]}-${d[1]}-${d[2]}`] = d;
                    }
                    return { x: d[0], y: d[1], z: d[2], layers };
                })
            );
            console.log("Not found", notFound)


            //Group water fill - to avoid artefacts on the side of tiles
            const allWater = []
            const filledRivers = tilesData.flatMap(t => t.layers?.water || [])
            filledRivers.forEach(f => {
                if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
                    allWater.push(f);
                }
            });
            const mergedFC = { type:"FeatureCollection", features: allWater };
            waterFillLayer.selectAll("path").remove();
            waterFillLayer.append("path")
                .attr("fill", "var(--water)")
                .attr("stroke", "none")
                .attr("d", path(mergedFC));

            const map = mapLayer.selectAll("g.tile")
                .data(tilesData, d => `${d.x}-${d.y}-${d.z}`);

            const enter = map.enter().append("g")
                .attr("class", "tile")

            const scale = 1 + currentZoom - minZoom;
            const strokeWidth = 1 / scale;

            enter.append("path") // waterways
                .attr("fill", "none")
                .attr("stroke", "var(--water)")
                .attr("stroke-width", .5 / scale)
                .attr("d", d => d.layers?.water ? path({ type: "FeatureCollection", features: d.layers.water }) : null);

            enter.append("path") // roads
                .attr("fill", "none")
                .attr("stroke", "var(--fg-1)")
                .attr("stroke-width", strokeWidth)
                .attr("d", d => d.layers?.roads ? path({ type: "FeatureCollection", features: d.layers.roads }) : null);

            enter.append("path") // buildings
                .attr("fill", "var(--bg-4)")
                .attr("stroke", "none")
                .attr("stroke-width", strokeWidth)
                .attr("d", d => d.layers?.buildings ? path({ type: "FeatureCollection", features: d.layers.buildings }) : null);

            map.exit().remove();

            
            if(typeof parkingData != 'undefined'){ //Reset parking layer
                parkingLayer.selectAll("circle").remove();
                parkingData.forEach(addParkingD3);
            }
            if(typeof bikeData != 'undefined'){ //Reset bike layer
                bikeLayer.selectAll("circle").remove();
                bikeData.forEach(addBikeD3);
            }
            if(typeof evData != 'undefined'){ //Reset EV layer
                evLayer.selectAll("circle").remove();
                evData.forEach(addEvD3);
            }
            zfeLayer.selectAll("path").attr("stroke-width", 2 * strokeWidth)
            tramBusLayer.selectAll("path").attr("stroke-width", tramBusStrokeWidth)
            bikeParkingLayer.selectAll("circle").attr("r", 2 * strokeWidth)
        }

        // Initial draw
        draw();

        //Other layers
        function addCircleMarker(layer, item, options) {
            const [lat, lon] = item.coords;
            if (!lat || !lon) return;
        
            const { color, radius, tooltipHTML, popupText, strokeWidth } = options;
        
            const scale = 1 + currentZoom - minZoom;
            const strokeWidthScaled = 1 / scale;
        
            const marker = layer.append("circle")
                .attr("r", radius * strokeWidthScaled)
                .attr("fill", color)
                .attr("stroke", options.stroke || color)
                .attr("stroke-width", (typeof strokeWidth != 'undefined' ? strokeWidth : 0) * strokeWidthScaled)
                .attr("opacity", 0.85)
                .attr("fill-opacity", 0.75)
                .datum(item);
        
            // Position on screen
            const [x, y] = projection([lon, lat]);
            marker.attr("cx", x).attr("cy", y);
        
            // Hover
            if(tooltipHTML){
                marker.on("mouseenter", (event, d) => {
                    marker.transition()
                        .attr("r", Math.min(radius * 1.2, 24) * strokeWidthScaled)
                        .attr("opacity", 1)
                        .attr("fill-opacity", 0.9)
                        .attr("stroke-width", 3 * strokeWidthScaled);
            
                    showTooltip(event, tooltipHTML(item), color);
                });
        
                marker.on("mouseleave", () => {
                    marker.transition()
                        .attr("r", radius * strokeWidthScaled)
                        .attr("opacity", 0.85)
                        .attr("fill-opacity", 0.75)
                        .attr("stroke-width", 2.5 * strokeWidthScaled);
            
                    hideTooltip();
                });
            }
            if(popupText)
                marker.on("click", () => alert(popupText(item)));
        }   
        
        function addParkingD3(p) {
            addCircleMarker(parkingLayer, p, {
                color: p.gratuit ? "#29c18c" : "#4f7cff",
                stroke: p.gratuit ? "#1fa371" : "#3551d5",
                radius: Math.min(Math.sqrt(p.places) * 0.7, 20),
        
                tooltipHTML: (d) => {
                    const services = [];
                    if (d.velo) services.push(`🚲 ${d.velo}`);
                    if (d.covoit) services.push("🤝");
                    if (d.elec) services.push(`⚡ ${d.elec}`);
                    if (d.autopartage) services.push("🚗");
                    if (d.pmr) services.push(`♿ ${d.pmr}`);
        
                    return `
                        <div style="font-weight:600; margin-bottom:0.4rem; color:white;">${icons.parking} ${d.nom}</div>
                        <div style="margin-bottom:0.4rem;">
                            <strong>${d.places}</strong> places · 
                            <span style="color:${p.gratuit ? "#29c18c" : "#4f7cff"}; font-weight:600">
                                ${d.gratuit ? "✓ Gratuit" : "💰 Payant"}
                            </span>
                        </div>
                        <div style="opacity:0.7; font-size:0.75rem;">${d.commune}</div>
                        ${services.length ? `<div style="margin-top:0.4rem; font-size:0.75rem;">${services.join(" ")}</div>` : ""}
                    `;
                },
        
                popupText: (d) => `${d.nom}\n${d.places} places\n${d.commune}`
            });
        }

        function addBikeD3(b) {
            addCircleMarker(bikeLayer, b, {
                color: "#e8d400",
                radius: Math.sqrt(b.avg) * 0.15,
        
                tooltipHTML: (d) => `
                    <div style="font-weight:600; margin-bottom:0.4rem; color:white;">${icons.bike} ${d.nom}</div>
                    <div style="margin-bottom:0.4rem; opacity:0.85;">
                        ${d.typeAxe}<br>
                        <strong>${Math.round(d.avg)}</strong> passages/jour (moyenne)
                    </div>
                    <div style="opacity:0.7; font-size:0.75rem;">${d.commune}</div>
                `,
        
                popupText: (d) => `${d.nom}\n${Math.round(d.avg)} passages/jour`
            });
        }
        
        function addEvD3(b) {
            addCircleMarker(evLayer, b, {
                color: "green",
                radius: Math.sqrt(b.pdc) * 3,
        
                tooltipHTML: (d) => `
                    <div style="font-weight:600; margin-bottom:0.4rem; color:white;">${icons.ev}${d.nom}</div>
                    <div style="margin-bottom:0.4rem; opacity:0.85;">
                        <strong>${d.pdc}</strong> places
                    </div>
                `,
        
                popupText: (d) => `${d.nom}\n${d.pdc} places`
            });
        }

        let tooltipDiv = null;

        function showTooltip(event, html, color) {
            hideTooltip();
        
            tooltipDiv = document.createElement("div");
            tooltipDiv.className = "map-marker-tooltip";
            tooltipDiv.innerHTML = html;
        
            Object.assign(tooltipDiv.style, {
                position: "fixed",
                background: "linear-gradient(135deg, rgba(15, 16, 25, 0.99), rgba(26,30,45,0.99))",
                color: "#f0f1f3",
                padding: "0.9rem 1.1rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                pointerEvents: "none",
                zIndex: 9999,
                boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                border: `1px solid ${color}66`,
                borderLeft: `4px solid ${color}`,
                left: event.clientX + 15 + "px",
                top: event.clientY - 100 + "px",
                maxWidth: "260px",
            });
        
            document.body.appendChild(tooltipDiv);
        }
        
        function hideTooltip() { if (tooltipDiv) tooltipDiv.remove(); }

        let parkingData = [];
        let bikeData = [];
        let evData = [];

        async function fetchParkingData(){
            console.log("Fetching parking data")
            const rawParkingData = await fetchCSV('./data/parking/parking.csv');

            parkingData = rawParkingData.filter(d => d.nb_places && parseInt(d.nb_places) > 0)
                .map(d => {
                    // Vérifier si le parking est gratuit (valeur 1 ou 1.0 dans colonne gratuit)
                    const gratuitValue = (d.gratuit || '').trim();
                    const isGratuit = gratuitValue === '1' || gratuitValue === '1.0' || parseFloat(gratuitValue) === 1;
                    return {
                        nom: d.nom,
                        places: parseInt(d.nb_places) || 0,
                        pmr: parseInt(d.nb_pmr) || 0,
                        velo: parseInt(d.nb_velo) || 0,
                        covoit: parseInt(d.nb_covoit) || 0,
                        elec: parseInt(d.nb_voitures_electriques) || 0,
                        moto: parseInt(d.nb_2r_el) || 0,
                        autopartage: parseInt(d.nb_autopartage) || 0,
                        type_ouvrage: d.type_ouvrage || 'unknown',
                        gratuit: isGratuit,
                        commune: d.commune,
                        coords: d.geo_point_2d?.split(',').map(parseFloat) || [0,0]
                    };
                });
            parkingData.forEach(p => addParkingD3(p));
        }

        async function fetchBikeData(){
            console.log("Fetching bike data")
            const raw = await fetchCSV('./data/mobilite_douce/comptages_velos_permanents.csv');

            // console.log(raw)

            bikeData = raw
                .filter(d => d.geo_point_2d)
                .map(d => {
                    const years = ["tmj_2019","tmj_2020","tmj_2021","tmj_2022"];
                    const vals = years.map(y => parseFloat(d[y])).filter(v => !isNaN(v));
                    const avg = d3.mean(vals);

                    return {
                        nom: d.nom_post?.replace(/^\(.*?\)\s*/, ""),
                        commune: d.nom_comm,
                        typeAxe: d.type_axe || "unknown",
                        coords: d.geo_point_2d.split(",").map(parseFloat) || [0,0],
                        avg
                    };
                });

            bikeData.forEach(addBikeD3);
        }

        async function fetchZFEData(){
            console.log("Fetching ZFE data")
            const raw = await fetchCSV('./data/zfe/zfeaires.csv');

            const ZFEPermimeter = featureCollectionFromRows(raw);

            zfeLayer.append("path")
                .attr("fill", "rgba(190, 3, 252,0.1)")
                .attr("stroke", "rgb(190, 3, 252)")
                .attr("stroke-width", 2)
                .attr("d", path(ZFEPermimeter));
        }

        function tramBusStrokeWidth(d){ // Changes the stroke of a public transport line whether it's a tram or a bus
            const scale = 1 + currentZoom - minZoom;
            const strokeWidth = 1 / scale;
            const code = d.properties.CODE;
        
            if (/^SEM_[A-Z]$/.test(code)) {
                // SEM_A (single letter) - tram
                return 3 * strokeWidth;
            }
            if (/^SEM_[A-Z][0-9]+$/.test(code)) {
                // SEM_C1, SEM_D12 (letter + digits) - chronobus
                return 2 * strokeWidth;
            }
            if (/^SEM_[0-9]+$/.test(code)) {
                // SEM_1, SEM_12 (digits only) - bus
                return 1.5 * strokeWidth;
            }
            // fallback
            return 1;
        }

        async function fetchTramBusData(){
            const raw = await fetchJSON('./data/transport_public/lignes_tag.geojson');

            //Separate each line - filter only lines that are in lineColors
            tramBusLayer.selectAll("path")
                .data(raw.features.filter(f => f.properties.CODE in lineColors))
                .enter()
                .append("path")
                .attr("d", d => path({
                    type: "Feature",
                    geometry: {
                    type: "MultiLineString",
                    coordinates: d.geometry.coordinates
                    }
                }))
                .attr("fill", "none")
                .attr("stroke", d => lineColors[d.properties.CODE] || "rgb(31,114,184)")
                .attr("stroke-width", tramBusStrokeWidth)
        }

        async function fetchEVData(){
            const files = [
                // './data/irve/irve_metropole.csv',
                // './data/irve/irve_gresivaudan.csv',
                './data/irve/irve_smmag.csv',
                // './data/irve/irve_pays_voironnais.csv'
            ];
            const raw = [];
            await Promise.all(files.map(async file => {
                const data = await fetchCSV(file);
                console.log(data)
                if(data.length > 0){
                    raw.push(...data);
                }
            }))
            evData = raw.filter(d => {
                const lat = parseFloat(d.consolidated_latitude);
                const lon = parseFloat(d.consolidated_longitude);
                return !isNaN(lat) && !isNaN(lon);
            }).map(d => ({
                nom: d.nom_enseigne || d.nom_station || 'Station',
                coords: [parseFloat(d.consolidated_latitude), parseFloat(d.consolidated_longitude)],
                pdc: parseInt(d.nbre_pdc) || 0
            }));

            console.log(evData)

            evData.forEach(addEvD3);

        }

        async function fetchBikeParkingData(){
            console.log("Fetching Bike Parking data")
            const raw = await fetchCSV('./data/mobilite_douce/arceaux.csv');

            raw.map(d => ({
                coords: d.geo_point_2d.split(",").map(parseFloat) || [0,0],
            })).map(d => addCircleMarker(bikeParkingLayer, d, {
                color: "red",
                radius: 2,
                strokeWidth: 0
            }))

            // const ZFEPermimeter = featureCollectionFromRows(raw);

            // zfeLayer.append("path")
            //     .attr("fill", "rgba(190, 3, 252,0.1)")
            //     .attr("stroke", "rgb(190, 3, 252)")
            //     .attr("stroke-width", 2)
            //     .attr("d", path(ZFEPermimeter));
            console.log(raw)
        }

        await Promise.all([fetchParkingData(), fetchBikeData(), fetchZFEData(), fetchTramBusData(), fetchEVData(), fetchBikeParkingData()]);
    }
}

//Tile fetching logic
async function fetchTileJson(x, y, z) {
    const path = `/data/geojson/output-${z}-${x}-${y}.geojson`;
    return await fetchJSON(path);
}