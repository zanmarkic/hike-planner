// src/pages/OrganizeTour.js
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import mountains from "../data/mountains";
import Map3D from "../components/Map3D";

/* ---------------- helpers ---------------- */
function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function guessFilePath(mountainName, routeName) {
  return `/routes/${slugify(mountainName)}-${slugify(routeName)}.geojson`;
}

// MapTiler slogi
const MAP_STYLES = [
  { id: "outdoor", label: "Outdoor (planinski)" },
  { id: "topo-v2", label: "Topo v2" },
  { id: "winter", label: "Winter" },
  { id: "satellite", label: "Satellite" },
  { id: "hybrid", label: "Hybrid" },
];

/* Robustno branje parkirišč (JSON only + ogledala + lep error) */
async function fetchParkingNearby(lat, lng, radius = 3000) {
  const mirrors = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.fr/api/interpreter",
  ];
  const query = `
[out:json][timeout:25];
(
  node["amenity"~"^parking(|_entrance|_space)$"](around:${radius},${lat},${lng});
  way["amenity"="parking"](around:${radius},${lat},${lng});
  relation["amenity"="parking"](around:${radius},${lat},${lng});
);
out center tags qt 200;
`;
  let lastErr;
  for (const base of mirrors) {
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        body: "data=" + encodeURIComponent(query),
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        if (text.trim().startsWith("<")) {
          throw new Error("Overpass je vrnil HTML/XML (rate limit ali napaka strežnika).");
        }
        throw e;
      }
      const elems = Array.isArray(json.elements) ? json.elements : [];
      return elems
        .map((e) => {
          const plat = e.lat ?? e.center?.lat;
          const plon = e.lon ?? e.center?.lon;
          if (typeof plat !== "number" || typeof plon !== "number") return null;
          const t = e.tags || {};
          return {
            lat: plat,
            lng: plon,
            name: t.name || t.operator || "Parkirišče",
            capacity: t.capacity ? Number(t.capacity) : undefined,
            fee: t.fee,
            surface: t.surface,
          };
        })
        .filter(Boolean);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Overpass ni dosegljiv.");
}

/* Združevanje bližnjih parkirišč v en marker */
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function clusterParkings(points, threshold = 120) {
  const used = new Array(points.length).fill(false);
  const clusters = [];
  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue;
    const seed = points[i];
    const group = [seed];
    used[i] = true;
    for (let j = i + 1; j < points.length; j++) {
      if (used[j]) continue;
      if (distanceMeters(seed, points[j]) <= threshold) {
        used[j] = true;
        group.push(points[j]);
      }
    }
    const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;
    const capacity =
      group
        .map((p) => p.capacity)
        .filter((x) => Number.isFinite(x))
        .reduce((a, b) => a + b, 0) || undefined;
    const fees = [...new Set(group.map((p) => p.fee).filter(Boolean))];
    const surfaces = [...new Set(group.map((p) => p.surface).filter(Boolean))];
    clusters.push({
      lat,
      lng,
      name:
        group.length === 1
          ? group[0].name || "Parkirišče"
          : `${group[0].name || "Parkirišče"} (×${group.length})`,
      capacity,
      fee: fees[0],
      surface: surfaces[0],
    });
  }
  return clusters;
}

/* ---------------- component ---------------- */
export default function OrganizeTour() {
  const [sp] = useSearchParams();
  const mountainName = sp.get("m") || "";
  const mountain = useMemo(
    () => mountains.find((m) => m.name === mountainName),
    [mountainName]
  );

  /* -------- obrazec -------- */
  const [form, setForm] = useState({
    people: "",
    dateFrom: "",
    dateTo: "",
    sleep: "ne",
    hut: "",           // dodano: izbrana koča
    transport: "",
    route: "",         // izbrana pot (nič privzeto)
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "sleep" && value === "ne") {
      setForm((prev) => ({ ...prev, sleep: "ne", hut: "" })); // ko ne spimo, počisti kočo
      return;
    }
    if (name === "dateFrom" && form.dateTo && value && value > form.dateTo) {
      setForm((prev) => ({ ...prev, dateFrom: value, dateTo: value }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // slog zemljevida
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].id);

  /* -------- poti & koče -------- */
  const allRoutes = useMemo(() => (mountain?.routes || []), [mountain]);

  // vse koče na gori (unikatni seznam)
  const allHuts = useMemo(() => {
    if (!mountain) return [];
    const s = new Set();
    allRoutes.forEach((r) => (r.huts || []).forEach((h) => s.add(h)));
    return Array.from(s);
  }, [mountain, allRoutes]);

  // filtrirane poti: če je izbrana koča in spanje = da, pokaži samo poti, ki vsebujejo kočo
  const filteredRoutes = useMemo(() => {
    if (!mountain) return [];
    if (form.sleep === "da" && form.hut) {
      return allRoutes.filter((r) => (r.huts || []).includes(form.hut));
    }
    return allRoutes;
  }, [mountain, allRoutes, form.sleep, form.hut]);

  // če trenutna izbrana pot ne ustreza filtru, jo počisti
  useEffect(() => {
    if (form.route && !filteredRoutes.some((r) => r.name === form.route)) {
      setForm((prev) => ({ ...prev, route: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hut, form.sleep, mountain]);

  // izbrana pot: NI več privzete (dokler uporabnik ne izbere)
  const selectedRoute = useMemo(() => {
    if (!mountain) return null;
    if (!form.route) return null;
    return allRoutes.find((r) => r.name === form.route) || null;
  }, [mountain, allRoutes, form.route]);

  /* -------- GeoJSON sledi -------- */
  const [routeCoords, setRouteCoords] = useState([]); // [[lng,lat],...]
  const [routeKey, setRouteKey] = useState("");

  useEffect(() => {
    setRouteCoords([]);
    if (!selectedRoute || !mountain) return;
    const file =
      selectedRoute.file || guessFilePath(mountain.name, selectedRoute.name);
    const key = file.split("/").pop().replace(".geojson", "");
    setRouteKey(key);

    fetch(file)
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`GeoJSON not found: ${file}`))
      )
      .then((geo) => {
        let coords = [];
        const pushLine = (g) => {
          if (!g) return;
          if (g.type === "LineString") coords.push(...g.coordinates);
          if (g.type === "MultiLineString")
            g.coordinates.forEach((c) => coords.push(...c));
        };
        if (geo.type === "FeatureCollection")
          (geo.features || []).forEach((f) => pushLine(f.geometry));
        else if (geo.type === "Feature") pushLine(geo.geometry);
        else pushLine(geo);
        setRouteCoords(coords || []);
      })
      .catch(() => setRouteCoords([]));
  }, [selectedRoute, mountain]);

  /* -------- parking manifest (izhodišče) -------- */
  const [parkingManifest, setParkingManifest] = useState({});
  useEffect(() => {
    fetch("/parking_manifest.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setParkingManifest)
      .catch(() => setParkingManifest({}));
  }, []);

  // izhodišče vožnje (samo če je izbrana pot)
  const driveTarget = useMemo(() => {
    if (!selectedRoute) return null;
    const m = parkingManifest?.[routeKey]?.start;
    if (m && typeof m.lat === "number" && typeof m.lng === "number") {
      return { lat: m.lat, lng: m.lng, label: parkingManifest?.[routeKey]?.label || selectedRoute.start?.label || "Izhodišče" };
    }
    if (selectedRoute.start?.lat && selectedRoute.start?.lng) {
      return { lat: selectedRoute.start.lat, lng: selectedRoute.start.lng, label: selectedRoute.start.label || "Izhodišče" };
    }
    if (routeCoords.length) {
      return { lat: routeCoords[0][1], lng: routeCoords[0][0], label: "Izhodišče" };
    }
    return null;
  }, [parkingManifest, routeKey, selectedRoute, routeCoords]);

  /* -------- “celoten načrt (avto + peš)” -------- */
  const [startLocation, setStartLocation] = useState("Ljubljana");
  const [originCoord, setOriginCoord] = useState(null);
  const [driveCoords, setDriveCoords] = useState([]);
  const [driveSummary, setDriveSummary] = useState(null);

  async function geocodePlace(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "sl" } });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error("Lokacije ni mogoče najti.");
    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  }

  async function fetchOSRMRoute(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route) throw new Error("OSRM ni vrnil poti.");
    const coords = route.geometry.coordinates;
    return { coords, summary: { distance: route.distance, duration: route.duration } };
  }

  const buildFullPlan = async () => {
    try {
      if (!driveTarget) return;
      const from = await geocodePlace(startLocation);
      setOriginCoord(from);
      const osrm = await fetchOSRMRoute(from, { lat: driveTarget.lat, lng: driveTarget.lng });
      setDriveCoords(osrm.coords);
      setDriveSummary(osrm.summary);
    } catch (e) {
      console.error(e);
      alert("Ne morem zgraditi avtomobilske poti. Poskusi z drugim krajem.");
      setDriveCoords([]);
      setDriveSummary(null);
    }
  };

  /* -------- parkirišča (progresivni radij + združevanje) -------- */
  const [parkingList, setParkingList] = useState([]);
  const [parkingError, setParkingError] = useState(null);

  useEffect(() => {
    if (!driveTarget?.lat || !driveTarget?.lng) return;
    let cancelled = false;
    setParkingError(null);
    setParkingList([]);

    (async () => {
      try {
        const radii = [500, 1000, 2000, 3000];
        let found = [];
        for (const r of radii) {
          const list = await fetchParkingNearby(driveTarget.lat, driveTarget.lng, r);
          if (list.length > 0) { found = list; break; }
        }
        const clustered = clusterParkings(found, 120);
        if (!cancelled) setParkingList(clustered);
      } catch (e) {
        if (!cancelled) setParkingError(e.message || "Napaka pri branju parkirišč.");
      }
    })();

    return () => { cancelled = true; };
  }, [driveTarget?.lat, driveTarget?.lng]);

  /* -------- ostalo -------- */
  const nights = useMemo(() => {
    if (!form.dateFrom || !form.dateTo) return 0;
    const from = new Date(form.dateFrom);
    const to = new Date(form.dateTo);
    const diff = (to - from) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  }, [form.dateFrom, form.dateTo]);

  const mapCenter = useMemo(() => {
    if (routeCoords.length) return routeCoords[0];
    if (selectedRoute?.start) return [selectedRoute.start.lng, selectedRoute.start.lat];
    return [14.5, 46.05]; // generični center SLO
  }, [routeCoords, selectedRoute]);

  /* -------- render -------- */
  if (!mountain) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Organiziraj turo</h1>
        <p>Ni podatkov o hribu. Odpri iz podrobnosti gore (gumb “Organiziraj turo”).</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Organiziraj turo za {mountain.name}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.people || !form.dateFrom || !form.dateTo || !form.transport) {
            alert("Prosimo, izpolni število ljudi, datum OD/DO in prevoz.");
            return;
          }
          if (form.dateTo < form.dateFrom) {
            alert("Datum DO ne sme biti pred datumom OD.");
            return;
          }
          const sleepText = form.sleep === "da" ? "DA" : "NE";
          alert(
            [
              `Tura potrjena!`,
              `Gora: ${mountain.name}`,
              `Ljudje: ${form.people}`,
              `Obdobje: ${form.dateFrom} → ${form.dateTo} (${nights} noč/i)`,
              `Spanje: ${sleepText}`,
              form.sleep === "da" && form.hut ? `Koča: ${form.hut}` : null,
              `Prevoz: ${form.transport}`,
              selectedRoute ? `Pot: ${selectedRoute.name}` : null,
            ].filter(Boolean).join("\n")
          );
        }}
        style={{ display: "grid", gap: 12, maxWidth: 560 }}
      >
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

        <label>
          Ali želite spati?
          <select name="sleep" value={form.sleep} onChange={onChange}>
            <option value="ne">Ne</option>
            <option value="da">Da</option>
          </select>
        </label>

        {form.sleep === "da" && (
          <label>
            Izberi kočo:
            <select name="hut" value={form.hut} onChange={onChange}>
              <option value="">— izberi kočo —</option>
              {allHuts.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
        )}

        <label>
          Predlagane poti (vse):
          <select name="route" value={form.route} onChange={onChange}>
            <option value="">— izberi pot —</option>
            {filteredRoutes.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} {r.time ? `· ${r.time}` : ""} {r.elevation ? `· +${r.elevation} m` : ""}
              </option>
            ))}
          </select>
        </label>
        {form.sleep === "da" && form.hut && filteredRoutes.length === 0 && (
          <div style={{ color: "#b91c1c", fontSize: 13 }}>
            Za izbrano kočo ni poti na tem vrhu. Izberi drugo kočo ali odstrani filter.
          </div>
        )}

        <label>
          Prevoz:
          <select name="transport" value={form.transport} onChange={onChange}>
            <option value="">— izberi prevoz —</option>
            <option value="avto">Avto</option>
            <option value="javni">Javni prevoz</option>
          </select>
        </label>

        <label>
          Slog zemljevida:
          <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)}>
            {MAP_STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>

        <label>
          Start lokacija (avto):
          <input type="text" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} placeholder="npr. Ljubljana" />
        </label>

        <button type="button" onClick={buildFullPlan} disabled={!driveTarget || !startLocation}>
          Pokaži celoten načrt (avto + peš)
        </button>

        <div style={{ fontSize: 14, color: "#555" }}>
          Izhodišče: {driveTarget?.label || selectedRoute?.start?.label || "—"}
          {driveSummary && (
            <> · Vožnja: ~{(driveSummary.distance / 1000).toFixed(1)} km, ~{Math.round(driveSummary.duration / 60)} min (OSRM)</>
          )}
        </div>

        <button type="submit">Potrdi rezervacijo</button>
      </form>

      {/* 3D mapa je vedno vidna – če ni poti, se prikaže samo podlaga */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>3D načrt poti</h2>
        {!form.route && (
          <div style={{ marginBottom: 8, color: "#666" }}>
            Izberi pot (po želji filtriraj kočo), da se nariše sled na zemljevidu.
          </div>
        )}
        <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
          <Map3D
            apiKey={process.env.REACT_APP_MAPTILER_KEY || "TVOJ_KLJUČ"}
            center={mapCenter}
            routeCoords={routeCoords}
            originCoord={originCoord}
            driveCoords={driveCoords}
            startLabel={driveTarget?.label || selectedRoute?.start?.label || "Izhodišče"}
            originLabel={startLocation || "Start"}
            summitLabel={mountain?.name ? `${mountain.name} (vrh)` : "Vrh"}
            height="420px"
            mapStyle={mapStyle}
            parkingPoints={parkingList}
          />
        </div>
      </section>

      {/* Parkirišča seznam */}
      <section style={{ marginTop: 24 }}>
        <h2>Parkirišča v bližini izhodišča</h2>
        {parkingError && <div style={{ color: "#b91c1c", marginBottom: 8 }}>Parkirišč ni možno prebrati: {parkingError}</div>}
        {!parkingError && parkingList.length === 0 && <div>Ni najdenih parkirišč.</div>}
        {parkingList.length > 0 && (
          <ul style={{ marginTop: 8 }}>
            {parkingList.map((p, i) => (
              <li key={i}>
                {p.name} · {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                {p.capacity ? ` · 🅿️ ${p.capacity}` : ""} {p.fee ? ` · 💶 ${p.fee}` : ""} {p.surface ? ` · ${p.surface}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
