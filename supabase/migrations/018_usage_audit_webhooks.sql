-- Usage/token tracking per chat or API request.
CREATE TABLE IF NOT EXISTS usage_events (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source         text        NOT NULL CHECK (source IN ('chat', 'api')),
  model          text        NOT NULL,
  input_tokens   integer     NOT NULL DEFAULT 0,
  output_tokens  integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_user_id_created_at_idx ON usage_events (user_id, created_at DESC);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON usage_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_insert" ON usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit trail. Only the service role can write (no INSERT policy for users), so
-- entries can't be tampered with or deleted from the client.
CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  agency_id  uuid        REFERENCES agencies(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  detail     jsonb       NOT NULL DEFAULT '{}',
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_created_at_idx ON audit_logs (user_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Outbound webhook subscriptions, delivered on server-side events (e.g. document processed).
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url        text        NOT NULL,
  events     text[]      NOT NULL DEFAULT '{}',
  secret     text        NOT NULL,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_all" ON webhook_subscriptions
  FOR ALL USING (auth.uid() = user_id);
