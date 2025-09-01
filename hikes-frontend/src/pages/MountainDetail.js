// src/pages/MountainDetail.js
import React from "react";
import { useParams, Link } from "react-router-dom";
import mountains from "../data/mountains";

export default function MountainDetail() {
  const { name } = useParams();
  const mountain = mountains.find((m) => m.name === name);

  if (!mountain) return <p>Gora ni najdena.</p>;

  return (
    <div style={{ padding: 20 }}>
      <Link to="/">← Nazaj na seznam</Link>
      <h1>{mountain.name}</h1>
      <p><strong>Hribovje:</strong> {mountain.range}</p>
      <p><strong>Višina:</strong> {mountain.height} m</p>
      <p><strong>Težavnost:</strong> {mountain.difficulty}</p>
      <p><strong>Čas hoje:</strong> {mountain.time}</p>
      <p><strong>Koče na poti:</strong> {mountain.huts ? "Da" : "Ne"}</p>

      <h2>Poti</h2>
      {mountain.routes.map((r, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <h3>{r.name}</h3>
          <p><strong>Izhodišče:</strong> {r.start.label} (GPS: {r.start.lat}, {r.start.lng})</p>
          <p><strong>Čas:</strong> {r.time}</p>
          <p><strong>Višinska razlika:</strong> {r.elevation} m</p>
          <p><strong>Koče:</strong> {r.huts.join(", ")}</p>

          <div style={{
            border: "1px solid #bbb", height: 200, background: "#eee",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            3D Zemljevid poti (placeholder)
          </div>
        </div>
      ))}

      {/* Klasičen način: samo ime gore */}
      <button
        onClick={() => window.open(`/organize?m=${encodeURIComponent(mountain.name)}`, "_blank")}
        style={{ marginTop: 20 }}
      >
        Organiziraj turo
      </button>
    </div>
  );
}
