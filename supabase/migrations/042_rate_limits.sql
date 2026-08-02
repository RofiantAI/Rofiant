-- Backfilled: this table already exists on the remote database (applied
-- directly, outside git, as remote migration 20260717000000). Recreated
-- here verbatim from the live schema so it's tracked in version control.
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id       uuid        NOT NULL,
  window_start  timestamptz NOT NULL,
  request_count integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits (window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies on remote: service-role only (matches audit_logs pattern).
