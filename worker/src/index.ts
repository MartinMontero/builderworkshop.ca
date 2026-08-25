// builderworkshop-guide — grounded search over the builderworkshop-map
// AI Search instance, /go referral tracking, and three maintenance loops:
// correction intake, weekly link patrol, monthly gap report.
//
// Deployed independently of the static site; the site works untouched when
// this Worker is down. Nothing here ever edits the dataset.

import { handleChat, handleCorrection, handleGo, type EventRow } from './handlers.ts';
import { loadEcosystem, type EcosystemData } from './ecosystem.ts';
import { GAP_PROBE, INSTANCE_NAME, RETRIEVAL } from './retrieval.ts';
import { ANSWER_SCHEMA, MODEL } from './llm.ts';
import { CORRECTION_SCHEMA, detectCorrection, type CorrectionDiff } from './correction.ts';
import { stripPersonNames } from './sanitize.ts';
import { Session } from './session.ts';
import { isAuthorized, parseDecision, REVIEW_NOTE, type ReviewItem } from './review.ts';
import { gapReport, linkPatrol, type QueueFinding } from './loops.ts';
import { USER_AGENT } from './patrol.ts';
import type { GapReport } from './gap.ts';

export { Session };

// Cron expressions must match wrangler.jsonc character for character —
// controller.cron is compared literally.
const CRON_LINK_PATROL = '17 9 * * MON';
const CRON_GAP_REPORT = '40 9 1 * *';

// How many URLs one patrol pass fetches. The Workers Free plan allows 50
// external subrequests per invocation and every redirect hop counts, so a
// pass is capped and resumes from a stored offset on the next run.
const DEFAULT_PATROL_BATCH = 46;
const FETCH_TIMEOUT_MS = 10_000;

interface D1Result<T> {
  results?: T[];
}
interface D1Statement {
  bind(...v: unknown[]): D1Statement;
  run(): Promise<unknown>;
  all<T>(): Promise<D1Result<T>>;
  first<T>(): Promise<T | null>;
}

interface Env {
  AI_SEARCH: { get(instance: string): { search(params: unknown): Promise<unknown> } };
  AI: { run(model: string, input: unknown): Promise<unknown> };
  DB: { prepare(q: string): D1Statement };
  SESSION: { idFromName(name: string): unknown; get(id: unknown): { append(t: unknown): Promise<void> } };
  REVIEW_TOKEN?: string; // wrangler secret put REVIEW_TOKEN — never in config
  PATROL_BATCH?: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://builderworkshop.ca',
  'https://www.builderworkshop.ca',
  'http://localhost:3000',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://builderworkshop.ca';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function logLine(event: string, detail?: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...detail }));
}

async function logEvent(env: Env, row: EventRow): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO events (ts, destination_host, entity_type, stage, query_class, answered) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(row.ts, row.destination_host, row.entity_type, row.stage, row.query_class, row.answered)
    .run();
}

// Findings and corrections share one queue. The partial unique index keeps a
// weekly patrol from stacking duplicates of the same open finding.
async function queueRow(
  env: Env,
  row: {
    ts: string;
    kind: string;
    assetId: string;
    field: string;
    currentValue: string;
    proposedValue: string;
    reason: string;
  }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO review_queue (ts, kind, asset_id, field, current_value, proposed_value, reason, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
     ON CONFLICT (kind, asset_id, field) WHERE status = 'pending' DO UPDATE SET
       ts = excluded.ts, current_value = excluded.current_value,
       proposed_value = excluded.proposed_value, reason = excluded.reason`
  )
    .bind(row.ts, row.kind, row.assetId, row.field, row.currentValue, row.proposedValue, row.reason)
    .run();
}

function patrolDeps() {
  return {
    fetchUrl: async (url: string, init: { headers: Record<string, string>; redirect: 'follow' }) => {
      const res = await fetch(url, {
        headers: init.headers,
        redirect: init.redirect,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      // Drain nothing: we only need status and the post-redirect URL.
      return { status: res.status, url: res.url };
    },
    sleep: (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    log: logLine,
  };
}

async function runLinkPatrol(env: Env, eco: EcosystemData, now: Date, limit: number) {
  return linkPatrol(
    { players: eco.players },
    {
      readOffset: async () => {
        const row = await env.DB.prepare('SELECT next_offset FROM patrol_state WHERE id = 1').first<{
          next_offset: number;
        }>();
        return row?.next_offset ?? 0;
      },
      writeOffset: async (offset, ts) => {
        await env.DB.prepare(
          'INSERT INTO patrol_state (id, next_offset, last_run_ts) VALUES (1, ?, ?) ' +
            'ON CONFLICT (id) DO UPDATE SET next_offset = excluded.next_offset, last_run_ts = excluded.last_run_ts'
        )
          .bind(offset, ts)
          .run();
      },
      queueFinding: (f: QueueFinding) => queueRow(env, f),
    },
    patrolDeps(),
    { limit, now }
  );
}

async function runGapReport(env: Env, eco: EcosystemData, now: Date): Promise<GapReport> {
  return gapReport(
    {
      eventsByClass: async (startIso, endIso) => {
        const r = await env.DB.prepare(
          `SELECT query_class, answered, COUNT(*) AS n FROM events
           WHERE ts >= ? AND ts < ? AND destination_host IS NULL
           GROUP BY query_class, answered`
        )
          .bind(startIso, endIso)
          .all<{ query_class: string | null; answered: number; n: number }>();
        return r.results ?? [];
      },
      clicksByHost: async (startIso, endIso) => {
        const r = await env.DB.prepare(
          `SELECT destination_host, COUNT(*) AS n FROM events
           WHERE ts >= ? AND ts < ? AND destination_host IS NOT NULL
           GROUP BY destination_host`
        )
          .bind(startIso, endIso)
          .all<{ destination_host: string | null; n: number }>();
        return r.results ?? [];
      },
      saveReport: async (report) => {
        await env.DB.prepare(
          'INSERT INTO gap_reports (month, generated_ts, payload) VALUES (?, ?, ?) ' +
            'ON CONFLICT (month) DO UPDATE SET generated_ts = excluded.generated_ts, payload = excluded.payload'
        )
          .bind(report.month, report.generatedTs, JSON.stringify(report))
          .run();
      },
    },
    eco.players,
    { stages: eco.stages, categories: eco.categories },
    now
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (url.pathname === '/go' && request.method === 'GET') {
        const eco = await loadEcosystem();
        return await handleGo(url, eco, (row) => logEvent(env, row), logLine);
      }

      // Public: the latest monthly aggregate. Counts only.
      if (url.pathname === '/api/gap-report' && request.method === 'GET') {
        const row = await env.DB.prepare(
          'SELECT month, generated_ts, payload FROM gap_reports ORDER BY month DESC LIMIT 1'
        ).first<{ month: string; generated_ts: string; payload: string }>();
        if (!row) return json({ error: 'no report yet' }, 404, origin);
        return json(JSON.parse(row.payload), 200, origin);
      }

      // Authenticated review queue.
      if (url.pathname === '/api/review') {
        if (!isAuthorized(request.headers.get('Authorization'), env.REVIEW_TOKEN)) {
          return json({ error: 'unauthorized' }, 401, origin);
        }
        if (request.method === 'GET') {
          const r = await env.DB.prepare(
            `SELECT id, ts, kind, asset_id, field, current_value, proposed_value, reason, status, reviewed_ts
             FROM review_queue WHERE status = 'pending' ORDER BY id DESC LIMIT 200`
          ).all<ReviewItem>();
          return json({ note: REVIEW_NOTE, pending: r.results ?? [] }, 200, origin);
        }
        if (request.method === 'POST') {
          const decision = parseDecision(await request.json().catch(() => null));
          if (!decision) return json({ error: 'expected {id, action: approve|reject}' }, 400, origin);
          const res = (await env.DB.prepare(
            `UPDATE review_queue SET status = ?, reviewed_ts = ? WHERE id = ? AND status = 'pending'`
          )
            .bind(decision.action === 'approve' ? 'approved' : 'rejected', new Date().toISOString(), decision.id)
            .run()) as { meta?: { changes?: number } };
          const changed = res?.meta?.changes ?? 0;
          if (changed === 0) return json({ error: 'not found or already reviewed' }, 404, origin);
          logLine('review.decided', { id: decision.id, action: decision.action });
          return json({ ok: true, id: decision.id, status: decision.action, note: REVIEW_NOTE }, 200, origin);
        }
        return json({ error: 'method not allowed' }, 405, origin);
      }

      // Authenticated manual patrol pass. Cloudflare documents no way to fire
      // a deployed cron on demand, so this is how a pass is run by hand.
      if (url.pathname === '/api/patrol/run' && request.method === 'POST') {
        if (!isAuthorized(request.headers.get('Authorization'), env.REVIEW_TOKEN)) {
          return json({ error: 'unauthorized' }, 401, origin);
        }
        const eco = await loadEcosystem();
        const limit = Number(url.searchParams.get('limit') ?? env.PATROL_BATCH ?? DEFAULT_PATROL_BATCH);
        const outcome = await runLinkPatrol(env, eco, new Date(), limit);
        return json(
          {
            checked: outcome.checked,
            flagged: outcome.flagged,
            stale: outcome.stale,
            wrapped: outcome.wrapped,
            nextOffset: outcome.nextOffset,
            results: outcome.results,
          },
          200,
          origin
        );
      }

      // Authenticated manual run, and the way to regenerate a past month.
      // asOf defaults to now; the report always covers the month before it.
      if (url.pathname === '/api/gap-report/run' && request.method === 'POST') {
        if (!isAuthorized(request.headers.get('Authorization'), env.REVIEW_TOKEN)) {
          return json({ error: 'unauthorized' }, 401, origin);
        }
        const asOfParam = url.searchParams.get('asOf');
        const asOf = asOfParam ? new Date(asOfParam) : new Date();
        if (Number.isNaN(asOf.getTime())) return json({ error: 'bad asOf' }, 400, origin);
        const eco = await loadEcosystem();
        return json(await runGapReport(env, eco, asOf), 200, origin);
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as
          | { sessionId?: string; query?: string }
          | null;
        const query = (body?.query ?? '').trim().slice(0, 500);
        const sessionId = (body?.sessionId ?? '').slice(0, 100);
        if (!query) return json({ error: 'query required' }, 400, origin);

        const eco = await loadEcosystem();
        const instance = env.AI_SEARCH.get(INSTANCE_NAME);
        const search = (q: string, probe: boolean) =>
          instance.search({
            messages: [{ role: 'user', content: q }],
            ai_search_options: probe ? GAP_PROBE : RETRIEVAL,
          });

        // Someone reporting that an entry is wrong takes a different path:
        // record a diff for review, answer no question, change nothing.
        if (detectCorrection(query).isCorrection) {
          const result = await handleCorrection(query, {
            eco,
            search: (q) => search(q, false),
            runModel: (prompt) =>
              env.AI.run(MODEL, {
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_schema', json_schema: CORRECTION_SCHEMA },
                temperature: 0.1,
              }),
            queueDiff: (diff: CorrectionDiff) =>
              queueRow(env, {
                ts: diff.ts,
                kind: 'correction',
                assetId: diff.assetId,
                field: diff.field,
                currentValue: diff.currentValue,
                proposedValue: diff.proposedValue,
                reason: diff.reason,
              }),
            // No session id is stored with a correction, by design.
            cleanReason: (text) => stripPersonNames(text, eco.names),
            now: () => new Date().toISOString(),
            log: logLine,
          });
          return json({ ...result, results: [], gap: null, queryClass: 'correction' }, 200, origin);
        }

        const response = await handleChat(query, {
          eco,
          search,
          runModel: (prompt) =>
            env.AI.run(MODEL, {
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_schema', json_schema: ANSWER_SCHEMA },
              temperature: 0.3,
            }),
          logEvent: (row) => logEvent(env, row),
          remember: async (entry) => {
            if (!sessionId) return;
            try {
              const stub = env.SESSION.get(env.SESSION.idFromName(sessionId));
              await stub.append({ ts: new Date().toISOString(), ...entry });
            } catch (e) {
              logLine('session.append_failed', { error: String(e) });
            }
          },
          log: logLine,
        });

        return json(response, 200, origin);
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      logLine('request.failed', { path: url.pathname, error: String(e) });
      return json({ error: 'guide unavailable' }, 500, origin);
    }
  },

  async scheduled(
    controller: { cron: string; scheduledTime: number },
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void }
  ): Promise<void> {
    const now = new Date(controller.scheduledTime);
    const work = (async () => {
      const eco = await loadEcosystem();
      switch (controller.cron) {
        case CRON_LINK_PATROL: {
          const limit = Number(env.PATROL_BATCH ?? DEFAULT_PATROL_BATCH);
          const outcome = await runLinkPatrol(env, eco, now, limit);
          logLine('cron.link_patrol', {
            checked: outcome.checked,
            flagged: outcome.flagged,
            stale: outcome.stale,
            wrapped: outcome.wrapped,
            nextOffset: outcome.nextOffset,
          });
          break;
        }
        case CRON_GAP_REPORT: {
          const report = await runGapReport(env, eco, now);
          logLine('cron.gap_report', {
            month: report.month,
            totalQueries: report.totalQueries,
            unanswered: report.unansweredQueries,
          });
          break;
        }
        default:
          logLine('cron.unknown', { cron: controller.cron });
      }
    })();
    // The runtime already waits on the returned promise; waitUntil makes the
    // outcome show up as the Cron Trigger's recorded status.
    ctx.waitUntil(work);
    await work;
  },
};

export { USER_AGENT };
