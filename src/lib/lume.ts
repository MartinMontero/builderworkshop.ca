// LUME standing-room counts.
//
// LUME (lume.builderworkshop.ca) is our own tool: people open recurring rooms
// with a named host, anchored to a venue on this map. It publishes an
// anon-readable view that returns COUNTS ONLY, keyed by venue_slug — no
// identity columns, no coordinates, by design. That is the whole reason we can
// show live numbers on a public page without asking anyone's permission.
//
// venue_slug joins to an asset id in this repo. A slug we do not recognise is
// dropped rather than rendered: a raw slug on the page would be a leak of
// LUME's internal keys into our copy, and would read as a bug.
//
// Requires the Supabase origin in public/_headers connect-src.

import { ACTIVE } from '../data/assets.ts';

const COUNTS_URL =
  'https://ihczeahetofnizxjlcqx.supabase.co/rest/v1/venue_room_counts?select=venue_slug,active_standing_rooms';

// Publishable key. Safe in a browser bundle by design — it grants SELECT on
// this counts-only view and nothing else.
const PUBLISHABLE_KEY = 'sb_publishable_WDyLAcWa04CpBWTbwrGSqw_wlrEr9Rm';

export interface VenueRoomCount {
  venue_slug: string;
  active_standing_rooms: number;
}

export interface RoomSummary {
  /** Total active standing rooms across every venue we can name. */
  total: number;
  /** Asset names, in directory order. Never raw slugs. */
  venueNames: string[];
  /** Slugs returned by LUME that match no asset here — dropped, but counted. */
  unmatched: number;
}

/** Exported for tests: pure join, no network. */
export function summarise(rows: VenueRoomCount[], assets = ACTIVE): RoomSummary {
  const byId = new Map(assets.map((a) => [a.id, a]));
  const order = new Map(assets.map((a, i) => [a.id, i]));
  let total = 0;
  let unmatched = 0;
  const named: Array<{ name: string; rank: number }> = [];

  for (const row of rows) {
    const n = Number(row?.active_standing_rooms) || 0;
    if (n <= 0) continue;
    const asset = byId.get(row.venue_slug);
    if (!asset) {
      // LUME knows a venue we do not, or an id drifted. Count the rooms — they
      // are real — but never print a slug we cannot resolve to a name.
      unmatched += n;
      continue;
    }
    total += n;
    named.push({ name: asset.name, rank: order.get(row.venue_slug) ?? Number.MAX_SAFE_INTEGER });
  }

  named.sort((a, b) => a.rank - b.rank);
  return { total, venueNames: named.map((v) => v.name), unmatched };
}

type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

/**
 * Fetch the live counts. Returns null on ANY failure — the caller renders the
 * card without numbers rather than blocking on LUME being reachable, and a
 * stale count is never shown as current.
 */
export async function fetchRoomCounts(
  options: { fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<RoomSummary | null> {
  const doFetch = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike | undefined);
  if (!doFetch) return null;
  try {
    const res = await doFetch(COUNTS_URL, {
      headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return summarise(rows as VenueRoomCount[]);
  } catch {
    return null;
  }
}

/** The card's line. Zero rooms is an invitation, not an error. */
export function describeRooms(summary: RoomSummary | null): string | null {
  if (!summary) return null; // fetch failed — the card renders without counts
  if (summary.total === 0) {
    return 'Nobody is hosting a recurring room yet. The first one is yours to start.';
  }
  const word = summary.total === 1 ? 'standing room' : 'standing rooms';
  const names = summary.venueNames;
  if (names.length === 0) {
    return `${summary.total} ${word} running this week.`;
  }
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${summary.total} ${word} this week — ${list}.`;
}
