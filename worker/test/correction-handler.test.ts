import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleCorrection } from '../src/handlers.ts';
import { indexEcosystem } from '../src/ecosystem.ts';
import type { CorrectionDiff } from '../src/correction.ts';

const RAW = {
  players: [
    {
      id: 'dctrl',
      name: 'DCTRL',
      category: 'Spaces & Places',
      stages: ['ZERO → ONE'],
      url: 'https://www.dctrl.wtf/',
      location: '328 W Hastings St · Gastown',
      verified: '2026-08',
    },
    {
      id: 'makerlabs',
      name: 'MakerLabs',
      category: 'Spaces & Places',
      stages: ['ONE → MVP'],
      url: 'https://www.makerlabs.com/',
      location: '780 E Cordova St · Strathcona',
      verified: '2026-08',
    },
  ],
  categories: ['Spaces & Places'],
  stages: ['ZERO → ONE', 'ONE → MVP'],
};

function deps(model: unknown, queued: CorrectionDiff[]) {
  return {
    eco: indexEcosystem(structuredClone(RAW)),
    search: async () => ({
      chunks: [
        { item: { key: 'dctrl.md' }, text: '# DCTRL', score: 0.5 },
        { item: { key: 'makerlabs.md' }, text: '# MakerLabs', score: 0.4 },
      ],
    }),
    runModel: async () => model,
    queueDiff: async (d: CorrectionDiff) => void queued.push(d),
    cleanReason: (t: string) => t,
    now: () => '2026-08-25T12:00:00.000Z',
    log: () => {},
  };
}

test('a correction is queued as pending and applied to nothing', async () => {
  const queued: CorrectionDiff[] = [];
  const d = deps(
    { response: { key: 'dctrl.md', field: 'status', proposed_value: 'closed', reason: 'it shut down last month' } },
    queued
  );
  const before = structuredClone(RAW);

  const res = await handleCorrection('DCTRL shut down', d);

  assert.equal(res.recorded, true);
  assert.equal(queued.length, 1, 'exactly one diff recorded');
  assert.equal(queued[0].assetId, 'dctrl');
  assert.equal(queued[0].currentValue, 'listed');
  assert.equal(queued[0].proposedValue, 'closed');

  // Nothing the Worker can reach has changed: the in-memory dataset still
  // holds the original values, and the deps surface has no apply/write path.
  assert.deepEqual(d.eco.byId.get('dctrl'), {
    id: 'dctrl',
    name: 'DCTRL',
    category: 'Spaces & Places',
    stages: ['ZERO → ONE'],
    url: 'https://www.dctrl.wtf/',
    location: '328 W Hastings St · Gastown',
    verified: '2026-08',
  });
  assert.deepEqual(RAW, before, 'source dataset untouched');
  assert.ok(!Object.keys(d).some((k) => /apply|write|update|patch|commit/i.test(k)));
  assert.ok(!/will be (fixed|updated|changed)/i.test(res.reply));
});

test('a diff for a url correction records the dataset url as current', async () => {
  const queued: CorrectionDiff[] = [];
  const d = deps(
    { response: { key: 'makerlabs.md', field: 'url', proposed_value: 'https://makerlabs.ca', reason: 'the old link 404s' } },
    queued
  );
  await handleCorrection('the makerlabs url is dead', d);
  assert.equal(queued[0].field, 'url');
  assert.equal(queued[0].currentValue, 'https://www.makerlabs.com/');
  assert.equal(queued[0].proposedValue, 'https://makerlabs.ca');
});

test('a key the model invented is refused, and nothing is queued', async () => {
  const queued: CorrectionDiff[] = [];
  const d = deps(
    { response: { key: 'imaginary.md', field: 'status', proposed_value: 'closed', reason: 'made up' } },
    queued
  );
  const res = await handleCorrection('that place closed', d);
  assert.equal(res.recorded, false);
  assert.equal(queued.length, 0);
});

test('an unreadable model answer records nothing and says so', async () => {
  const queued: CorrectionDiff[] = [];
  const d = deps({ response: 'not json at all' }, queued);
  const res = await handleCorrection('the url is dead', d);
  assert.equal(res.recorded, false);
  assert.equal(queued.length, 0);
});

test('no correction is queued when nothing on the map matches', async () => {
  const queued: CorrectionDiff[] = [];
  const d = {
    ...deps({ response: {} }, queued),
    search: async () => ({ chunks: [{ item: { key: 'pathway-maker-mile.md' }, text: 'route', score: 0.5 }] }),
  };
  const res = await handleCorrection('that thing closed', d);
  assert.equal(res.recorded, false);
  assert.equal(queued.length, 0);
});
