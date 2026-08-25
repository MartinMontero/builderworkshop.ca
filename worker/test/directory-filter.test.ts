import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterDirectory } from '../../src/lib/guide.ts';
import { ASSETS } from '../../src/data/assets.ts';

test('clearing a query restores all 46 entries', () => {
  assert.equal(ASSETS.length, 46);
  assert.equal(filterDirectory(ASSETS, null, null).length, 46);
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
