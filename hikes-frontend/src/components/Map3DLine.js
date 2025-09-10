import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

// Varen MapTiler ključ (deluje v Vite in CRA)
const MAP_KEY =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_MAPTILER_KEY) ||
  (typeof process !== "undefined" && process?.env?.REACT_APP_MAPTILER_KEY) ||
  "";


/**
 * routeGeoJSON: Feature ali FeatureCollection z LineString/MultilineString geometrijo
 */
export default function Map3DLine({ routeGeoJSON, height="50vh", exaggeration=1.5 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const styleUrl = KEY
      ? `https://api.maptiler.com/maps/outdoor/style.json?key=${KEY}`
      : "https://demotiles.maplibre.org/style.json";

    const map = new maplibregl.Map({
      container: ref.current,
      style: styleUrl,
      center: [14.5, 46.3],
      zoom: 10,
      pitch: 60,
      bearing: -20,
      antialias: true,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      if (KEY) {
        map.addSource("terrain", {
          type: "raster-dem",
          url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${KEY}`,
          tileSize: 256,
        });
        map.setTerrain({ source: "terrain", exaggeration });
      }

      map.addSource("route", {
        type: "geojson",
        data: routeGeoJSON ?? { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#ff4d4d",
          "line-width": 4,
          "line-opacity": 0.95,
        },
      });

      // fit
      if (routeGeoJSON) {
        const bbox = getBbox(routeGeoJSON);
        if (bbox) map.fitBounds(bbox, { padding: 80, duration: 800 });
      }
    });

    return () => map.remove();
  }, []);

  // sprotna posodobitev, če zamenjaš pot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("route");
    if (src && routeGeoJSON) {
      src.setData(routeGeoJSON);
      const bbox = getBbox(routeGeoJSON);
      if (bbox) map.fitBounds(bbox, { padding: 80, duration: 600 });
    }
  }, [routeGeoJSON]);

  return <div ref={ref} style={{ height }} className="w-full rounded-2xl overflow-hidden shadow" />;
}

// minimal bbox brez dodatnih knjižnic
function getBbox(geojson) {
  const feats = geojson.type === "FeatureCollection" ? geojson.features : [geojson];
  const coords = [];
  for (const f of feats) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "LineString") coords.push(...g.coordinates);
    if (g.type === "MultiLineString") g.coordinates.forEach(c => coords.push(...c));
  }
  if (!coords.length) return null;
  let minX=coords[0][0], minY=coords[0][1], maxX=minX, maxY=minY;
  for (const [x,y] of coords) {
    if (x<minX) minX=x; if (x>maxX) maxX=x;
    if (y<minY) minY=y; if (y>maxY) maxY=y;
  }
  return [[minX, minY], [maxX, maxY]];
}
