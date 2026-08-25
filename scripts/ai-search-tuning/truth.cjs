// Dumps the ground-truth corpus table (key, name, category, stages,
// capabilities, location, blurb) used to judge search relevance.
// Usage: node scripts/ai-search-tuning/truth.cjs
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');
const root = path.resolve(__dirname, '..', '..');
const req = createRequire(path.join(root, 'package.json'));
const { buildSync } = req('esbuild');
const r = buildSync({ entryPoints: [path.join(root, 'src/data/assets.ts')], bundle: true, format: 'cjs', platform: 'node', write: false });
const mod = { exports: {} };
new Function('module', 'exports', 'require', r.outputFiles[0].text)(mod, mod.exports, req);
const { ASSETS, PATHWAYS, CAPABILITY_LABELS } = mod.exports;
const rows = ASSETS.map((a) => ({
  key: a.id + '.md', name: a.name, category: a.category,
  stages: a.stages, caps: (a.capabilities || []).map((c) => CAPABILITY_LABELS[c] || c),
  location: a.location, blurb: a.blurb.slice(0, 110),
}));
for (const p of PATHWAYS) rows.push({ key: 'pathway-' + p.id + '.md', name: p.name, category: 'Pathway', stages: [], caps: [], location: '', blurb: p.blurb.slice(0, 110) });
fs.writeFileSync(path.join(__dirname, 'results', 'truth.json'), JSON.stringify(rows, null, 1));
console.log('wrote', rows.length, 'ground-truth rows to results/truth.json');
