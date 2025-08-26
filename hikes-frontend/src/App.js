import React, { useState } from "react";

const mountains = [
  {
    name: "Triglav",
    height: 2864,
    difficulty: "Težka",
    time: "8-10h",
    season: "Poletje",
    range: "Julijske Alpe",
    huts: [
      { name: "Koča na Kredarici", reservation: "https://www.pzs.si/koce.php?pid=16" },
      { name: "Dom Planika", reservation: "https://www.pzs.si/koce.php?pid=17" }
    ],
    routes: [
      {
        name: "Krma",
        parking: { name: "Parkirišče Krma", lat: 46.3857, lng: 13.9273 },
        time: "8-9h",
        difficulty: "Srednja"
      },
      {
        name: "Pokljuka",
        parking: { name: "Parkirišče Rudno polje", lat: 46.3434, lng: 13.9242 },
        time: "7-8h",
        difficulty: "Srednja"
      }
    ],
    transport: [
      { type: "Avtobus Ljubljana–Mojstrana", link: "https://www.ap-ljubljana.si" },
      { type: "Vlak Ljubljana–Jesenice", link: "https://potniski.sz.si" }
    ]
  },
  {
    name: "Šmarna gora",
    height: 669,
    difficulty: "Lahka",
    time: "1h",
    season: "Celo leto",
    range: "Pohorje",
    huts: [
      { name: "Gostilna Ledinek", reservation: "https://www.ledinek.si" }
    ],
    routes: [
      {
        name: "Tacen",
        parking: { name: "Parkirišče Tacen", lat: 46.1121, lng: 14.4542 },
        time: "1h",
        difficulty: "Lahka"
      },
      {
        name: "Pirniče",
        parking: { name: "Parkirišče Pirniče", lat: 46.1205, lng: 14.4521 },
        time: "1h 15min",
        difficulty: "Lahka"
      }
    ],
    transport: [
      { type: "Avtobus LPP", link: "https://www.lpp.si" }
    ]
  }
];

export default function App() {
  const [filters, setFilters] = useState({
    range: "",
    difficulty: "",
    huts: false,
    transport: false,
  });

  const [selectedMountain, setSelectedMountain] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [planOptions, setPlanOptions] = useState({
    useTransit: true,
    useDriving: false,
    date: "",
    time: ""
  });

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetFilters = () => {
    setFilters({
      range: "",
      difficulty: "",
      huts: false,
      transport: false,
    });
    setSelectedMountain(null);
  };

  const filteredMountains = mountains.filter((m) => {
    return (
      (!filters.range || m.range === filters.range) &&
      (!filters.difficulty || m.difficulty === filters.difficulty) &&
      (!filters.huts || (m.huts && m.huts.length > 0)) &&
      (!filters.transport || (m.transport && m.transport.length > 0))
    );
  });

  const askUserLocation = () => {
    if (!navigator.geolocation) {
      alert("⚠️ Brskalnik ne podpira geolokacije.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // ni lokacije: nič hudega, Maps bo povprašal ob odprtju linka
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // helper: izdela Google Maps directions URL
  const buildGMapsDir = ({ destLat, destLng, mode = "transit" }) => {
    const base = new URL("https://www.google.com/maps/dir/");
    base.searchParams.set("api", "1");
    if (userLocation) {
      base.searchParams.set("origin", `${userLocation.lat},${userLocation.lng}`);
    }
    base.searchParams.set("destination", `${destLat},${destLng}`);
    base.searchParams.set("travelmode", mode);

    // poskusno dodamo čas odhoda, če ga je uporabnik izbral (Maps ga včasih ignorira v web UI)
    if (mode === "transit" && planOptions.date && planOptions.time) {
      try {
        const dtIso = new Date(`${planOptions.date}T${planOptions.time}:00`);
        const epoch = Math.floor(dtIso.getTime() / 1000);
        base.searchParams.set("departure_time", String(epoch));
      } catch {
        // ignore
      }
    }
    return base.toString();
  };

  const openAll = (urls) => {
    // poskusi odpreti več zavihkov — user gesture (onClick) je potreben
    urls.forEach((u) => window.open(u, "_blank"));
  };

  const selectedRoute =
    selectedMountain && selectedMountain.routes[selectedRouteIdx]
      ? selectedMountain.routes[selectedRouteIdx]
      : null;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Slovenski vrhovi</h1>

      {/* Filtri */}
      <div style={{ marginBottom: "20px" }}>
        <select name="range" value={filters.range} onChange={handleFilterChange}>
          <option value="">Izberi gorovje</option>
          <option value="Julijske Alpe">Julijske Alpe</option>
          <option value="Kamniško Savinjske Alpe">Kamniško Savinjske Alpe</option>
          <option value="Karavanke">Karavanke</option>
          <option value="Pohorje">Pohorje</option>
        </select>

        <select
          name="difficulty"
          value={filters.difficulty}
          onChange={handleFilterChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Težavnost</option>
          <option value="Lahka">Lahka</option>
          <option value="Srednja">Srednja</option>
          <option value="Težka">Težka</option>
        </select>

        <select
          name="season"
          value={filters.season}
          onChange={handleFilterChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Sezona</option>
          <option value="Celo leto">Celo leto</option>
          <option value="Poletje">Poletje</option>
          <option value="Zima">Zima</option>
        </select>

        <label style={{ marginLeft: "10px" }}>
          <input
            type="checkbox"
            name="huts"
            checked={filters.huts}
            onChange={handleFilterChange}
          />
          Koče na poti
        </label>

        <label style={{ marginLeft: "10px" }}>
          <input
            type="checkbox"
            name="transport"
            checked={filters.transport}
            onChange={handleFilterChange}
          />
          Javni prevoz
        </label>

        <button onClick={resetFilters} style={{ marginLeft: "10px" }}>
          Reset
        </button>
      </div>

      {/* Seznam vrhov */}
      {!selectedMountain &&
        filteredMountains.map((m) => (
          <div
            key={m.name}
            style={{
              border: "1px solid gray",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedMountain(m);
              setSelectedRouteIdx(0);
              setUserLocation(null);
            }}
          >
            <h2>{m.name}</h2>
            <p>Višina: {m.height} m</p>
            <p>Težavnost: {m.difficulty}</p>
            <p>Čas hoje: {m.time}</p>
            <p>Sezona: {m.season}</p>
          </div>
        ))}

      {/* Detajl vrha */}
      {selectedMountain && (
        <div style={{ marginTop: "20px" }}>
          <h2>{selectedMountain.name}</h2>
          <p>Višina: {selectedMountain.height} m</p>
          <p>Težavnost: {selectedMountain.difficulty}</p>
          <p>Čas hoje: {selectedMountain.time}</p>
          <p>Sezona: {selectedMountain.season}</p>

          <h3>Koče:</h3>
          <ul>
            {selectedMountain.huts.map((h, i) => (
              <li key={i}>
                <a href={h.reservation} target="_blank" rel="noreferrer">
                  {h.name} 🏠
                </a>
              </li>
            ))}
          </ul>

          <h3>Poti:</h3>
          <ul>
            {selectedMountain.routes.map((r, i) => (
              <li key={i}>
                <strong>{r.name}</strong> ({r.time}, {r.difficulty}) <br />
                {r.parking.name}{" "}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${r.parking.lat},${r.parking.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                  title="Vožnja do izhodišča"
                >
                  🚗
                </a>{" "}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${r.parking.lat},${r.parking.lng}&travelmode=transit`}
                  target="_blank"
                  rel="noreferrer"
                  title="Javni prevoz do izhodišča"
                >
                  🚍
                </a>
              </li>
            ))}
          </ul>

          <h3>Javni prevoz:</h3>
          <ul>
            {selectedMountain.transport.map((t, i) => (
              <li key={i}>
                <a href={t.link} target="_blank" rel="noreferrer">
                  {t.type} 🎫
                </a>
              </li>
            ))}
          </ul>

          {/* PLAN – izbira poti in 1 klik paket */}
          {selectedMountain.routes.length > 0 && (
            <div style={{ marginTop: 20, padding: 12, border: "1px dashed #888", borderRadius: 8 }}>
              <h3>Načrt poti (paket)</h3>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <label>
                  Pot:
                  <select
                    value={selectedRouteIdx}
                    onChange={(e) => setSelectedRouteIdx(Number(e.target.value))}
                    style={{ marginLeft: 6 }}
                  >
                    {selectedMountain.routes.map((r, i) => (
                      <option key={r.name} value={i}>
                        {r.name} ({r.time}, {r.difficulty})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Datum:
                  <input
                    type="date"
                    value={planOptions.date}
                    onChange={(e) => setPlanOptions({ ...planOptions, date: e.target.value })}
                    style={{ marginLeft: 6 }}
                  />
                </label>

                <label>
                  Odhod:
                  <input
                    type="time"
                    value={planOptions.time}
                    onChange={(e) => setPlanOptions({ ...planOptions, time: e.target.value })}
                    style={{ marginLeft: 6 }}
                  />
                </label>

                <label style={{ marginLeft: 10 }}>
                  <input
                    type="checkbox"
                    checked={planOptions.useTransit}
                    onChange={(e) => setPlanOptions({ ...planOptions, useTransit: e.target.checked })}
                  />{" "}
                  Javni prevoz
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={planOptions.useDriving}
                    onChange={(e) => setPlanOptions({ ...planOptions, useDriving: e.target.checked })}
                  />{" "}
                  Vožnja
                </label>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={askUserLocation}>Uporabi mojo lokacijo</button>

                <button
                  onClick={() => {
                    if (!selectedRoute) return;
                    const urls = [];

                    // Maps links
                    if (planOptions.useTransit) {
                      urls.push(
                        buildGMapsDir({
                          destLat: selectedRoute.parking.lat,
                          destLng: selectedRoute.parking.lng,
                          mode: "transit",
                        })
                      );
                    }
                    if (planOptions.useDriving) {
                      urls.push(
                        buildGMapsDir({
                          destLat: selectedRoute.parking.lat,
                          destLng: selectedRoute.parking.lng,
                          mode: "driving",
                        })
                      );
                    }

                    // vozovnice
                    selectedMountain.transport.forEach((t) => urls.push(t.link));

                    // koče
                    selectedMountain.huts.forEach((h) => urls.push(h.reservation));

                    openAll(urls);
                  }}
                >
                  Načrtuj v 1 kliku ✨
                </button>

                <button
                  onClick={() => {
                    if (!selectedRoute) return;
                    const url = buildGMapsDir({
                      destLat: selectedRoute.parking.lat,
                      destLng: selectedRoute.parking.lng,
                      mode: planOptions.useTransit ? "transit" : "driving",
                    });
                    window.open(url, "_blank");
                  }}
                >
                  Odpri navigacijo
                </button>

                <button
                  onClick={() => {
                    selectedMountain.transport.forEach((t) => window.open(t.link, "_blank"));
                  }}
                >
                  Kupi vozovnice
                </button>

                <button
                  onClick={() => {
                    selectedMountain.huts.forEach((h) => window.open(h.reservation, "_blank"));
                  }}
                >
                  Rezerviraj koče
                </button>
              </div>

              <p style={{ marginTop: 8 }}>
                <small>Namig: če brskalnik blokira zavihke, dovoli “pop-ups” za to spletno mesto.</small>
              </p>
            </div>
          )}

          <button
            style={{ marginTop: "10px" }}
            onClick={() => setSelectedMountain(null)}
          >
            Nazaj
          </button>
        </div>
      )}
    </div>
  );
}
