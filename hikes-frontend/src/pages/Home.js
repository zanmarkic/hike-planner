import React, { useState } from "react";
import { Link } from "react-router-dom"; // <-- to dodaj
import Filters from "../components/Filters";
import MountainCard from "../components/MountainCard";

// Seznam gora (primeri)
const mountains = [
  {
    id: 1,
    name: "Triglav",
    range: "Julijske Alpe",
    difficulty: "težka",
    time: "8h+",
    huts: true,
    height: 2864,
  },
  {
    id: 2,
    name: "Grintovec",
    range: "Kamniško-Savinjske Alpe",
    difficulty: "srednja",
    time: "6-8h",
    huts: true,
    height: 2558,
  },
  {
    id: 3,
    name: "Stol",
    range: "Karavanke",
    difficulty: "lahka",
    time: "4-6h",
    huts: false,
    height: 2236,
  },
];

export default function Home() {
  const [filters, setFilters] = useState({
    range: "",
    difficulty: "",
    time: "",
    huts: "",
  });

  // Filtriranje gora
  const filteredMountains = mountains.filter((mountain) => {
    return (
      (filters.range === "" || mountain.range === filters.range) &&
      (filters.difficulty === "" || mountain.difficulty === filters.difficulty) &&
      (filters.time === "" || mountain.time === filters.time) &&
      (filters.huts === "" ||
        (filters.huts === "da" && mountain.huts) ||
        (filters.huts === "ne" && !mountain.huts))
    );
  });

  const isAnyFilterSelected =
    filters.range || filters.difficulty || filters.time || filters.huts;

  return (
    <div>
      <h1>Slovenske Gore</h1>
      <Filters filters={filters} setFilters={setFilters} />

      {isAnyFilterSelected ? (
  filteredMountains.length > 0 ? (
    filteredMountains.map((mountain) => (
      <div key={mountain.id}>
        <Link to={`/mountain/${encodeURIComponent(mountain.name)}`}>
          <MountainCard mountain={mountain} />
        </Link>
      </div>
    ))
  ) : (
    <p>Ni gora, ki bi ustrezale filtrom.</p>
  )
) : null}
    </div>
  );
}
