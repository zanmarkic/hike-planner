// src/components/Map3D.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Props:
 * - center: [lng, lat] | {lng,lat}
 * - routeCoords: Array<[lng,lat] | {lng,lat}>
 * - driveCoords: Array<[lng,lat] | {lng,lat}>
 * - originCoord: [lng,lat] | {lng,lat}
 * - originLabel?: string
 * - startLabel?: string
 * - summitLabel?: string
 * - apiKey?: string
 * - height?: string
 * - showProviderBadge?: boolean
 * - mapStyle?: string  // npr. "outdoor-v2", "topo-v2", "winter", "streets-v2", "hybrid" ali poln URL
 */
export default function Map3D({
  center,
  routeCoords,
  driveCoords,
  originCoord,
  originLabel,
  startLabel,
  summitLabel,
  apiKey,
  height = "300px",
  showProviderBadge = true,
  mapStyle = "outdoor-v2",
}) {
  const mapRef = useRef(null);
  const mapEl = useRef(null);
  const startMarkerRef = useRef(null);
  const summitMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);

  const KEY =
    apiKey ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_MAPTILER_KEY) ||
    (typeof process !== "undefined" && process?.env?.REACT_APP_MAPTILER_KEY) ||
    "";
  const HAS_KEY = !!KEY;

  const toArrayLngLat = (p) => {
    if (Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) return [p[0], p[1]];
    if (p && typeof p === "object") {
      const lng = Number.isFinite(p.lng) ? p.lng : Number.isFinite(p.lon) ? p.lon : undefined;
      const lat = Number.isFinite(p.lat) ? p.lat : undefined;
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }
    return null;
  };
  const isCoord = (p) => !!toArrayLngLat(p);
  const filterCoords = (arr) => (Array.isArray(arr) ? arr.map(toArrayLngLat).filter(Boolean) : []);
  const collectAllCoords = (route, drive) => [...filterCoords(route), ...filterCoords(drive)];

  const upsertMarker = (markerRef, map, lngLat, color, label) => {
    const xy = toArrayLngLat(lngLat);
    if (!xy) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    if (!markerRef.current) {
      const m = new maplibregl.Marker({ color });
      m.setLngLat(xy).addTo(map);
      if (label) {
        const pop = new maplibregl.Popup({ offset: 10 }).setText(label);
        m.setPopup(pop);
      }
      markerRef.current = m;
      return;
    }
    markerRef.current.setLngLat(xy);
    if (label && !markerRef.current.getPopup()) {
      markerRef.current.setPopup(new maplibregl.Popup({ offset: 10 }).setText(label));
    }
  };

  // Sestavi style URL: če je poln URL, ga uporabi; sicer id -> MapTiler style
  const makeStyleUrl = (styleOrUrl) => {
    if (!HAS_KEY) return "https://demotiles.maplibre.org/style.json";
    if (typeof styleOrUrl === "string" && /^https?:\/\//.test(styleOrUrl)) return styleOrUrl;
    const styleId = styleOrUrl || "outdoor-v2";
    return `https://api.maptiler.com/maps/${styleId}/style.json?key=${KEY}`;
  };

  // INIT
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const styleUrl = makeStyleUrl(mapStyle);
    const initCenter = toArrayLngLat(center) || [14.5, 46.05];

    const map = new maplibregl.Map({
      container: mapEl.current,
      style: styleUrl,
      center: initCenter,
      zoom: 12,
      pitch: 60,
      bearing: -10,
      antialias: true,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      if (HAS_KEY) {
        map.addSource("terrain-dem", {
          type: "raster-dem",
          tiles: [
            `https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=${KEY}`,
          ],
          tileSize: 256,
          maxzoom: 14,
          encoding: "mapbox",
        });
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.3 });
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun-intensity": 15,
          },
        });
      }

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: filterCoords(routeCoords) },
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#ff5500", "line-width": 4, "line-opacity": 0.95 },
      });

      map.addSource("drive", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: filterCoords(driveCoords) },
        },
      });
      map.addLayer({
        id: "drive-line",
        type: "line",
        source: "drive",
        paint: { "line-color": "#2b6cff", "line-width": 3, "line-dasharray": [2, 2], "line-opacity": 0.9 },
      });

      const rc = filterCoords(routeCoords);
      const start = rc.length ? rc[0] : null;
      const summit = rc.length ? rc[rc.length - 1] : null;
      upsertMarker(startMarkerRef, map, start, "#2ab56f", startLabel || "Izhodišče");
      upsertMarker(summitMarkerRef, map, summit, "#ff8a00", summitLabel || "Vrh");

      const dc = filterCoords(driveCoords);
      const originPoint = toArrayLngLat(originCoord) || (dc.length ? dc[0] : null);
      upsertMarker(originMarkerRef, map, originPoint, "#1e90ff", originLabel || "Start");

      const all = collectAllCoords(routeCoords, driveCoords);
      if (all.length >= 2) {
        const b = new maplibregl.LngLatBounds();
        all.forEach((c) => b.extend(c));
        map.stop();
        map.fitBounds(b, { padding: 60, duration: 900 });
      } else if (isCoord(center)) {
        map.setCenter(toArrayLngLat(center));
      }
    });

    return () => {
      startMarkerRef.current?.remove();
      summitMarkerRef.current?.remove();
      originMarkerRef.current?.remove();
      startMarkerRef.current = null;
      summitMarkerRef.current = null;
      originMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle, KEY]);

  // UPDATE center if no lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasRoute = filterCoords(routeCoords).length >= 2;
    const hasDrive = filterCoords(driveCoords).length >= 2;
    const c = toArrayLngLat(center);
    if (!hasRoute && !hasDrive && c) {
      map.easeTo({ center: c, duration: 400 });
    }
  }, [center, routeCoords, driveCoords]);

  // UPDATE routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("route");
    if (!src) return;

    const coords = filterCoords(routeCoords);
    src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords } });

    const start = coords.length ? coords[0] : null;
    const summit = coords.length ? coords[coords.length - 1] : null;
    upsertMarker(startMarkerRef, map, start, "#2ab56f", startLabel || "Izhodišče");
    upsertMarker(summitMarkerRef, map, summit, "#ff8a00", summitLabel || "Vrh");
  }, [routeCoords, startLabel, summitLabel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("drive");
    if (!src) return;

    const dcoords = filterCoords(driveCoords);
    src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: dcoords } });
  }, [driveCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const dc = filterCoords(driveCoords);
    const originPoint = toArrayLngLat(originCoord) || (dc.length ? dc[0] : null);
    upsertMarker(originMarkerRef, map, originPoint, "#1e90ff", originLabel || "Start");
  }, [originCoord, originLabel, driveCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const all = collectAllCoords(routeCoords, driveCoords);
    if (all.length >= 2) {
      const b = new maplibregl.LngLatBounds();
      all.forEach((c) => b.extend(c));
      map.stop();
      map.fitBounds(b, { padding: 60, duration: 600 });
    }
  }, [routeCoords, driveCoords]);

  const badge = showProviderBadge ? (
    <div
      style={{
        position: "absolute",
        right: 8,
        bottom: 8,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "4px 8px",
        fontSize: 12,
        lineHeight: 1,
        color: HAS_KEY ? "#15803d" : "#4b5563",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        userSelect: "none",
        pointerEvents: "none",
      }}
      title={HAS_KEY ? "MapTiler ključ zaznan – 3D teren aktiven" : "Brez MapTiler ključa – demo slog"}
    >
      {HAS_KEY ? "MapTiler ON" : "MapTiler OFF"}
    </div>
  ) : null;

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      <div ref={mapEl} style={{ width: "100%", height: "100%" }} />
      {badge}
    </div>
  );
}
