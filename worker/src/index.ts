// builderworkshop-guide — grounded search over the builderworkshop-map
// AI Search instance, plus /go referral tracking. Deployed independently of
// the static site; the site works untouched when this Worker is down.

import { handleChat, handleGo, type EventRow } from './handlers.ts';
import { loadEcosystem } from './ecosystem.ts';
import { GAP_PROBE, INSTANCE_NAME, RETRIEVAL } from './retrieval.ts';
import { ANSWER_SCHEMA, MODEL } from './llm.ts';
import { Session } from './session.ts';

export { Session };

interface Env {
  AI_SEARCH: {
    get(instance: string): {
      search(params: unknown): Promise<unknown>;
    };
  };
  AI: { run(model: string, input: unknown): Promise<unknown> };
  DB: {
    prepare(q: string): {
      bind(...v: unknown[]): { run(): Promise<unknown> };
    };
  };
  SESSION: {
    idFromName(name: string): unknown;
    get(id: unknown): { append(turn: unknown): Promise<void> };
  };
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
    'Access-Control-Allow-Headers': 'Content-Type',
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

async function logEvent(env: Env, row: EventRow): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO events (ts, destination_host, entity_type, stage, query_class, answered) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(row.ts, row.destination_host, row.entity_type, row.stage, row.query_class, row.answered)
    .run();
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

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as
          | { sessionId?: string; query?: string }
          | null;
        const query = (body?.query ?? '').trim().slice(0, 500);
        const sessionId = (body?.sessionId ?? '').slice(0, 100);
        if (!query) return json({ error: 'query required' }, 400, origin);

        const eco = await loadEcosystem();
        const instance = env.AI_SEARCH.get(INSTANCE_NAME);

        const response = await handleChat(query, {
          eco,
          // Retrieval restricted to the tuned instance; params live in
          // retrieval.ts and nowhere else.
          search: (q, probe) =>
            instance.search({
              messages: [{ role: 'user', content: q }],
              ai_search_options: probe ? GAP_PROBE : RETRIEVAL,
            }),
          runModel: (prompt) =>
            env.AI.run(MODEL, {
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_schema', json_schema: ANSWER_SCHEMA },
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
      // Loud by design: a missing key or a dead dataset is a 500, not a guess.
      logLine('request.failed', { path: url.pathname, error: String(e) });
      return json({ error: 'guide unavailable' }, 500, origin);
    }
  },
};

function logLine(event: string, detail?: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...detail }));
}
