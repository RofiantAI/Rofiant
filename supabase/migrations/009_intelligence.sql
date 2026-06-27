-- Real-time intelligence events from urban data sources (traffic cams, sensors, etc.)

CREATE TABLE intelligence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'unknown',         -- e.g. 'traffic_cam', 'sensor', 'manual'
  source_id text,                                  -- external ID / cam ID from Python program
  event_type text NOT NULL DEFAULT 'observation', -- e.g. 'incident', 'anomaly', 'observation'
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location_label text,                             -- human-readable location
  lat double precision,
  lng double precision,
  confidence numeric(4,3),                         -- 0.000 – 1.000
  summary text NOT NULL,                           -- AI-generated description
  raw_data jsonb,                                  -- full payload from Python
  image_url text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX intelligence_events_agency_id_created_at
  ON intelligence_events (agency_id, created_at DESC);

CREATE INDEX intelligence_events_severity
  ON intelligence_events (agency_id, severity, created_at DESC);

ALTER TABLE intelligence_events ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "intel_owner_all" ON intelligence_events
  FOR ALL USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- Active members can read
CREATE POLICY "intel_member_select" ON intelligence_events
  FOR SELECT USING (
    agency_id IN (SELECT user_agency_ids(auth.uid()))
  );

-- Service role / Python program inserts via API key — no RLS restriction needed
-- (admin client bypasses RLS automatically)
