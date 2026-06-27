-- Extend agencies table with additional settings fields

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS default_member_role text NOT NULL DEFAULT 'member' CHECK (default_member_role IN ('admin', 'member')),
  ADD COLUMN IF NOT EXISTS members_can_invite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_2fa boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_domains text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notify_member_joined boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_member_left boolean NOT NULL DEFAULT true;
