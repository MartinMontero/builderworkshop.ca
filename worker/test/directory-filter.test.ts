import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterDirectory } from '../../src/lib/guide.ts';
import { ACTIVE, ASSETS } from '../../src/data/assets.ts';

// Derived from the data, never a literal — the directory grows and a hardcoded
// count turns a correct addition into a red build.
test('clearing a query restores every active entry', () => {
  assert.ok(ACTIVE.length > 0);
  assert.equal(filterDirectory(ACTIVE, null, null).length, ACTIVE.length);
  assert.equal(ACTIVE.length, ASSETS.filter((a) => !a.closed).length);
});

test('an active query filters to the returned entries in rank order', () => {
  const ids = ['makercube', 'makerlabs', 'victoria-makerspace'];
  const out = filterDirectory(ASSETS, null, ids);
  assert.deepEqual(
    out.map((a) => a.id),
    ids
  );
});

test('the stage filter composes with an active query as an intersection', () => {
  const ids = ['makercube', 'makerlabs', 'zenmakerlab'];
  // zenmakerlab is ZERO → ONE only; the makerspaces are ONE → MVP
  const out = filterDirectory(ASSETS, 'ONE → MVP', ids);
  assert.deepEqual(
    out.map((a) => a.id),
    ['makercube', 'makerlabs']
  );
  const zeroOne = filterDirectory(ASSETS, 'ZERO → ONE', ids);
  assert.deepEqual(
    zeroOne.map((a) => a.id),
    ['zenmakerlab']
  );
});

test('stage filter alone still works with no query active', () => {
  const out = filterDirectory(ASSETS, 'MVP → SCALE', null);
  assert.ok(out.length > 0 && out.length < ASSETS.length);
  assert.ok(out.every((a) => a.stages.includes('MVP → SCALE')));
});
