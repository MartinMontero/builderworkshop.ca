import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDiff, correctionReply, detectCorrection } from '../src/correction.ts';

// Every starter chip and tuning-set query the site actually sends.
const ORDINARY_QUESTIONS = [
  'where can I laser cut something',
  'I have an idea but nothing built yet, where do I start',
  'somewhere downtown to sit and work',
  'my kid is 12 and into robotics',
  'who funds early stage founders in BC',
  'I want to try pottery',
  'I need to prototype a physical product',
  "what's happening in Vancouver tech this week",
  'ceramics studio',
  'pre-seed accelerator',
  'coworking Gastown',
  'youth STEAM programs',
  'glass blowing',
  'SR&ED tax credits',
  'I need a room to build hardware',
  'where do I meet other founders',
  // near-misses: change words inside genuine questions
  'has DCTRL moved?',
  'did MakerLabs move recently?',
  'is Maker Cube closed on weekends?',
  'which spaces changed their hours?',
  'where can I go when everything else is closed?',
];

const CORRECTIONS = [
  'DCTRL moved',
  'DCTRL has moved to a new space on Hastings',
  'that program shut down',
  'the URL is dead',
  'this link is broken',
  'MakerLabs is now called something else',
  'Zen Maker Lab rebranded',
  'FoundersBoost no longer runs in Vancouver',
  'the Arts Factory closed down',
  'that entry is wrong',
  'this is outdated, they moved to Burnaby',
  'the url should be https://example.ca',
  'Victoria Makerspace is out of business',
  'their website is gone',
  'needs updating — they relocated to Langley',
];

test('correction detection does not fire on ordinary questions', () => {
  for (const q of ORDINARY_QUESTIONS) {
    const d = detectCorrection(q);
    assert.equal(d.isCorrection, false, `false positive on: "${q}" (matched ${d.matched.join(', ')})`);
  }
});

test('correction detection fires on reports of change', () => {
  for (const q of CORRECTIONS) {
    const d = detectCorrection(q);
    assert.equal(d.isCorrection, true, `missed correction: "${q}"`);
  }
});

test('a diff records the dataset value as current, never the reporter\'s claim', () => {
  const entity = {
    id: 'dctrl',
    name: 'DCTRL',
    url: 'https://www.dctrl.wtf/',
    location: '328 W Hastings St · Gastown',
    category: 'Spaces & Places',
  };
  const diff = buildDiff(
    { key: 'dctrl.md', field: 'location', proposed_value: 'somewhere on Main St', reason: 'they moved last month' },
    entity,
    '2026-08-25T00:00:00.000Z',
    (t) => t
  );
  assert.equal(diff.assetId, 'dctrl');
  assert.equal(diff.field, 'location');
  assert.equal(diff.currentValue, '328 W Hastings St · Gastown', 'current value must come from the dataset');
  assert.equal(diff.proposedValue, 'somewhere on Main St');
  assert.equal(diff.reason, 'they moved last month');
});

test('a diff strips a person named in the reason', () => {
  const entity = { id: 'dctrl', name: 'DCTRL', url: 'https://www.dctrl.wtf/', location: 'Gastown', category: 'Spaces & Places' };
  const stripped: string[] = [];
  const diff = buildDiff(
    { key: 'dctrl.md', field: 'status', proposed_value: 'closed', reason: 'Jordan Whitfield told me it closed' },
    entity,
    '2026-08-25T00:00:00.000Z',
    (t) => {
      stripped.push(t);
      return t.replace('Jordan Whitfield', 'someone');
    }
  );
  assert.equal(stripped.length, 1, 'reason must be passed through the cleaner');
  assert.ok(!/Jordan|Whitfield/.test(diff.reason));
});

test('the reply promises no timeline and claims no change was made', () => {
  const reply = correctionReply(
    {
      ts: '2026-08-25T00:00:00.000Z',
      assetId: 'dctrl',
      field: 'status',
      currentValue: 'listed',
      proposedValue: 'closed',
      reason: 'it shut down',
    },
    'DCTRL'
  );
  assert.ok(/recorded/i.test(reply));
  assert.ok(/human/i.test(reply), 'must say a human checks it');
  assert.ok(!/soon|shortly|within|hours?|days?|weeks?|tomorrow/i.test(reply), `reply promises a timeline: ${reply}`);
});
