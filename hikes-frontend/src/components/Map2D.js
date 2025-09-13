// src/components/Map2D.js
import React from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ParkingLayer from "./ParkingLayer";

function FitToGeoJSON({ data }) {
  const map = useMap();
  React.useEffect(() => {
    if (!data) return;
    const bounds = [];
    const walk = (coords) => {
      if (typeof coords[0] === "number") bounds.push([coords[1], coords[0]]);
      else coords.forEach(walk);
    };
    if (data.type === "FeatureCollection") data.features.forEach(f => walk(f.geometry.coordinates));
    else if (data.type === "Feature") walk(data.geometry.coordinates);
    else walk(data.coordinates);
    if (bounds.length) map.fitBounds(bounds, { padding: [20, 20] });
  }, [data, map]);
  return null;
}

export default function Map2D({ geojsonUrl, start, showParking = true }) {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch(geojsonUrl).then(r => r.json()).then(setData).catch(console.error);
  }, [geojsonUrl]);

  return (
    <MapContainer style={{ height: 500, width: "100%" }} center={[46.05, 14.5]} zoom={9}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data && <GeoJSON data={data} />}
      {data && <FitToGeoJSON data={data} />}
      {start && (
        <Marker position={[start.lat, start.lng]}>
          <Popup>{start.name || "Izhodišče"}</Popup>
        </Marker>
      )}
      {showParking && start && (
        <ParkingLayer center={{ lat: start.lat, lng: start.lng }} radius={2000} />
      )}
    </MapContainer>
  );
}
