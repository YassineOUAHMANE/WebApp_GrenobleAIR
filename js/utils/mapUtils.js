// --- Helpers géo (GeoJSON & points "lat,lon") ---

/** Convertit une colonne 'geo_shape' (GeoJSON string) en FeatureCollection */
export function featureCollectionFromRows(rows, { shapeCol = 'geo_shape', includeProps = true } = {}) {
  const features = [];
  for (const r of rows) {
    const s = r?.[shapeCol];
    if (!s) continue;
    try {
      const geom = JSON.parse(String(s));
      const props = includeProps ? { ...r } : {};
      delete props[shapeCol];
      features.push({ type: 'Feature', geometry: geom, properties: props });
    } catch {}
  }
  return { type: 'FeatureCollection', features };
}

/** Ajoute un L.geoJSON sur la carte ; retourne un cleanup() */
export function addGeoJSON(map, featureCollection, { style, onEachFeature } = {}) {
  const layer = L.geoJSON(featureCollection, { style, onEachFeature }).addTo(map);
  return () => { try { map.removeLayer(layer); } catch {} };
}

/** Essaie d'ajuster la carte à un GeoJSON (FeatureCollection ou L.Layer) */
export function fitToGeoJSON(map, featureCollection, { padding = [20,20] } = {}) {
  try {
    const temp = L.geoJSON(featureCollection);
    const b = temp.getBounds();
    if (b && b.isValid()) map.fitBounds(b, { padding });
  } catch {}
}

/** Parse "lat,lon" -> { lat:Number, lon:Number } */
export function parseLatLon(str) {
  if (!str) return null;
  const [lat, lon] = String(str).split(',').map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  return null;
}

/** Ajoute des circleMarkers à partir d'une colonne texte 'geo_point_2d' */
export function addCircleMarkersFromPointCol(map, rows, {
  pointCol = 'geo_point_2d',
  radius = 5,
  color = '#4f7cff',
  popup = (d) => ''
} = {}) {
  const layer = L.layerGroup().addTo(map);
  for (const r of rows) {
    const p = parseLatLon(r?.[pointCol]);
    if (!p) continue;
    const m = L.circleMarker([p.lat, p.lon], { radius, color, weight: 2, fillOpacity: 0.6 }).addTo(layer);
    const html = popup(r);
    if (html) m.bindPopup(html);
  }
  return () => { try { map.removeLayer(layer); } catch {} };
}
