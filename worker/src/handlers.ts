// Request handlers, written against injected dependencies so the contract
// paths are unit-testable without the Workers runtime.

import { enforceContract, gapResponse, type ChatResponse, type Logger } from './contract.ts';
import { normalizeChunks, type RetrievedChunk } from './retrieval.ts';
import { isJoinableKey, resolveKey, type EcosystemData } from './ecosystem.ts';
import { buildPrompt, parseModelAnswer } from './llm.ts';
import {
  buildCorrectionPrompt,
  buildDiff,
  correctionReply,
  CORRECTION_FIELDS,
  type CorrectionDiff,
  type CorrectionField,
  type ExtractedCorrection,
} from './correction.ts';

export interface EventRow {
  ts: string;
  destination_host: string | null;
  entity_type: string | null;
  stage: string | null;
  query_class: string | null;
  answered: 0 | 1;
}

export interface ChatDeps {
  search: (query: string, probe: boolean) => Promise<unknown>;
  runModel: (prompt: string) => Promise<unknown>;
  eco: EcosystemData;
  logEvent: (row: EventRow) => Promise<void>;
  remember: (entry: { queryClass: string; keys: string[] }) => Promise<void>;
  log: Logger;
}

export async function handleChat(query: string, deps: ChatDeps): Promise<ChatResponse> {
  const { eco, log } = deps;

  const retrieved = normalizeChunks(await deps.search(query, false));
  // Pathways carry no outbound URL and can never be a structured result.
  const candidates = retrieved.filter((c) => isJoinableKey(c.key));

  if (candidates.length === 0) {
    // Empty retrieval is a finding: say so, log it unanswered, never fall
    // back on model knowledge. One wider probe grounds "closest categories".
    const nearMiss = normalizeChunks(await deps.search(query, true));
    log('chat.unanswered', { nearMisses: nearMiss.length });
    await deps.logEvent(row(null, null, null, 'unanswered', 0));
    await deps.remember({ queryClass: 'unanswered', keys: [] });
    return gapResponse(nearMiss, eco);
  }

  const answer = parseModelAnswer(await deps.runModel(buildPrompt(query, candidates)));
  const results = enforceContract(answer.picks, candidates, eco, log);

  if (results.length === 0) {
    log('chat.model_declined', { retrieved: candidates.length });
    await deps.logEvent(row(null, null, null, answer.query_class, 0));
    await deps.remember({ queryClass: answer.query_class, keys: [] });
    return gapResponse(candidates as RetrievedChunk[], eco);
  }

  await deps.logEvent(row(null, null, null, answer.query_class, 1));
  await deps.remember({ queryClass: answer.query_class, keys: results.map((r) => r.key) });
  return { queryClass: answer.query_class, results, gap: null };
}

export interface CorrectionDeps {
  search: (query: string) => Promise<unknown>;
  runModel: (prompt: string) => Promise<unknown>;
  eco: EcosystemData;
  // Records the diff for review. There is deliberately no "apply" counterpart
  // anywhere in this Worker — editing the dataset is a human job.
  queueDiff: (diff: CorrectionDiff) => Promise<void>;
  cleanReason: (text: string) => string;
  now: () => string;
  log: Logger;
}

export interface CorrectionResponse {
  kind: 'correction';
  reply: string;
  recorded: boolean;
}

export async function handleCorrection(
  query: string,
  deps: CorrectionDeps
): Promise<CorrectionResponse> {
  const retrieved = normalizeChunks(await deps.search(query));
  const candidates = retrieved.filter((c) => isJoinableKey(c.key));

  if (candidates.length === 0) {
    deps.log('correction.no_entry_matched', {});
    return {
      kind: 'correction',
      recorded: false,
      reply:
        "We couldn't tell which entry you mean. Name the place, program or community and what changed, and we'll record it.",
    };
  }

  let extracted: ExtractedCorrection;
  try {
    const raw = await deps.runModel(buildCorrectionPrompt(query, candidates));
    const r = raw as { response?: unknown };
    let payload = r?.response ?? raw;
    if (typeof payload === 'string') payload = JSON.parse(payload);
    extracted = payload as ExtractedCorrection;
  } catch (e) {
    deps.log('correction.extract_failed', { error: String(e) });
    return {
      kind: 'correction',
      recorded: false,
      reply: "We couldn't read that as a correction. Say which entry is wrong and what it should say.",
    };
  }

  const retrievedKeys = new Set(candidates.map((c) => c.key));
  if (!extracted?.key || !retrievedKeys.has(extracted.key)) {
    deps.log('correction.hallucinated_key', { key: extracted?.key });
    return {
      kind: 'correction',
      recorded: false,
      reply: "We couldn't match that to an entry on the map. Name the place and what changed.",
    };
  }
  if (!CORRECTION_FIELDS.includes(extracted.field as CorrectionField)) {
    extracted = { ...extracted, field: 'status' as CorrectionField };
  }

  const entity = resolveKey(deps.eco, extracted.key); // throws loudly if the index and dataset disagree
  const diff = buildDiff(extracted, entity, deps.now(), deps.cleanReason);
  await deps.queueDiff(diff);
  deps.log('correction.queued', { assetId: diff.assetId, field: diff.field });

  return { kind: 'correction', recorded: true, reply: correctionReply(diff, entity.name) };
}

// /go?to=<url>&class=<query_class> — logs the referral and 302s.
//
// `to` must be a URL that exists verbatim in ecosystem.json (this is also the
// open-redirect guard). The response carries no Referrer-Policy header: the
// browser re-reads policy on redirect, and the default keeps the site's
// origin as the referrer the destination sees.
export async function handleGo(
  reqUrl: URL,
  eco: EcosystemData,
  logEvent: (row: EventRow) => Promise<void>,
  log: Logger
): Promise<Response> {
  const to = reqUrl.searchParams.get('to') ?? '';
  const queryClass = (reqUrl.searchParams.get('class') ?? 'general').slice(0, 32);

  const entity = eco.byUrl.get(to);
  if (!entity) {
    log('go.unknown_destination', { to: to.slice(0, 200) });
    return new Response('Unknown destination', { status: 400 });
  }

  await logEvent(
    row(new URL(entity.url).host, entity.category, entity.stages[0] ?? null, queryClass, 1)
  );

  return new Response(null, {
    status: 302,
    headers: { Location: entity.url },
  });
}

function row(
  destination_host: string | null,
  entity_type: string | null,
  stage: string | null,
  query_class: string | null,
  answered: 0 | 1
): EventRow {
  return { ts: new Date().toISOString(), destination_host, entity_type, stage, query_class, answered };
}
