import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleChat, type EventRow } from '../src/handlers.ts';
import { indexEcosystem } from '../src/ecosystem.ts';

const eco = indexEcosystem({
  players: [
    { id: 'tcglass', name: 'Terminal City Glass', category: 'Spaces & Places', stages: ['ZERO → ONE'], url: 'https://tcglass.example' },
    { id: 'makerlabs', name: 'MakerLabs', category: 'Spaces & Places', stages: ['ONE → MVP'], url: 'https://makerlabs.com' },
  ],
});

test('empty retrieval returns a gap, logs unanswered, and never calls the model', async () => {
  const events: EventRow[] = [];
  let modelCalled = false;
  let probeCalled = false;

  const res = await handleChat('underwater basket weaving residency', {
    eco,
    search: async (_q, probe) => {
      if (probe) {
        probeCalled = true;
        return { chunks: [{ item: { key: 'tcglass.md' }, text: 'near miss', score: 0.22 }] };
      }
      return { chunks: [] };
    },
    runModel: async () => {
      modelCalled = true;
      throw new Error('model must not run on empty retrieval');
    },
    logEvent: async (row) => {
      events.push(row);
    },
    remember: async () => {},
    log: () => {},
  });

  assert.equal(modelCalled, false, 'model knowledge must never back-fill an empty retrieval');
  assert.equal(probeCalled, true, 'gap statement should be grounded by the wider probe');
  assert.equal(res.results.length, 0);
  assert.ok(res.gap, 'gap statement required');
  assert.deepEqual(res.gap!.categories, ['Spaces & Places']);
  assert.equal(events.length, 1);
  assert.equal(events[0].answered, 0);
  assert.equal(events[0].query_class, 'unanswered');
  assert.equal(events[0].destination_host, null);
});

test('pathway-only retrieval is treated as unanswerable, not joined', async () => {
  const events: EventRow[] = [];
  const res = await handleChat('a walking route', {
    eco,
    search: async (_q, probe) =>
      probe
        ? { chunks: [] }
        : { chunks: [{ item: { key: 'pathway-maker-mile.md' }, text: 'route doc', score: 0.5 }] },
    runModel: async () => {
      throw new Error('model must not run when no joinable docs were retrieved');
    },
    logEvent: async (row) => {
      events.push(row);
    },
    remember: async () => {},
    log: () => {},
  });
  assert.equal(res.results.length, 0);
  assert.equal(events[0].answered, 0);
});
