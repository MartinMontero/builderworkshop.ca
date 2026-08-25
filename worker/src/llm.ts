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
    'For each, write "why": why would THIS visitor walk in THIS door, over the other rows?',
    '',
    'Every why combines one concrete fact from that document with the reason it fits this',
    'visitor. Every claim must appear in the document text — nothing invented, nothing',
    'inferred, no hedging ("may", "might"). If the ask names where the visitor is in their',
    'journey (nothing built yet, early stage, scaling), say plainly how the entry meets',
    'them there — but never paste stage tag text like "ZERO → ONE".',
    '',
    'The whys are a set: a reader comparing rows must see a different reason to pick each',
    'one — like the two 3D-print examples below. No two whys may open with the same word',
    'or lean on the same core fact. Never end a why by restating the ask ("...where you',
    'can try pottery").',
    '',
    'Match the length and density of these examples (fictional entries — copy the shape,',
    'never the words):',
    '',
    'Ask: "I want to learn to weld"',
    'why: "A member-run metal shop where you learn on their gear — the intro nights',
    'assume you have never held a torch."',
    '',
    'Ask: "who backs first-time founders"',
    'why: "They write the first cheque before you have anything to show, and pair it',
    'with a year of mentorship."',
    '',
    'Ask: "where can I 3D print" — two entries returned, written as a set:',
    'why (first): "The biggest bench of printers in the city — you book a machine and',
    'a tech checks your first setup."',
    'why (second): "Volunteer-run and cheap — you learn the printers yourself,',
    'alongside people fixing their own projects."',
    '',
    'Ask routed to a partner document: "where do I find grants"',
    'why: "That answer lives at ExampleGrants.ca — this map does not track grants, and',
    'they hold the full national picture."',
    '',
    'When a document says to go to a partner site for this ask, the why must name the',
    "site and send the visitor there, like that third example — never describe the",
    "partner's content as if this map held it.",
    '',
    'Voice: direct, concrete, plain — no marketing register, no exclamation marks.',
    'Active voice only: you do something there, or the place does something — never',
    '"is available" or "are provided". Address the reader only as "you", never "the',
    'visitor". End on the fact — cut any closing clause that repeats the ask',
    '("...allowing you to try pottery", "...which can help you prototype").',
    "Never include street addresses, dates, times, or any person's name. Never quote",
    'dollar amounts — say "a startup loan", not the number. If a document gives you no',
    'distinguishing fact, one plain factual sentence is correct; do not embellish.',
    '',
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
