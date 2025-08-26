import React, { useState } from "react";

// Podatki – zdaj ima vsaka gora več poti
const mountains = [
  {
    name: "Triglav",
    height: 2864,
    difficulty: "Težka",
    time: "8-10h",
    season: "Poletje",
    range: "Julijske Alpe",
    routes: [
      {
        name: "Krma – Kredarica – Triglav",
        difficulty: "Srednja",
        time: "8h",
        parking: { name: "Parkirišče Krma", lat: 46.3857, lng: 13.9273 },
        huts: [
          { name: "Koča na Kredarici", reservation: "https://www.pzs.si/koce.php?pid=16" },
          { name: "Dom Planika", reservation: "https://www.pzs.si/koce.php?pid=17" }
        ]
      },
      {
        name: "Vrata – Prag – Triglav",
        difficulty: "Težka",
        time: "9h",
        parking: { name: "Parkirišče Vrata", lat: 46.4339, lng: 13.8481 },
        huts: [
          { name: "Aljažev dom v Vratih", reservation: "https://www.pzs.si/koce.php?pid=23" }
        ]
      }
    ]
  },
  {
    name: "Šmarna gora",
    height: 669,
    difficulty: "Lahka",
    time: "1h",
    season: "Celo leto",
    range: "Pohorje",
    routes: [
      {
        name: "Pot iz Tacna",
        difficulty: "Lahka",
        time: "1h",
        parking: { name: "Parkirišče Tacen", lat: 46.1121, lng: 14.4542 },
        huts: [
          { name: "Gostilna Ledinek", reservation: "https://www.ledinek.si" }
        ]
      }
    ]
  }
];

export default function App() {
  const [filters, setFilters] = useState({
    range: "",
    difficulty: "",
    season: "",
    huts: false,
    transport: false,
  });

  const [selectedMountain, setSelectedMountain] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetFilters = () => {
    setFilters({
      range: "",
      difficulty: "",
      season: "",
      huts: false,
      transport: false,
    });
    setSelectedMountain(null);
    setSelectedRoute(null);
  };

  const filteredMountains = mountains.filter((m) => {
    return (
      (!filters.range || m.range === filters.range) &&
      (!filters.difficulty || m.difficulty === filters.difficulty) &&
      (!filters.season || m.season === filters.season) &&
      (!filters.huts || m.routes.some(r => r.huts && r.huts.length > 0))
    );
  });

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Slovenski vrhovi</h1>

      {/* Filtri */}
      <div style={{ marginBottom: "20px" }}>
        <select name="range" value={filters.range} onChange={handleFilterChange}>
          <option value="">Izberi gorovje</option>
          <option value="Julijske Alpe">Julijske Alpe</option>
          <option value="Kamniško Savinjske Alpe">Kamniško Savinjske Alpe</option>
          <option value="Karavanke">Karavanke</option>
          <option value="Pohorje">Pohorje</option>
        </select>

        <select
          name="difficulty"
          value={filters.difficulty}
          onChange={handleFilterChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Težavnost</option>
          <option value="Lahka">Lahka</option>
          <option value="Srednja">Srednja</option>
          <option value="Težka">Težka</option>
        </select>

        <select
          name="season"
          value={filters.season}
          onChange={handleFilterChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Sezona</option>
          <option value="Celo leto">Celo leto</option>
          <option value="Poletje">Poletje</option>
          <option value="Zima">Zima</option>
        </select>

        <label style={{ marginLeft: "10px" }}>
          <input
            type="checkbox"
            name="huts"
            checked={filters.huts}
            onChange={handleFilterChange}
          />
          Koče na poti
        </label>

        <button onClick={resetFilters} style={{ marginLeft: "10px" }}>
          Reset
        </button>
      </div>

      {/* Seznam vrhov */}
      {!selectedMountain && filteredMountains.map((m) => (
        <div
          key={m.name}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 0",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setSelectedMountain(m)}
        >
          <h2>{m.name}</h2>
          <p>Višina: {m.height} m</p>
          <p>Težavnost: {m.difficulty}</p>
          <p>Čas hoje: {m.time}</p>
          <p>Sezona: {m.season}</p>
        </div>
      ))}

      {/* Seznam poti za izbrano goro */}
      {selectedMountain && !selectedRoute && (
        <div style={{ marginTop: "20px" }}>
          <h2>{selectedMountain.name}</h2>
          <p>Izberi pot:</p>
          <ul>
            {selectedMountain.routes.map((r, i) => (
              <li key={i} style={{ cursor: "pointer" }} onClick={() => setSelectedRoute(r)}>
                {r.name} ({r.difficulty}, {r.time})
              </li>
            ))}
          </ul>
          <button onClick={() => setSelectedMountain(null)}>Nazaj</button>
        </div>
      )}

      {/* Detajli poti */}
      {selectedRoute && (
        <div style={{ marginTop: "20px" }}>
          <h3>{selectedRoute.name}</h3>
          <p>Težavnost: {selectedRoute.difficulty}</p>
          <p>Čas hoje: {selectedRoute.time}</p>

          <h4>Parkirišče:</h4>
          <a
            href={`https://www.google.com/maps?q=${selectedRoute.parking.lat},${selectedRoute.parking.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            {selectedRoute.parking.name} 🚗
          </a>

          <h4>Koče:</h4>
          <ul>
            {selectedRoute.huts.map((h, i) => (
              <li key={i}>
                <a href={h.reservation} target="_blank" rel="noreferrer">
                  {h.name} 🔗
                </a>
              </li>
            ))}
          </ul>

          <button style={{ marginRight: "10px" }} onClick={() => setSelectedRoute(null)}>
            Nazaj na poti
          </button>
          <button onClick={() => { setSelectedRoute(null); setSelectedMountain(null); }}>
            Nazaj na vrhove
          </button>
        </div>
      )}
    </div>
  );
}
