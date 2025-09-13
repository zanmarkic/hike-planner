// src/components/ParkingLayer.js
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// preprost "P" icon
const parkingIcon = new L.DivIcon({
  className: "parking-divicon",
  html: '<div class="parking-badge">P</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// mini CSS (dodaš enkrat v App.css)
export const parkingCss = `
.parking-divicon .parking-badge {
  width: 26px; height: 26px; line-height: 26px;
  text-align: center; font-weight: 700; border-radius: 50%;
  background: white; border: 2px solid #2b6cb0; color: #2b6cb0;
  box-shadow: 0 1px 4px rgba(0,0,0,.25);
}
`;

async function fetchParkings({ lat, lng }, radius = 2000) {
  // Overpass QL: parkirišča v radiju (node/way/relation) + centroid (out center)
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="parking"](around:${radius},${lat},${lng});
      way["amenity"="parking"](around:${radius},${lat},${lng});
      relation["amenity"="parking"](around:${radius},${lat},${lng});
    );
    out center 50;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query }).toString(),
  });
  const json = await res.json();

  const features = (json.elements || []).map((el) => {
    // node ima lat/lon; way/relation imata center.lat/center.lon
    const latLng = el.type === "node"
      ? { lat: el.lat, lng: el.lon }
      : el.center
      ? { lat: el.center.lat, lng: el.center.lon }
      : null;

    return latLng
      ? {
          id: `${el.type}/${el.id}`,
          lat: latLng.lat,
          lng: latLng.lng,
          name: el.tags?.name || "Parkirišče",
          fee: el.tags?.fee,                // yes/no/...
          capacity: el.tags?.capacity,      // število mest (če obstaja)
          surface: el.tags?.surface,        // asfalt/gramoz ...
        }
      : null;
  }).filter(Boolean);

  // unikati (včasih vrne node + way iste lokacije)
  const key = (p) => `${p.lat.toFixed(5)}_${p.lng.toFixed(5)}`;
  const map = new Map();
  features.forEach((f) => { if (!map.has(key(f))) map.set(key(f), f); });
  return Array.from(map.values());
}

export default function ParkingLayer({ center, radius = 2000 }) {
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!center?.lat || !center?.lng) return;
    let dead = false;

    fetchParkings(center, radius)
      .then((list) => { if (!dead) setItems(list); })
      .catch((e) => { if (!dead) setError(e?.message || "Napaka pri branju parkirišč"); });

    return () => { dead = true; };
  }, [center, radius]);

  if (error) {
    // Ne motimo karte, samo tih fallback
    console.warn("ParkingLayer error:", error);
  }

  if (!items.length) return null;

  return (
    <>
      {items.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={parkingIcon}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{p.name}</strong>
              <div>📍 {p.lat.toFixed(5)}, {p.lng.toFixed(5)}</div>
              {p.capacity && <div>🅿️ Kapaciteta: {p.capacity}</div>}
              {p.fee && <div>💶 Plačilo: {p.fee}</div>}
              {p.surface && <div>🧱 Podlaga: {p.surface}</div>}
              <div style={{ marginTop: 8 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}
                  target="_blank" rel="noreferrer"
                >
                  Navigiraj do parkirišča 🚗
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
