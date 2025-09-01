import React from "react";
import { Link } from "react-router-dom";

function MountainList({ mountains, filters, setFilters }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const filteredMountains = mountains.filter((m) => {
    return (
      (filters.region === "" || m.region === filters.region) &&
      (filters.difficulty === "" || m.difficulty === filters.difficulty) &&
      (filters.season === "" || m.season.includes(filters.season)) &&
      (filters.minHeight === "" || m.height >= parseInt(filters.minHeight)) &&
      (filters.maxHeight === "" || m.height <= parseInt(filters.maxHeight)) &&
      (filters.minTime === "" || m.time >= parseInt(filters.minTime)) &&
      (filters.maxTime === "" || m.time <= parseInt(filters.maxTime)) &&
      (!filters.huts || m.huts.length > 0) &&
      (!filters.parkings || m.parkings.length > 0) &&
      (!filters.transport || m.transport.length > 0)
    );
  });

  return (
    <div>
      <h2>Filtri</h2>
      <select name="region" value={filters.region} onChange={handleChange}>
        <option value="">Gorovje (vse)</option>
        <option value="Julijske Alpe">Julijske Alpe</option>
        <option value="Kamniško-Savinjske Alpe">Kamniško-Savinjske Alpe</option>
        <option value="Osrednja Slovenija">Osrednja Slovenija</option>
      </select>

      <select
        name="difficulty"
        value={filters.difficulty}
        onChange={handleChange}
      >
        <option value="">Težavnost (vse)</option>
        <option value="lahka">Lahka</option>
        <option value="srednja">Srednja</option>
        <option value="težka">Težka</option>
      </select>

      <select name="season" value={filters.season} onChange={handleChange}>
        <option value="">Sezona (vse)</option>
        <option value="poletje">Poletje</option>
        <option value="zima">Zima</option>
        <option value="celo leto">Celo leto</option>
      </select>

      <input
        type="number"
        name="minHeight"
        placeholder="Min višina"
        value={filters.minHeight}
        onChange={handleChange}
      />
      <input
        type="number"
        name="maxHeight"
        placeholder="Max višina"
        value={filters.maxHeight}
        onChange={handleChange}
      />
      <input
        type="number"
        name="minTime"
        placeholder="Min čas (h)"
        value={filters.minTime}
        onChange={handleChange}
      />
      <input
        type="number"
        name="maxTime"
        placeholder="Max čas (h)"
        value={filters.maxTime}
        onChange={handleChange}
      />

      <label>
        <input
          type="checkbox"
          name="huts"
          checked={filters.huts}
          onChange={handleChange}
        />
        Koče na poti
      </label>
      <label>
        <input
          type="checkbox"
          name="parkings"
          checked={filters.parkings}
          onChange={handleChange}
        />
        Parkirišče
      </label>
      <label>
        <input
          type="checkbox"
          name="transport"
          checked={filters.transport}
          onChange={handleChange}
        />
        Javni prevoz
      </label>

      <h2>Seznam vrhov</h2>
      <ul>
        {filteredMountains.map((m) => (
          <li key={m.id}>
            <Link to={`/mountain/${m.id}`}>
              {m.name} ({m.region}) – Višina: {m.height} m, Težavnost:{" "}
              {m.difficulty}, Čas: {m.time}h
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MountainList;
