// The two scheduled loops, written against injected storage so they can be
// exercised without the Workers runtime. Neither ever edits the dataset — both
// only write findings to the review queue.

import { buildGapReport, previousMonth, type GapReport } from './gap.ts';
import {
  isFlagged,
  runPatrol,
  staleVerifications,
  type LinkResult,
  type PatrolDeps,
} from './patrol.ts';

export interface QueueFinding {
  ts: string;
  kind: 'link_patrol' | 'stale_verification';
  assetId: string;
  field: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
}

export interface PatrolStorage {
  readOffset: () => Promise<number>;
  writeOffset: (offset: number, ts: string) => Promise<void>;
  queueFinding: (f: QueueFinding) => Promise<void>;
}

export interface PatrolAssets {
  players: Array<{ id: string; url: string; verified?: string }>;
}

export interface PatrolOutcome {
  checked: number;
  flagged: number;
  wrapped: boolean;
  nextOffset: number;
  stale: number;
  results: LinkResult[];
}

export async function linkPatrol(
  assets: PatrolAssets,
  storage: PatrolStorage,
  deps: PatrolDeps,
  opts: { limit: number; now: Date }
): Promise<PatrolOutcome> {
  const ts = opts.now.toISOString();
  const offset = await storage.readOffset();
  const { results, nextOffset, wrapped } = await runPatrol(assets.players, deps, {
    offset,
    limit: opts.limit,
  });

  let flagged = 0;
  for (const r of results) {
    if (!isFlagged(r.verdict)) continue;
    flagged++;
    await storage.queueFinding({
      ts,
      kind: 'link_patrol',
      assetId: r.assetId,
      field: 'url',
      currentValue: r.url,
      proposedValue: r.verdict === 'redirect_cross_domain' ? (r.finalUrl ?? '') : '',
      reason: `${r.verdict}: ${r.detail}`.slice(0, 300),
    });
  }

  // Staleness costs nothing to check, so it runs on every pass over the whole
  // dataset rather than only the slice that was fetched.
  let stale = 0;
  for (const s of staleVerifications(assets.players, opts.now)) {
    stale++;
    await storage.queueFinding({
      ts,
      kind: 'stale_verification',
      assetId: s.assetId,
      field: 'verified',
      currentValue: s.verified,
      proposedValue: '',
      reason: `last verified ${s.monthsOld} months ago`,
    });
  }

  await storage.writeOffset(nextOffset, ts);
  return { checked: results.length, flagged, wrapped, nextOffset, stale, results };
}

export interface GapStorage {
  eventsByClass: (
    startIso: string,
    endIso: string
  ) => Promise<Array<{ query_class: string | null; answered: number; n: number }>>;
  clicksByHost: (
    startIso: string,
    endIso: string
  ) => Promise<Array<{ destination_host: string | null; n: number }>>;
  saveReport: (report: GapReport) => Promise<void>;
}

export async function gapReport(
  storage: GapStorage,
  assets: Array<{ category: string; stages: string[] }>,
  meta: { stages: string[]; categories: string[] },
  now: Date
): Promise<GapReport> {
  const { key, startIso, endIso } = previousMonth(now);
  const [events, clicks] = await Promise.all([
    storage.eventsByClass(startIso, endIso),
    storage.clicksByHost(startIso, endIso),
  ]);
  const report = buildGapReport(
    key,
    now.toISOString(),
    events,
    clicks,
    assets,
    meta.stages,
    meta.categories
  );
  await storage.saveReport(report);
  return report;
}
