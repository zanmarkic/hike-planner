const trails = [
  {
    name: "Triglav",
    mountainRange: "Julijske Alpe",
    height: 2864,
    difficulty: "težka",
    climbing: true,
    time: "8-10h",
    timeHours: 9,
    huts: [
      { name: "Planika", link: "https://www.pzs.si/koce.php?pid=17" },
      { name: "Kredarica", link: "https://www.pzs.si/koce.php?pid=18" },
      { name: "Dom Valentina Staniča", link: "https://www.pzs.si/koce.php?pid=19" },
    ],
    season: ["poletje", "celo leto"],
    parking: [
      {
        name: "Krma",
        type: "makadam",
        price: "brezplačno",
        gps: { lat: 46.3833, lon: 13.9333 },
      },
      {
        name: "Pokljuka",
        type: "asfaltno parkirišče",
        price: "5€/dan",
        gps: { lat: 46.3421, lon: 13.9245 },
      },
    ],
    transport: [
      {
        type: "avtobus",
        from: "Ljubljana",
        to: "Mojstrana",
        price: "8€",
        time: "2h",
        link: "https://www.ap-ljubljana.si/",
      },
      {
        type: "vlak",
        from: "Ljubljana",
        to: "Jesenice",
        price: "7€",
        time: "1.5h",
        link: "https://potniski.sz.si/",
      },
    ],
  },
  {
    name: "Šmarna Gora",
    mountainRange: "Pohorje",
    height: 669,
    difficulty: "lahka",
    climbing: false,
    time: "1h",
    timeHours: 1,
    huts: [
      { name: "Gostilna na vrhu", link: "https://www.smarna-gora.si/" },
    ],
    season: ["celo leto"],
    parking: [
      {
        name: "Tacenski most",
        type: "asfaltno parkirišče",
        price: "brezplačno",
        gps: { lat: 46.1247, lon: 14.4520 },
      },
    ],
    transport: [
      {
        type: "avtobus",
        from: "Ljubljana Center",
        to: "Tacen",
        price: "1.3€",
        time: "25min",
        link: "https://www.lpp.si/",
      },
    ],
  },
  {
    name: "Storžič",
    mountainRange: "Kamniško Savinjske Alpe",
    height: 2132,
    difficulty: "srednja",
    climbing: false,
    time: "5-6h",
    timeHours: 5,
    huts: [
      { name: "Dom pod Storžičem", link: "https://www.pzs.si/koce.php?pid=45" },
    ],
    season: ["poletje", "celo leto"],
    parking: [
      {
        name: "Dom pod Storžičem parkirišče",
        type: "asfaltno parkirišče",
        price: "brezplačno",
        gps: { lat: 46.3331, lon: 14.4215 },
      },
    ],
    transport: [
      {
        type: "vlak",
        from: "Ljubljana",
        to: "Kranj",
        price: "5€",
        time: "40min",
        link: "https://potniski.sz.si/",
      },
      {
        type: "avtobus",
        from: "Kranj",
        to: "Trstenik",
        price: "2€",
        time: "20min",
        link: "https://www.ap-ljubljana.si/",
      },
    ],
  },
];

export default trails;
