-- Per-user Urban AI settings stored in Supabase so the dashboard can control the Python service.

CREATE TABLE IF NOT EXISTS urban_ai_settings (
  user_id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  datasource_url   text        NOT NULL DEFAULT '',
  datasource_auth  text        NOT NULL DEFAULT '',
  scan_interval    integer     NOT NULL DEFAULT 60,
  concurrency      integer     NOT NULL DEFAULT 20,
  confidence       numeric     NOT NULL DEFAULT 0.25,
  infer_size       integer     NOT NULL DEFAULT 1280,
  model_name       text        NOT NULL DEFAULT 'yolov8n.pt',
  crowd_threshold  integer     NOT NULL DEFAULT 20,
  traffic_threshold integer    NOT NULL DEFAULT 30,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE urban_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_all" ON urban_ai_settings
  FOR ALL USING (auth.uid() = user_id);

-- Service role (Python via ingest API key) can read settings
CREATE POLICY "service_select" ON urban_ai_settings
  FOR SELECT USING (true);
