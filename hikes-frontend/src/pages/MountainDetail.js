import React from "react";
import { useParams, Link } from "react-router-dom";

const mountains = [
  {
    name: "Triglav",
    range: "Julijske Alpe",
    height: 2864,
    difficulty: "težka",
    time: "8h+",
    huts: true,
    routes: [
      {
        name: "Pot čez Kredarico",
        start: "Krma (GPS: 46.383, 13.933)",
        time: "6-7h",
        elevation: "1800m",
        huts: ["Dom v Krmi", "Kredarica"],
      },
      {
        name: "Pot čez Planiko",
        start: "Vrata (GPS: 46.423, 13.848)",
        time: "7-8h",
        elevation: "1900m",
        huts: ["Aljažev dom", "Dom Planika"],
      },
    ],
  },
  {
    name: "Grintovec",
    range: "Kamniško-Savinjske Alpe",
    height: 2558,
    difficulty: "srednja",
    time: "6-8h",
    huts: true,
    routes: [
      {
        name: "Čez Kokrsko sedlo",
        start: "Kamniška Bistrica (GPS: 46.333, 14.600)",
        time: "5-6h",
        elevation: "1600m",
        huts: ["Cojzova koča na Kokrskem sedlu"],
      },
    ],
  },
  {
    name: "Stol",
    range: "Karavanke",
    height: 2236,
    difficulty: "lahka",
    time: "4-6h",
    huts: false,
    routes: [
      {
        name: "Pot iz Završnice",
        start: "Valvasorjev dom (GPS: 46.433, 14.183)",
        time: "3-4h",
        elevation: "1200m",
        huts: ["Valvasorjev dom"],
      },
    ],
  },
];

export default function MountainDetail() {
  const { name } = useParams();
  const mountain = mountains.find((m) => m.name === name);

  if (!mountain) {
    return <p>Gora ni najdena.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/">← Nazaj na seznam</Link>
      <h1>{mountain.name}</h1>
      <p><strong>Hribovje:</strong> {mountain.range}</p>
      <p><strong>Višina:</strong> {mountain.height} m</p>
      <p><strong>Težavnost:</strong> {mountain.difficulty}</p>
      <p><strong>Čas hoje:</strong> {mountain.time}</p>
      <p><strong>Koče na poti:</strong> {mountain.huts ? "Da" : "Ne"}</p>

      <h2>Poti</h2>
      {mountain.routes.map((route, index) => (
        <div key={index} style={{ marginBottom: "15px" }}>
          <h3>{route.name}</h3>
          <p><strong>Izhodišče:</strong> {route.start}</p>
          <p><strong>Čas:</strong> {route.time}</p>
          <p><strong>Višinska razlika:</strong> {route.elevation}</p>
          <p><strong>Koče:</strong> {route.huts.join(", ")}</p>
          <div style={{ border: "1px solid gray", height: "200px", background: "#eee", textAlign: "center", lineHeight: "200px" }}>
            3D Zemljevid poti (placeholder)
          </div>
        </div>
      ))}

      <button
        onClick={() => window.open("/organize", "_blank")}
        style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
      >
        Organiziraj turo
      </button>
    </div>
  );
}
