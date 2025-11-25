// A script that retrieves Protobuf buffers and parses them as GeoJSON
// import { VectorTile } from 'd3';
import { geoMercator } from 'd3-geo';
import { tile } from 'd3-tile';

import { VectorTile } from '@mapbox/vector-tile';

import Pbf from 'pbf'

import fs from 'fs'

const zoom_levels = { start: 19, end: 24 };


// const request = (z,x,y) => `https://tile.nextzen.org/tilezen/vector/v1/256/all/${z}/${x}/${y}.mvt?api_key=${API_KEY}`
// console.log("Script started");
console.log("Starting retrieval");

(async () => {
    console.log("Starting JSON retrieval");
    for (let zoom = zoom_levels.start; zoom <= zoom_levels.end; zoom++) {
        console.log("Retrieving zoom level", zoom);

        const projection = geoMercator()
            .center([5.7249, 45.1885]) // Center on Grenoble
            .scale(Math.pow(2, zoom) / (2 * Math.PI))
            .precision(0);


        const tiles = tile()
            // .size([width, height])
            .scale(projection.scale() * 2 * Math.PI)
            .translate(projection([0, 0]))(zoom); // Call with zoom level

        await Promise.all(tiles.map(async d => {
            const [x,y,z] = d;
            console.log(z,x,y)
            const fileName = `buffers/output-${z}-${x}-${y}.mvt`
            const jsonFileName = `geojson/output-${z}-${x}-${y}.geojson`
            if (!fs.existsSync(fileName)) {
                console.error(filename + " doesn't exist!");
            }
            const buffer = fs.readFileSync(fileName);
            const pbf = new Pbf(buffer) // Parse PBF

            const vectorTile = new VectorTile(pbf).layers;

            console.log(vectorTile)
            console.log(typeof vectorTile)
            console.log(Object.keys(vectorTile))
            // Convert each layer to JSON
            console.log(vectorTile.length)
            
            const json = {};
            for (const layerName of Object.keys(vectorTile)) {
                json[layerName] = [];
                const layer = vectorTile[layerName];
                for (let i = 0; i < layer.length; i++) {
                    const f = layer.feature(i).toGeoJSON(x, y, z);
                    // console.log(f)
                    json[layerName].push(f);
                }
            }
            fs.writeFileSync(jsonFileName, JSON.stringify(json));
        }))
    }

})();