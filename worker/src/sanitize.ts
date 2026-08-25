// The `why` line is one sentence on fit. It must never carry an address, a
// date, a time, a price, or a person's name — those rot, and the row already
// links to the source of truth. Enforced here in code, not in the prompt.

export interface SanitizeOutcome {
  why: string;
  violations: string[];
}

const PATTERNS: Array<{ kind: string; re: RegExp }> = [
  // street addresses & Canadian postal codes
  { kind: 'address', re: /\b\d{1,5}[A-Za-z]?(?:[–-]\d{1,5}[A-Za-z]?)?\s+(?:[A-Za-z][A-Za-z.'-]*\s+){1,3}(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Way|Dr|Drive|Hwy|Highway|Lane|Ln|Court|Ct|Place|Pl)\b/i },
  { kind: 'address', re: /\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/ },
  // dates: ISO, slashed, "March 4", "4 March", years attached to months, weekdays
  { kind: 'date', re: /\b\d{4}-\d{2}-\d{2}\b/ },
  { kind: 'date', re: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/ },
  { kind: 'date', re: /\b(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(t|tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\.?\s+\d{1,2}(st|nd|rd|th)?\b/i },
  { kind: 'date', re: /\b\d{1,2}(st|nd|rd|th)?\s+(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(t|tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\b/i },
  { kind: 'date', re: /\b(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days?\b/i },
  // times
  { kind: 'time', re: /\b\d{1,2}:\d{2}\s?(a\.?m\.?|p\.?m\.?)?\b/i },
  { kind: 'time', re: /\b\d{1,2}\s?(a\.?m\.?|p\.?m\.?)\b/i },
  // prices — take a leading "up to / from / at / for" with the amount so the
  // strip doesn't leave grammatical debris ("up to  loans")
  { kind: 'price', re: /\b(up to|from|at|for)\s+\$\s?\d[\d,.]*\s?[KkMm]?\b/i },
  { kind: 'price', re: /\$\s?\d[\d,.]*\s?[KkMm]?\b/ },
  { kind: 'price', re: /\b\d[\d,.]*\s?(dollars|CAD|USD)\b/i },
];

// Words that legitimately appear capitalized mid-sentence in this corpus and
// are not people: geography, org-name vocabulary, category words.
const SAFE_CAPS = new Set(
  (
    'British Columbia Vancouver Victoria Langley Burnaby Surrey Nanaimo Saanich Strathcona Gastown ' +
    'Island North Shore Mount Pleasant Grandview Downtown Drive West East Coast Central City ' +
    'BC AI IoT AR VR STEAM CNC MVP SCALE ZERO ONE CC BY SR ED APEX CSE VST HI Jericho Beach ' +
    'OpenStreetMap LinkedIn Bitcoin Canada Canadian Technology Park Way Great Northern'
  ).split(/\s+/)
);

function findPersonName(why: string, entityWords: Set<string>): string | null {
  // honorific + capitalized word is always a person reference
  const honorific = why.match(/\b(Mr|Mrs|Ms|Mx|Dr|Prof)\.?\s+[A-Z][a-z]+/);
  if (honorific) return honorific[0];
  // Capitalized First Last pair where neither word belongs to the entity's own
  // name, the corpus safelist, or sentence position. Conservative by design:
  // a stripped-but-clean why beats a leaked name.
  const pairs = why.matchAll(/(?<!^)(?<![.!?]\s)\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g);
  for (const m of pairs) {
    const [full, a, b] = m;
    if (SAFE_CAPS.has(a) || SAFE_CAPS.has(b)) continue;
    if (entityWords.has(a) || entityWords.has(b)) continue;
    return full;
  }
  return null;
}

export function sanitizeWhy(
  why: string,
  entity: { name: string; category: string },
  allEntityNames: string[]
): SanitizeOutcome {
  const violations: string[] = [];
  let out = why.trim();

  for (const { kind, re } of PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    if (global.test(out)) {
      violations.push(kind);
      out = out.replace(global, '').replace(/\s{2,}/g, ' ').trim();
    }
  }

  const entityWords = new Set(
    allEntityNames.flatMap((n) => n.split(/\s+/)).filter((w) => /^[A-Z]/.test(w))
  );
  const person = findPersonName(out, entityWords);
  if (person) {
    violations.push('person-name');
    out = out.replace(person, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Tidy what the strips left behind: orphaned punctuation, then any dangling
  // conjunctions/articles the removed span was attached to ("...with the and.").
  out = out.replace(/\s+([,.;:])/g, '$1').replace(/[,;:\s]+$/, '').trim();
  if (violations.length > 0) {
    let prev;
    do {
      prev = out;
      out = out.replace(/\s*\b(and|or|with|plus|the|a|an|for|to|in|at|on|of|every|each)\s*\.?$/i, '').trim();
    } while (out !== prev);
  }
  if (violations.length > 0 && out.length < 25) {
    out = 'A strong fit for this ask — the details are in the row.';
  }
  if (!/[.!?]$/.test(out)) out += '.';

  return { why: out, violations };
}
