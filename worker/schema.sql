-- Referral + query telemetry. Deliberately anonymous: no raw query text,
-- no session ids, nothing identifying a person.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,               -- ISO 8601
  destination_host TEXT,          -- NULL for query events, host for /go clicks
  entity_type TEXT,               -- asset category, when known
  stage TEXT,                     -- first builder stage of the entity, when known
  query_class TEXT,               -- coarse class of the question, never its text
  answered INTEGER NOT NULL       -- 1 = results returned / referral, 0 = gap
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);

-- Everything the maintenance loops want a human to look at. Nothing in here is
-- ever applied automatically: approving records a decision, and a person still
-- edits src/data/assets.ts by hand.
--
-- This is the only table holding free text, and only for corrections:
-- proposed_value and reason. No session id, no IP, no submitter identity.
CREATE TABLE IF NOT EXISTS review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  kind TEXT NOT NULL,             -- correction | link_patrol | stale_verification
  asset_id TEXT NOT NULL,
  field TEXT NOT NULL,            -- url | location | name | status | blurb | link | verified
  current_value TEXT,
  proposed_value TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  reviewed_ts TEXT
);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue (status, id);
-- One open finding per asset+kind+field: a weekly patrol must not pile up
-- duplicates of the same dead link.
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_open
  ON review_queue (kind, asset_id, field) WHERE status = 'pending';

-- Monthly aggregate. Counts only — see gap.ts.
CREATE TABLE IF NOT EXISTS gap_reports (
  month TEXT PRIMARY KEY,         -- YYYY-MM
  generated_ts TEXT NOT NULL,
  payload TEXT NOT NULL           -- JSON, counts only
);

-- Where the link patrol got to, so a run that is capped by the per-invocation
-- subrequest budget resumes instead of restarting.
CREATE TABLE IF NOT EXISTS patrol_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_offset INTEGER NOT NULL DEFAULT 0,
  last_run_ts TEXT
);
INSERT OR IGNORE INTO patrol_state (id, next_offset) VALUES (1, 0);
