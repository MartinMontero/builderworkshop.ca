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
const { ASSETS, PATHWAYS, CATEGORIES, CATEGORY_COLORS, STAGES, STAGE_COLORS, CAPABILITY_LABELS } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);

const site = 'https://builderworkshop.ca';
const generated = new Date().toISOString().slice(0, 10);

const players = ASSETS.map((a, i) => ({
  rank: i + 1,
  id: a.id,
  name: a.name,
  category: a.category,
  stages: a.stages,
  url: a.url,
  blurb: a.blurb,
  location: a.location,
  ...(a.verified ? { verified: a.verified } : {}),
  ...(a.lat !== undefined ? { lat: a.lat, lng: a.lng } : {}),
  ...(a.capabilities ? { capabilities: a.capabilities } : {}),
  // Closed entries stay in the open data with the date and reason recorded.
  // The map is what still exists; the export is what existed.
  ...(a.closed ? { closed: a.closed } : {}),
}));

const active = players.filter((p) => !p.closed);

// The fields downstream consumers may build on. Anything not listed here may
// change shape without notice. Breaking one of these means bumping
// schemaVersion — scripts/ecosystem-contract.test.mjs fails the build otherwise.
const SCHEMA_VERSION = 1;
const CONTRACT = {
  id: 'string',
  lat: 'number | absent',
  lng: 'number | absent',
  closed: '{ date: "YYYY-MM", note: string } | absent',
};

const dataset = {
  name: 'Builder Workshop — BC innovation ecosystem directory',
  url: site,
  generated,
  license: 'CC BY 4.0 — credit builderworkshop.ca',
  schemaVersion: SCHEMA_VERSION,
  contract: CONTRACT,
  count: active.length,
  closedCount: players.length - active.length,
  categories: CATEGORIES,
  categoryColors: CATEGORY_COLORS,
  stages: STAGES,
  stageColors: STAGE_COLORS,
  // The vocabulary `capabilities` draws from. Published because the geojson
  // contract pins capability values as keys of this map — a contract that
  // names a vocabulary has to ship the vocabulary.
  capabilityLabels: CAPABILITY_LABELS,
  players,
  pathways: PATHWAYS.map((p) => ({
    id: p.id,
    name: p.name,
    blurb: p.blurb,
    stops: p.stops.map((sid) => players.find((pl) => pl.id === sid)?.name ?? sid),
  })),
};

writeFileSync('public/ecosystem.json', JSON.stringify(dataset, null, 2) + '\n');

/*
  The geojson carries its own version, deliberately not shared with the JSON's.
  The two files can diverge — a change to one need not touch the other — and a
  single version would either force a meaningless bump or imply a coupling that
  does not exist.

  The asymmetry in `features` is the point of this file: it is pre-filtered to
  mapped, active entries, so a map consumer never needs the closed filter that
  ecosystem.json requires. That is the reason to choose this file over that one.
*/
const GEOJSON_SCHEMA_VERSION = 1;
const GEOJSON_CONTRACT = {
  'geometry.coordinates': '[lng, lat]',
  'properties.id': 'string — joins to ecosystem.json players[].id',
  'properties.name': 'string',
  'properties.capabilities': 'string[] | absent — values are keys of ecosystem.json capabilityLabels',
  features: 'mapped, active entries only — closed are excluded, no filtering needed',
};

const geojson = {
  type: 'FeatureCollection',
  name: 'builderworkshop.ca asset map',
  generated,
  schemaVersion: GEOJSON_SCHEMA_VERSION,
  contract: GEOJSON_CONTRACT,
  features: active
    .filter((p) => p.lat !== undefined)
    .map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        rank: p.rank,
        id: p.id,
        name: p.name,
        category: p.category,
        stages: p.stages,
        url: p.url,
        location: p.location,
        ...(p.capabilities ? { capabilities: p.capabilities } : {}),
      },
    })),
};

writeFileSync('public/ecosystem.geojson', JSON.stringify(geojson, null, 2) + '\n');
console.log(
  `Wrote public/ecosystem.json (${active.length} active + ${players.length - active.length} closed) ` +
    `and public/ecosystem.geojson (${geojson.features.length} points)`
);
