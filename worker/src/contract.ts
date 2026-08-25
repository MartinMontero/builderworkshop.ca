// The response contract, enforced in code. There is no free-prose path out of
// this Worker: /api/chat returns exactly this shape or an error status.

import { isJoinableKey, resolveKey, type EcosystemData } from './ecosystem.ts';
import { sanitizeWhy } from './sanitize.ts';
import type { RetrievedChunk } from './retrieval.ts';

export const MAX_RESULTS = 3;

export const QUERY_CLASSES = [
  'capability',
  'stage',
  'category',
  'location',
  'funding',
  'events',
  'general',
] as const;
export type QueryClass = (typeof QUERY_CLASSES)[number];

export interface GuideResult {
  key: string;
  id: string;
  name: string;
  category: string;
  stages: string[];
  why: string;
  url: string;
}

export interface ChatResponse {
  queryClass: string;
  results: GuideResult[];
  gap: { message: string; categories: string[] } | null;
}

export interface ModelPick {
  key: string;
  why: string;
}

export type Logger = (event: string, detail?: Record<string, unknown>) => void;

// Model output → contract. Drops hallucinated keys (a pick must name a chunk
// that was actually retrieved), caps at MAX_RESULTS, sanitizes every why, and
// joins each key to ecosystem.json — which throws on a genuinely missing key.
export function enforceContract(
  picks: ModelPick[],
  retrieved: RetrievedChunk[],
  eco: EcosystemData,
  log: Logger
): GuideResult[] {
  const retrievedKeys = new Set(retrieved.map((c) => c.key));
  const out: GuideResult[] = [];
  const seen = new Set<string>();

  for (const pick of picks) {
    if (out.length >= MAX_RESULTS) {
      log('contract.capped', { dropped: pick.key });
      continue;
    }
    if (!retrievedKeys.has(pick.key)) {
      log('contract.hallucinated_key', { key: pick.key });
      continue;
    }
    if (seen.has(pick.key)) continue;
    seen.add(pick.key);

    const entity = resolveKey(eco, pick.key); // throws loudly on missing key
    const { why, violations } = sanitizeWhy(pick.why, entity, eco.names);
    if (violations.length > 0) {
      log('contract.why_sanitized', { key: pick.key, violations });
    }
    out.push({
      key: pick.key,
      id: entity.id,
      name: entity.name,
      category: entity.category,
      stages: entity.stages,
      why,
      url: entity.url, // canonical URL from the dataset, never from the index
    });
  }
  return out;
}

export function gapResponse(nearMissChunks: RetrievedChunk[], eco: EcosystemData): ChatResponse {
  const categories: string[] = [];
  for (const c of nearMissChunks) {
    if (!isJoinableKey(c.key)) continue;
    try {
      const cat = resolveKey(eco, c.key).category;
      if (!categories.includes(cat)) categories.push(cat);
    } catch {
      // a broken near-miss key shouldn't break the gap statement
    }
    if (categories.length >= 3) break;
  }
  return {
    queryClass: 'unanswered',
    results: [],
    gap: {
      message: 'Nothing on this map serves that need yet — that gap is a real finding.',
      categories,
    },
  };
}
