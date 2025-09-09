// src/components/Map3D.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Props:
 * - center: [lng, lat]  (npr. [13.933, 46.383]) – za prvi pogled
 * - routeCoords: [[lng, lat], ...] – koordinatna linija poti
 * - apiKey: string – MapTiler API ključ (brezplačen)
 * - height: CSS višina (npr. "300px")
 */
export default function Map3D({ center, routeCoords, apiKey, height = "300px" }) {
  const mapRef = useRef(null);
  const mapEl = useRef(null);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    // Osnovni slog (outdoor) – MapTiler
    const styleUrl = `https://api.maptiler.com/maps/outdoor/style.json?key=${apiKey}`;

    const map = new maplibregl.Map({
      container: mapEl.current,
      style: styleUrl,
      center: center,
      zoom: 12,
      pitch: 60,       // nagnjen pogled (3D)
      bearing: -10,
      antialias: true,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // 1) Dodamo DEM vir (teren) za 3D
      map.addSource("terrain-dem", {
        type: "raster-dem",
        tiles: [
          `https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=${apiKey}`,
        ],
        tileSize: 256,
        maxzoom: 14,
        encoding: "mapbox",
      });
      map.setTerrain({ source: "terrain-dem", exaggeration: 1.3 });

      // 2) Nebo (lepši 3D učinek)
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun-intensity": 15,
        },
      });

      // 3) Pot kot GeoJSON linija
      if (routeCoords && routeCoords.length >= 2) {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCoords, // [[lng,lat], ...]
            },
          },
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#ff5500",
            "line-width": 4,
          },
        });

        // prilagodimo pogled, da se vidi vsa pot
        const bounds = new maplibregl.LngLatBounds();
        routeCoords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 60, duration: 1200, pitch: 60, bearing: -10 });
      }

      // 4) Marker izhodišča
      if (routeCoords && routeCoords.length) {
        new maplibregl.Marker({ color: "#2b6" })
          .setLngLat(routeCoords[0])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, routeCoords, apiKey]);

  return <div ref={mapEl} style={{ width: "100%", height }} />;
}
