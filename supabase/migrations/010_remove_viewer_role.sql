-- Remove viewer role, update any existing viewers to member
UPDATE agency_members SET role = 'member' WHERE role = 'viewer';

ALTER TABLE agency_members
  DROP CONSTRAINT agency_members_role_check;

ALTER TABLE agency_members
  ADD CONSTRAINT agency_members_role_check CHECK (role IN ('admin', 'member'));
