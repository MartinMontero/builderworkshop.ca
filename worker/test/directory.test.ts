import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE, ASSETS, CLOSED, MAPPED } from '../../src/data/assets.ts';
import { filterIntent, type IntentState } from '../../src/lib/guide.ts';

const intent = (over: Partial<IntentState>): IntentState => ({
  status: 'intent',
  id: 'x',
  label: 'x',
  heading: 'x',
  note: 'x',
  categories: [],
  stage: null,
  ...over,
});

test('closed entries leave every active surface but stay in the record', () => {
  assert.equal(CLOSED.length, 1);
  assert.equal(CLOSED[0].id, 'zenmakerlab');
  assert.equal(ACTIVE.length, ASSETS.length - 1);
  assert.ok(!ACTIVE.some((a) => a.id === 'zenmakerlab'));
  assert.ok(!MAPPED.some((a) => a.id === 'zenmakerlab'));
  assert.ok(CLOSED[0].closed?.date && CLOSED[0].closed?.note);
});

test('each card returns a distinct, non-empty id set', () => {
  const cards: Record<string, IntentState> = {
    idea: intent({ categories: ['Programs & Accelerators', 'Community & Events'], stage: 'ZERO → ONE' }),
    make: intent({ categories: ['Spaces & Places'] }),
    learn: intent({ categories: ['Learning & Talent'] }),
    people: intent({ categories: ['Community & Events'] }),
    fund: intent({ categories: ['Capital & Venture'] }),
  };
  const sets = Object.entries(cards).map(([k, c]) => {
    const ids = filterIntent(ACTIVE, c, null).map((a) => a.id);
    assert.ok(ids.length > 0, `${k} returned nothing`);
    assert.ok(ids.length < ACTIVE.length, `${k} returned everything`);
    return [k, ids.join(',')] as const;
  });
  const seen = new Set(sets.map(([, v]) => v));
  assert.equal(seen.size, sets.length, 'two cards produce the same result set');
});

test('a card composes with the stage filter as an intersection', () => {
  const c = intent({ categories: ['Spaces & Places'] });
  const all = filterIntent(ACTIVE, c, null);
  const zeroOne = filterIntent(ACTIVE, c, 'ZERO → ONE');
  assert.ok(zeroOne.length < all.length);
  assert.ok(zeroOne.every((a) => a.stages.includes('ZERO → ONE')));
  assert.ok(zeroOne.every((a) => a.category === 'Spaces & Places'));
});

test('no card can surface a closed entry', () => {
  const c = intent({ categories: ['Learning & Talent'] });
  assert.ok(!filterIntent(ACTIVE, c, null).some((a) => a.id === 'zenmakerlab'));
});
