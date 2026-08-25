// Gap report. Monthly aggregate of what the map was asked for and could not
// answer, plus where its own coverage is thin.
//
// Counts only. The events table has never held query text — see schema.sql —
// so there is nothing to redact here; the shape below is enforced by test.

export interface EventAggregateRow {
  query_class: string | null;
  answered: number;
  n: number;
}

export interface HostClickRow {
  destination_host: string | null;
  n: number;
}

export interface GapReport {
  month: string; // YYYY-MM
  generatedTs: string;
  totalQueries: number;
  unansweredQueries: number;
  unansweredByClass: Array<{ queryClass: string; count: number }>;
  clicksByHost: Array<{ host: string; count: number }>;
  thinStages: Array<{ stage: string; count: number }>;
  thinCategories: Array<{ category: string; count: number }>;
}

export const THIN_STAGE_THRESHOLD = 3;
export const THIN_CATEGORY_THRESHOLD = 5;

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// The month that just ended, relative to `now`.
export function previousMonth(now: Date): { key: string; startIso: string; endIso: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { key: monthKey(start), startIso: start.toISOString(), endIso: end.toISOString() };
}

export function buildGapReport(
  month: string,
  generatedTs: string,
  events: EventAggregateRow[],
  hostClicks: HostClickRow[],
  assets: Array<{ category: string; stages: string[] }>,
  allStages: string[],
  allCategories: string[]
): GapReport {
  let totalQueries = 0;
  let unansweredQueries = 0;
  const byClass = new Map<string, number>();

  for (const row of events) {
    // A referral click carries a destination host; a query does not. Only
    // query rows count toward the ask totals.
    totalQueries += row.n;
    if (row.answered === 0) {
      unansweredQueries += row.n;
      const cls = row.query_class ?? 'unknown';
      byClass.set(cls, (byClass.get(cls) ?? 0) + row.n);
    }
  }

  const stageCounts = new Map<string, number>();
  for (const s of allStages) stageCounts.set(s, 0);
  const catCounts = new Map<string, number>();
  for (const c of allCategories) catCounts.set(c, 0);
  for (const a of assets) {
    catCounts.set(a.category, (catCounts.get(a.category) ?? 0) + 1);
    for (const s of a.stages) stageCounts.set(s, (stageCounts.get(s) ?? 0) + 1);
  }

  return {
    month,
    generatedTs,
    totalQueries,
    unansweredQueries,
    unansweredByClass: [...byClass.entries()]
      .map(([queryClass, count]) => ({ queryClass, count }))
      .sort((a, b) => b.count - a.count),
    clicksByHost: hostClicks
      .filter((h) => h.destination_host)
      .map((h) => ({ host: h.destination_host as string, count: h.n }))
      .sort((a, b) => b.count - a.count),
    thinStages: [...stageCounts.entries()]
      .filter(([, count]) => count < THIN_STAGE_THRESHOLD)
      .map(([stage, count]) => ({ stage, count })),
    thinCategories: [...catCounts.entries()]
      .filter(([, count]) => count < THIN_CATEGORY_THRESHOLD)
      .map(([category, count]) => ({ category, count })),
  };
}
