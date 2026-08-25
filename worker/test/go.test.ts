import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleGo, type EventRow } from '../src/handlers.ts';
import { indexEcosystem } from '../src/ecosystem.ts';

const eco = indexEcosystem({
  players: [
    {
      id: 'makerlabs',
      name: 'MakerLabs',
      category: 'Spaces & Places',
      stages: ['ONE → MVP', 'MVP → SCALE'],
      url: 'https://makerlabs.com/',
    },
  ],
});

const noop = () => {};

test('/go 302s to the canonical URL and preserves the referrer', async () => {
  const events: EventRow[] = [];
  const url = new URL(
    `https://guide.example/go?to=${encodeURIComponent('https://makerlabs.com/')}&class=capability`
  );
  const res = await handleGo(url, eco, async (row) => void events.push(row), noop);

  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), 'https://makerlabs.com/');
  // The browser re-reads referrer policy on redirect; any Referrer-Policy set
  // here could erase the site referrer the destination is meant to see.
  assert.equal(res.headers.get('Referrer-Policy'), null);

  assert.equal(events.length, 1);
  assert.equal(events[0].destination_host, 'makerlabs.com');
  assert.equal(events[0].entity_type, 'Spaces & Places');
  assert.equal(events[0].stage, 'ONE → MVP');
  assert.equal(events[0].query_class, 'capability');
  assert.equal(events[0].answered, 1);
});

test('/go refuses destinations that are not in ecosystem.json', async () => {
  const events: EventRow[] = [];
  const url = new URL(`https://guide.example/go?to=${encodeURIComponent('https://evil.example/phish')}&class=capability`);
  const res = await handleGo(url, eco, async (row) => void events.push(row), noop);
  assert.equal(res.status, 400);
  assert.equal(events.length, 0, 'refused redirects must not be logged as referrals');
});

test('event rows carry no query text and nothing identifying a person', async () => {
  const events: EventRow[] = [];
  const url = new URL(`https://guide.example/go?to=${encodeURIComponent('https://makerlabs.com/')}&class=stage`);
  await handleGo(url, eco, async (row) => void events.push(row), noop);
  assert.deepEqual(Object.keys(events[0]).sort(), [
    'answered',
    'destination_host',
    'entity_type',
    'query_class',
    'stage',
    'ts',
  ]);
});
