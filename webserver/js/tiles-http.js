let VectorTile = _mapbox_vectorTile.VectorTile
const API_KEY = 'cfNfEQR1Qkaz-6mvWl8cpw';

const tileCache = {};

async function fetchTileJson(x, y, z) {
    if(tileCache[`${x}-${y}-${z}`]){
        console.log("Serving ", `${x}-${y}-${z}`, " from cache")
        return tileCache[`${x}-${y}-${z}`]
    }
    let layers; 
    try { 
        layers = new VectorTile(new Pbf(await d3.buffer(`https://tile.nextzen.org/tilezen/vector/v1/256/all/${z}/${x}/${y}.mvt?api_key=${API_KEY}`)));
    }catch(e){
        return null;
    }
    const json = {};

    // console.log(vectorTile)
    const vectorTile = layers.layers;


    for (const layerName of Object.keys(vectorTile)) {
        json[layerName] = [];
        const layer = vectorTile[layerName];
        for (let i = 0; i < layer.length; i++) {
            const f = layer.feature(i).toGeoJSON(x, y, z);
            json[layerName].push(f);
        }
    }
    tileCache[`${x}-${y}-${z}`] = json;
    // console.log(json)
    return json;
}