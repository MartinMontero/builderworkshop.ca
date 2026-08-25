// Pushes the builderworkshop directory into a Cloudflare AI Search instance.
//
//   node scripts/index-ai-search.mjs            # sync (delete-all + upload)
//   node scripts/index-ai-search.mjs --dry-run  # print docs, touch nothing
//
// Env:
//   CF_ACCOUNT_ID        Cloudflare account id
//   CF_AI_SEARCH_TOKEN   token with AI Search:Edit + AI Search:Run
//   CF_AI_SEARCH_INSTANCE  optional, defaults to builderworkshop-map
//
// Design note: documents carry everything the directory knows about an
// entry. The map's job is to tell someone as much as it can about a venue,
// program or community so they can decide whether to go.
//
// The one exception is the two partner entries - buildrs.dev and
// FoundedIn Canada. Their unique value-adds (the Vancouver events calendar
// and product directory; funding and grant discovery, the SR&ED estimator,
// investor-readiness scoring) are theirs. We point people at them and do
// not reproduce or compete with them. That rule applies to those two
// entries only.
//
// The object key is `<id>.md`, so the app joins retrieval hits back to
// ecosystem.json for the canonical URL rather than trusting the index.

import { build } from 'esbuild';

const DRY = process.argv.includes('--dry-run');
const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_AI_SEARCH_TOKEN;
const INSTANCE = process.env.CF_AI_SEARCH_INSTANCE || 'builderworkshop-map';
const API = 'https://api.cloudflare.com/client/v4';

if (!DRY && (!ACCOUNT || !TOKEN)) {
  console.error('Missing CF_ACCOUNT_ID or CF_AI_SEARCH_TOKEN. Set both, or pass --dry-run.');
  process.exit(1);
}

// --- load the typed data through esbuild, same trick as export-data.mjs ---
const result = await build({
  entryPoints: ['src/data/assets.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const { ASSETS, PATHWAYS, CAPABILITY_LABELS } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
);

const byId = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

// The two partner entries. Their unique tools are theirs; we route to them.
const PARTNER_ROUTING = {
  buildrs:
    'For what is actually happening in Vancouver tech week to week, and for the directory of products BC builders are shipping, go to buildrs.dev. It is the single calendar for the city and the place to list what you have built. builderworkshop.ca does not run an events calendar or a product directory.',
  foundedincanada:
    'For funding and grant discovery, the SR&ED estimator, investor-readiness scoring, name and trademark checks, and the national picture beyond BC, go to FoundedIn Canada. builderworkshop.ca does not duplicate those tools.',
};

function assetDoc(a, rank) {
  const caps = (a.capabilities || []).map((c) => CAPABILITY_LABELS[c] || c);
  return [
    `# ${a.name}`,
    ``,
    `Type: ${a.category}`,
    `Builder stage: ${a.stages.join(', ')}`,
    `Location: ${a.location}`,
    a.lat === undefined
      ? `Fixed venue: no - this is a program, community or network without a street address`
      : `Fixed venue: yes - you can walk in`,
    a.lat !== undefined ? `Coordinates: ${a.lat}, ${a.lng}` : null,
    caps.length ? `Equipment and facilities on site: ${caps.join(', ')}` : null,
    `Website: ${a.url}`,
    `Directory rank: ${rank} of 46`,
    `Last verified: ${a.verified || 'unverified'}`,
    ``,
    a.blurb,
    ``,
    PARTNER_ROUTING[a.id] || null,
  ]
    .filter(Boolean)
    .join('\n');
}

function pathwayDoc(p) {
  const stops = p.stops.map((id) => byId[id]?.name || id);
  return [
    `# ${p.name}`,
    ``,
    `Type: Pathway - a curated route through several venues`,
    `Stops in order: ${stops.join(' -> ')}`,
    ``,
    p.blurb,
  ].join('\n');
}

const docs = [
  ...ASSETS.map((a, i) => ({ key: `${a.id}.md`, body: assetDoc(a, i + 1) })),
  ...PATHWAYS.map((p) => ({ key: `pathway-${p.id}.md`, body: pathwayDoc(p) })),
];

if (DRY) {
  console.log(`--- DRY RUN: ${docs.length} documents ---\n`);
  console.log(docs[0].body);
  console.log('\n---\n');
  console.log(docs[docs.length - 1].body);
  const bytes = docs.reduce((n, d) => n + Buffer.byteLength(d.body), 0);
  const max = docs.reduce((m, d) => Math.max(m, Buffer.byteLength(d.body)), 0);
  console.log(`\n${docs.length} docs, ${bytes} bytes total, largest ${max} bytes`);
  console.log(`Largest doc is ${max < 2048 ? 'under' : 'OVER'} the 2048 chunk size - ${max < 2048 ? 'one chunk each, good' : 'will split, raise chunk-size'}`);
  process.exit(0);
}

const headers = { Authorization: `Bearer ${TOKEN}` };
const base = `${API}/accounts/${ACCOUNT}/ai-search/instances/${INSTANCE}/items`;

async function cf(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = json?.errors?.[0];
    throw new Error(`${res.status} ${err ? `${err.code} ${err.message}` : text.slice(0, 300)}`);
  }
  return json;
}

// 1. clear existing items so this is a clean re-sync
console.log(`Listing existing items in "${INSTANCE}"...`);
const PER_PAGE = 50; // API caps per_page at 50
const existing = [];
for (let page = 1; ; page++) {
  const u = new URL(base);
  u.searchParams.set('per_page', String(PER_PAGE));
  u.searchParams.set('page', String(page));
  const res = await cf(u.toString());
  const items = Array.isArray(res.result) ? res.result : res.result?.items || [];
  existing.push(...items);
  // result_info is page-based - {count, page, per_page, total_count}, no cursor.
  const total = res.result_info?.total_count;
  if (items.length < PER_PAGE) break;
  if (typeof total === 'number' && existing.length >= total) break;
}
console.log(`  found ${existing.length}`);

let deleted = 0;
for (const item of existing) {
  const id = item.id || item.item_id;
  if (!id) continue;
  await cf(`${base}/${id}`, { method: 'DELETE' });
  deleted++;
}
if (deleted) console.log(`  deleted ${deleted}`);

// 2. upload
let uploaded = 0;
for (const doc of docs) {
  const form = new FormData();
  form.append('file', new Blob([doc.body], { type: 'text/markdown' }), doc.key);
  await cf(base, { method: 'POST', body: form });
  uploaded++;
  process.stdout.write(`\r  uploaded ${uploaded}/${docs.length}`);
}
console.log('');

console.log(`Done. deleted ${deleted}, uploaded ${uploaded}.`);
console.log(`Check indexing:  npx wrangler ai-search stats ${INSTANCE} --json`);
