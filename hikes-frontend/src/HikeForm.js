import React, { useState } from "react";

function HikeForm({ onAdd }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [difficulty, setDifficulty] = useState("Lahko");

  const handleSubmit = (e) => {
    e.preventDefault();

    const newHike = { name, location, difficulty };

    fetch("/api/hikes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newHike),
    })
      .then((res) => res.json())
      .then((data) => {
        onAdd(data); // dodamo novo pot v seznam
        setName("");
        setLocation("");
        setDifficulty("Lahko");
      })
      .catch((err) => console.error("Napaka pri dodajanju poti:", err));
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <div>
        <label>Ime poti: </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Lokacija: </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Težavnost: </label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="Lahko">Lahko</option>
          <option value="Srednje">Srednje</option>
          <option value="Težko">Težko</option>
        </select>
      </div>
      <button type="submit">Dodaj pot</button>
    </form>
  );
}

export default HikeForm;