// Client for the grounded guide Worker + the query state shared by Hero,
// Directory and AssetMap through the same CustomEvent idiom as bw:trail.
//
// The Worker origin is configured here and in public/_headers connect-src.
// The static site must keep working when the Worker is down: askGuide()
// failures surface as { status: 'error' } and never block the directory.

import type { Asset, Category, Stage } from '../data/assets';

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

// A card intent is deterministic navigation: no model call, no network, the
// same result every time. It shares the Directory/AssetMap bus with query
// results so there is one filtered-state mechanism, not two.
export interface IntentState {
  status: 'intent';
  id: string;
  label: string;
  heading: string; // replaces the Directory heading while active
  note: string; // one line under the heading
  categories: Category[];
  stage: Stage | null; // additionally require this stage
  focus?: 'map'; // scroll target beyond #players
  handoff?: { name: string; url: string; note: string }; // partner routing
}

export type QueryState =
  | { status: 'loading'; question: string }
  | IntentState
  | {
      status: 'done';
      question: string;
      queryClass: string;
      results: GuideResult[];
      gap: GuideGap | null;
      // Set when the guide read the input as a correction rather than a
      // question: nothing was searched, a diff was queued for review.
      correction?: string;
    }
  | { status: 'error'; question: string }
  | null; // cleared

export function dispatchIntent(intent: IntentState) {
  window.dispatchEvent(new CustomEvent(QUERY_EVENT, { detail: intent }));
}

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
      kind?: string;
      reply?: string;
    };
    return {
      status: 'done',
      question,
      queryClass: data.queryClass,
      results: (data.results ?? []).slice(0, 3),
      gap: data.gap ?? null,
      ...(data.kind === 'correction' && data.reply ? { correction: data.reply } : {}),
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

// Pure intent filter: category membership, optionally narrowed by the intent's
// own stage, then by the user's stage filter if one is set. Directory rank
// order is preserved. Unit-tested — keep free of DOM/React.
export function filterIntent(
  assets: Asset[],
  intent: IntentState,
  stage: Stage | null
): Asset[] {
  return assets.filter((a) => {
    if (!intent.categories.includes(a.category)) return false;
    if (intent.stage && !a.stages.includes(intent.stage)) return false;
    if (stage && !a.stages.includes(stage)) return false;
    return true;
  });
}
