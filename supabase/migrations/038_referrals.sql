-- Referral tracking: a user's own id doubles as their referral code (used as
-- ?ref=<uuid> on the signup link), so no separate code-generation/storage is
-- needed. One row per referred user — they can only be credited to one referrer.
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (referrer_id <> referred_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals (referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can see who they've referred.
CREATE POLICY "referrer_select" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- A newly-signed-up user can record their own inbound referral (attributing
-- themselves to whoever invited them), but nothing else.
CREATE POLICY "referred_insert_own" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);
