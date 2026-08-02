-- Backfilled: this table already exists on the remote database (applied
-- directly, outside git, as remote migration 20260717000001). Recreated
-- here verbatim from the live schema so it's tracked in version control.
CREATE TABLE IF NOT EXISTS telemetry_events (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  anon_id     text        NOT NULL,
  user_id     uuid,
  event       text        NOT NULL CHECK (char_length(event) <= 100),
  properties  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  app_version text,
  platform    text
);

CREATE INDEX IF NOT EXISTS telemetry_events_created_at_idx ON telemetry_events (created_at);
CREATE INDEX IF NOT EXISTS telemetry_events_event_idx ON telemetry_events (event);

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert telemetry events" ON telemetry_events
  FOR INSERT WITH CHECK (true);
