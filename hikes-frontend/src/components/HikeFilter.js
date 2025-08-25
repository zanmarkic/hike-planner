import React, { useState } from "react";

const mountains = [
  {
    id: 1,
    name: "Karavanke",
    hikes: [
      {
        id: 1,
        name: "Stol",
        options: [
          { difficulty: "Lahka", time: 5, climbing: false, huts: true },
          { difficulty: "Težka", time: 6, climbing: true, huts: false }
        ]
      },
      {
        id: 2,
        name: "Košuta",
        options: [
          { difficulty: "Lahka", time: 4, climbing: false, huts: true }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Julijske Alpe",
    hikes: [
      {
        id: 3,
        name: "Triglav",
        options: [
          { difficulty: "Težka", time: 10, climbing: true, huts: true }
        ]
      }
    ]
  }
];

const HikeFilter = () => {
  const [selectedRange, setSelectedRange] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [climbing, setClimbing] = useState(null);
  const [huts, setHuts] = useState(null);

  const selectedMountains = mountains.find((m) => m.name === selectedRange);

  const filteredHikes =
    selectedMountains?.hikes.filter((hike) =>
      hike.options.some((opt) => {
        return (
          (difficulty ? opt.difficulty === difficulty : true) &&
          (climbing !== null ? opt.climbing === climbing : true) &&
          (huts !== null ? opt.huts === huts : true)
        );
      })
    ) || [];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Izberi gorovje in filtre</h2>

      {/* Dropdown za gorovja */}
      <select
        value={selectedRange}
        onChange={(e) => setSelectedRange(e.target.value)}
      >
        <option value="">-- Izberi gorovje --</option>
        {mountains.map((m) => (
          <option key={m.id} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>

      {/* Filtri */}
      <div style={{ marginTop: "15px" }}>
        <label>
          Težavnost:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Vse</option>
            <option value="Lahka">Lahka</option>
            <option value="Težka">Težka</option>
          </select>
        </label>

        <label style={{ marginLeft: "10px" }}>
          Plezanje:
          <select
            value={climbing === null ? "" : climbing}
            onChange={(e) =>
              setClimbing(e.target.value === "" ? null : e.target.value === "true")
            }
          >
            <option value="">Vse</option>
            <option value="true">Da</option>
            <option value="false">Ne</option>
          </select>
        </label>

        <label style={{ marginLeft: "10px" }}>
          Koče:
          <select
            value={huts === null ? "" : huts}
            onChange={(e) =>
              setHuts(e.target.value === "" ? null : e.target.value === "true")
            }
          >
            <option value="">Vse</option>
            <option value="true">Da</option>
            <option value="false">Ne</option>
          </select>
        </label>
      </div>

      {/* Seznam gora */}
      <div style={{ marginTop: "20px" }}>
        <h3>Rezultati:</h3>
        {filteredHikes.length > 0 ? (
          <ul>
            {filteredHikes.map((hike) => (
              <li key={hike.id}>{hike.name}</li>
            ))}
          </ul>
        ) : (
          <p>Ni rezultatov.</p>
        )}
      </div>
    </div>
  );
};

export default HikeFilter;
