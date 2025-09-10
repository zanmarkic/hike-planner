// src/pages/MountainDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import mountains from "../data/mountains";
import Map3D from "../components/Map3D";

// Varen MapTiler ključ (deluje v Vite in CRA)
const MAP_KEY =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_MAPTILER_KEY) ||
  (typeof process !== "undefined" && process?.env?.REACT_APP_MAPTILER_KEY) ||
  "";


export default function MountainDetail() {
  const { name } = useParams();
  const mountain = useMemo(
    () => mountains.find((m) => m.name === name),
    [name]
  );

  // mapping: ime poti -> pot do geojson (v public/)
  const routeFiles = useMemo(() => {
    if (!mountain) return {};
    // tu uredi imena po svojih datotekah
    // primer za Triglav:
    return {
      "Pot čez Kredarico (Krma)": "/routes/triglav-krma.geojson",
      "Pot čez Planiko": "/routes/triglav-planika.geojson",
      // dodaš več po potrebi
    };
  }, [mountain]);

  const [selectedRoute, setSelectedRoute] = useState("");
  const [routeCoords, setRouteCoords] = useState([]);

  // ko se zamenja pot ali gora, naloži GeoJSON
  useEffect(() => {
    setRouteCoords([]);

    // če ni izbrane poti, poskusno izberi prvo, ki je v mappingu
    if (!selectedRoute) {
      const first = Object.keys(routeFiles)[0];
      if (first) setSelectedRoute(first);
      return;
    }

    const url = routeFiles[selectedRoute];
    if (!url) return;

    fetch(url)
      .then((r) => r.json())
      .then((geo) => {
        const geom =
          geo.type === "FeatureCollection"
            ? geo.features?.[0]?.geometry
            : geo.geometry;

        const coords = Array.isArray(geom?.coordinates) ? geom.coordinates : [];
        // MapLibre pričakuje [lng, lat]; če imaš [lat,lng], zamenjaj:
        // const coords = raw.map(([lng, lat]) => [lat, lng]);  // samo če rabiš
        setRouteCoords(coords);
      })
      .catch((err) => {
        console.error("Napaka pri branju GeoJSON:", err);
        setRouteCoords([]);
      });
  }, [selectedRoute, routeFiles]);

  if (!mountain) return <p>Gora ni najdena.</p>;

  // center: začetna točka trase ali fallback
  const center = routeCoords.length ? routeCoords[0] : [14.5, 46.05];

  return (
    <div style={{ padding: 20 }}>
      <Link to="/">← Nazaj na seznam</Link>
      <h1>{mountain.name}</h1>
      <p><strong>Hribovje:</strong> {mountain.range}</p>
      <p><strong>Višina:</strong> {mountain.height} m</p>
      <p><strong>Težavnost (splošna):</strong> {mountain.difficulty}</p>
      <p><strong>Čas hoje (splošno):</strong> {mountain.time}</p>

      <h2>Poti</h2>
      {mountain.routes?.map((r, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <h3>{r.name}</h3>
          <p>
            <strong>Izhodišče:</strong> {r.start.label} (GPS: {r.start.lat}, {r.start.lng})
          </p>
          <p>
            <strong>Čas:</strong> {r.time} · <strong>Višinska razlika:</strong> {r.elevation} m
          </p>
          <p><strong>Koče:</strong> {r.huts.join(", ")}</p>
        </div>
      ))}

      <div style={{ margin: "20px 0" }}>
        <label>
          <strong>Izberi prikaz poti (3D): </strong>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {Object.keys(routeFiles).length === 0 && (
              <option value="">(ni pripravljenih tras)</option>
            )}
            {Object.keys(routeFiles).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2>3D zemljevid poti</h2>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <Map3D
          apiKey={"MlYisTqyVIMLyyNin19J"}  // <- zamenjaj s svojim ključem
          center={center}
          routeCoords={routeCoords}
          height="420px"
        />
      </div>

      <button
        onClick={() =>
          window.open(`/organize?m=${encodeURIComponent(mountain.name)}`, "_blank")
        }
        style={{ marginTop: 20 }}
      >
        Organiziraj turo
      </button>
    </div>
  );
}
