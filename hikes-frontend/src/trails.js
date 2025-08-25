const trails = [
  {
    name: "Triglav",
    mountainRange: "Julijske Alpe",
    height: 2864,
    difficulty: "težka",
    climbing: true,
    huts: [
      { name: "Koča pri Triglavskih jezerih", link: "https://www.pzs.si/koce.php?pid=31" },
      { name: "Dom Planika pod Triglavom", link: "https://www.pzs.si/koce.php?pid=22" },
      { name: "Triglavski dom na Kredarici", link: "https://www.pzs.si/koce.php?pid=21" },
    ],
    time: "6-8h",
    timeHours: 7,
    season: ["poletje", "zima"],
    startingPoints: [
      {
        name: "Krma",
        transport: {
          car: {
            parking: { name: "Parkirišče Krma", price: "3€/dan", capacity: "70 vozil" },
            timeFromLjubljana: "1h 40min",
            costFromLjubljana: "~20€ gorivo + 6€ parkirnina",
          },
          bus: {
            nearestStop: "Mojstrana",
            timeToStart: "30min taxi ali 1h hoje",
            price: "7€ iz Ljubljane do Mojstrane",
          },
          train: {
            nearestStation: "Jesenice",
            transfer: "bus Jesenice → Mojstrana + taxi/hoja",
            price: "8€ vlak + 5€ bus",
          },
        },
      },
      {
        name: "Rudno polje (Pokljuka)",
        transport: {
          car: {
            parking: { name: "Rudno polje", price: "5€/dan", capacity: "100 vozil" },
            timeFromLjubljana: "1h 30min",
            costFromLjubljana: "~18€ gorivo + 5€ parkirnina",
          },
          bus: {
            nearestStop: "Bled",
            timeToStart: "30min taxi z Bleda",
            price: "6€ bus Ljubljana → Bled",
          },
          train: {
            nearestStation: "Jesenice",
            transfer: "vlak Jesenice → Bled + taxi",
            price: "8€ vlak + 5€ taxi/bus",
          },
        },
      },
    ],
  },
  {
    name: "Šmarna gora",
    mountainRange: "Pohorje",
    height: 669,
    difficulty: "lahka",
    climbing: false,
    huts: [
      { name: "Gostilna Ledinek", link: "https://www.smarna-gora.si/" }
    ],
    time: "1h",
    timeHours: 1,
    season: ["celo leto"],
    startingPoints: [
      {
        name: "Tacen",
        transport: {
          car: {
            parking: { name: "Parkirišče Tacen", price: "brezplačno", capacity: "50 vozil" },
            timeFromLjubljana: "15min",
            costFromLjubljana: "~2€ gorivo",
          },
          bus: {
            nearestStop: "Tacen",
            timeToStart: "5min hoje",
            price: "1,3€ mestni avtobus",
          },
        },
      },
    ],
  },
  {
    name: "Grintovec",
    mountainRange: "Kamniško Savinjske Alpe",
    height: 2558,
    difficulty: "težka",
    climbing: true,
    huts: [
      { name: "Cožanova koča", link: "https://www.pzs.si/koce.php?pid=32" }
    ],
    time: "5-6h",
    timeHours: 6,
    season: ["poletje"],
    startingPoints: [
      {
        name: "Kamniška Bistrica",
        transport: {
          car: {
            parking: { name: "Izvir Kamniške Bistrice", price: "brezplačno", capacity: "80 vozil" },
            timeFromLjubljana: "45min",
            costFromLjubljana: "~6€ gorivo",
          },
          bus: {
            nearestStop: "Kamniška Bistrica",
            timeToStart: "0min – direktno",
            price: "5€ iz Kamnika",
          },
        },
      },
    ],
  },
  {
    name: "Stol",
    mountainRange: "Karavanke",
    height: 2236,
    difficulty: "srednja",
    climbing: false,
    huts: [
      { name: "Prešernova koča na Stolu", link: "https://www.pzs.si/koce.php?pid=18" }
    ],
    time: "4-5h",
    timeHours: 5,
    season: ["poletje", "jesen"],
    startingPoints: [
      {
        name: "Valvasorjev dom",
        transport: {
          car: {
            parking: { name: "Parkirišče Valvasorjev dom", price: "3€/dan", capacity: "60 vozil" },
            timeFromLjubljana: "1h 15min",
            costFromLjubljana: "~15€ gorivo + parkirnina",
          },
          bus: {
            nearestStop: "Žirovnica",
            timeToStart: "1h hoje ali taxi",
            price: "6€ Ljubljana → Žirovnica",
          },
        },
      },
    ],
  },
];

export default trails;
