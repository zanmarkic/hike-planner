// src/components/Map3D.js
import React, { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ---------- helpers ---------- */
function emptyFC() {
  return { type: "FeatureCollection", features: [] };
}
function tilesUrl(styleId, apiKey) {
  return `https://api.maptiler.com/maps/${styleId}/256/{z}/{x}/{y}.png?key=${apiKey}`;
}
// terrain DEM tiles (MapTiler terrain-rgb)
function terrainTilesUrl(apiKey) {
  return `https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=${apiKey}`;
}

// Barvni marker z emoji + labelom
function makePinEl({ bg = "#111", fg = "#fff", emoji = "", text = "" }) {
  if (!document.getElementById("pin-badge-style")) {
    const css = document.createElement("style");
    css.id = "pin-badge-style";
    css.textContent = `
      .pin-badge{display:inline-flex;align-items:center;gap:6px;
        padding:6px 10px;border-radius:14px;font:600 12px/1 system-ui,Segoe UI,Roboto,Arial;
        box-shadow:0 1px 4px rgba(0,0,0,.25);transform:translateY(-2px);background:#111;color:#fff}
      .pin-emoji{font-size:14px;line-height:1}
    `;
    document.head.appendChild(css);
  }
  const el = document.createElement("div");
  el.className = "pin-badge";
  el.style.background = bg;
  el.style.color = fg;
  el.innerHTML = `${emoji ? `<span class="pin-emoji">${emoji}</span>` : ""}<span>${text}</span>`;
  return el;
}

/**
 * Props:
 * - apiKey, center, height, mapStyle
 * - is3D (boolean) – preklop 2D/3D
 * - routeCoords  : [[lng,lat], ...]   // modra
 * - driveCoords  : [[lng,lat], ...]   // vijolična
 * - originCoord  : {lat,lng} | null
 * - startLabel, originLabel, summitLabel
 * - parkingPoints: [{lat,lng,name,fee,capacity,surface}]
 */
export default function Map3D({
  apiKey,
  center = [14.5, 46.05],
  height = "420px",
  mapStyle = "outdoor",
  is3D = true,
  routeCoords = [],
  driveCoords = [],
  originCoord = null,
  startLabel = "Izhodišče",
  originLabel = "Start",
  summitLabel = "Konec",
  parkingPoints = [],
}) {
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);

  const initialTiles = useMemo(() => tilesUrl(mapStyle, apiKey), [apiKey, mapStyle]);
  const terrainTiles = useMemo(() => terrainTilesUrl(apiKey), [apiKey]);

  // Stalen “minimalni” style z našimi sloji
  const baseStyle = useMemo(
    () => ({
      version: 8,
      sources: {
        basemap: {
          type: "raster",
          tiles: [initialTiles],
          tileSize: 256,
          attribution: "© MapTiler © OpenStreetMap contributors",
        },
        "route-line": { type: "geojson", data: emptyFC() },
        "drive-line": { type: "geojson", data: emptyFC() },
      },
      layers: [
        { id: "basemap", type: "raster", source: "basemap" },

        // Peš pot (MODRA) – casing + linija
        {
          id: "route-line-casing",
          type: "line",
          source: "route-line",
          paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.95 },
        },
        {
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          paint: { "line-color": "#1e90ff", "line-width": 5.5, "line-opacity": 1 },
        },

        // Avto (VIJOLIČNA) – casing + linija
        {
          id: "drive-line-casing",
          type: "line",
          source: "drive-line",
          paint: { "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.98 },
        },
        {
          id: "drive-line-layer",
          type: "line",
          source: "drive-line",
          paint: { "line-color": "#7c3aed", "line-width": 6.5, "line-opacity": 1 },
        },
      ],
    }),
    [initialTiles]
  );

  const markersRef = useRef({ start: null, end: null, origin: null, parking: [] });

  const clearMarkers = (which = "all") => {
    const m = markersRef.current;
    const rm = (x) => x && x.remove();
    if (which === "all" || which === "main") {
      rm(m.start); rm(m.end); rm(m.origin);
      m.start = m.end = m.origin = null;
    }
    if (which === "all" || which === "parking") {
      m.parking.forEach(rm);
      m.parking = [];
    }
  };

  const setLineData = () => {
    const map = mapRef.current;
    if (!map) return;
    const route = map.getSource("route-line");
    const drive = map.getSource("drive-line");

    if (route) {
      route.setData(
        routeCoords?.length
          ? {
              type: "FeatureCollection",
              features: [
                { type: "Feature", geometry: { type: "LineString", coordinates: routeCoords }, properties: {} },
              ],
            }
          : emptyFC()
      );
    }
    if (drive) {
      drive.setData(
        driveCoords?.length
          ? {
              type: "FeatureCollection",
              features: [
                { type: "Feature", geometry: { type: "LineString", coordinates: driveCoords }, properties: {} },
              ],
            }
          : emptyFC()
      );
    }
  };

  const fitToRoute = () => {
    const map = mapRef.current;
    if (!map) return;
    if (routeCoords?.length) {
      const lngs = routeCoords.map((c) => c[0]);
      const lats = routeCoords.map((c) => c[1]);
      const b = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      try { map.fitBounds(b, { padding: 56, duration: 600 }); } catch {}
    } else {
      try { map.easeTo({ center, zoom: 9, duration: 400 }); } catch {}
    }
  };

  const placeMainMarkers = () => {
    const map = mapRef.current;
    if (!map) return;
    clearMarkers("main");

    if (routeCoords?.length) {
      const startLL = { lng: routeCoords[0][0], lat: routeCoords[0][1] };
      const endLL   = { lng: routeCoords.at(-1)[0], lat: routeCoords.at(-1)[1] };

      const trailheadEl = makePinEl({ bg: "#ef4444", emoji: "🚩", text: startLabel || "Izhodišče" });
      markersRef.current.start = new maplibregl.Marker({ element: trailheadEl }).setLngLat(startLL).addTo(map);

      const summitEl = makePinEl({ bg: "#22c55e", emoji: "⛰️", text: summitLabel || "Vrh" });
      markersRef.current.end = new maplibregl.Marker({ element: summitEl }).setLngLat(endLL).addTo(map);
    }

    if (originCoord?.lat && originCoord?.lng) {
      const originEl = makePinEl({ bg: "#a855f7", emoji: "🏠", text: originLabel || "Start" });
      markersRef.current.origin = new maplibregl.Marker({ element: originEl })
        .setLngLat({ lng: originCoord.lng, lat: originCoord.lat })
        .addTo(map);
    }
  };

  const placeParkingMarkers = () => {
    const map = mapRef.current;
    if (!map) return;
    clearMarkers("parking");
    if (!Array.isArray(parkingPoints) || parkingPoints.length === 0) return;

    let css = document.getElementById("p-badge-style");
    if (!css) {
      css = document.createElement("style");
      css.id = "p-badge-style";
      css.textContent = `.p-badge{width:26px;height:26px;border-radius:50%;
        background:#fff;border:2px solid #2b6cb0;color:#2b6cb0;
        display:flex;align-items:center;justify-content:center;
        font:700 14px/26px system-ui,Segoe UI,Roboto,Arial;
        box-shadow:0 1px 4px rgba(0,0,0,.25);}`;
      document.head.appendChild(css);
    }

    markersRef.current.parking = parkingPoints
      .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
      .map((p) => {
        const el = document.createElement("div");
        el.className = "p-badge";
        el.textContent = "P";
        return new maplibregl.Marker({ element: el })
          .setLngLat({ lng: p.lng, lat: p.lat })
          .setPopup(
            new maplibregl.Popup({ offset: 12 }).setHTML(`
              <div style="min-width:180px">
                <strong>${p.name || "Parkirišče"}</strong><br/>
                <small>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</small><br/>
                ${p.capacity ? `🅿️ ${p.capacity}<br/>` : ""}
                ${p.fee ? `💶 ${p.fee}<br/>` : ""}
                ${p.surface ? `🧱 ${p.surface}<br/>` : ""}
                <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving" target="_blank" rel="noreferrer">
                  Navigiraj do parkirišča 🚗
                </a>
              </div>
            `)
          )
          .addTo(map);
      });
  };

  /* ---------- init ---------- */
  useEffect(() => {
    if (!mapDivRef.current) return;

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style: baseStyle,
      center,
      zoom: 9,
      pitch: is3D ? 58 : 0,
      bearing: is3D ? 0 : 0,
      antialias: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // --- terrain (DEM) + sky ---
      if (!map.getSource("terrain-dem")) {
        map.addSource("terrain-dem", {
          type: "raster-dem",
          tiles: [terrainTiles],
          tileSize: 256,
          encoding: "mapbox",
        });
      }
      if (!map.getLayer("sky")) {
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun-intensity": 12,
          },
        });
      }
      if (is3D) {
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.35 });
      }

      setLineData();
      placeMainMarkers();
      placeParkingMarkers();
      fitToRoute();
    });

    mapRef.current = map;

    return () => {
      try { clearMarkers("all"); } catch {}
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // enkrat ob mountu

  /* ---------- menjava podlage brez setStyle ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const swapTiles = () => {
      try {
        if (map.getLayer("basemap")) map.removeLayer("basemap");
        if (map.getSource("basemap")) map.removeSource("basemap");
      } catch {}
      map.addSource("basemap", {
        type: "raster",
        tiles: [tilesUrl(mapStyle, apiKey)],
        tileSize: 256,
        attribution: "© MapTiler © OpenStreetMap contributors",
      });
      map.addLayer({ id: "basemap", type: "raster", source: "basemap" }, "route-line-casing");
    };

    if (map.isStyleLoaded && map.isStyleLoaded()) {
      swapTiles();
    } else {
      map.once("load", swapTiles);
    }
  }, [mapStyle, apiKey]);

  /* ---------- posodobitve geometrij/markerjev ---------- */
  useEffect(() => { setLineData(); fitToRoute(); }, [routeCoords]);
  useEffect(() => { setLineData(); }, [driveCoords]);
  useEffect(() => { placeMainMarkers(); }, [routeCoords, originCoord, startLabel, originLabel, summitLabel]);
  useEffect(() => { placeParkingMarkers(); }, [parkingPoints]);

  /* ---------- 2D/3D preklop (pitch + terrain) ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (is3D) {
        if (!map.getSource("terrain-dem")) {
          map.addSource("terrain-dem", {
            type: "raster-dem",
            tiles: [terrainTiles],
            tileSize: 256,
            encoding: "mapbox",
          });
        }
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.35 });
      } else {
        map.setTerrain(null);  // izklopi relief v 2D
        map.setBearing(0);
      }

      map.easeTo({
        pitch: is3D ? 58 : 0,
        duration: 400,
      });
    } catch {}
  }, [is3D, terrainTiles]);

  return <div ref={mapDivRef} style={{ width: "100%", height }} />;
}
