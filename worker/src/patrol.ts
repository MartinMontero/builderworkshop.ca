// Link patrol. Weekly: walk every entry's URL, record where it actually ends
// up, and flag the ones that have rotted. Findings go to the review queue —
// the patrol never edits anything.

export type LinkVerdict =
  | 'ok'
  | 'redirect_same_domain'
  | 'redirect_cross_domain'
  | 'gone'
  | 'server_error'
  | 'unreachable';

export interface LinkResult {
  assetId: string;
  url: string;
  finalUrl: string | null;
  finalHost: string | null;
  status: number | null;
  verdict: LinkVerdict;
  detail: string;
}

// Multi-label public suffixes we actually plausibly meet in a BC directory.
// Not a full public-suffix list: a wrong guess here only ever mislabels a
// redirect as cross-domain, which a human then reads in the queue.
const MULTI_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.au', 'net.au', 'org.au',
  'co.nz', 'co.jp', 'co.in', 'co.za',
  'bc.ca', 'on.ca', 'ab.ca', 'qc.ca',
  'gc.ca', 'gov.bc.ca',
]);

export function registrableDomain(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const lastThree = parts.slice(-3).join('.');
  if (MULTI_LABEL_SUFFIXES.has(lastThree)) return parts.slice(-4).join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_LABEL_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

export function classify(originalUrl: string, finalUrl: string | null, status: number | null): LinkVerdict {
  if (status === null) return 'unreachable';
  if (status === 404 || status === 410) return 'gone';
  if (status >= 500) return 'server_error';
  if (finalUrl) {
    const from = registrableDomain(new URL(originalUrl).host);
    const to = registrableDomain(new URL(finalUrl).host);
    if (from !== to) return 'redirect_cross_domain';
    if (new URL(finalUrl).href !== new URL(originalUrl).href) return 'redirect_same_domain';
  }
  return 'ok';
}

// Only these reach the review queue. A same-domain redirect is normal (http →
// https, trailing slash) and is recorded but not flagged.
export function isFlagged(verdict: LinkVerdict): boolean {
  return verdict === 'gone' || verdict === 'server_error' || verdict === 'redirect_cross_domain';
}

export const USER_AGENT =
  'builderworkshop.ca link patrol (+https://builderworkshop.ca; weekly directory link check)';

export interface PatrolDeps {
  fetchUrl: (url: string, init: { headers: Record<string, string>; redirect: 'follow' }) => Promise<{
    status: number;
    url: string;
  }>;
  sleep: (ms: number) => Promise<void>;
  log?: (event: string, detail?: Record<string, unknown>) => void;
}

export const POLITE_DELAY_MS = 1200;

export async function checkOne(
  asset: { id: string; url: string },
  deps: PatrolDeps
): Promise<LinkResult> {
  // One retry, then give up on this URL and move on.
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await deps.fetchUrl(asset.url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' },
        redirect: 'follow',
      });
      const finalUrl = res.url || asset.url;
      const verdict = classify(asset.url, finalUrl, res.status);
      return {
        assetId: asset.id,
        url: asset.url,
        finalUrl,
        finalHost: new URL(finalUrl).host,
        status: res.status,
        verdict,
        detail: `${res.status} → ${finalUrl}`,
      };
    } catch (e) {
      lastError = String(e);
      if (attempt === 0) await deps.sleep(500);
    }
  }
  return {
    assetId: asset.id,
    url: asset.url,
    finalUrl: null,
    finalHost: null,
    status: null,
    verdict: 'unreachable',
    detail: lastError.slice(0, 200),
  };
}

// Sequential on purpose: one origin at a time, with a gap between requests.
// `limit` caps how many entries a single run touches so the pass stays inside
// the platform's per-invocation subrequest budget; `offset` walks the rest on
// later runs.
export async function runPatrol(
  assets: Array<{ id: string; url: string }>,
  deps: PatrolDeps,
  opts: { offset: number; limit: number }
): Promise<{ results: LinkResult[]; nextOffset: number; wrapped: boolean }> {
  const results: LinkResult[] = [];
  const total = assets.length;
  let i = opts.offset % Math.max(total, 1);
  let taken = 0;
  let wrapped = false;

  while (taken < opts.limit && taken < total) {
    const asset = assets[i];
    if (taken > 0) await deps.sleep(POLITE_DELAY_MS);
    const result = await checkOne(asset, deps);
    results.push(result);
    deps.log?.('patrol.checked', { id: asset.id, verdict: result.verdict, status: result.status });
    taken++;
    i = (i + 1) % total;
    if (i === 0) wrapped = true;
  }
  return { results, nextOffset: i, wrapped };
}

// Verification staleness is a separate, free check — no network needed.
export const STALE_MONTHS = 6;

export function staleVerifications(
  assets: Array<{ id: string; verified?: string }>,
  now: Date
): Array<{ assetId: string; verified: string; monthsOld: number }> {
  const out: Array<{ assetId: string; verified: string; monthsOld: number }> = [];
  for (const a of assets) {
    if (!a.verified) continue; // dataset without stamps — nothing to judge
    const m = a.verified.match(/^(\d{4})-(\d{2})$/);
    if (!m) continue;
    const stampedYear = Number(m[1]);
    const stampedMonth = Number(m[2]);
    const monthsOld =
      (now.getUTCFullYear() - stampedYear) * 12 + (now.getUTCMonth() + 1 - stampedMonth);
    if (monthsOld >= STALE_MONTHS) {
      out.push({ assetId: a.id, verified: a.verified, monthsOld });
    }
  }
  return out;
}
