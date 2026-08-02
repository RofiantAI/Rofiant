-- Backfilled: this table already exists on the remote database (applied
-- directly, outside git, as remote migration 20260730000000). Recreated
-- here verbatim from the live schema so it's tracked in version control.
CREATE TABLE IF NOT EXISTS folders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL CHECK (char_length(name) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders (user_id);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select their own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update their own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can delete their own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);
