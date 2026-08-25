import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGapReport, monthKey, previousMonth } from '../src/gap.ts';

const STAGES = ['ZERO → ONE', 'ONE → MVP', 'MVP → SCALE'];
const CATEGORIES = [
  'Spaces & Places',
  'Programs & Accelerators',
  'Learning & Talent',
  'Community & Events',
  'Media & Storytelling',
  'Capital & Venture',
];

const ASSETS = [
  { category: 'Spaces & Places', stages: ['ONE → MVP'] },
  { category: 'Spaces & Places', stages: ['ONE → MVP'] },
  { category: 'Spaces & Places', stages: ['ONE → MVP'] },
  { category: 'Spaces & Places', stages: ['ONE → MVP'] },
  { category: 'Spaces & Places', stages: ['ONE → MVP', 'MVP → SCALE'] },
  { category: 'Capital & Venture', stages: ['MVP → SCALE'] },
  { category: 'Media & Storytelling', stages: ['ZERO → ONE'] },
];

const EVENTS = [
  { query_class: 'capability', answered: 1, n: 40 },
  { query_class: 'funding', answered: 1, n: 12 },
  { query_class: 'unanswered', answered: 0, n: 9 },
  { query_class: 'events', answered: 0, n: 4 },
];

const CLICKS = [
  { destination_host: 'makerlabs.com', n: 18 },
  { destination_host: 'buildrs.dev', n: 7 },
  { destination_host: null, n: 55 }, // query rows, not clicks
];

function report() {
  return buildGapReport('2026-07', '2026-08-01T00:00:00.000Z', EVENTS, CLICKS, ASSETS, STAGES, CATEGORIES);
}

test('the gap report contains zero raw query text', () => {
  const serialized = JSON.stringify(report());
  // Nothing a person could have typed may survive into the aggregate.
  for (const phrase of [
    'where can I laser cut something',
    'laser cut',
    'my kid',
    'pottery',
    'DCTRL moved',
    'downtown',
  ]) {
    assert.ok(!serialized.toLowerCase().includes(phrase.toLowerCase()), `leaked query text: ${phrase}`);
  }
  // Structural guarantee: every leaf is a count, a month, a class name, a host,
  // a stage or a category — nothing free-form.
  const r = report();
  const allowedStrings = new Set([
    r.month,
    r.generatedTs,
    ...r.unansweredByClass.map((c) => c.queryClass),
    ...r.clicksByHost.map((c) => c.host),
    ...r.thinStages.map((s) => s.stage),
    ...r.thinCategories.map((c) => c.category),
  ]);
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      assert.ok(allowedStrings.has(v), `unexpected free text in report: ${v}`);
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(walk);
    }
  };
  walk(r);
});

test('query classes with no answer are counted and ranked', () => {
  const r = report();
  assert.equal(r.totalQueries, 65);
  assert.equal(r.unansweredQueries, 13);
  assert.deepEqual(r.unansweredByClass, [
    { queryClass: 'unanswered', count: 9 },
    { queryClass: 'events', count: 4 },
  ]);
});

test('clicks are counted per destination host, query rows excluded', () => {
  const r = report();
  assert.deepEqual(r.clicksByHost, [
    { host: 'makerlabs.com', count: 18 },
    { host: 'buildrs.dev', count: 7 },
  ]);
});

test('thin coverage is reported against the thresholds', () => {
  const r = report();
  // ZERO → ONE has 1 entry, MVP → SCALE has 2 — both under 3. ONE → MVP has 5.
  assert.deepEqual(r.thinStages, [
    { stage: 'ZERO → ONE', count: 1 },
    { stage: 'MVP → SCALE', count: 2 },
  ]);
  // Only Spaces & Places clears 5.
  assert.deepEqual(
    r.thinCategories.map((c) => c.category),
    ['Programs & Accelerators', 'Learning & Talent', 'Community & Events', 'Media & Storytelling', 'Capital & Venture']
  );
  assert.equal(r.thinCategories.find((c) => c.category === 'Learning & Talent')?.count, 0);
});

test('the report covers the month that just ended', () => {
  const { key, startIso, endIso } = previousMonth(new Date('2026-08-01T00:05:00Z'));
  assert.equal(key, '2026-07');
  assert.equal(startIso, '2026-07-01T00:00:00.000Z');
  assert.equal(endIso, '2026-08-01T00:00:00.000Z');
  // January rolls back across the year boundary
  assert.equal(previousMonth(new Date('2026-01-01T00:05:00Z')).key, '2025-12');
  assert.equal(monthKey(new Date('2026-08-25T00:00:00Z')), '2026-08');
});
