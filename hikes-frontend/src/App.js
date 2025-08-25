import React, { useState } from "react";
import trails from "./trails";

function App() {
  const [filters, setFilters] = useState({
    mountainRange: "",
    difficulty: "",
    climbing: "",
    huts: "",
    minHeight: "",
    maxHeight: "",
    maxTime: "",
    season: "",
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const resetFilters = () => {
    setFilters({
      mountainRange: "",
      difficulty: "",
      climbing: "",
      huts: "",
      minHeight: "",
      maxHeight: "",
      maxTime: "",
      season: "",
    });
  };

  const filteredTrails = trails.filter((trail) => {
    return (
      (!filters.mountainRange || trail.mountainRange === filters.mountainRange) &&
      (!filters.difficulty || trail.difficulty === filters.difficulty) &&
      (!filters.climbing ||
        (filters.climbing === "da" && trail.climbing) ||
        (filters.climbing === "ne" && !trail.climbing)) &&
      (!filters.huts ||
        (filters.huts === "da" && trail.huts.length > 0) ||
        (filters.huts === "ne" && trail.huts.length === 0)) &&
      (!filters.minHeight || trail.height >= parseInt(filters.minHeight)) &&
      (!filters.maxHeight || trail.height <= parseInt(filters.maxHeight)) &&
      (!filters.maxTime || trail.timeHours <= parseInt(filters.maxTime)) &&
      (!filters.season || trail.season.includes(filters.season))
    );
  });

  const anyFilterApplied = Object.values(filters).some((v) => v !== "");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Iskanje poti v slovenskih gorah</h1>

      {/* Filtri */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          Gorovje:
          <select
            name="mountainRange"
            value={filters.mountainRange}
            onChange={handleFilterChange}
          >
            <option value="">-- izberi --</option>
            <option value="Julijske Alpe">Julijske Alpe</option>
            <option value="Karavanke">Karavanke</option>
            <option value="Kamniško Savinjske Alpe">Kamniško Savinjske Alpe</option>
            <option value="Pohorje">Pohorje</option>
          </select>
        </label>

        <label style={{ marginLeft: "15px" }}>
          Težavnost:
          <select
            name="difficulty"
            value={filters.difficulty}
            onChange={handleFilterChange}
          >
            <option value="">-- izberi --</option>
            <option value="lahka">Lahka</option>
            <option value="srednja">Srednja</option>
            <option value="težka">Težka</option>
          </select>
        </label>

        <label style={{ marginLeft: "15px" }}>
          Plezanje:
          <select
            name="climbing"
            value={filters.climbing}
            onChange={handleFilterChange}
          >
            <option value="">-- izberi --</option>
            <option value="da">Da</option>
            <option value="ne">Ne</option>
          </select>
        </label>

        <label style={{ marginLeft: "15px" }}>
          Koče na poti:
          <select
            name="huts"
            value={filters.huts}
            onChange={handleFilterChange}
          >
            <option value="">-- izberi --</option>
            <option value="da">Da</option>
            <option value="ne">Ne</option>
          </select>
        </label>

        <label style={{ marginLeft: "15px" }}>
          Min višina (m):
          <input
            type="number"
            name="minHeight"
            value={filters.minHeight}
            onChange={handleFilterChange}
            style={{ width: "80px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Max višina (m):
          <input
            type="number"
            name="maxHeight"
            value={filters.maxHeight}
            onChange={handleFilterChange}
            style={{ width: "80px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Max čas hoje (h):
          <input
            type="number"
            name="maxTime"
            value={filters.maxTime}
            onChange={handleFilterChange}
            style={{ width: "60px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Sezona:
          <select
            name="season"
            value={filters.season}
            onChange={handleFilterChange}
          >
            <option value="">-- izberi --</option>
            <option value="poletje">Poletje</option>
            <option value="zima">Zima</option>
            <option value="celo leto">Celo leto</option>
          </select>
        </label>

        <button
          onClick={resetFilters}
          style={{
            marginLeft: "20px",
            padding: "5px 10px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {/* Rezultati */}
      {anyFilterApplied && (
        <div>
          <h2>Rezultati</h2>
          {filteredTrails.length > 0 ? (
            <ul>
              {filteredTrails.map((trail, index) => (
                <li key={index} style={{ marginBottom: "20px" }}>
                  <strong>{trail.name}</strong> ({trail.mountainRange}) – Višina:{" "}
                  {trail.height} m, Težavnost: {trail.difficulty}, Čas: {trail.time}
                  <br />
                  {trail.huts.length > 0 && (
                    <span>
                      Koče:
                      <ul>
                        {trail.huts.map((hut, i) => (
                          <li key={i}>
                            <a href={hut.link} target="_blank" rel="noreferrer">
                              {hut.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </span>
                  )}
                  <em>Sezona: {trail.season.join(", ")}</em>

                  {/* IZHAJALIŠČA IN PREVOZI */}
                  {trail.startingPoints && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Izhodišča:</strong>
                      <ul>
                        {trail.startingPoints.map((sp, idx) => (
                          <li key={idx}>
                            <u>{sp.name}</u>
                            <ul>
                              {sp.transport.car && (
                                <li>
                                  🚗 Avto – Parkirišče: {sp.transport.car.parking.name},{" "}
                                  Cena: {sp.transport.car.parking.price},{" "}
                                  Čas iz LJ: {sp.transport.car.timeFromLjubljana},{" "}
                                  Strošek: {sp.transport.car.costFromLjubljana}
                                </li>
                              )}
                              {sp.transport.bus && (
                                <li>
                                  🚌 Bus – Najbližja postaja: {sp.transport.bus.nearestStop},{" "}
                                  Čas do izhodišča: {sp.transport.bus.timeToStart},{" "}
                                  Cena: {sp.transport.bus.price}
                                </li>
                              )}
                              {sp.transport.train && (
                                <li>
                                  🚆 Vlak – Najbližja postaja:{" "}
                                  {sp.transport.train.nearestStation},{" "}
                                  Povezava: {sp.transport.train.transfer},{" "}
                                  Cena: {sp.transport.train.price}
                                </li>
                              )}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Ni rezultatov za izbrane filtre.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
