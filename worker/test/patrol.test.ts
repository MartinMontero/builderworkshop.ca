import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkOne,
  classify,
  isFlagged,
  registrableDomain,
  runPatrol,
  staleVerifications,
  USER_AGENT,
  type PatrolDeps,
} from '../src/patrol.ts';

const noSleep = async () => {};

function fakeFetcher(map: Record<string, { status: number; url?: string } | 'timeout'>) {
  const calls: string[] = [];
  const headersSeen: Record<string, string>[] = [];
  const deps: PatrolDeps = {
    fetchUrl: async (url, init) => {
      calls.push(url);
      headersSeen.push(init.headers);
      const outcome = map[url];
      if (!outcome) throw new Error(`unexpected url ${url}`);
      if (outcome === 'timeout') throw new Error('The operation was aborted due to timeout');
      return { status: outcome.status, url: outcome.url ?? url };
    },
    sleep: noSleep,
  };
  return { deps, calls, headersSeen };
}

test('classifies 200, same-domain redirect, cross-domain redirect, 404 and timeout', async () => {
  const cases: Array<[string, { status: number; url?: string } | 'timeout', string]> = [
    ['https://ok.example/', { status: 200 }, 'ok'],
    ['https://moved.example/old', { status: 200, url: 'https://moved.example/new' }, 'redirect_same_domain'],
    // www → apex is a redirect, but must not read as leaving the domain
    ['https://www.shop.example/', { status: 200, url: 'https://shop.example/home' }, 'redirect_same_domain'],
    ['https://sold.example/', { status: 200, url: 'https://parking-domains.test/lander' }, 'redirect_cross_domain'],
    ['https://missing.example/', { status: 404 }, 'gone'],
    ['https://retired.example/', { status: 410 }, 'gone'],
    ['https://broken.example/', { status: 503 }, 'server_error'],
    ['https://slow.example/', 'timeout', 'unreachable'],
  ];
  const map = Object.fromEntries(cases.map(([url, outcome]) => [url, outcome]));
  const { deps } = fakeFetcher(map);

  for (const [url, , expected] of cases) {
    const r = await checkOne({ id: url, url }, deps);
    assert.equal(r.verdict, expected, `${url} → expected ${expected}, got ${r.verdict}`);
  }
});

test('only rot is flagged — a same-domain redirect is recorded, not queued', () => {
  assert.equal(isFlagged('gone'), true);
  assert.equal(isFlagged('server_error'), true);
  assert.equal(isFlagged('redirect_cross_domain'), true);
  assert.equal(isFlagged('ok'), false);
  assert.equal(isFlagged('redirect_same_domain'), false);
  // unreachable is not queued: one slow host should not manufacture a finding
  assert.equal(isFlagged('unreachable'), false);
});

test('registrable domain ignores www and handles multi-label suffixes', () => {
  assert.equal(registrableDomain('www.makerlabs.com'), 'makerlabs.com');
  assert.equal(registrableDomain('shop.makerlabs.com'), 'makerlabs.com');
  assert.equal(registrableDomain('foo.bar.co.uk'), 'bar.co.uk');
  assert.equal(registrableDomain('a.b.gov.bc.ca'), 'b.gov.bc.ca');
  assert.equal(registrableDomain('vanhack.ca'), 'vanhack.ca');
});

test('classify treats a plain https upgrade as a same-domain redirect', () => {
  assert.equal(classify('https://x.example/', 'https://x.example/home', 200), 'redirect_same_domain');
  assert.equal(classify('https://x.example/', 'https://x.example/', 200), 'ok');
});

test('a URL is retried once, then abandoned', async () => {
  const { deps, calls } = fakeFetcher({ 'https://slow.example/': 'timeout' });
  const r = await checkOne({ id: 'slow', url: 'https://slow.example/' }, deps);
  assert.equal(calls.length, 2, 'exactly one retry');
  assert.equal(r.verdict, 'unreachable');
  assert.equal(r.status, null);
});

test('patrol is sequential, polite, and identifies itself', async () => {
  const urls = ['https://a.example/', 'https://b.example/', 'https://c.example/'];
  const { deps, calls, headersSeen } = fakeFetcher(
    Object.fromEntries(urls.map((u) => [u, { status: 200 }]))
  );
  const sleeps: number[] = [];
  const timed: PatrolDeps = { ...deps, sleep: async (ms) => void sleeps.push(ms) };

  const { results } = await runPatrol(
    urls.map((u, i) => ({ id: String(i), url: u })),
    timed,
    { offset: 0, limit: 10 }
  );
  assert.equal(results.length, 3);
  assert.deepEqual(calls, urls, 'requests go out in order, one at a time');
  assert.equal(sleeps.length, 2, 'a delay between each pair of requests');
  assert.ok(sleeps.every((ms) => ms > 0));
  assert.ok(headersSeen.every((h) => h['User-Agent'] === USER_AGENT));
  assert.ok(USER_AGENT.includes('builderworkshop.ca'));
});

test('patrol resumes where it stopped so a run stays inside the subrequest budget', async () => {
  const urls = ['https://a.example/', 'https://b.example/', 'https://c.example/', 'https://d.example/'];
  const { deps, calls } = fakeFetcher(Object.fromEntries(urls.map((u) => [u, { status: 200 }])));
  const assets = urls.map((u, i) => ({ id: String(i), url: u }));

  const first = await runPatrol(assets, deps, { offset: 0, limit: 2 });
  assert.equal(first.results.length, 2);
  assert.equal(first.nextOffset, 2);
  assert.equal(first.wrapped, false);

  const second = await runPatrol(assets, deps, { offset: first.nextOffset, limit: 2 });
  assert.equal(second.nextOffset, 0);
  assert.equal(second.wrapped, true);
  assert.deepEqual(calls, urls, 'two runs cover every entry exactly once');
});

test('stale verification flags stamps six months or older, and tolerates missing stamps', () => {
  const now = new Date('2026-08-25T00:00:00Z');
  const stale = staleVerifications(
    [
      { id: 'fresh', verified: '2026-08' },
      { id: 'five-months', verified: '2026-03' },
      { id: 'six-months', verified: '2026-02' },
      { id: 'ancient', verified: '2024-01' },
      { id: 'unstamped' },
      { id: 'malformed', verified: 'sometime' },
    ],
    now
  );
  assert.deepEqual(
    stale.map((s) => s.assetId),
    ['six-months', 'ancient']
  );
  assert.equal(stale[0].monthsOld, 6);
});
