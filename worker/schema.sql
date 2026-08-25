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
