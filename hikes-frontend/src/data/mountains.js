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
      },
      {
        name: "Pot čez Planiko",
        start: { label: "Vrata", lat: 46.423, lng: 13.848 },
        time: "7-8h",
        elevation: 1900,
        huts: ["Aljažev dom", "Dom Planika"],
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
