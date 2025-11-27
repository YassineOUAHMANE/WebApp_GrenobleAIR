// A script that retrieves Protobuf buffers and parses them as GeoJSON
import { VectorTile } from '@mapbox/vector-tile';

import Pbf from 'pbf'

import fs from 'fs'
import path from 'path'

const layersToKeep = ['water', 'roads', 'buildings']; // To reduce space, keep only these layers

(async () => {
    console.log("Starting GEOJSON retrieval");
    const directoryPath = 'buffers'
    const files = fs.readdirSync('buffers');

    // Loop through each file
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(directoryPath, files[i]);
        console.log(`File: ${files[i]} (Path: ${filePath})`);

        // Optionally, check if it's a file or directory
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
            console.log(`${files[i]} is not a file.`);
            continue;
        }
        //Get the zoom 
        // Use a regular expression to extract z, x, and y
        const regex = /output-(\d+)-(\d+)-(\d+)\.mvt/;
        const match = files[i].match(regex);
        if(!match){
            console.log('Filename format is incorrect');
            continue;
        }
        const z = match[1];
        const x = match[2];
        const y = match[3];

        const jsonFileName = `geojson/output-${z}-${x}-${y}.geojson`
        
        if(fs.existsSync(jsonFileName)){
            console.log("The geojson file already exists, skipping");
            continue;
        }

        const buffer = fs.readFileSync(filePath);
        const pbf = new Pbf(buffer) // Parse PBF

        const vectorTile = new VectorTile(pbf).layers;

        console.log(vectorTile)
        console.log(typeof vectorTile)
        console.log(Object.keys(vectorTile))
        // Convert each layer to JSON
        console.log(vectorTile.length)
        
        const json = {};
        for (const layerName of Object.keys(vectorTile)) {
            if(!layersToKeep.includes(layerName)){ // filter only layer items of interest
                continue;
            }
            console.log("LayerName: ", layerName)
            json[layerName] = [];
            const layer = vectorTile[layerName];
            for (let i = 0; i < layer.length; i++) {
                const f = layer.feature(i).toGeoJSON(x, y, z);
                if(f.properties && !f.properties.boundary){
                    delete f.properties;
                }
                json[layerName].push(f);
            }
        }
        fs.writeFileSync(jsonFileName, JSON.stringify(json));
    }

})();