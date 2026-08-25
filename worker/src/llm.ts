// One model call: rank the retrieved documents and write the why lines.
// Grounding rules live in the prompt, but nothing downstream trusts them —
// contract.ts re-checks every key and sanitizes every sentence in code.

import { MAX_RESULTS, QUERY_CLASSES, type ModelPick } from './contract.ts';
import type { RetrievedChunk } from './retrieval.ts';

export const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export interface ModelAnswer {
  query_class: string;
  picks: ModelPick[];
}

export const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    query_class: { type: 'string', enum: [...QUERY_CLASSES] },
    picks: {
      type: 'array',
      maxItems: MAX_RESULTS,
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['key', 'why'],
      },
    },
  },
  required: ['query_class', 'picks'],
} as const;

export function buildPrompt(query: string, chunks: RetrievedChunk[]): string {
  const docs = chunks
    .map((c) => `<doc key="${c.key}">\n${c.text.slice(0, 1200)}\n</doc>`)
    .join('\n\n');
  return [
    'You are the guide for builderworkshop.ca, a map of the British Columbia builder ecosystem.',
    'A visitor asked:',
    `"${query.replace(/"/g, "'")}"`,
    '',
    'Below are the only documents you may use. You have no other knowledge.',
    '',
    docs,
    '',
    `Choose at most ${MAX_RESULTS} document keys that genuinely serve this visitor, best first.`,
    'For each, write "why" — ONE specific sentence of 10 to 20 words on why this place fits',
    'this visitor, naming a concrete detail from the document: the equipment, the program,',
    'the community, the neighbourhood. Plain, direct language, no generic filler.',
    "Never include street addresses, dates, times, prices, or any person's name.",
    'If none of the documents genuinely serve the need, return an empty picks array.',
    `Set query_class to one of: ${QUERY_CLASSES.join(', ')}.`,
  ].join('\n');
}

export function parseModelAnswer(raw: unknown): ModelAnswer {
  const r = raw as { response?: unknown };
  let payload = r?.response ?? raw;
  if (typeof payload === 'string') {
    payload = JSON.parse(payload);
  }
  const a = payload as ModelAnswer;
  if (!a || !Array.isArray(a.picks) || typeof a.query_class !== 'string') {
    throw new Error('model returned malformed answer');
  }
  return a;
}
