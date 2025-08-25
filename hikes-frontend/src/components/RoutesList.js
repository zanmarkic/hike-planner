import React, { useEffect, useState } from "react";

function RoutesList() {
  const [hikes, setHikes] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/hikes")
      .then((res) => res.json())
      .then((data) => setHikes(data))
      .catch((err) => console.error("Napaka pri pridobivanju poti:", err));
  }, []);

  return (
    <div>
      <h2>Seznam poti</h2>
      <ul>
        {hikes.map((hike) => (
          <li key={hike.id}>
            <strong>{hike.name}</strong> ({hike.location}) -{" "}
            {hike.distance_km} km |{" "}
            {hike.difficulty ? hike.difficulty : "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RoutesList;