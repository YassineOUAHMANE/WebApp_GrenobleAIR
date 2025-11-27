# Retrieve GeoJSON
This directory contains Node.js to fetch vector tiles as protobuf and to convert them to GeoJson. 
The pipeline is as follows
* `retrieve_pbf.js` - retrieves all tiles in to_add.json (in map x, y, z coordinates) and saves their protobuf buffers to buffers/
* `parse_geojson.js` - converts the protobuf buffers into geojson by iterating through their layers. 
* 