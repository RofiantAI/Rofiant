-- Ensure anon/authenticated roles can read site broadcast tables (RLS still applies)
GRANT SELECT ON site_announcements TO anon, authenticated;
GRANT SELECT ON site_screens TO anon, authenticated;
