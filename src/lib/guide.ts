// Client for the grounded guide Worker + the query state shared by Hero,
// Directory and AssetMap through the same CustomEvent idiom as bw:trail.
//
// The Worker origin is configured here and in public/_headers connect-src.
// The static site must keep working when the Worker is down: askGuide()
// failures surface as { status: 'error' } and never block the directory.

import type { Asset, Stage } from '../data/assets';

export const GUIDE_ORIGIN = 'https://builderworkshop-guide.these3remain.workers.dev';

export const QUERY_EVENT = 'bw:query';

export interface GuideResult {
  key: string; // '<id>.md' — the AI Search item key
  id: string; // asset id, joined server-side against ecosystem.json
  name: string;
  category: string;
  stages: string[];
  why: string; // one sentence on fit, grounded in the retrieved chunk
  url: string;
}

export interface GuideGap {
  message: string;
  categories: string[]; // closest categories, from near-miss retrieval
}

export type QueryState =
  | { status: 'loading'; question: string }
  | {
      status: 'done';
      question: string;
      queryClass: string;
      results: GuideResult[];
      gap: GuideGap | null;
    }
  | { status: 'error'; question: string }
  | null; // cleared

export function dispatchQuery(state: QueryState) {
  window.dispatchEvent(new CustomEvent(QUERY_EVENT, { detail: state }));
}

export function onQuery(handler: (state: QueryState) => void): () => void {
  const fn = (e: Event) => handler((e as CustomEvent<QueryState>).detail);
  window.addEventListener(QUERY_EVENT, fn);
  return () => window.removeEventListener(QUERY_EVENT, fn);
}

function sessionId(): string {
  const KEY = 'bw:session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export async function askGuide(question: string): Promise<QueryState> {
  try {
    const res = await fetch(`${GUIDE_ORIGIN}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId(), query: question }),
    });
    if (!res.ok) return { status: 'error', question };
    const data = (await res.json()) as {
      queryClass: string;
      results: GuideResult[];
      gap: GuideGap | null;
    };
    return {
      status: 'done',
      question,
      queryClass: data.queryClass,
      results: (data.results ?? []).slice(0, 3),
      gap: data.gap ?? null,
    };
  } catch {
    return { status: 'error', question };
  }
}

// Routes an outbound directory link through /go while a query is active.
// The Worker joins the destination URL back to ecosystem.json for entity
// type and stage, so the link itself carries only destination and class.
export function goUrl(destination: string, queryClass: string): string {
  return `${GUIDE_ORIGIN}/go?to=${encodeURIComponent(destination)}&class=${encodeURIComponent(queryClass)}`;
}

// Pure directory filter: a stage filter and an active query compose as an
// intersection; query order wins for row order. Null query → stage filter
// alone; null both → all assets. Unit-tested — keep free of DOM/React.
export function filterDirectory(
  assets: Asset[],
  stage: Stage | null,
  queryIds: string[] | null
): Asset[] {
  const byStage = stage ? assets.filter((a) => a.stages.includes(stage)) : assets;
  if (!queryIds) return byStage;
  const allowed = new Map(byStage.map((a) => [a.id, a]));
  return queryIds.map((id) => allowed.get(id)).filter((a): a is Asset => a !== undefined);
}
