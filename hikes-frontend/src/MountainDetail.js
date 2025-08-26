import React from "react";
import { useParams, Link } from "react-router-dom";

function MountainDetail({ mountains }) {
  const { id } = useParams();
  const mountain = mountains.find((m) => m.id === parseInt(id));

  if (!mountain) return <p>Vrh ni bil najden.</p>;

  return (
    <div>
      <h2>{mountain.name}</h2>
      <p>Gorovje: {mountain.region}</p>
      <p>Višina: {mountain.height} m</p>
      <p>Težavnost: {mountain.difficulty}</p>
      <p>Čas: {mountain.time}h</p>
      <p>Sezona: {mountain.season.join(", ")}</p>

      <h3>Koče</h3>
      <ul>
        {mountain.huts.length > 0 ? (
          mountain.huts.map((h, i) => (
            <li key={i}>
              <a href={h.url} target="_blank" rel="noopener noreferrer">
                {h.name}
              </a>
            </li>
          ))
        ) : (
          <li>Ni koč</li>
        )}
      </ul>

<h3>Parkirišča</h3>
<ul>
  {mountain.parkings.map((parking, index) => {
    if (typeof parking === "string") {
      return <li key={index}>{parking}</li>; // samo ime
    } else {
      return (
        <li key={index}>
          {parking.name}{" "}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${parking.gps}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📍
          </a>
        </li>
      );
    }
  })}
</ul>

      <h3>Javni prevoz</h3>
      <ul>
        {mountain.transport.length > 0 ? (
          mountain.transport.map((t, i) => (
            <li key={i}>
              <a href={t.url} target="_blank" rel="noopener noreferrer">
                {t.name}
              </a>
            </li>
          ))
        ) : (
          <li>Ni javnega prevoza</li>
        )}
      </ul>

      <Link to="/">Nazaj</Link>
    </div>
  );
}

export default MountainDetail;
