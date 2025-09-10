// src/components/Map3D.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Props:
 * - center: [lng, lat]
 * - routeCoords: [[lng, lat], ...]
 * - apiKey: string (MapTiler ključ) – neobvezno; če manjka, prikažemo stil brez terena
 * - height: CSS višina (npr. "300px")
 */
export default function Map3D({ center, routeCoords, apiKey, height = "300px" }) {
  const mapRef = useRef(null);
  const mapEl = useRef(null);

  // Varen KEY (dela v Vite in CRA); props > .env > prazno
  const KEY =
    apiKey ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_MAPTILER_KEY) ||
    (typeof process !== "undefined" && process?.env?.REACT_APP_MAPTILER_KEY) ||
    "";

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const hasKey = !!KEY;

    // Če ni ključa, uporabimo demo stil brez terena
    const styleUrl = hasKey
      ? `https://api.maptiler.com/maps/outdoor/style.json?key=${KEY}`
      : "https://demotiles.maplibre.org/style.json";

    const map = new maplibregl.Map({
      container: mapEl.current,
      style: styleUrl,
      center: center || [14.5, 46.05],
      zoom: 12,
      pitch: 60,
      bearing: -10,
      antialias: true,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // 1) 3D teren samo, če imamo KEY
      if (hasKey) {
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

        // nebo je nice-to-have tudi brez terena
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun-intensity": 15,
          },
        });
      }

      // 2) Vir in plast poti
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: Array.isArray(routeCoords) ? routeCoords : [],
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
          "line-opacity": 0.95,
        },
      });

      // 3) Marker izhodišča (če je)
      if (Array.isArray(routeCoords) && routeCoords.length) {
        new maplibregl.Marker({ color: "#2b6" })
          .setLngLat(routeCoords[0])
          .addTo(map);
      }

      // 4) Fit na pot, če obstaja
      if (Array.isArray(routeCoords) && routeCoords.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        routeCoords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 60, duration: 1000 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // KEY in center sta del inicializacije
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEY]);

  // Posodabljaj center in geometrijo, ko se props spremenijo po začetnem loadu
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (center && Array.isArray(center) && center.length === 2) {
      // Ne “poskakuj” pogleda, če že prikazujemo pot in smo jo fitBounds-ali.
      // V praksi center posodobi le, ko še ni sledi.
      if (!(Array.isArray(routeCoords) && routeCoords.length >= 2)) {
        map.easeTo({ center, duration: 400 });
      }
    }
  }, [center, routeCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource("route");
    if (!src) return;

    const coords = Array.isArray(routeCoords) ? routeCoords : [];
    src.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
    });

    // če pride nova sled, jo fit-amo v pogled
    if (coords.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 60, duration: 600 });
    }
  }, [routeCoords]);

  return <div ref={mapEl} style={{ width: "100%", height }} />;
}
