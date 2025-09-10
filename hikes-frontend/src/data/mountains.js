// src/data/mountains.js
const mountains = [
  {
    name: "Triglav",
    range: "Julijske Alpe",
    height: 2864,
    difficulty: "težka",
    time: "8h+",
    huts: true,
    routes: [
      {
        name: "Pot čez Kredarico",
        start: { label: "Krma", lat: 46.383, lng: 13.933 },
        time: "6-7h",
        elevation: 1800,
        huts: ["Dom v Krmi", "Kredarica"],
        file: "/routes/triglav-krma.geojson",
      },
      {
        name: "Pot čez Planiko",
        start: { label: "Vrata", lat: 46.423, lng: 13.848 },
        time: "7-8h",
        elevation: 1900,
        huts: ["Aljažev dom", "Dom Planika"],
        file: "/routes/triglav-planika.geojson",
      },
      {
        name: "Pot iz Vrat",
        start: { label: "Vrata (Aljažev dom)", lat: 46.4324, lng: 13.8482 },
        time: "7-8h",
        elevation: 1900,
        huts: ["Aljažev dom", "Dom Planika"],
        file: "/routes/triglav-vrata.geojson",
      },
      {
        name: "Pot iz Pokljuke",
        start: { label: "Planinski dom na Pokljuki", lat: 46.3446, lng: 13.9661 },
        time: "6-7h",
        elevation: 1600,
        huts: ["Dom na Pokljuki", "Vodnikov dom", "Dom Planika"],
        file: "/routes/triglav-pokljuka.geojson",
      },
      {
        name: "Pot iz Trente (čez Dolič)",
        start: { label: "Trenta – Zadnjica", lat: 46.3735, lng: 13.7397 },
        time: "7-9h",
        elevation: 2000,
        huts: ["Koča na Doliču"],
        file: "/routes/triglav-trenta.geojson",
      },
      {
        name: "Čez Komarčo (Triglavska jezera)",
        start: { label: "Koča pri Savici / Komarča", lat: 46.3006, lng: 13.8399 },
        time: "8-10h",
        elevation: 2100,
        huts: ["Koča pri jezerih", "Koča na Doliču"],
        file: "/routes/triglav-komarca.geojson",
      },
    ],
  },
  {
    name: "Grintovec",
    range: "Kamniško-Savinjske Alpe",
    height: 2558,
    difficulty: "srednja",
    time: "6-8h",
    huts: true,
    routes: [
      {
        name: "Čez Kokrsko sedlo",
        start: { label: "Kamniška Bistrica", lat: 46.333, lng: 14.6 },
        time: "5-6h",
        elevation: 1600,
        huts: ["Cojzova koča na Kokrskem sedlu"],
      },
      {
        name: "BLALBLA",
        start: { label: "Kamniška Bistrica", lat: 46.333, lng: 14.6 },
        time: "5-6h",
        elevation: 1600,
        huts: ["BlABLA KOCA"],
      },
    ],
  },
  {
    name: "Stol",
    range: "Karavanke",
    height: 2236,
    difficulty: "lahka",
    time: "4-6h",
    huts: false,
    routes: [
      {
        name: "Pot iz Završnice",
        start: { label: "Valvasorjev dom", lat: 46.433, lng: 14.183 },
        time: "3-4h",
        elevation: 1200,
        huts: ["Valvasorjev dom"],
      },
    ],
  },
];

export default mountains;
