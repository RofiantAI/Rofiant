-- Platform-wide announcements and custom pages (site owner managed)

CREATE TABLE site_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  variant text NOT NULL DEFAULT 'info' CHECK (variant IN ('info', 'warning', 'critical')),
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX site_announcements_active ON site_announcements (active, starts_at DESC);

CREATE TABLE site_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  show_in_nav boolean NOT NULL DEFAULT true,
  nav_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX site_screens_published ON site_screens (published, show_in_nav);

ALTER TABLE site_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_screens ENABLE ROW LEVEL SECURITY;

-- Public read for active announcements (includes anonymous visitors)
CREATE POLICY "site_announcements_public_read" ON site_announcements
  FOR SELECT USING (
    active = true
    AND starts_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Public read for published screens
CREATE POLICY "site_screens_public_read" ON site_screens
  FOR SELECT USING (published = true);

-- Writes go through service-role API routes only
