import React from "react";

export default function Filters({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      range: "",
      difficulty: "",
      time: "",
      huts: "",
    });
  };

  return (
    <div>
      <h2>Filtri</h2>

      {/* Vrsta hribovja */}
      <label>
        Hribovje:
        <select name="range" value={filters.range} onChange={handleChange}>
          <option value="">-- Izberi --</option>
          <option value="Julijske Alpe">Julijske Alpe</option>
          <option value="Karavanke">Karavanke</option>
          <option value="Kamniško-Savinjske Alpe">Kamniško-Savinjske Alpe</option>
        </select>
      </label>

      {/* Težavnost */}
      <label>
        Težavnost:
        <select
          name="difficulty"
          value={filters.difficulty}
          onChange={handleChange}
        >
          <option value="">-- Izberi --</option>
          <option value="lahka">Lahka</option>
          <option value="srednja">Srednja</option>
          <option value="težka">Težka</option>
        </select>
      </label>

      {/* Čas hoje */}
      <label>
        Čas hoje:
        <select name="time" value={filters.time} onChange={handleChange}>
          <option value="">-- Izberi --</option>
          <option value="0-4h">0-4h</option>
          <option value="4-6h">4-6h</option>
          <option value="6-8h">6-8h</option>
          <option value="8h+">8h+</option>
        </select>
      </label>

      {/* Koče */}
      <label>
        Koče na poti:
        <select name="huts" value={filters.huts} onChange={handleChange}>
          <option value="">-- Izberi --</option>
          <option value="da">Da</option>
          <option value="ne">Ne</option>
        </select>
      </label>

      <button onClick={resetFilters}>Resetiraj filtre</button>
    </div>
  );
}
