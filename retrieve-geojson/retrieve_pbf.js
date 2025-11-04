// A script that retrieves Protobuf buffers and parses them as GeoJSON
// import * as d3 from 'd3';
import { buffer } from 'd3';
import { geoMercator } from 'd3-geo';
import { tile } from 'd3-tile';

import fs from 'fs'

const API_KEY = 'cfNfEQR1Qkaz-6mvWl8cpw';
const zoom_levels = {start: 19, end: 24};

const request = (z,x,y) => `https://tile.nextzen.org/tilezen/vector/v1/256/all/${z}/${x}/${y}.mvt?api_key=${API_KEY}`
// console.log("Script started");
console.log("Starting retrieval");

(async () => {
    console.log("Starting retrieval");
    for (let zoom = zoom_levels.start; zoom <= zoom_levels.end; zoom++) {
        console.log("Retrieving zoom level", zoom);

        const projection = geoMercator()
            .center([5.7249, 45.1885]) // Center on Grenoble
            .scale(Math.pow(2, zoom) / (2 * Math.PI))
            // .translate([width / 2, height / 2])
            .precision(0);

        const tiles = tile()
            // .size([width, height])
            .scale(projection.scale() * 2 * Math.PI)
            .translate(projection([0, 0]))(zoom); // Call with zoom level

        await Promise.all(tiles.map(async d => {
            const [x,y,z] = d;
            console.log(request(z,x,y))
            const fileName = `buffers/output-${z}-${x}-${y}.mvt`
            if(!fs.existsSync(fileName)){
                //Request and save PBF 
                const b = await buffer(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${z}/${x}/${y}.mvt?api_key=${API_KEY}`);
                const protobufBuffer = Buffer.from(b); // Your Protobuf buffer
                fs.writeFileSync(fileName, protobufBuffer);
            }
        }))
    }

})();