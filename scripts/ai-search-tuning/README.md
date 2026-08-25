# AI Search retrieval tuning — builderworkshop-map

Empirical tuning of the Cloudflare AI Search instance `builderworkshop-map`
(2026-08-25). Goal: conversational queries ("where can I laser cut something")
must return results, not just keyword queries ("laser cutting").

## Findings — why conversational queries returned 0

The retrieval `score_threshold` (0.4 at the time) was **not** the cause. Three
stacked mechanisms were:

1. **Keyword AND-gate.** With `hybrid_search_enabled: true` and
   `retrieval_options.keyword_match_mode: "and"`, a document had to appear in
   the BM25 keyword results to be returned at all — in every baseline query,
   chunks returned == keyword hits exactly, and the 39–50 vector matches were
   discarded. Conversational phrasings ("where **can** **I** ... **something**")
   match no document on every term → 0 keyword hits → 0 results at any threshold.
2. **Hidden reranking floor (~0.4).** `reranking: true` with an empty
   `reranking_model` is *not* a no-op: a default model runs and its score becomes
   the returned `score`. No chunk with a reranking score below exactly 0.400 was
   ever returned, even with `score_threshold` 0.15 — a default
   `reranking.match_threshold` that is only overridable per request, not at the
   instance level. Conversational phrasings score below it.
3. **Similarity cache.** With `cache: true`, an initial 6-threshold sweep
   returned byte-identical results at every threshold (first response cached,
   identical queries hit it). `results/sweep-cached-hybrid/` preserves that
   contaminated run as evidence. All real measurements ran with `--cache false`;
   cache was restored to `true` afterwards.

With hybrid off and reranking off, the threshold filters on `vector_score` and
tuning becomes meaningful.

## Method

16 queries (`queries.txt`): keyword + conversational forms of the same intents,
covering capabilities (laser, ceramics, glass, 3D print), stages (pre-seed),
categories (coworking, youth, funding, events, SR&ED). 9 thresholds
(0.4 → 0.15), vector-only, reranking off, cache off. Raw output in
`results/sweep/`, digested in `results/analysis.json`.

Chunks returned (max_num_results caps at 10; ¹ transient empty right after the
config update, re-verified: k-laser@0.4=3, c-laser@0.4=2):

| query | 0.4 | 0.38 | 0.36 | **0.35** | 0.33 | 0.3 | ≤0.25 |
|---|---|---|---|---|---|---|---|
| k-laser | 3¹ | 3 | 4 | **5** | 8 | 8 | 10 |
| c-laser | 2¹ | 4 | 6 | **7** | 8 | 10 | 10 |
| k-ceramics | 8 | 10 | 10 | **10** | 10 | 10 | 10 |
| c-ceramics | 0 | 0 | 3 | **8** | 10 | 10 | 10 |
| k-preseed | 7 | 8 | 8 | **10** | 10 | 10 | 10 |
| c-preseed | 0 | 0 | 1 | **3** | 6 | 10 | 10 |
| k-cowork | 10 | 10 | 10 | **10** | 10 | 10 | 10 |
| c-cowork | 3 | 4 | 7 | **10** | 10 | 10 | 10 |
| k-youth | 9 | 10 | 10 | **10** | 10 | 10 | 10 |
| c-youth | 0 | 1 | 1 | **2** | 3 | 5 | 10 |
| k-glass | 0 | 0 | 1 | **1** | 3 | 9 | 10 |
| c-fund | 10 | 10 | 10 | **10** | 10 | 10 | 10 |
| k-3dprint | 6 | 6 | 8 | **10** | 10 | 10 | 10 |
| c-proto | 1 | 1 | 4 | **4** | 9 | 10 | 10 |
| c-events | 4 | 6 | 8 | **10** | 10 | 10 | 10 |
| k-sred | 0 | 0 | 1 | **1** | 1 | 6 | 10 |

First clearly-bad results as the threshold drops: `vst`→c-events at 0.388;
`slice`→c-laser at 0.355; `makerlabs`/`makercube`→k-glass at 0.338–0.349;
`zenlaunchpad`→c-youth at 0.335; k-sred junk flood at 0.313–0.325. Real answers
that need a low threshold: c-ceramics `artsfactory` 0.371 / `makerlabs` 0.362,
c-youth `zenmakerlab` 0.352, c-preseed `althra` 0.304. Some junk exists at any
threshold (`tcglass` 0.509 for "coworking Gastown", `inspirationlab` 0.415 for
"ceramics studio") — embedding-ranking failures a reranker would fix, not a
threshold.

## Decision: score_threshold = 0.35

Every query returns ≥1 result; all ground-truth targets retrievable; incremental
junk is two last-ranked tail items. 0.33/0.30 break k-glass, c-youth and k-sred.
Final verification at 0.35 (`results/final/`, rendered by `final-table.cjs`):
**0/16 dead queries; 53 good / 42 marginal / 16 bad** (7 bads are the
pre-existing k-youth tail no threshold fixes).

## Instance state after tuning

| setting | value | note |
|---|---|---|
| score_threshold | 0.35 | tuned here |
| hybrid_search_enabled | false (was true) | removed the keyword AND-gate |
| index_method.keyword | false (was true) | flipped by `--hybrid-search false` |
| reranking | false (was true) | hidden 0.4 floor; model choice left to owner |
| cache | true | disabled during measurement only, restored |
| summarization / rewrite_query / chunk_size / embedding model | unchanged | out of scope by instruction |

To restore hybrid + reranking later: in the dashboard set
`keyword_match_mode: "or"` and `reranking_model: "@cf/baai/bge-reranker-base"`,
then `npx wrangler ai-search update builderworkshop-map --hybrid-search true
--reranking true`. Caveat: the ~0.4 reranking floor returns with it unless the
app passes `ai_search_options.reranking.match_threshold` per request.

## Token scopes (AI Search permissions: Read / Run / Edit)

The `.env` `CF_AI_SEARCH_TOKEN` has Edit (items API works) and Run (search
works). `stats` and instance GET/PATCH still 401 — they need **AI Search:Read**
(and config PATCH may need account-scoped Edit). `wrangler` uses OAuth and can
do stats/config updates except `keyword_match_mode`, which has no wrangler flag.

## Files

- `queries.txt` — 16-query test set (`id|query` per line)
- `sweep.sh` — threshold sweep driver (wrangler OAuth; disable cache first)
- `analyze.cjs` — query × threshold matrix + per-threshold detail
- `final-table.cjs` — relevance-marked verification table
- `truth.cjs` — regenerates `results/truth.json` from `src/data/assets.ts`
- `results/sweep/` — clean sweep raw data (vector-only, rerank off, cache off)
- `results/sweep-cached-hybrid/` — first sweep, cache-contaminated (evidence)
- `results/final/` — verification run at 0.35
- `update-*.json` files from the sweeps are excluded (they embed account email)
