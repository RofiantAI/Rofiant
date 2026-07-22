-- Drop tables backing features whose UI and API callers no longer exist:
--
-- - intelligence_events: backed dashboard/agency/intelligence (deleted). Only
--   reader was src/app/api/intelligence/route.ts, which has no frontend caller.
-- - agency_screens: backed dashboard/agency/screens/[slug] (deleted). CRUD
--   routes (src/app/api/agency/screens/*) and the getNavScreens() helper in
--   src/lib/agency-broadcast.ts have zero callers left.
-- - voice_records: backed dashboard/voice-ai and the voice-ai marketing page
--   (both deleted). src/app/api/voice/* has no frontend caller; the current
--   chat voice input (src/app/api/transcribe) transcribes in-memory and never
--   persists to this table.
--
-- Note: agency_announcements is NOT dropped here — it's still read by
-- src/lib/user-notifications.ts (getActiveAnnouncements) to feed the
-- dashboard notification bell, so that table stays live.

DROP TABLE IF EXISTS intelligence_events;
DROP TABLE IF EXISTS agency_screens;
DROP TABLE IF EXISTS voice_records;

-- Storage policies for the 'voice' bucket (migration 004). Bucket itself
-- can't be dropped via SQL migration — remove it manually via the
-- Storage API/dashboard if desired.
DROP POLICY IF EXISTS "Users upload own voice" ON storage.objects;
DROP POLICY IF EXISTS "Users read own voice" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own voice" ON storage.objects;
