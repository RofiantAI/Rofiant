-- Tracks who downloads which desktop app asset (user optional; anon downloads allowed).
CREATE TABLE IF NOT EXISTS download_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  asset_name   text        NOT NULL,
  platform     text        NOT NULL,
  version      text,
  ip           text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS download_events_user_id_created_at_idx ON download_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS download_events_asset_name_idx ON download_events (asset_name);

ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- Only service role writes (route uses admin client), same as audit_logs.
CREATE POLICY "own_select" ON download_events
  FOR SELECT USING (auth.uid() = user_id);
