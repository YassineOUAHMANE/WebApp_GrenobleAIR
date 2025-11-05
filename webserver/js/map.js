height = 600;
width = 954;

const notFound = []; //When a tile isn't found it's added here for debugging purposes

const minZoom = 19, maxZoom = 24;
let currentZoom = minZoom;
let transform = null;

// Create the SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

// Group to hold all map content
const g = svg.append("g");

// Create the projection
const projection = d3.geoMercator()
    .center([5.7249, 45.1885])
    .scale(Math.pow(2, minZoom) / (2 * Math.PI))
    .translate([width / 2, height / 2])
    .precision(0);

// Create the tile generator
const tile = d3.tile()
    .size([width, height])
    .scale(projection.scale() * 2 * Math.PI)
    .translate(projection([0, 0]));

// Create the zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // Adjust for smooth scaling without changing tiles
    .on("zoom", (event) => {
        // console.log("Zoom event", event)
        // transform = event.transform; 

        const zoomLevel = minZoom + Math.floor(Math.log2(event.transform.k));
        // console.log("Zoom level (power of 2):", zoomLevel);
        // console.log(event, tiles)
        g.attr("transform", event.transform); // Apply transform to group

        if (currentZoom != zoomLevel) {
            currentZoom = zoomLevel;
            transform = event.transform
            console.log("Changed zoom level!", zoomLevel, event.transform.k);
            redraw();
        }
    });

// Apply zoom behavior to the SVG
svg.call(zoom);

// Create the path generator
const path = d3.geoPath(projection);

// Function to redraw the map
function redraw() {
    g.selectAll("*").remove();
    fetchTiles();
}

// Function to filter GeoJSON features
function filter({ features }, test) {
    return { type: "FeatureCollection", features: features.filter(test) };
}

// Function to extract GeoJSON features from a tile
function geojson([x, y, z], layer, filterFn = () => true) {
    if (!layer) return;
    const features = [];
    for (let i = 0; i < layer.length; ++i) {
        const f = layer[i];
        if (filterFn(f, i, features)) features.push(f);
    }
    return { type: "FeatureCollection", features };
}

// Function to fetch and render tiles
async function fetchTiles() {
    // const tiles = tile.zoomDelta(1)(transform);
    console.log('Fetching zoom level', currentZoom - 8);
    if (transform != null) {
        // minZoom + Math.floor(Math.log2(event.transform.k));
        transform.k = Math.pow(2, currentZoom - minZoom);
        console.log("applying transform", transform)
        tile.zoomDelta(0.99)(transform);
    }
    const tiles = await Promise.all(tile().map(async d => {
        console.log(d[0], d[1], d[2])
        // console.log("Fetching", `/geojson/output-${currentZoom - 8}-${d[0]}-${d[1]}.geojson`)
        // const res = await fetch(`/geojson/output-${currentZoom - 8}-${d[0]}-${d[1]}.geojson`);
        // if(res.status != 200){
        //     notFound.push([currentZoom - 8, d[0], d[1]])
        //     return null;
        // }
        // d.layers = await res.json();
        d.layers = await fetchTileJson(d[0], d[1], currentZoom - 8);
        d.coordinates = [d[0], d[1], currentZoom - 8];
        return d;
    }));
    console.log("Coordinates", tiles.map(i => i.coordinates))

    tiles.forEach(d => {
        if (!d.layers) return;
        // Render water
        g.append("path")
            .attr("fill", "#eee")
            .attr("d", path(geojson(d, d.layers.water, f => !f.properties.boundary)));

        // Render water boundaries
        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "#34ebe5")
            .attr("d", path(geojson(d, d.layers.water, f => f.properties.boundary)));

        // Render roads
        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-width", "0.75")
            .attr("d", path(geojson(d, d.layers.roads)));

        // Render boundary
        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "#ff0000")
            .attr("stroke-width", "0.75")
            .attr("d", path(geojson(d, d.layers.earth)));
    });
}

// Initial render
fetchTiles();