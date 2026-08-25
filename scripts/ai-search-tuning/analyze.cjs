// Builds the query x threshold matrix from raw sweep output.
// Usage: node scripts/ai-search-tuning/analyze.cjs
//   env RESULTS_DIR  (default: <here>/results)
//   env SWEEP        sweep subdir name (default: sweep)
//   env THRESHOLDS   comma list (default: 0.4,0.38,0.36,0.35,0.33,0.3,0.25,0.2,0.15)
const fs = require('fs'), path = require('path');
const S = process.env.RESULTS_DIR || path.join(__dirname, 'results');
const SWEEP = process.env.SWEEP || 'sweep';
const qids = fs.readFileSync(path.join(__dirname, 'queries.txt'), 'utf8').trim().split('\n').map((l) => l.split('|')[0]);
const thresholds = (process.env.THRESHOLDS || '0.4,0.38,0.36,0.35,0.33,0.3,0.25,0.2,0.15').split(',');
const out = {};
for (const T of thresholds) {
  out[T] = {};
  for (const q of qids) {
    const f = path.join(S, SWEEP, `T${T}`, `${q}.json`);
    if (!fs.existsSync(f)) { out[T][q] = { missing: true }; continue; }
    const m = fs.readFileSync(f, 'utf8').match(/\{[\s\S]*\}/);
    if (!m) { out[T][q] = { parseFail: true }; continue; }
    let j; try { j = JSON.parse(m[0]); } catch { out[T][q] = { parseFail: true }; continue; }
    const chunks = j.chunks || [];
    out[T][q] = {
      n: chunks.length,
      top: chunks[0]?.score ?? null,
      keys: chunks.map((c) => c.item?.key || '?'),
      rerank: chunks.map((c) => +(c.scoring_details?.reranking_score ?? c.score).toFixed(3)),
      vec: chunks.map((c) => (c.scoring_details?.vector_score != null ? +c.scoring_details.vector_score.toFixed(3) : null)),
      vecCount: j.hybrid_meta?.vector_result_count, kwCount: j.hybrid_meta?.keyword_result_count,
    };
  }
}
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('query', 12) + thresholds.map((t) => pad('@' + t, 9)).join(''));
for (const q of qids) {
  console.log(pad(q, 12) + thresholds.map((t) => {
    const r = out[t][q];
    if (!r || r.missing) return pad('-', 9);
    if (r.parseFail) return pad('ERR', 9);
    return pad(String(r.n), 9);
  }).join(''));
}
console.log('\n=== detail per threshold: key:vecScore/finalScore ===');
for (const T of thresholds) {
  console.log(`\n--- threshold ${T} ---`);
  for (const q of qids) {
    const r = out[T][q];
    if (!r || r.missing || r.parseFail || !r.n) continue;
    console.log(`  ${pad(q, 12)} ${r.keys.map((k, i) => `${k.replace('.md', '')}:${r.vec[i]}/${r.rerank[i]}`).join('  ')}`);
  }
}
fs.writeFileSync(path.join(S, 'analysis.json'), JSON.stringify(out, null, 1));
console.log('\nwrote', path.join(S, 'analysis.json'));
