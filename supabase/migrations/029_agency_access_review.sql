ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS last_access_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_access_review_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_access_review_notes text;
