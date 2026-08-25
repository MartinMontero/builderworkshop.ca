import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeWhy } from '../src/sanitize.ts';

const entity = { name: 'MakerLabs', category: 'Spaces & Places' };
const names = ['MakerLabs', 'Maker Cube', 'Vancouver Hack Space', 'Victoria Makerspace'];

test('street address is stripped and logged', () => {
  const r = sanitizeWhy('A huge fabrication studio at 780 E Cordova St with laser cutters for your project.', entity, names);
  assert.ok(r.violations.includes('address'));
  assert.ok(!/780|Cordova/.test(r.why));
});

test('postal code is stripped', () => {
  const r = sanitizeWhy('Fabrication studio in V6A 1M3 with wood and metal shops for prototyping runs.', entity, names);
  assert.ok(r.violations.includes('address'));
  assert.ok(!/V6A/.test(r.why));
});

test('dates are stripped in several formats', () => {
  for (const dirty of [
    'Open studio on March 4 with laser cutters and wood shops available to members.',
    'Since 2024-01-15 it has run laser cutting and CNC intro classes for beginners.',
    'Drop-in Tuesdays for laser cutting, woodworking and electronics work at any level.',
  ]) {
    const r = sanitizeWhy(dirty, entity, names);
    assert.ok(r.violations.includes('date'), `expected date violation in: ${dirty}`);
    assert.ok(!/March 4|2024-01-15|Tuesdays/.test(r.why));
  }
});

test('times are stripped', () => {
  const r = sanitizeWhy('Laser cutting access from 9:30 am for members working on hardware prototypes.', entity, names);
  assert.ok(r.violations.includes('time'));
  assert.ok(!/9:30/.test(r.why));
});

test('prices are stripped', () => {
  const r = sanitizeWhy('Memberships from $85 with full access to laser cutters and the wood shop.', entity, names);
  assert.ok(r.violations.includes('price'));
  assert.ok(!/\$85/.test(r.why));
});

test('person names are stripped, entity and place names survive', () => {
  const r = sanitizeWhy('Founded by Jordan Whitfield, it gives Vancouver builders laser cutting access.', entity, names);
  assert.ok(r.violations.includes('person-name'));
  assert.ok(!/Jordan Whitfield/.test(r.why));

  const clean = sanitizeWhy('Vancouver Hack Space gives British Columbia builders laser cutting access.', entity, names);
  assert.equal(clean.violations.length, 0);
  assert.ok(/Vancouver Hack Space/.test(clean.why));
});

test('a gutted sentence falls back to a safe template', () => {
  const r = sanitizeWhy('At 780 E Cordova St on March 4 at 9:30 am for $85.', entity, names);
  assert.ok(r.violations.length > 0);
  assert.ok(r.why.length >= 20);
  assert.ok(!/780|March|9:30|\$85/.test(r.why));
});

test('a clean why passes through untouched apart from punctuation', () => {
  const r = sanitizeWhy('The largest fabrication studio on the map, with laser cutters you can book as a member', entity, names);
  assert.equal(r.violations.length, 0);
  assert.equal(r.why.endsWith('.'), true);
});
