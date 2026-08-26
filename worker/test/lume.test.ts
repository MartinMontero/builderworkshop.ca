import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeRooms, fetchRoomCounts, summarise, type VenueRoomCount } from '../../src/lib/lume.ts';
import type { Asset } from '../../src/data/assets.ts';

/*
  The LUME card shows live counts for a tool we built. Three things have to hold:
  the disclosure is unconditional wherever ownedByUs is set, an empty tool reads
  as an invitation rather than a failure, and an unreachable LUME degrades to a
  card with no numbers — never a stale number presented as current.
*/

const asset = (id: string, name: string): Asset => ({
  id,
  name,
  category: 'Spaces & Places',
  stages: ['ONE → MVP'],
  url: `https://${id}.example`,
  blurb: 'x',
  location: 'x',
});

// Directory order matters: names are listed in the order the map ranks them.
const ASSETS = [asset('dctrl', 'DCTRL'), asset('friendsquarters', 'FriendsQuarters'), asset('makerlabs', 'MakerLabs')];

const rows = (...pairs: Array<[string, number]>): VenueRoomCount[] =>
  pairs.map(([venue_slug, active_standing_rooms]) => ({ venue_slug, active_standing_rooms }));

test('rooms are totalled and venues named from asset ids, in directory order', () => {
  // deliberately out of order in the response
  const s = summarise(rows(['makerlabs', 1], ['dctrl', 1], ['friendsquarters', 1]), ASSETS);
  assert.equal(s.total, 3);
  assert.deepEqual(s.venueNames, ['DCTRL', 'FriendsQuarters', 'MakerLabs']);
  assert.equal(describeRooms(s), '3 standing rooms this week — DCTRL, FriendsQuarters and MakerLabs.');
});

test('a single room reads as singular', () => {
  const s = summarise(rows(['dctrl', 1]), ASSETS);
  assert.equal(describeRooms(s), '1 standing room this week — DCTRL.');
});

test('several rooms at one venue count once as a venue but fully as rooms', () => {
  const s = summarise(rows(['dctrl', 3]), ASSETS);
  assert.equal(s.total, 3);
  assert.deepEqual(s.venueNames, ['DCTRL']);
});

test('a slug matching no asset is dropped, never rendered raw', () => {
  const s = summarise(rows(['dctrl', 1], ['some-venue-we-do-not-carry', 2]), ASSETS);
  assert.deepEqual(s.venueNames, ['DCTRL']);
  assert.equal(s.unmatched, 2, 'unmatched rooms are still counted, just not named');
  const line = describeRooms(s)!;
  assert.ok(!line.includes('some-venue-we-do-not-carry'), 'a raw slug must never reach the page');
  assert.ok(!/-/.test(line.replace(/—/g, '')), 'no slug-shaped token in the copy');
});

test('venues with zero active rooms are not named', () => {
  const s = summarise(rows(['dctrl', 0], ['makerlabs', 2]), ASSETS);
  assert.equal(s.total, 2);
  assert.deepEqual(s.venueNames, ['MakerLabs']);
});

test('zero rooms is an invitation, not an error', () => {
  const s = summarise([], ASSETS);
  assert.equal(s.total, 0);
  const line = describeRooms(s)!;
  assert.match(line, /nobody is hosting/i);
  assert.match(line, /yours to start/i);
  // It must not read as a failure or an outage.
  assert.ok(!/error|unavailable|failed|sorry|problem/i.test(line), `zero state sounds like a failure: ${line}`);
});

test('a failed fetch yields no line at all — the card renders without counts', async () => {
  for (const fetchImpl of [
    async () => {
      throw new Error('offline');
    },
    async () => ({ ok: false, json: async () => [] }),
    async () => ({ ok: true, json: async () => ({ not: 'an array' }) }),
  ]) {
    const result = await fetchRoomCounts({ fetchImpl: fetchImpl as never });
    assert.equal(result, null);
    assert.equal(describeRooms(result), null, 'a failed fetch must not produce copy');
  }
});

test('a stale count is never presented as current', () => {
  // null is the only representation of "we do not know", and it renders nothing.
  assert.equal(describeRooms(null), null);
});

test('the request carries the publishable key and asks only for counts', async () => {
  let seenUrl = '';
  let seenHeaders: Record<string, string> = {};
  await fetchRoomCounts({
    fetchImpl: async (url, init) => {
      seenUrl = url;
      seenHeaders = init.headers;
      return { ok: true, json: async () => [] };
    },
  });
  assert.match(seenUrl, /\/rest\/v1\/venue_room_counts/);
  // Only the two counts-only columns are requested — no speculative select=*.
  assert.match(seenUrl, /select=venue_slug,active_standing_rooms/);
  assert.ok(!/organizer|profile|email|lat|lng/.test(seenUrl), 'must not ask for identity or coordinates');
  assert.ok(seenHeaders.apikey?.startsWith('sb_publishable_'), 'publishable key only');
  assert.match(seenHeaders.Authorization, /^Bearer sb_publishable_/);
});

test('malformed rows are survived rather than thrown on', () => {
  const s = summarise(
    [
      { venue_slug: 'dctrl', active_standing_rooms: 2 },
      { venue_slug: 'makerlabs' } as VenueRoomCount,
      { active_standing_rooms: 5 } as VenueRoomCount,
      null as unknown as VenueRoomCount,
    ].filter(Boolean),
    ASSETS,
  );
  assert.equal(s.total, 2);
  assert.deepEqual(s.venueNames, ['DCTRL']);
});

/* -------------------------------------------------------------------------
 * The disclosure — asserted against the component source, since this repo
 * has no DOM test harness. What matters is that it is unconditional on
 * ownedByUs, and that nothing gates it behind the counts loading.
 * ----------------------------------------------------------------------- */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = readFileSync(join(process.cwd(), 'src', 'sections', 'Directory.tsx'), 'utf8');
const hero = readFileSync(join(process.cwd(), 'src', 'sections', 'Hero.tsx'), 'utf8');

test('the disclosure renders wherever ownedByUs is set', () => {
  assert.match(directory, /Built by builderworkshop\.ca/);
  // Gated on ownedByUs alone — not on counts, not on the fetch resolving.
  const block = directory.slice(directory.indexOf('The disclosure'));
  const guard = block.slice(0, block.indexOf('Built by builderworkshop.ca'));
  assert.match(guard, /intent\.handoff\.ownedByUs &&/);
  assert.ok(!/rooms|roomsLoaded/.test(guard), 'the disclosure must not depend on the counts fetch');
});

test('our own tool is the only handoff marked ownedByUs', () => {
  const marked = [...hero.matchAll(/ownedByUs:\s*true/g)];
  assert.equal(marked.length, 1, 'exactly one handoff should claim to be ours');
  // and it is the LUME one
  const lumeBlock = hero.slice(hero.indexOf("name: 'LUME'"), hero.indexOf("name: 'LUME'") + 400);
  assert.match(lumeBlock, /ownedByUs:\s*true/);
});

test('the partner handoff is NOT marked as ours', () => {
  // FoundedIn Canada is a genuine outward handoff; marking it would invert the
  // whole point of the disclosure.
  const ficBlock = hero.slice(hero.indexOf('handoff: FIC'), hero.indexOf('handoff: FIC') + 200);
  assert.ok(!/ownedByUs/.test(ficBlock));
});

test('counts render only once the fetch has resolved', () => {
  // Prevents a flash of "0 rooms" before the request returns.
  assert.match(directory, /ownedByUs && roomsLoaded && describeRooms\(rooms\)/);
});
