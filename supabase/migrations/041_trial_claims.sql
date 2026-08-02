-- Cross-account signal for free-trial abuse: records the device/IP that
-- claimed a Pro trial so a different account on the same device/IP is
-- routed to the no-trial product at checkout (see /api/checkout).
CREATE TABLE IF NOT EXISTS trial_claims (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id    text,
  ip_hash      text,
  claimed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_claims_device_id_idx ON trial_claims (device_id);
CREATE INDEX IF NOT EXISTS trial_claims_ip_hash_idx ON trial_claims (ip_hash);

ALTER TABLE trial_claims ENABLE ROW LEVEL SECURITY;

-- Only service role reads/writes (checkout route + webhook use admin client).
