/*
# Café QR Engagement SaaS — Core Schema

## Overview
Creates the full multi-tenant schema for a SaaS platform that builds branded QR-code
customer engagement websites for cafés and restaurants.

## Tables created
1. `profiles` — display name for each auth user
2. `cafes` — one row per café, containing all branding/config as JSONB
3. `cafe_members` — maps users to cafés with a role (owner / manager / admin)
4. `feedback_submissions` — private customer feedback linked to a café
5. `engagement_events` — lightweight analytics (page views, link clicks)
6. `feedback_presets` — the randomized preset library (platform defaults + café overrides)

## Security (RLS)
- `profiles`: users read/update their own row; admins read all
- `cafes`: active cafés' public config readable by anon; members/admins read full; members/admins write
- `cafe_members`: members read own memberships; admins manage all
- `feedback_submissions`: anon can insert; only members/admins can read their café's data
- `engagement_events`: anon can insert; only members/admins can read their café's data
- `feedback_presets`: active presets for a café readable by anon; members/admins manage

## Notes
- Platform admin is a user with a `cafe_members` row where role = 'admin' and cafe_id can be any café (or we use a separate check).
- Owner columns default to auth.uid() where the client omits them.
- All café configuration lives in JSONB columns for flexibility.
*/

-- ============ Create all tables first ============

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  address text,
  logo_url text,
  banner_url text,
  brand_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cafe_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner', 'manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, user_id)
);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  food_rating int CHECK (food_rating >= 1 AND food_rating <= 5),
  service_rating int CHECK (service_rating >= 1 AND service_rating <= 5),
  ambience_rating int CHECK (ambience_rating >= 1 AND ambience_rating <= 5),
  cleanliness_rating int CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  overall_rating int CHECK (overall_rating >= 1 AND overall_rating <= 5),
  private_feedback_text text,
  selected_feedback_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid REFERENCES cafes(id) ON DELETE CASCADE,
  text text NOT NULL,
  short_label text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ Enable RLS on all tables ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_presets ENABLE ROW LEVEL SECURITY;

-- ============ RLS Policies ============

-- profiles
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
CREATE POLICY "admins_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- cafes
DROP POLICY IF EXISTS "anon_read_active_cafes" ON cafes;
CREATE POLICY "anon_read_active_cafes" ON cafes FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "members_read_cafes" ON cafes;
CREATE POLICY "members_read_cafes" ON cafes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = cafes.id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_read_all_cafes" ON cafes;
CREATE POLICY "admins_read_all_cafes" ON cafes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_insert_cafes" ON cafes;
CREATE POLICY "admins_insert_cafes" ON cafes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admins_update_cafes" ON cafes;
CREATE POLICY "admins_update_cafes" ON cafes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "members_update_cafes" ON cafes;
CREATE POLICY "members_update_cafes" ON cafes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = cafes.id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = cafes.id AND user_id = auth.uid())
  );

-- cafe_members
DROP POLICY IF EXISTS "read_own_membership" ON cafe_members;
CREATE POLICY "read_own_membership" ON cafe_members FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_read_all_members" ON cafe_members;
CREATE POLICY "admins_read_all_members" ON cafe_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_insert_members" ON cafe_members;
CREATE POLICY "admins_insert_members" ON cafe_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM cafe_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_update_members" ON cafe_members;
CREATE POLICY "admins_update_members" ON cafe_members FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM cafe_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_delete_members" ON cafe_members;
CREATE POLICY "admins_delete_members" ON cafe_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin')
  );

-- feedback_submissions
DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback_submissions;
CREATE POLICY "anon_insert_feedback" ON feedback_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "members_read_feedback" ON feedback_submissions;
CREATE POLICY "members_read_feedback" ON feedback_submissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = feedback_submissions.cafe_id AND user_id = auth.uid())
  );

-- engagement_events
DROP POLICY IF EXISTS "anon_insert_events" ON engagement_events;
CREATE POLICY "anon_insert_events" ON engagement_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "members_read_events" ON engagement_events;
CREATE POLICY "members_read_events" ON engagement_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = engagement_events.cafe_id AND user_id = auth.uid())
  );

-- feedback_presets
DROP POLICY IF EXISTS "anon_read_active_presets" ON feedback_presets;
CREATE POLICY "anon_read_active_presets" ON feedback_presets FOR SELECT
  TO anon, authenticated USING (
    is_active = true
    AND (
      cafe_id IS NULL
      OR EXISTS (SELECT 1 FROM cafes WHERE id = feedback_presets.cafe_id AND is_active = true)
    )
  );

DROP POLICY IF EXISTS "admins_manage_presets" ON feedback_presets;
CREATE POLICY "admins_manage_presets" ON feedback_presets FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM cafe_members WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "members_manage_presets" ON feedback_presets;
CREATE POLICY "members_manage_presets" ON feedback_presets FOR ALL
  TO authenticated USING (
    cafe_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = feedback_presets.cafe_id AND user_id = auth.uid())
  ) WITH CHECK (
    cafe_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM cafe_members WHERE cafe_id = feedback_presets.cafe_id AND user_id = auth.uid())
  );

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_cafes_slug ON cafes(slug);
CREATE INDEX IF NOT EXISTS idx_cafes_active ON cafes(is_active);
CREATE INDEX IF NOT EXISTS idx_members_user ON cafe_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_cafe ON cafe_members(cafe_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cafe ON feedback_submissions(cafe_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_events_cafe ON engagement_events(cafe_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON engagement_events(created_at);
CREATE INDEX IF NOT EXISTS idx_presets_cafe ON feedback_presets(cafe_id);
CREATE INDEX IF NOT EXISTS idx_presets_active ON feedback_presets(is_active);

-- ============ Triggers ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cafes_updated_at ON cafes;
CREATE TRIGGER cafes_updated_at BEFORE UPDATE ON cafes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS presets_updated_at ON feedback_presets;
CREATE TRIGGER presets_updated_at BEFORE UPDATE ON feedback_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ Storage bucket for café assets ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('cafe-assets', 'cafe-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read cafe-assets
DROP POLICY IF EXISTS "public_read_cafe_assets" ON storage.objects;
CREATE POLICY "public_read_cafe_assets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'cafe-assets');

-- Authenticated users can upload to cafe-assets
DROP POLICY IF EXISTS "auth_upload_cafe_assets" ON storage.objects;
CREATE POLICY "auth_upload_cafe_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cafe-assets');

DROP POLICY IF EXISTS "auth_update_cafe_assets" ON storage.objects;
CREATE POLICY "auth_update_cafe_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cafe-assets');

DROP POLICY IF EXISTS "auth_delete_cafe_assets" ON storage.objects;
CREATE POLICY "auth_delete_cafe_assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cafe-assets');
