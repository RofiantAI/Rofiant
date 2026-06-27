-- Fix circular RLS policies that cause infinite recursion

DROP POLICY IF EXISTS "agencies_member_select" ON agencies;
DROP POLICY IF EXISTS "agency_members_owner_all" ON agency_members;
DROP POLICY IF EXISTS "agency_members_member_select" ON agency_members;
DROP POLICY IF EXISTS "agency_members_self_accept" ON agency_members;

-- SECURITY DEFINER functions bypass RLS, breaking the circular reference
CREATE OR REPLACE FUNCTION agency_owner_id(p_agency_id uuid)
RETURNS uuid SECURITY DEFINER LANGUAGE sql STABLE AS $$
  SELECT owner_id FROM agencies WHERE id = p_agency_id;
$$;

CREATE OR REPLACE FUNCTION user_agency_ids(p_user_id uuid)
RETURNS SETOF uuid SECURITY DEFINER LANGUAGE sql STABLE AS $$
  SELECT agency_id FROM agency_members WHERE user_id = p_user_id AND status = 'active';
$$;

-- Agency members: owner full access (no subquery on agencies, uses fn instead)
CREATE POLICY "agency_members_owner_all" ON agency_members
  FOR ALL USING (agency_owner_id(agency_id) = auth.uid());

-- Agency members: active member can read others in same agency
CREATE POLICY "agency_members_member_select" ON agency_members
  FOR SELECT USING (
    agency_id IN (SELECT user_agency_ids(auth.uid()))
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

-- Agencies: active members can read (uses fn to avoid cycle)
CREATE POLICY "agencies_member_select" ON agencies
  FOR SELECT USING (
    id IN (SELECT user_agency_ids(auth.uid()))
  );
