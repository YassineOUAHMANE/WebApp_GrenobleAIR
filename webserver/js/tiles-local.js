
const tileCache = {};

async function fetchTileJson(x, y, z) {
    if(tileCache[`${x}-${y}-${z}`]){
        console.log("Serving ", `${x}-${y}-${z}`, " from cache")
        return tileCache[`${x}-${y}-${z}`]
    }

    // console.log("Fetching", `/geojson/output-${currentZoom - 8}-${d[0]}-${d[1]}.geojson`)
    const res = await fetch(`/geojson/output-${z}-${x}-${y}.geojson`);
    if(res.status != 200){
        return null;
    }
    const json = await res.json();
    

    tileCache[`${x}-${y}-${z}`] = json;
    // console.log(json)
    return json;
}