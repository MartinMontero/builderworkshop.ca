// The published open data must match the contract it declares.
//
// LUME consumes this file and typed `closed` as boolean|string. It is an
// object. That only worked because String({}) coerces to something truthy — a
// slightly different shape would have silently offered a permanently closed
// venue as bookable. This test exists so the next consumer does not have to
// guess, and so changing a load-bearing field without bumping schemaVersion
// fails here rather than in someone else's product.
//
// Two halves:
//   1. the DECLARED contract is pinned, so changing it is a deliberate edit
//   2. the DATA conforms to whatever the file declares
//
// Run: node --test "scripts/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Regenerate, so this tests the artifact that would actually ship rather than
// whatever happens to be on disk.
execFileSync(process.execPath, ['scripts/export-data.mjs'], { stdio: 'ignore' });
const dataset = JSON.parse(readFileSync('public/ecosystem.json', 'utf8'));
const geojson = JSON.parse(readFileSync('public/ecosystem.geojson', 'utf8'));

/*
  Pinned. Editing either of these is the signal that a consumer-visible shape
  changed: bump schemaVersion in scripts/export-data.mjs, update this, and tell
  the consumers listed in the README.
*/
const SCHEMA_VERSION = 1;
const CONTRACT = {
  id: 'string',
  lat: 'number | absent',
  lng: 'number | absent',
  closed: '{ date: "YYYY-MM", note: string } | absent',
};

/*
  Pinned separately, on purpose. The two files version independently: a change
  to one does not imply a change to the other, and sharing a number would either
  force meaningless bumps or assert a coupling that is not real. These being
  equal today is a coincidence, not an invariant.
*/
const GEOJSON_SCHEMA_VERSION = 1;
const GEOJSON_CONTRACT = {
  'geometry.coordinates': '[lng, lat]',
  'properties.id': 'string — joins to ecosystem.json players[].id',
  'properties.name': 'string',
  features: 'mapped, active entries only — closed are excluded, no filtering needed',
};

test('the file declares the contract it is pinned to', () => {
  assert.equal(dataset.schemaVersion, SCHEMA_VERSION);
  assert.deepEqual(
    dataset.contract,
    CONTRACT,
    'the declared contract changed — bump schemaVersion and notify consumers',
  );
});

test('id is a stable, unique, non-empty string on every entry', () => {
  const ids = dataset.players.map((p) => p.id);
  for (const id of ids) {
    assert.equal(typeof id, 'string');
    assert.ok(id.length > 0);
  }
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique — consumers key on them');
});

test('lat and lng are numbers or absent, never null, and always paired', () => {
  for (const p of dataset.players) {
    for (const field of ['lat', 'lng']) {
      if (field in p) {
        assert.equal(typeof p[field], 'number', `${p.id}.${field} must be a number when present`);
        assert.ok(Number.isFinite(p[field]), `${p.id}.${field} must be finite`);
      }
    }
    // A half-located entry is unusable: consumers treat "has coordinates" as
    // "has a fixed address you can stand at".
    assert.equal(
      'lat' in p,
      'lng' in p,
      `${p.id} has one coordinate but not the other`,
    );
  }
});

test('closed is an object with date and note, or absent — never a boolean or string', () => {
  for (const p of dataset.players) {
    if (!('closed' in p)) continue;
    const c = p.closed;
    assert.equal(
      typeof c,
      'object',
      `${p.id}.closed is ${typeof c}; the contract says object. This is the exact ` +
        'shape mismatch that made a closed venue look bookable downstream.',
    );
    assert.ok(c !== null, `${p.id}.closed must not be null — omit the field instead`);
    assert.match(c.date, /^\d{4}-\d{2}$/, `${p.id}.closed.date must be YYYY-MM`);
    assert.equal(typeof c.note, 'string', `${p.id}.closed.note must be a string`);
    assert.ok(c.note.trim().length > 0, `${p.id}.closed.note must say why`);
  }
});

test('absence of closed is the only way to say "open"', () => {
  // No entry may carry a falsey closed value; that would make "closed" ambiguous
  // between "open" and "closed but unrecorded".
  for (const p of dataset.players) {
    if ('closed' in p) {
      assert.ok(p.closed, `${p.id} carries a falsey closed value — omit the field instead`);
    }
  }
});

test('the derived counts agree with the data', () => {
  const closed = dataset.players.filter((p) => 'closed' in p);
  assert.equal(dataset.closedCount, closed.length);
  assert.equal(dataset.count, dataset.players.length - closed.length);
});

test('closed entries stay in players but never in the geojson', () => {
  const geo = JSON.parse(readFileSync('public/ecosystem.geojson', 'utf8'));
  const geoIds = new Set(geo.features.map((f) => f.properties.id));
  for (const p of dataset.players) {
    if ('closed' in p) {
      assert.ok(!geoIds.has(p.id), `${p.id} is closed but still mapped`);
    }
  }
});

/* -------------------------------------------------------------------------
 * ecosystem.geojson — versioned and pinned independently of the JSON
 * ----------------------------------------------------------------------- */

test('the geojson declares the contract it is pinned to', () => {
  assert.equal(geojson.schemaVersion, GEOJSON_SCHEMA_VERSION);
  assert.deepEqual(
    geojson.contract,
    GEOJSON_CONTRACT,
    'the declared geojson contract changed — bump its schemaVersion and notify consumers',
  );
});

test('the two files version independently', () => {
  // Not an assertion that they differ — an assertion that nothing in the build
  // ties them together. Each is read from its own file and pinned separately.
  const source = readFileSync('scripts/export-data.mjs', 'utf8');
  assert.match(source, /const SCHEMA_VERSION = \d+;/);
  assert.match(source, /const GEOJSON_SCHEMA_VERSION = \d+;/);
  assert.ok(
    !/GEOJSON_SCHEMA_VERSION = SCHEMA_VERSION/.test(source),
    'the geojson version must not be derived from the JSON version',
  );
});

test('coordinates are [lng, lat] on every feature', () => {
  // The classic GeoJSON footgun: longitude first. Pinned because a consumer
  // that gets it backwards puts every venue in the wrong hemisphere.
  for (const f of geojson.features) {
    assert.equal(f.geometry.type, 'Point');
    const [lng, lat] = f.geometry.coordinates;
    assert.equal(typeof lng, 'number');
    assert.equal(typeof lat, 'number');
    // British Columbia: latitude ~48-60N, longitude ~-139 to -114.
    assert.ok(lat > 0 && lat < 90, `${f.properties.id}: latitude out of range — coordinates may be swapped`);
    assert.ok(lng < 0 && lng > -180, `${f.properties.id}: longitude out of range — coordinates may be swapped`);
  }
});

test('properties.id is a string that joins to the JSON', () => {
  const jsonIds = new Set(dataset.players.map((p) => p.id));
  for (const f of geojson.features) {
    assert.equal(typeof f.properties.id, 'string');
    assert.ok(f.properties.id.length > 0);
    assert.ok(jsonIds.has(f.properties.id), `${f.properties.id} is not in ecosystem.json`);
    assert.equal(typeof f.properties.name, 'string');
    assert.ok(f.properties.name.length > 0);
  }
});

test('features are pre-filtered — the asymmetry that makes this file worth choosing', () => {
  const byId = new Map(dataset.players.map((p) => [p.id, p]));
  for (const f of geojson.features) {
    const player = byId.get(f.properties.id);
    assert.ok(!('closed' in player), `${f.properties.id} is closed but present in the geojson`);
    assert.ok('lat' in player, `${f.properties.id} is mapped here but has no coordinates in the JSON`);
  }
  // And nothing mapped-and-active is missing, or the filter is over-eager.
  const expected = dataset.players.filter((p) => !('closed' in p) && 'lat' in p).length;
  assert.equal(geojson.features.length, expected);
});

test('the geojson never carries a closed field — it has nothing to filter', () => {
  for (const f of geojson.features) {
    assert.ok(!('closed' in f.properties), `${f.properties.id} carries closed; the file promises it cannot`);
  }
});
