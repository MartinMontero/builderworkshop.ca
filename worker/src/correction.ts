// Correction intake. Someone tells us an entry is wrong — moved, closed,
// renamed, dead link. We record a structured diff for human review and never
// touch the data ourselves.
//
// Detection is a pure function so it is testable without a model: the model is
// only asked to extract a diff once detection has already fired.

// Tier A: assertive reports. These state a change or an error outright, so
// they are corrections even when punctuated as a question ("did you know the
// url is dead?").
const ASSERTIVE = [
  /\b(shut\s?down|closed\s+down|permanently\s+closed|out\s+of\s+business|defunct|folded)\b/i,
  /\bno\s+longer\b/i,
  /\b(dead|broken|wrong|bad)\s+(link|url)\b/i,
  /\b(link|url|site|website|domain)\s+(is|are|has|was)\s+(dead|broken|wrong|down|gone|expired)\b/i,
  /\b(is|are|was|that's|thats|this\s+is)\s+(wrong|incorrect|inaccurate|outdated|out\s+of\s+date)\b/i,
  /\b(needs?\s+(updating|to\s+be\s+updated)|please\s+update|should\s+be\s+updated)\b/i,
  /\b(renamed|rebranded|now\s+called|new\s+name\s+is|changed\s+(its|their)\s+name)\b/i,
  /\b(has|have|had)\s+(moved|relocated|closed|shut)\b/i,
  /\b(moved|relocated)\s+to\b/i,
  /\bshould\s+(be|now\s+be)\b/i,
];

// Tier B: change words that only read as a correction outside a question.
const CHANGE_WORDS =
  /\b(moved|relocated|closed|shut|renamed|gone|wrong|incorrect|outdated|changed)\b/i;

// Question framing: an interrogative opener plus a question mark.
const INTERROGATIVE_OPEN =
  /^\s*(where|what|when|who|whom|whose|why|how|which|is|are|was|were|do|does|did|can|could|should|would|will|has|have|had|any|anyone|anybody|i'?m|im|i\s+need|i\s+want|looking)\b/i;

export interface Detection {
  isCorrection: boolean;
  matched: string[];
}

export function detectCorrection(query: string): Detection {
  const q = query.trim();
  const matched: string[] = [];

  for (const re of ASSERTIVE) {
    const m = q.match(re);
    if (m) matched.push(m[0].toLowerCase());
  }
  if (matched.length > 0) return { isCorrection: true, matched };

  const change = q.match(CHANGE_WORDS);
  if (change) {
    const framedAsQuestion = INTERROGATIVE_OPEN.test(q) && q.includes('?');
    if (!framedAsQuestion) {
      return { isCorrection: true, matched: [change[0].toLowerCase()] };
    }
  }
  return { isCorrection: false, matched: [] };
}

export const CORRECTION_FIELDS = ['url', 'location', 'name', 'status', 'blurb'] as const;
export type CorrectionField = (typeof CORRECTION_FIELDS)[number];

export const CORRECTION_SCHEMA = {
  type: 'object',
  properties: {
    key: { type: 'string', description: 'the <id>.md key of the entry being corrected' },
    field: { type: 'string', enum: [...CORRECTION_FIELDS] },
    proposed_value: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['key', 'field', 'proposed_value', 'reason'],
} as const;

export interface ExtractedCorrection {
  key: string;
  field: CorrectionField;
  proposed_value: string;
  reason: string;
}

export function buildCorrectionPrompt(query: string, docs: Array<{ key: string; text: string }>): string {
  return [
    'Someone is reporting that an entry on the builderworkshop.ca map is out of date.',
    '',
    'What they said:',
    `"${query.replace(/"/g, "'")}"`,
    '',
    'These are the only entries you may choose from:',
    '',
    ...docs.map((d) => `<doc key="${d.key}">\n${d.text.slice(0, 600)}\n</doc>`),
    '',
    'Identify which entry they mean and what they say has changed.',
    '- key: the exact key of that entry, copied from above.',
    `- field: which field is wrong — ${CORRECTION_FIELDS.join(', ')}. Use "status" when they`,
    '  say it has closed or no longer exists.',
    '- proposed_value: what it should say instead, in their words. If they only say it has',
    '  closed, use "closed". If they give no replacement, use "unknown".',
    '- reason: what they told us, in one short sentence. Do not add anything they did not say.',
    '',
    'Do not invent an entry that is not listed above.',
  ].join('\n');
}

// The recorded diff. current_value comes from the dataset, never from the
// person or the model — we look it up ourselves.
export interface CorrectionDiff {
  ts: string;
  assetId: string;
  field: CorrectionField;
  currentValue: string;
  proposedValue: string;
  reason: string;
}

export const MAX_FREE_TEXT = 300;

export function buildDiff(
  extracted: ExtractedCorrection,
  entity: { id: string; name: string; url: string; location?: string; category: string },
  ts: string,
  cleanReason: (text: string) => string
): CorrectionDiff {
  const current: Record<CorrectionField, string> = {
    url: entity.url,
    location: entity.location ?? '',
    name: entity.name,
    status: 'listed',
    blurb: '',
  };
  return {
    ts,
    assetId: entity.id,
    field: extracted.field,
    currentValue: current[extracted.field] ?? '',
    proposedValue: extracted.proposed_value.trim().slice(0, MAX_FREE_TEXT),
    // The reason is the only place a person's own words are kept. Strip any
    // name they mention — the diff needs the claim, not who made it.
    reason: cleanReason(extracted.reason).trim().slice(0, MAX_FREE_TEXT),
  };
}

// The reply. Confirms what was recorded, promises no timeline.
export function correctionReply(diff: CorrectionDiff, entityName: string): string {
  const what =
    diff.field === 'status'
      ? `that ${entityName} is ${diff.proposedValue}`
      : `a change to ${entityName}'s ${diff.field}`;
  return `Recorded: ${what}. It goes in the queue for a human to check against the source before anything on the map changes. Nothing is updated automatically, and we can't say when someone will get to it.`;
}
