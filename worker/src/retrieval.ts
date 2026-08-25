// Every retrieval parameter the Worker uses, in one place.
//
// The instance itself is tuned (see scripts/ai-search-tuning/README.md):
// score_threshold 0.35, vector-only, reranking off, cache on. The values here
// are passed explicitly per request so this file is the only thing to edit
// when the tuning changes — including reranking.match_threshold if reranking
// is ever re-enabled (the platform's default rerank floor is ~0.4 and is only
// overridable per request).

export const INSTANCE_NAME = 'builderworkshop-map';

export const RETRIEVAL = {
  retrieval: {
    match_threshold: 0.35,
    max_num_results: 10,
  },
  // reranking: { enabled: true, model: '@cf/baai/bge-reranker-base', match_threshold: 0.2 },
} as const;

// When the tuned threshold returns nothing, one wider probe supplies the
// "closest categories" for the gap statement. Grounded in the same index —
// never in model knowledge.
export const GAP_PROBE = {
  retrieval: {
    match_threshold: 0.2,
    max_num_results: 5,
  },
} as const;

export interface RetrievedChunk {
  key: string;
  text: string;
  score: number;
}

// Normalizes the binding's search() result; tolerant of the documented
// {chunks: [...]} shape arriving with or without a result envelope.
export function normalizeChunks(raw: unknown): RetrievedChunk[] {
  const r = raw as { chunks?: unknown; result?: { chunks?: unknown } };
  const list = (Array.isArray(r?.chunks) ? r.chunks : r?.result?.chunks) as
    | Array<{ item?: { key?: string }; text?: string; score?: number }>
    | undefined;
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => typeof c?.item?.key === 'string')
    .map((c) => ({ key: c.item!.key!, text: c.text ?? '', score: c.score ?? 0 }));
}
