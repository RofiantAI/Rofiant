-- Urban AI: camera detection results from Python service

CREATE TABLE IF NOT EXISTS camera_detections (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id      text        NOT NULL,
  main_road      text        NOT NULL DEFAULT '',
  cross_street   text        NOT NULL DEFAULT '',
  lat            numeric,
  lon            numeric,
  cars           integer     NOT NULL DEFAULT 0,
  people         integer     NOT NULL DEFAULT 0,
  trucks         integer     NOT NULL DEFAULT 0,
  bicycles       integer     NOT NULL DEFAULT 0,
  buses          integer     NOT NULL DEFAULT 0,
  motorcycles    integer     NOT NULL DEFAULT 0,
  total_vehicles integer     NOT NULL DEFAULT 0,
  total_objects  integer     NOT NULL DEFAULT 0,
  anomaly_count  integer     NOT NULL DEFAULT 0,
  anomaly_types  text[]      NOT NULL DEFAULT '{}',
  image_url      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS camera_detections_camera_id_idx ON camera_detections (camera_id, created_at DESC);
CREATE INDEX IF NOT EXISTS camera_detections_anomaly_idx   ON camera_detections (anomaly_count) WHERE anomaly_count > 0;
CREATE INDEX IF NOT EXISTS camera_detections_created_idx   ON camera_detections (created_at DESC);

ALTER TABLE camera_detections ENABLE ROW LEVEL SECURITY;

-- Service role (Python backend) can write; authenticated users can read
CREATE POLICY "service_insert" ON camera_detections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_select" ON camera_detections
  FOR SELECT USING (auth.role() = 'authenticated');
