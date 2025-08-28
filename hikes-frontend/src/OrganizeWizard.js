import React, { useState } from "react";

function OrganizeWizard({ mountain, onClose }) {
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(1);

  if (!mountain) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      `Tura za ${mountain.name} (${mountain.height} m)\n` +
      `Datum: ${date}\n` +
      `Število udeležencev: ${participants}`
    );
    onClose(); // zapre modal
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "350px",
        }}
      >
        <h2>Organizacija ture za {mountain.name}</h2>
        <p>Višina: {mountain.height} m</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>
              Datum:{" "}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Število udeležencev:{" "}
              <input
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                required
              />
            </label>
          </div>

          <button type="submit">Potrdi</button>
          <button type="button" onClick={onClose} style={{ marginLeft: "10px" }}>
            Prekliči
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrganizeWizard;
