import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { mountains } from "../data/mountains"; // sem bomo dali podatke o gorah

export default function OrganizeTour() {
  const { name } = useParams(); // ime gore iz URL
  const mountain = mountains.find((m) => m.name === name);

  const [people, setPeople] = useState(1);
  const [date, setDate] = useState("");
  const [sleep, setSleep] = useState("ne");
  const [hut, setHut] = useState("");
  const [transport, setTransport] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!mountain) {
    return <p>Gora ni najdena.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Organiziraj turo na {mountain.name}</h1>

      <label>
        Število ljudi:
        <input
          type="number"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          min="1"
        />
      </label>
      <br />

      <label>
        Datum:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <br />

      <label>
        Ali želite spati?
        <select value={sleep} onChange={(e) => setSleep(e.target.value)}>
          <option value="ne">NE</option>
          <option value="da">DA</option>
        </select>
      </label>
      <br />

      {/* Če želi spati, pokažemo koče */}
      {sleep === "da" && mountain.routes && (
        <>
          <label>
            Izberi kočo:
            <select value={hut} onChange={(e) => setHut(e.target.value)}>
              <option value="">-- izberi --</option>
              {mountain.routes.flatMap((r) =>
                r.huts.map((h, idx) => (
                  <option key={idx} value={h}>
                    {h}
                  </option>
                ))
              )}
            </select>
          </label>
          <br />

          {/* Ko uporabnik izbere kočo → predlagamo poti */}
          {hut && (
            <div>
              <h3>Priporočene poti za kočo "{hut}":</h3>
              <ul>
                {mountain.routes
                  .filter((r) => r.huts.includes(hut))
                  .map((r, idx) => (
                    <li key={idx}>
                      {r.name} – {r.difficulty}, {r.time}, višinska razlika{" "}
                      {r.elevationGain} m
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      <label>
        Prevoz:
        <select
          value={transport}
          onChange={(e) => setTransport(e.target.value)}
        >
          <option value="">-- izberi --</option>
          <option value="avto">Avto (odpre GPS)</option>
          <option value="bus">Javni prevoz</option>
        </select>
      </label>
      <br />

      <button onClick={() => setConfirmed(true)} style={{ marginTop: "20px" }}>
        Preveri podatke
      </button>

      {confirmed && (
        <div style={{ marginTop: "20px" }}>
          <h2>Povzetek rezervacije</h2>
          <p>Gora: {mountain.name}</p>
          <p>Število ljudi: {people}</p>
          <p>Datum: {date}</p>
          <p>S pičanjem: {sleep === "da" ? `DA (${hut})` : "NE"}</p>
          <p>Prevoz: {transport}</p>

          <button style={{ marginTop: "10px" }}>Plačaj</button>
        </div>
      )}
    </div>
  );
}
