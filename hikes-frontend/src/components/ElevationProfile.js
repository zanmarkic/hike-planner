import React, { useEffect, useMemo, useState } from "react";

/* ---------- utili ---------- */
const haversine = (a, b) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const la1 = toRad(a[1]);
  const la2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const pathLength = (coords) => {
  let L = 0;
  for (let i = 1; i < coords.length; i++) L += haversine(coords[i - 1], coords[i]);
  return L;
};
const clampOdd = (w, n, fallback) => {
  const v = Math.max(1, Math.min(n, Math.floor(w)));
  const odd = v % 2 === 1 ? v : v - 1;
  return Math.max(1, Math.min(n, odd || fallback));
};
const medianFilter = (arr, win) => {
  const n = arr.length;
  if (win <= 1 || n <= 2) return arr.slice();
  const r = Math.floor(win / 2);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - r);
    const b = Math.min(n - 1, i + r);
    const slice = arr.slice(a, b + 1).filter(Number.isFinite).sort((x, y) => x - y);
    out[i] = slice.length ? slice[Math.floor(slice.length / 2)] : arr[i];
  }
  return out;
};
const movingAverage = (arr, win) => {
  const n = arr.length;
  if (win <= 1 || n <= 2) return arr.slice();
  const r = Math.floor(win / 2);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - r);
    const b = Math.min(n - 1, i + r);
    let s = 0,
      c = 0;
    for (let j = a; j <= b; j++) {
      const v = arr[j];
      if (Number.isFinite(v)) { s += v; c++; }
    }
    out[i] = c ? s / c : arr[i];
  }
  return out;
};
/* deadband: akumuliramo samo, ko presežemo prag (m) – manj šuma, bolj realen vzpon/spust */
const gainLossWithDeadband = (ele, epsilon = 5) => {
  let up = 0, down = 0, acc = 0;
  for (let i = 1; i < ele.length; i++) {
    const d = ele[i] - ele[i - 1];
    acc += d;
    if (acc >= epsilon) { up += acc; acc = 0; }
    if (acc <= -epsilon) { down -= acc; acc = 0; }
  }
  return { gain: Math.round(up), loss: Math.round(down) };
};

/* ---------- DEM ponudniki (fallbacki) ---------- */
async function fetchOpenElevation(batch) {
  const res = await fetch("https://api.open-elevation.com/api/v1/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locations: batch }),
  });
  if (!res.ok) throw new Error("Open-Elevation HTTP " + res.status);
  const json = await res.json();
  return (json?.results || []).map((r) => r.elevation);
}
async function fetchOpenTopoData(batch) {
  const qs = batch.map((p) => `${p.latitude},${p.longitude}`).join("|");
  const url = `https://api.opentopodata.org/v1/srtm90m?locations=${encodeURIComponent(qs)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OpenTopoData HTTP " + res.status);
  const json = await res.json();
  return (json?.results || []).map((r) => r.elevation);
}
async function fetchElevations(locations) {
  const chunkSize = 100;
  const out = [];
  for (let i = 0; i < locations.length; i += chunkSize) {
    const chunk = locations.slice(i, i + chunkSize);
    let ok = false, vals;
    let attempt = 0;
    while (!ok && attempt < 3) {
      try { vals = await fetchOpenTopoData(chunk); ok = true; }
      catch { attempt++; if (attempt < 3) await new Promise(r => setTimeout(r, 300 * attempt * attempt)); }
    }
    if (!ok) vals = await fetchOpenElevation(chunk);
    out.push(...vals);
  }
  return out;
}

/* ---------- graf ---------- */
function Chart({ dist, ele, height = 160 }) {
  if (!Array.isArray(ele) || ele.length < 2 || !Array.isArray(dist) || dist.length !== ele.length) return null;
  const padding = { top: 8, right: 8, bottom: 18, left: 36 };
  const W = 700, H = height;

  const minEle = Math.min(...ele), maxEle = Math.max(...ele);
  const minX = dist[0], maxX = dist[dist.length - 1] || 1;

  const sx = (x) => padding.left + ((x - minX) / (maxX - minX)) * (W - padding.left - padding.right);
  const sy = (y) => padding.top + (1 - (y - minEle) / Math.max(1, maxEle - minEle)) * (H - padding.top - padding.bottom);

  let d = "";
  for (let i = 0; i < ele.length; i++) {
    const x = sx(dist[i]), y = sy(ele[i]);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  const area = `${d} L ${sx(maxX)} ${sy(minEle)} L ${sx(minX)} ${sy(minEle)} Z`;

  const ticks = 3;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round(minEle + (i * (maxEle - minEle)) / ticks));

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padding.left} x2={W - padding.right} y1={sy(t)} y2={sy(t)} stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={sy(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6b7280">{t} m</text>
          </g>
        ))}
        <path d={area} fill="#bfdbfe" opacity="0.85" />
        <path d={d} fill="none" stroke="#1d4ed8" strokeWidth="2" />
        <text x={padding.left} y={H - 4} textAnchor="start" fontSize="11" fill="#6b7280">0 km</text>
        <text x={W - padding.right} y={H - 4} textAnchor="end" fontSize="11" fill="#6b7280">{(maxX / 1000).toFixed(1)} km</text>
      </svg>
    </div>
  );
}

/* ---------- glavna komponenta ---------- */
/**
 * props:
 *  - coords: [[lng,lat] | [lng,lat,ele], ...]  (ORIGINALNA, polna sled)
 *  - maxSamples?: št. vzorcev za elevation API (privzeto 180)
 *  - medianWindow?: liho (privzeto 7)
 *  - averageWindow?: liho (privzeto 11)
 *  - deadband?: m za vzpon/spust (privzeto 5)
 *  - summitOverride?: številka (npr. uradna višina vrha iz baze)
 */
export default function ElevationProfile({
  coords = [],
  maxSamples = 180,
  medianWindow = 7,
  averageWindow = 11,
  deadband = 5,
  summitOverride,
}) {
  const [elev, setElev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const hasEmbeddedEle = useMemo(
    () => Array.isArray(coords) && coords.some((c) => Array.isArray(c) && c.length >= 3 && Number.isFinite(c[2])),
    [coords]
  );

  // vzorčenje samo za klice na DEM
  const sampled = useMemo(() => {
    if (!Array.isArray(coords) || coords.length < 2) return [];
    const n = coords.length;
    if (n <= maxSamples) return coords;
    const step = (n - 1) / (maxSamples - 1);
    const out = [];
    for (let i = 0; i < maxSamples; i++) {
      const idx = Math.round(i * step);
      out.push(coords[Math.min(idx, n - 1)]);
    }
    return out;
  }, [coords, maxSamples]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null); setElev(null);
      try {
        if (coords.length < 2) { setLoading(false); return; }

        // 1) ele za vzorce
        let eleRaw = null;
        if (hasEmbeddedEle) {
          eleRaw = sampled.map((c) => (Number.isFinite(c[2]) ? c[2] : null));
          const miss = eleRaw.map((v, i) => (v == null ? i : -1)).filter((i) => i !== -1);
          if (miss.length) {
            const toLookup = miss.map((i) => ({ latitude: sampled[i][1], longitude: sampled[i][0] }));
            const fetched = await fetchElevations(toLookup);
            miss.forEach((i, k) => (eleRaw[i] = fetched[k]));
          }
        } else {
          const locs = sampled.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          eleRaw = await fetchElevations(locs);
        }

        // 2) gladitev
        const n = eleRaw.length;
        const mWin = clampOdd(medianWindow, n, 7);
        const aWin = clampOdd(averageWindow, n, 11);
        const eleMed = medianFilter(eleRaw, mWin);
        const eleSmooth = movingAverage(eleMed, aWin);

        // 3) razdalje
        // 3a) prave: po originalni sledi (brez DEM klicev)
        const totalLenFull = pathLength(coords);           // to prikazujemo
        // 3b) razdalje med vzorci (za x-os grafa)
        const distSample = [0];
        let tmp = 0;
        for (let i = 1; i < sampled.length; i++) {
          tmp += haversine(sampled[i - 1], sampled[i]);
          distSample.push(tmp);
        }
        // skala: poravnamo x-os na PRAVO razdaljo
        const scale = distSample[distSample.length - 1] > 0 ? totalLenFull / distSample[distSample.length - 1] : 1;
        const distScaled = distSample.map((d) => d * scale);

        // 4) vzpon/spust po zglajenem profilu + deadband
        const { gain, loss } = gainLossWithDeadband(eleSmooth, deadband);

        // 5) izhodišče in vrh (originalne/uradne vrednosti)
        const startEle = Math.round(eleRaw[0]);
        let endEle = Math.round(eleRaw[eleRaw.length - 1]);
        if (Number.isFinite(summitOverride) && summitOverride > startEle) {
          endEle = Math.round(summitOverride);
        }
        const netDiff = endEle - startEle;

        if (!cancelled) {
          setElev({
            dist: distScaled,
            eleSmooth,
            startEle,
            endEle,
            netDiff: Math.round(netDiff),
            gain,
            loss,
            totalAbs: Math.round(gain + loss),
            length: Math.round(totalLenFull), // v metrih
            mWin, aWin,
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Napaka pri profilu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [coords, sampled, hasEmbeddedEle, medianWindow, averageWindow, deadband, summitOverride]);

  const fmtSigned = (n) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : "0");

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ marginBottom: 8, display: "flex", gap: 16, rowGap: 6, flexWrap: "wrap", fontSize: 14 }}>
        {loading ? (
          <span>Pridobivam višine…</span>
        ) : err ? (
          <span style={{ color: "#b91c1c" }}>Profil ni na voljo: {err}</span>
        ) : elev ? (
          <>
            <span>Dolžina: <strong>{(elev.length / 1000).toFixed(2)} km</strong></span>
            <span>Izhodišče: <strong>{elev.startEle} m</strong></span>
            <span>Vrh: <strong>{elev.endEle} m</strong></span>
            <span>Razlika (izhodišče → vrh): <strong>{fmtSigned(elev.netDiff)} m</strong></span>
            <span>Skupni vzpon: <strong>+{elev.gain} m</strong></span>
            <span>Skupni spust: <strong>−{elev.loss} m</strong></span>
            <span>Skupna višinska sprememba (|Δ|): <strong>{elev.gain + elev.loss} m</strong></span>
            <span style={{ color: "#6b7280" }}>
              Glajenje: mediana {elev.mWin} · povprečje {elev.aWin}
            </span>
          </>
        ) : (
          <span>Profil ni na voljo</span>
        )}
      </div>

      {elev?.eleSmooth &&
        Array.isArray(elev.eleSmooth) &&
        elev.eleSmooth.length > 1 &&
        Array.isArray(elev.dist) &&
        elev.dist.length === elev.eleSmooth.length && (
          <Chart dist={elev.dist} ele={elev.eleSmooth} height={160} />
      )}

      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        Višine: GeoJSON (če <code>[lng,lat,ele]</code>) ali DEM (OpenTopoData SRTM90m, fallback Open-Elevation).
        Razdalja je izračunana po **celotni** sledi; grafa je poravnan (skalan) nanjo.
        Vzpon/spust sta iz zglajenega profila (mediana + povprečje) z deadbandom {deadband} m.
      </div>
    </div>
  );
}
