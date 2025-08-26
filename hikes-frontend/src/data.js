const mountains = [
  {
    id: 1,
    name: "Triglav",
    region: "Julijske Alpe",
    height: 2864,
    difficulty: "težka",
    season: ["poletje", "celo leto"],
    time: 9,
    huts: [
      { name: "Triglavski dom", url: "https://www.pzs.si/koce.php?pid=10" },
      { name: "Koča na Doliču", url: "https://www.pzs.si/koce.php?pid=20" }
    ],
    parkings: [
      { name: "Parkirišče Vrata", url: "https://maps.google.com/?q=Parkirišče+Vrata" },
      { name: "Pokljuka", url: "https://maps.google.com/?q=Pokljuka" }
    ],
    transport: [
      { name: "Avtobus Ljubljana – Mojstrana", url: "https://www.ap-ljubljana.si/" },
      { name: "Vlak Ljubljana – Jesenice", url: "https://potniski.sz.si/vozni-red/" }
    ]
  }
];
export default mountains;
