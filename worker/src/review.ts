// The review queue: everything the maintenance loops want a human to look at.
// Nothing here edits the map. Approving a diff records a decision; changing
// src/data/assets.ts stays a human job, and the listing says so.

export type ReviewKind = 'correction' | 'link_patrol' | 'stale_verification';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewItem {
  id: number;
  ts: string;
  kind: ReviewKind;
  asset_id: string;
  field: string;
  current_value: string | null;
  proposed_value: string | null;
  reason: string | null;
  status: ReviewStatus;
  reviewed_ts: string | null;
}

export const REVIEW_NOTE =
  'Approving records a decision only. Nothing on the map changes until a human edits ' +
  'src/data/assets.ts and redeploys — this queue never writes to the dataset.';

// Constant-time-ish comparison so a wrong token cannot be probed byte by byte.
export function tokensMatch(provided: string, expected: string): boolean {
  if (!expected || expected.length < 24) return false; // refuse weak/unset secrets
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function isAuthorized(authHeader: string | null, expected: string | undefined): boolean {
  if (!authHeader || !expected) return false;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return tokensMatch(m[1].trim(), expected);
}

export interface ReviewDecision {
  id: number;
  action: 'approve' | 'reject';
}

export function parseDecision(body: unknown): ReviewDecision | null {
  const b = body as { id?: unknown; action?: unknown } | null;
  if (!b) return null;
  const id = typeof b.id === 'number' ? b.id : Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (b.action !== 'approve' && b.action !== 'reject') return null;
  return { id, action: b.action };
}
