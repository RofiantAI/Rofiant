-- Agency management for team plan owners

CREATE TABLE agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Agency',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  UNIQUE(agency_id, email)
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;

-- Agencies: owner can do everything
CREATE POLICY "agencies_owner_all" ON agencies
  FOR ALL USING (owner_id = auth.uid());

-- Agencies: active members can read
CREATE POLICY "agencies_member_select" ON agencies
  FOR SELECT USING (
    id IN (
      SELECT agency_id FROM agency_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Agency members: owner can do everything
CREATE POLICY "agency_members_owner_all" ON agency_members
  FOR ALL USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- Agency members: active member can view own agency's members
CREATE POLICY "agency_members_member_select" ON agency_members
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_members am2
      WHERE am2.user_id = auth.uid() AND am2.status = 'active'
    )
  );

-- Agency members: self accept pending invitation
CREATE POLICY "agency_members_self_accept" ON agency_members
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
  );
