-- Per-user notification preferences, readable server-side so backend routes/webhooks
-- can decide whether to send an email for a given event.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_prefs jsonb       NOT NULL DEFAULT '{
    "usage_alerts": true,
    "security_alerts": true,
    "product_updates": false,
    "weekly_digest": false,
    "api_failures": true,
    "billing_alerts": true
  }',
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_all" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Service role (webhooks, background jobs) needs to read prefs to decide on sending emails
CREATE POLICY "service_select" ON user_settings
  FOR SELECT USING (true);
