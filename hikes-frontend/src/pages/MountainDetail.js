import React from "react";
import { useParams, Link } from "react-router-dom";
import mountains from "../data/mountains";
import Map3D from "../components/Map3D";

export default function MountainDetail() {
  const { name } = useParams();
  const mountain = mountains.find((m) => m.name === name);

  if (!mountain) return <p>Gora ni najdena.</p>;

  // 1) znane koordinate vrhov (približno)
  const summits = {
    Triglav: [13.8369, 46.3783],
    Grintovec: [14.5403, 46.3561],
    Stol: [14.1740, 46.4360],
  };

  // 2) za demo: trasa = [izhodišče, vrh]
  //    (kasneje: zamenjaj s pravim GeoJSON/GPX)
  const firstRoute = mountain.routes?.[0];
  const start = firstRoute?.start;
  const summit = summits[mountain.name];
  const routeCoords =
    start && summit ? [[start.lng, start.lat], summit] : null;

  return (
    <div style={{ padding: 20 }}>
      <Link to="/">← Nazaj na seznam</Link>
      <h1>{mountain.name}</h1>
      <p><strong>Hribovje:</strong> {mountain.range}</p>
      <p><strong>Višina:</strong> {mountain.height} m</p>

      <h2>Poti</h2>
      {mountain.routes.map((r, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <h3>{r.name}</h3>
          <p><strong>Izhodišče:</strong> {r.start.label} (GPS: {r.start.lat}, {r.start.lng})</p>
          <p><strong>Čas:</strong> {r.time} · <strong>Višinska razlika:</strong> {r.elevation} m</p>
          <p><strong>Koče:</strong> {r.huts.join(", ")}</p>
        </div>
      ))}

      <h2>3D Zemljevid poti</h2>
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #ddd" }}>
        <Map3D
          apiKey={"MlYisTqyVIMLyyNin19J"}          // <-- zamenjaj!
          center={routeCoords ? routeCoords[0] : [14.5, 46.05]} // fallback: SLO center
          routeCoords={routeCoords || []}
          height="380px"
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
