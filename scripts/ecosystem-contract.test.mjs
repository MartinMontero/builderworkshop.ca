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
