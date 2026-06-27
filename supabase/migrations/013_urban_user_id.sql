-- Add user_id to camera_detections so each user's data is isolated.
-- Create urban-images storage bucket for annotated camera frames.

-- 1. Add user_id column (nullable to not break existing rows)
ALTER TABLE camera_detections
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop old permissive policies
DROP POLICY IF EXISTS "service_insert" ON camera_detections;
DROP POLICY IF EXISTS "auth_select"    ON camera_detections;

-- 3. New policies: users see only their own rows; service role (ingest API) can insert
CREATE POLICY "own_select" ON camera_detections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service_insert" ON camera_detections
  FOR INSERT WITH CHECK (true);

-- 4. Storage bucket for annotated images (created by ingest route on first use,
--    but declare policies here so they survive bucket recreation)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('urban-images', 'urban-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'urban_images_public_read'
  ) THEN
    CREATE POLICY "urban_images_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'urban-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'urban_images_service_insert'
  ) THEN
    CREATE POLICY "urban_images_service_insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'urban-images');
  END IF;
END $$;
