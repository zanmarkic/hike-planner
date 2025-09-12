// src/pages/OrganizeTour.js
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import mountains from "../data/mountains";
import Map3D from "../components/Map3D";

// ---- helpers -------------------------------------------------
function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// /routes/<slug-gora>-<slug-pot>.geojson
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

export default function OrganizeTour() {
  const [sp] = useSearchParams();
  const mountainName = sp.get("m") || "";
  const mountain = useMemo(
    () => mountains.find((m) => m.name === mountainName),
    [mountainName]
  );

  // -------------------- obrazec --------------------
  const [form, setForm] = useState({
    people: "",
    dateFrom: "",
    dateTo: "",
    sleep: "ne",
    transport: "",
    route: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "sleep" && value === "ne") {
      setForm((prev) => ({ ...prev, sleep: "ne" }));
      return;
    }
    if (name === "dateFrom" && form.dateTo && value && value > form.dateTo) {
      setForm((prev) => ({ ...prev, dateFrom: value, dateTo: value }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Slog zemljevida
  const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].id); // "outdoor"

  // -------------------- poti --------------------
  const suggestedRoutes = useMemo(() => {
    if (!mountain) return [];
    return mountain.routes || [];
  }, [mountain]);

  const selectedRoute = useMemo(() => {
    if (!mountain) return null;
    const name = form.route || (suggestedRoutes[0]?.name ?? "");
    return (mountain.routes || []).find((r) => r.name === name) || null;
  }, [mountain, form.route, suggestedRoutes]);

  // -------------------- GeoJSON sledi --------------------
  const [routeCoords, setRouteCoords] = useState([]); // [[lng,lat],...]
  const [routeKey, setRouteKey] = useState(""); // npr. "triglav-krma"

  useEffect(() => {
    setRouteCoords([]);
    if (!selectedRoute || !mountain) return;

    const file =
      selectedRoute.file || guessFilePath(mountain.name, selectedRoute.name);

    // ključ manifesta = ime datoteke brez .geojson (npr. "triglav-krma")
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

  // -------------------- parking manifest (branje) -----------
  const [parkingManifest, setParkingManifest] = useState({});
  useEffect(() => {
    fetch("/parking_manifest.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setParkingManifest)
      .catch(() => setParkingManifest({}));
  }, []);

  // Cilj vožnje = start iz manifesta (po routeKey) -> fallback na route.start -> fallback na prvo točko sledi
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

  // -------------------- “celoten načrt (avto + peš)” --------------------
  const [startLocation, setStartLocation] = useState("Ljubljana");
  const [originCoord, setOriginCoord] = useState(null);     // {lat,lng}
  const [driveCoords, setDriveCoords] = useState([]);       // [[lng,lat],...]
  const [driveSummary, setDriveSummary] = useState(null);   // {distance, duration}

  // preprosta geolokacija (Nominatim)
  async function geocodePlace(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}`;
    const res = await fetch(url, { headers: { "Accept-Language": "sl" } });
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error("Lokacije ni mogoče najti.");
    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  }

  // vožnja z OSRM
  async function fetchOSRMRoute(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route) throw new Error("OSRM ni vrnil poti.");
    const coords = route.geometry.coordinates; // [[lng,lat], ...]
    return {
      coords,
      summary: { distance: route.distance, duration: route.duration },
    };
  }

  const buildFullPlan = async () => {
    try {
      if (!driveTarget) return;
      // 1) geocodiraj izvor
      const from = await geocodePlace(startLocation);
      setOriginCoord(from);
      // 2) osrm vožnja do izhodišča
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

  // -------------------- ostalo --------------------
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
    if (routeCoords.length) return routeCoords[0]; // [lng,lat]
    if (selectedRoute?.start) return [selectedRoute.start.lng, selectedRoute.start.lat];
    return [14.5, 46.05];
  }, [routeCoords, selectedRoute]);

  // -------------------- render --------------------
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
              `Prevoz: ${form.transport}`,
              selectedRoute ? `Pot: ${selectedRoute.name}` : null,
            ]
              .filter(Boolean)
              .join("\n")
          );
        }}
        style={{ display: "grid", gap: 12, maxWidth: 560 }}
      >
        <label>
          Število ljudi:
          <input
            type="number"
            min="1"
            name="people"
            value={form.people}
            onChange={onChange}
          />
        </label>

        <label>
          Datum OD:
          <input
            type="date"
            name="dateFrom"
            value={form.dateFrom}
            onChange={onChange}
            max={form.dateTo || undefined}
          />
        </label>

        <label>
          Datum DO:
          <input
            type="date"
            name="dateTo"
            value={form.dateTo}
            onChange={onChange}
            min={form.dateFrom || undefined}
          />
        </label>

        <label>
          Ali želite spati?
          <select name="sleep" value={form.sleep} onChange={onChange}>
            <option value="ne">Ne</option>
            <option value="da">Da</option>
          </select>
        </label>

        <label>
          Predlagane poti (vse):
          <select
            name="route"
            value={form.route}
            onChange={onChange}
          >
            <option value="">— izberi pot —</option>
            {suggestedRoutes.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} {r.time ? `· ${r.time}` : ""}{" "}
                {r.elevation ? `· +${r.elevation} m` : ""}
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

        <label>
          Slog zemljevida:
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
          >
            {MAP_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {/* Start lokacija za avtomobilsko pot */}
        <label>
          Start lokacija (avto):
          <input
            type="text"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="npr. Ljubljana"
          />
        </label>

        <button
          type="button"
          onClick={buildFullPlan}
          disabled={!driveTarget || !startLocation}
        >
          Pokaži celoten načrt (avto + peš)
        </button>

        <div style={{ fontSize: 14, color: "#555" }}>
          Izhodišče: {driveTarget?.label || selectedRoute?.start?.label || "—"}
          {driveSummary && (
            <>
              {" "}
              · Vožnja: ~{(driveSummary.distance / 1000).toFixed(1)} km, ~
              {Math.round(driveSummary.duration / 60)} min (OSRM)
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={!driveTarget}
            onClick={() =>
              driveTarget && openMaps(driveTarget.lat, driveTarget.lng, "driving")
            }
          >
            Navigacija (avto)
          </button>
          <button
            type="button"
            disabled={!driveTarget}
            onClick={() =>
              driveTarget && openMaps(driveTarget.lat, driveTarget.lng, "transit")
            }
          >
            Navigacija (javni)
          </button>
        </div>

        <button type="submit">Potrdi rezervacijo</button>
      </form>

      {/* 3D prikaz poti */}
      {routeCoords.length > 1 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 8 }}>3D načrt poti</h2>
          <div
            style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}
          >
            <Map3D
              apiKey={process.env.REACT_APP_MAPTILER_KEY || "TVOJ_KLJUČ"}
              center={mapCenter}
              routeCoords={routeCoords}    // rdeča peš pot
              originCoord={originCoord}     // moder marker (start)
              driveCoords={driveCoords}     // modra črtkana vožnja
              startLabel={driveTarget?.label || selectedRoute?.start?.label || "Izhodišče"}
              originLabel={startLocation || "Start"}
              summitLabel={
                mountain?.name ? `${mountain.name} (vrh)` : "Vrh"
              }
              height="420px"
              mapStyle={mapStyle}
            />
          </div>
        </section>
      )}
    </div>
  );
}
