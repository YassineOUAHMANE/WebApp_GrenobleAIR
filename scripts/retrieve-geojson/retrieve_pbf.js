// A script that retrieves Protobuf buffers and parses them as GeoJSON
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
    async function fetchTile([x,y,z]){
        const fileName = `buffers/output-${z}-${x}-${y}.mvt`
        if(!fs.existsSync(fileName)){
            console.log(request(z,x,y))
            //Request and save PBF 
            const b = await buffer(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${z}/${x}/${y}.mvt?api_key=${API_KEY}`);
            const protobufBuffer = Buffer.from(b); // Your Protobuf buffer
            fs.writeFileSync(fileName, protobufBuffer);
        }
    }


    console.log("Starting retrieval");
    // for (let zoom = zoom_levels.start; zoom <= zoom_levels.end; zoom++) {
    //     console.log("Retrieving zoom level", zoom);
    //     const toFetch = [];

    //     const projection = geoMercator()
    //         .center([5.7249, 45.1885]) // Center on Grenoble
    //         .scale(Math.pow(2, zoom) / (2 * Math.PI))
    //         // .translate([width / 2, height / 2])
    //         .precision(0);

    //     const tiles = tile()
    //         // .size([width, height])
    //         .scale(projection.scale() * 2 * Math.PI)
    //         .translate(projection([0, 0]))(zoom); // Call with zoom level

    //     tiles.map(([x,y,z]) => toFetch.push([x,y,z]))

    //     await Promise.all(toFetch.map(async i => fetchTile(i)))
    // }

    //Fetch from to_add.json
    if(fs.existsSync('to_add.json')){
        const json = JSON.parse(fs.readFileSync('to_add.json'));
        await Promise.all(json.map(async ([x,y,z]) => fetchTile([x,y,z])))
    }

})();