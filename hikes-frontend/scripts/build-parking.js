// scripts/build-parking.js
const fs = require("fs");
const path = require("path");

const routesDir = path.join(__dirname, "../public/routes");
const outFile = path.join(__dirname, "../public/parking_manifest.json");

if (!fs.existsSync(routesDir)) {
  console.error("Ni mape public/routes – dodaj .geojson sledi.");
  process.exit(1);
}

const manifest = {};
const files = fs.readdirSync(routesDir).filter((f) => f.endsWith(".geojson"));

files.forEach((file) => {
  const geo = JSON.parse(fs.readFileSync(path.join(routesDir, file), "utf8"));

  let start = null;

  const readLineStart = (g) => {
    if (!g) return null;
    if (g.type === "LineString") return g.coordinates?.[0];
    if (g.type === "MultiLineString") return g.coordinates?.[0]?.[0];
    return null;
  };

  if (geo.type === "FeatureCollection") {
    for (const f of geo.features || []) {
      start = readLineStart(f.geometry);
      if (start) break;
    }
  } else if (geo.type === "Feature") {
    start = readLineStart(geo.geometry);
  } else {
    start = readLineStart(geo);
  }

  if (Array.isArray(start)) {
    const name = file.replace(/\.geojson$/i, "");
    manifest[name] = { start: { lng: start[0], lat: start[1] } };
    console.log(`✔ ${name}: start → ${start[1]}, ${start[0]}`);
  } else {
    console.warn(`✖ Preskočim ${file}: ne najdem začetne točke`);
  }
});

fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
console.log(`\n✅ Zapisano v ${outFile}`);
