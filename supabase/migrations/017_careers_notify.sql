-- Stores emails from the "notify me about open positions" form on the careers page.
CREATE TABLE IF NOT EXISTS careers_notify_signups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE careers_notify_signups ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (used by the /api/careers/notify route) can read/write.
