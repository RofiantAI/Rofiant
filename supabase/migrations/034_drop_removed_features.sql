-- Drop tables backing features removed from app: Urban AI (camera monitoring,
-- per-user settings) and Federal Solutions workflow runs. Their routes/pages
-- (src/app/(dashboard)/dashboard/urban, src/app/api/urban/*,
-- src/app/(dashboard)/dashboard/agency/solutions, src/app/api/federal-solutions/*)
-- were deleted with no remaining references to these tables.

DROP TABLE IF EXISTS camera_detections;
DROP TABLE IF EXISTS urban_ai_settings;
DROP TABLE IF EXISTS federal_workflow_runs;

-- Storage policies for urban camera frames (migration 013). Bucket itself
-- ('urban-images') is left in place — storage.buckets can't be modified via
-- SQL migrations; remove it manually via the Storage API/dashboard if desired.
DROP POLICY IF EXISTS "urban_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "urban_images_service_insert" ON storage.objects;
