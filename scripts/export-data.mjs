// Generates public/ecosystem.json + public/ecosystem.geojson from src/data/assets.ts.
// Run: node scripts/export-data.mjs  (also runs automatically before `npm run build`)
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

const result = await build({
  entryPoints: ['src/data/assets.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const code = result.outputFiles[0].text;
const { ASSETS, PATHWAYS, CATEGORIES, CATEGORY_COLORS } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);

const site = 'https://builderworkshop.ca';
const generated = new Date().toISOString().slice(0, 10);

const players = ASSETS.map((a, i) => ({
  rank: i + 1,
  id: a.id,
  name: a.name,
  category: a.category,
  url: a.url,
  blurb: a.blurb,
  location: a.location,
  ...(a.lat !== undefined ? { lat: a.lat, lng: a.lng } : {}),
  ...(a.capabilities ? { capabilities: a.capabilities } : {}),
}));

const dataset = {
  name: 'Builder Workshop — BC innovation ecosystem directory',
  url: site,
  generated,
  license: 'CC BY 4.0 — credit builderworkshop.ca',
  count: players.length,
  categories: CATEGORIES,
  categoryColors: CATEGORY_COLORS,
  players,
  pathways: PATHWAYS.map((p) => ({
    id: p.id,
    name: p.name,
    blurb: p.blurb,
    stops: p.stops.map((sid) => players.find((pl) => pl.id === sid)?.name ?? sid),
  })),
};

writeFileSync('public/ecosystem.json', JSON.stringify(dataset, null, 2) + '\n');

const geojson = {
  type: 'FeatureCollection',
  name: 'builderworkshop.ca asset map',
  generated,
  features: players
    .filter((p) => p.lat !== undefined)
    .map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        rank: p.rank,
        id: p.id,
        name: p.name,
        category: p.category,
        url: p.url,
        location: p.location,
        ...(p.capabilities ? { capabilities: p.capabilities } : {}),
      },
    })),
};

writeFileSync('public/ecosystem.geojson', JSON.stringify(geojson, null, 2) + '\n');
console.log(`Wrote public/ecosystem.json (${players.length} players) and public/ecosystem.geojson (${geojson.features.length} points)`);
