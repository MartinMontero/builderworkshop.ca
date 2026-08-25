import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enforceContract, type ModelPick } from '../src/contract.ts';
import { indexEcosystem } from '../src/ecosystem.ts';
import type { RetrievedChunk } from '../src/retrieval.ts';

const eco = indexEcosystem({
  players: [
    { id: 'makerlabs', name: 'MakerLabs', category: 'Spaces & Places', stages: ['ONE → MVP'], url: 'https://makerlabs.com' },
    { id: 'makercube', name: 'Maker Cube', category: 'Spaces & Places', stages: ['ONE → MVP'], url: 'https://makercube.ca' },
    { id: 'vhs', name: 'Vancouver Hack Space', category: 'Spaces & Places', stages: ['ONE → MVP'], url: 'https://vanhack.ca' },
    { id: 'althra', name: 'Althra', category: 'Programs & Accelerators', stages: ['ONE → MVP'], url: 'https://althra.example' },
    { id: 'zenmakerlab', name: 'Zen Maker Lab', category: 'Learning & Talent', stages: ['ZERO → ONE'], url: 'https://zenmakerlab.example' },
  ],
  categories: ['Spaces & Places'],
});

const chunk = (key: string): RetrievedChunk => ({ key, text: 'doc text', score: 0.4 });
const retrieved = ['makerlabs.md', 'makercube.md', 'vhs.md', 'althra.md', 'zenmakerlab.md'].map(chunk);
const noop = () => {};

test('results are capped at three even when the model returns more', () => {
  const picks: ModelPick[] = ['makerlabs.md', 'makercube.md', 'vhs.md', 'althra.md', 'zenmakerlab.md'].map(
    (key) => ({ key, why: 'A strong fit for building physical prototypes with shared tools.' })
  );
  const logged: string[] = [];
  const out = enforceContract(picks, retrieved, eco, (e) => logged.push(e));
  assert.equal(out.length, 3);
  assert.ok(logged.includes('contract.capped'));
});

test('hallucinated keys never reach the output', () => {
  const picks: ModelPick[] = [
    { key: 'not-retrieved.md', why: 'Sounds plausible but was never retrieved for this query.' },
    { key: 'makerlabs.md', why: 'A real fabrication studio with the tools you described needing.' },
  ];
  const logged: string[] = [];
  const out = enforceContract(picks, retrieved, eco, (e) => logged.push(e));
  assert.equal(out.length, 1);
  assert.equal(out[0].key, 'makerlabs.md');
  assert.ok(logged.includes('contract.hallucinated_key'));
});

test('no address, date, time, price or person name reaches the output', () => {
  const picks: ModelPick[] = [
    { key: 'makerlabs.md', why: 'At 780 E Cordova St since March 4, from $85, ask for Jordan Whitfield at 9:30 am.' },
  ];
  const events: string[] = [];
  const out = enforceContract(picks, retrieved, eco, (e) => events.push(e));
  assert.equal(out.length, 1);
  const why = out[0].why;
  assert.ok(!/780|Cordova/.test(why), 'address leaked');
  assert.ok(!/March/.test(why), 'date leaked');
  assert.ok(!/9:30/.test(why), 'time leaked');
  assert.ok(!/\$85/.test(why), 'price leaked');
  assert.ok(!/Jordan|Whitfield/.test(why), 'person name leaked');
  assert.ok(events.includes('contract.why_sanitized'));
});

test('URL comes from ecosystem.json, and the structured shape is exact', () => {
  const out = enforceContract(
    [{ key: 'makercube.md', why: 'Purpose-built shop access for exactly this kind of build.' }],
    retrieved,
    eco,
    noop
  );
  assert.deepEqual(Object.keys(out[0]).sort(), ['category', 'id', 'key', 'name', 'stages', 'url', 'why']);
  assert.equal(out[0].url, 'https://makercube.ca');
});

test('a retrieved key missing from ecosystem.json fails loudly', () => {
  const ghost = [chunk('ghost.md')];
  assert.throws(
    () =>
      enforceContract(
        [{ key: 'ghost.md', why: 'This entry exists in the index but not the dataset.' }],
        ghost,
        eco,
        noop
      ),
    /ghost\.md.*out of sync/
  );
});
