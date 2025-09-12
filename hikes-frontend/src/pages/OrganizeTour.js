// src/pages/OrganizeTour.js
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as turf from "@turf/turf";
import mountains from "../data/mountains";
import Map3D from "../components/Map3D";

// MapTiler ključ iz CRA (.env): REACT_APP_MAPTILER_KEY=...
const MAP_KEY = process.env.REACT_APP_MAPTILER_KEY || "";

// ------------------ PARKIRIŠČNI OVERRIDES (Triglav – 6 poti) ------------------
// Ključ MORA natančno ustrezati `${mountain.name}::${route.name}`
const DRIVE_OVERRIDES = {
  // Krma -> Kovinarska koča / parkirišče v Krmi
  "Triglav::Pot čez Kredarico": {
    label: "Krma – parkirišče (Kovinarska koča)",
    lat: 46.3857,
    lng: 13.9429,
  },

  // Vrata -> Aljažev dom v Vratih (parkirišče)
  "Triglav::Pot čez Planiko": {
    label: "Aljažev dom v Vratih – parkirišče",
    lat: 46.4332,
    lng: 13.8484,
  },

  // Komarča -> Koča pri Savici (parkirišče)
  "Triglav::Pot čez Komarčo": {
    label: "Koča pri Savici – parkirišče",
    lat: 46.2899,
    lng: 13.8666,
  },

  // Pokljuka -> Rudno polje (parkirišče)
  "Triglav::Pot s Pokljuke": {
    label: "Rudno polje – parkirišče",
    lat: 46.3605,
    lng: 13.9413,
  },

  // Trenta -> Zadnjica (parkirišče)
  "Triglav::Pot iz Trente": {
    label: "Zadnjica (Trenta) – parkirišče",
    lat: 46.3666,
    lng: 13.7395,
  },

  // Vrata (če imaš ločeno pot “Pot iz Vrat”) -> isto parkirišče kot zgoraj
  "Triglav::Pot iz Vrat": {
    label: "Aljažev dom v Vratih – parkirišče",
    lat: 46.4332,
    lng: 13.8484,
  },
};

// Najbližja "routable" (cestna) točka za podane koordinate – OSRM nearest
async function snapToRoad(lng, lat) {
  const res = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`);
  const j = await res.json();
  const loc = j?.waypoints?.[0]?.location; // [lng, lat]
  return Array.isArray(loc) ? { lng: loc[0], lat: loc[1] } : { lng, lat };
}

// --- Koče okoli Triglava (osnovni nabor za zaznavo ob sledi) ---
const HUTS = [
  { name: "Triglavski dom na Kredarici", short: "Kredarica", lng: 13.8489, lat: 46.3785 },
  { name: "Dom Planika pod Triglavom", short: "Dom Planika", lng: 13.8537, lat: 46.3638 },
  { name: "Dom Valentina Staniča pod Triglavom", short: "Staničev dom", lng: 13.8326, lat: 46.4051 },
  { name: "Vodnikov dom na Velem polju", short: "Vodnikov dom", lng: 13.8897, lat: 46.3544 },
  { name: "Aljažev dom v Vratih", short: "Aljažev dom", lng: 13.8482, lat: 46.4324 },
  { name: "Dom v Krmi", short: "Dom v Krmi", lng: 13.9384, lat: 46.3713 },
  { name: "Planinski dom na Pokljuki", short: "Dom na Pokljuki", lng: 13.9661, lat: 46.3446 },
  { name: "Koča pri Triglavskih jezerih", short: "Koča pri jezerih", lng: 13.7802, lat: 46.3316 },
  { name: "Koča na Doliču (Tržaška koča)", short: "Koča na Doliču", lng: 13.7764, lat: 46.3609 },
];

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// /routes/<slug-gora>-<slug-pot>.geojson
function guessFilePath(mountainName, routeName) {
  return `/routes/${slugify(mountainName)}-${slugify(routeName)}.geojson`;
}

export default function OrganizeTour() {
  const [sp] = useSearchParams();
  const mountainName = sp.get("m") || "";

  const mountain = useMemo(
    () => mountains.find((m) => m.name === mountainName),
    [mountainName]
  );

  // obrazec
  const [form, setForm] = useState({
    people: "",
    dateFrom: "",
    dateTo: "",
    sleep: "ne",
    hut: "",
    transport: "",
    route: "",
  });

  // Map style (dropdown)
  const MAPTILER_STYLES = [
    { id: "outdoor-v2", label: "Outdoor (planinski)" },
    { id: "topo-v2", label: "Topo v2 (osnovni)" },
    { id: "streets-v2", label: "Streets v2 (mesta)" },
    { id: "bright-v2", label: "Bright v2" },
    { id: "winter", label: "Winter (zimski)" },
    { id: "hybrid", label: "Hybrid (satelit + labels)" },
  ];
  const [mapStyle, setMapStyle] = useState("outdoor-v2");

  // Start lokacija (za avto) + avto trasa
  const [origin, setOrigin] = useState("Ljubljana");
  const [originCoord, setOriginCoord] = useState(null);     // [lng, lat]
  const [driveCoords, setDriveCoords] = useState([]);       // [[lng,lat], ...]
  const [driveInfo, setDriveInfo] = useState(null);         // { distance_km, duration_min }

  // koče za dropdown (iz routes + fiksni nabor)
  const allHuts = useMemo(() => {
    const s = new Set();
    if (mountain) {
      (mountain.routes || []).forEach((r) => (r.huts || []).forEach((h) => s.add(h)));
    }
    ["Kredarica","Dom Planika","Staničev dom","Vodnikov dom","Aljažev dom","Dom v Krmi"].forEach((h) => s.add(h));
    return Array.from(s);
  }, [mountain]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "sleep" && value === "ne") {
      setForm((prev) => ({ ...prev, sleep: "ne", hut: "" }));
      return;
    }
    if (name === "dateFrom" && form.dateTo && value && value > form.dateTo) {
      setForm((prev) => ({ ...prev, dateFrom: value, dateTo: value }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // cache: koče zaznane ob posamezni sledi
  const [routeHutsCache, setRouteHutsCache] = useState({}); // { [routeName]: ["Kredarica", ...] }

  // predlagane poti (filtracija po koči, če uporabnik izbere spanje + kočo)
  const suggestedRoutes = useMemo(() => {
    if (!mountain) return [];
    if (form.sleep === "da" && form.hut) {
      return (mountain.routes || []).filter((r) => {
        const detected = routeHutsCache[r.name];
        if (Array.isArray(detected)) return detected.includes(form.hut);
        return (r.huts || []).includes(form.hut);
      });
    }
    return mountain.routes || [];
  }, [mountain, form.sleep, form.hut, routeHutsCache]);

  // izbrana pot (če ni izbrana, vzemi prvo iz predlaganih)
  const selectedRoute = useMemo(() => {
    if (!mountain) return null;
    const name = form.route || (suggestedRoutes[0]?.name ?? "");
    return (mountain.routes || []).find((r) => r.name === name) || null;
  }, [mountain, form.route, suggestedRoutes]);

  // GeoJSON -> coords + zaznaj koče na sledi
  const [routeCoords, setRouteCoords] = useState([]); // [[lng,lat], ...]

  useEffect(() => {
    setRouteCoords([]);
    if (!selectedRoute || !mountain) return;

    const file = selectedRoute.file || guessFilePath(mountain.name, selectedRoute.name);

    fetch(file)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GeoJSON not found: ${file}`))))
      .then((geo) => {
        let coords = [];
        const pushLine = (g) => {
          if (!g) return;
          if (g.type === "LineString") coords.push(...g.coordinates);
          if (g.type === "MultiLineString") g.coordinates.forEach((c) => coords.push(...c));
        };
        if (geo.type === "FeatureCollection") (geo.features || []).forEach((f) => pushLine(f.geometry));
        else if (geo.type === "Feature") pushLine(geo.geometry);
        else pushLine(geo);

        setRouteCoords(coords || []);

        // zaznaj koče vzdolž sledi (<= 300 m)
        try {
          if (coords.length >= 2) {
            const line = turf.lineString(coords);
            const nearHuts = HUTS.filter((h) => {
              const pt = turf.point([h.lng, h.lat]);
              const snap = turf.nearestPointOnLine(line, pt, { units: "meters" });
              return snap.properties.dist <= 300;
            }).map((h) => h.short);
            setRouteHutsCache((prev) => ({ ...prev, [selectedRoute.name]: nearHuts }));
          }
        } catch (e) {
          console.warn("Huts detection error:", e);
        }
      })
      .catch((err) => {
        console.error("GeoJSON load error:", err);
        setRouteCoords([]);
      });
  }, [selectedRoute, mountain]);

  // helpers
  const nights = useMemo(() => {
    if (!form.dateFrom || !form.dateTo) return 0;
    const from = new Date(form.dateFrom);
    const to = new Date(form.dateTo);
    const diff = (to - from) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  }, [form.dateFrom, form.dateTo]);

  const openMaps = (lat, lng, mode = "driving") => {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", `${lat},${lng}`);
    url.searchParams.set("travelmode", mode);
    window.open(url.toString(), "_blank");
  };

  const mapCenter = useMemo(() => {
    if (routeCoords.length) return routeCoords[0];
    if (selectedRoute?.start) return [selectedRoute.start.lng, selectedRoute.start.lat];
    return [14.5, 46.05];
  }, [routeCoords, selectedRoute]);

  // --- AVTO: geokodiranje + OSRM routing ---
  async function geocode(q) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url, { headers: { "Accept-Language": "sl" } });
    const arr = await res.json();
    if (!arr?.length) throw new Error("Lokacije ni mogoče najti.");
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  }

  useEffect(() => {
    if (form.transport !== "avto") {
      setDriveCoords([]);
      setDriveInfo(null);
      setOriginCoord(null);
    }
  }, [form.transport]);

  // ---------------------- RENDER ----------------------
  return (
    <div style={{ padding: 20 }}>
      {!mountain ? (
        <>
          <h1>Organiziraj turo</h1>
        <p>Ni podatkov o hribu. Odpri iz podrobnosti gore (gumb “Organiziraj turo”).</p>
        </>
      ) : (
        <>
          <h1>Organiziraj turo za {mountain.name}</h1>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!form.people || !form.dateFrom || !form.dateTo || !form.transport) {
              alert("Prosimo, izpolni število ljudi, datum OD/DO in prevoz."); return;
            }
            if (form.dateTo < form.dateFrom) {
              alert("Datum DO ne sme biti pred datumom OD."); return;
            }
            if (form.sleep === "da" && !form.hut) {
              alert("Izberi kočo."); return;
            }
            const sleepText = form.sleep === "da" ? `DA (${form.hut})` : "NE";
            const base = [
              `Tura potrjena!`,
              `Gora: ${mountain.name}`,
              `Ljudje: ${form.people}`,
              `Obdobje: ${form.dateFrom} → ${form.dateTo} (${nights} noč/i)`,
              `Spanje: ${sleepText}`,
              `Prevoz: ${form.transport}`,
              selectedRoute ? `Pot: ${selectedRoute.name}` : null,
              selectedRoute && routeHutsCache[selectedRoute.name]?.length
                ? `Koče na poti: ${routeHutsCache[selectedRoute.name].join(", ")}`
                : null,
              driveInfo && form.transport === "avto"
                ? `Vožnja: ~${driveInfo.distance_km} km, ~${driveInfo.duration_min} min (OSRM)`
                : null,
            ].filter(Boolean).join("\n");
            alert(base);
          }} style={{ display: "grid", gap: 12, maxWidth: 560 }}>

            <label>
              Število ljudi:
              <input type="number" min="1" name="people" value={form.people} onChange={onChange} />
            </label>

            <label>
              Datum OD:
              <input type="date" name="dateFrom" value={form.dateFrom} onChange={onChange} max={form.dateTo || undefined} />
            </label>

            <label>
              Datum DO:
              <input type="date" name="dateTo" value={form.dateTo} onChange={onChange} min={form.dateFrom || undefined} />
            </label>

            {form.dateFrom && form.dateTo && (
              <div style={{ fontSize: 14, color: "#555" }}>
                {nights > 0 ? `Število nočitev: ${nights}` : "Ista noč (brez nočitve)"}
              </div>
            )}

            <label>
              Ali želite spati?
              <select name="sleep" value={form.sleep} onChange={onChange}>
                <option value="ne">Ne</option>
                <option value="da">Da</option>
              </select>
            </label>

            {form.sleep === "da" && (
              <label>
                Koča (v bližini poti):
                <select name="hut" value={form.hut} onChange={onChange}>
                  <option value="">— izberi kočo —</option>
                  {allHuts.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Predlagane poti {form.hut ? `(koča: ${form.hut})` : "(vse)"}:
              <select
                name="route"
                value={form.route}
                onChange={onChange}
              >
                <option value="">— izberi pot —</option>
                {suggestedRoutes.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} {r.time ? `· ${r.time}` : ""} {r.elevation ? `· +${r.elevation} m` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Prevoz:
              <select name="transport" value={form.transport} onChange={onChange}>
                <option value="">— izberi prevoz —</option>
                <option value="avto">Avto</option>
                <option value="javni">Javni prevoz</option>
              </select>
            </label>

            {/* IZBOR MAP TILER SLOGA */}
            <label>
              Slog zemljevida:
              <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
                {MAPTILER_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>

            {/* AVTO: start lokacija + izračun vožnje */}
            {form.transport === "avto" && (
              <>
                <label>
                  Start lokacija (avto):
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="npr. Ljubljana, Kranj …"
                  />
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (
                        !selectedRoute?.start ||
                        typeof selectedRoute.start.lat !== "number" ||
                        typeof selectedRoute.start.lng !== "number"
                      ) {
                        alert("Izberi pot (izhodišče).");
                        return;
                      }
                      setDriveCoords([]);
                      setDriveInfo(null);

                      // 1) iz geokodiranja dobimo origin (A)
                      const from = await geocode(origin);
                      setOriginCoord([from.lng, from.lat]);

                      // 2) cilj vožnje = override (parkirišče) ali start peš poti
                      const key = `${mountain.name}::${selectedRoute.name}`;
                      const driveTarget = DRIVE_OVERRIDES[key] || selectedRoute.start; // {lat,lng}

                      // 3) “snap” obeh točk na cesto (stabilen routing)
                      const A = await snapToRoad(from.lng, from.lat);
                      const B = await snapToRoad(driveTarget.lng, driveTarget.lat);

                      // 4) OSRM vožnja A->B (radiuses poveča toleranco za snap)
                      const url =
                        `https://router.project-osrm.org/route/v1/driving/` +
                        `${A.lng},${A.lat};${B.lng},${B.lat}` +
                        `?overview=full&geometries=geojson&radiuses=5000;5000`;
                      const res = await fetch(url);
                      const json = await res.json();
                      const r = json?.routes?.[0];
                      if (!r) throw new Error("Vožnje ni mogoče izračunati.");

                      setDriveCoords(Array.isArray(r.geometry?.coordinates) ? r.geometry.coordinates : []);
                      setDriveInfo({
                        distance_km: Math.round((r.distance / 1000) * 10) / 10,
                        duration_min: Math.round(r.duration / 60),
                      });
                    } catch (e) {
                      console.error(e);
                      alert(e.message || "Napaka pri izračunu vožnje.");
                    }
                  }}
                >
                  Pokaži celoten načrt (avto + peš)
                </button>
                {driveInfo && (
                  <div style={{ fontSize: 14, color: "#555" }}>
                    Vožnja: ~{driveInfo.distance_km} km, ~{driveInfo.duration_min} min (OSRM).
                  </div>
                )}
              </>
            )}

            {/* JAVNI PREVOZ: hitre povezave */}
            {form.transport === "javni" && selectedRoute?.start && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    const g = new URL("https://www.google.com/maps/dir/");
                    g.searchParams.set("api", "1");
                    g.searchParams.set("origin", origin || "Ljubljana");
                    g.searchParams.set("destination", `${selectedRoute.start.lat},${selectedRoute.start.lng}`);
                    g.searchParams.set("travelmode", "transit");
                    window.open(g.toString(), "_blank");
                  }}
                >
                  Google Transit
                </button>
                <button type="button" onClick={() => window.open("https://www.ap-ljubljana.si", "_blank")}>
                  Avtobusi (AP Ljubljana)
                </button>
                <button type="button" onClick={() => window.open("https://potniski.sz.si", "_blank")}>
                  Vlaki (SŽ)
                </button>
              </div>
            )}

            {/* Hitra navigacija (le do izhodišča) */}
            {selectedRoute && (
              <>
                <div style={{ fontSize: 14, color: "#555" }}>
                  Izhodišče: {selectedRoute.start?.label || "—"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => openMaps(selectedRoute.start.lat, selectedRoute.start.lng, "driving")}
                  >
                    Navigacija (avto)
                  </button>
                  <button
                    type="button"
                    onClick={() => openMaps(selectedRoute.start.lat, selectedRoute.start.lng, "transit")}
                  >
                    Navigacija (javni)
                  </button>
                </div>
              </>
            )}

            <button type="submit">Potrdi rezervacijo</button>
          </form>

          {/* 3D prikaz iz GeoJSON sledi + (po potrebi) avto linija */}
          {routeCoords.length > 1 && (
            <section style={{ marginTop: 24 }}>
              <h2 style={{ marginBottom: 8 }}>3D načrt poti</h2>
              <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
                <Map3D
                  apiKey={MAP_KEY}
                  center={mapCenter}
                  routeCoords={routeCoords}
                  driveCoords={driveCoords}
                  originCoord={originCoord}
                  originLabel={origin || "Start"}
                  startLabel={selectedRoute?.start?.label || "Izhodišče"}
                  summitLabel={mountain?.name ? `${mountain.name} (vrh)` : "Vrh"}
                  height="420px"
                  mapStyle={mapStyle}
                />
              </div>
              {selectedRoute && routeHutsCache[selectedRoute.name]?.length ? (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  Koče na tej poti: <strong>{routeHutsCache[selectedRoute.name].join(", ")}</strong>
                </p>
              ) : null}
            </section>
          )}
        </>
      )}
    </div>
  );
}
