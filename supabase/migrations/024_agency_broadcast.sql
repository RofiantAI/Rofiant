-- Agency announcements and custom screens for owners to broadcast to members

CREATE TABLE agency_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  variant text NOT NULL DEFAULT 'info' CHECK (variant IN ('info', 'warning', 'critical')),
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX agency_announcements_agency_active
  ON agency_announcements (agency_id, active, starts_at DESC);

CREATE TABLE agency_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  show_in_nav boolean NOT NULL DEFAULT true,
  nav_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, slug)
);

CREATE INDEX agency_screens_agency_published
  ON agency_screens (agency_id, published);

ALTER TABLE agency_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_screens ENABLE ROW LEVEL SECURITY;

-- Announcements: owner full access
CREATE POLICY "agency_announcements_owner_all" ON agency_announcements
  FOR ALL USING (agency_owner_id(agency_id) = auth.uid());

-- Announcements: active members can read active rows
CREATE POLICY "agency_announcements_member_select" ON agency_announcements
  FOR SELECT USING (
    active = true
    AND starts_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
    AND agency_id IN (SELECT user_agency_ids(auth.uid()))
  );

-- Screens: owner full access
CREATE POLICY "agency_screens_owner_all" ON agency_screens
  FOR ALL USING (agency_owner_id(agency_id) = auth.uid());

-- Screens: members can read published
CREATE POLICY "agency_screens_member_select" ON agency_screens
  FOR SELECT USING (
    published = true
    AND agency_id IN (SELECT user_agency_ids(auth.uid()))
  );
