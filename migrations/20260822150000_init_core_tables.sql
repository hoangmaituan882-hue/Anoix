-- ============================================================
-- Anoix screening-archive core schema (stage 3)
-- Public read for anon + authenticated; writes admin-only via RLS
-- Rollback: DROP TABLE ... CASCADE in reverse dependency order
-- ============================================================

CREATE TABLE films (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_zh text,
  title_en text,
  year text,
  category text,
  image text,
  landscape_image text,
  tagline text,
  description text,
  description_zh text,
  description_en text,
  director text,
  character_design text,
  series_composition text,
  cast text[],
  streaming_platforms text[],
  official_url text,
  trailer_url text,
  is_new boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE news (
  id text PRIMARY KEY,
  date text,
  category text,
  title text NOT NULL,
  title_zh text,
  title_en text,
  content text,
  content_zh text,
  content_en text,
  image text,
  link text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE screenings (
  id text PRIMARY KEY,
  title text NOT NULL,
  screen_date date NOT NULL,
  venue text,
  theme text,
  film_ids text[],
  gallery text[],
  recap text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE nomination_rounds (
  id text PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'voting', 'revealed')),
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE nomination_options (
  id bigserial PRIMARY KEY,
  round_id text NOT NULL REFERENCES nomination_rounds(id) ON DELETE CASCADE,
  film_id text REFERENCES films(id) ON DELETE SET NULL,
  nominator text,
  note text,
  votes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE votes (
  id bigserial PRIMARY KEY,
  round_id text NOT NULL REFERENCES nomination_rounds(id) ON DELETE CASCADE,
  option_id bigint NOT NULL REFERENCES nomination_options(id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, voter_id)
);

CREATE TABLE user_roles (
  uid text PRIMARY KEY,
  username text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Grants ----------
GRANT SELECT ON films, news, screenings, nomination_rounds, nomination_options TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON films, news, screenings, nomination_rounds, nomination_options TO authenticated;
GRANT INSERT ON votes TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON votes TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE nomination_options_id_seq, votes_id_seq TO anon, authenticated;

-- ---------- Row Level Security ----------
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nomination_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE nomination_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY films_public_read ON films FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY news_public_read ON news FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY screenings_public_read ON screenings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rounds_public_read ON nomination_rounds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY options_public_read ON nomination_options FOR SELECT TO anon, authenticated USING (true);

-- Admin write policies (uid must exist in user_roles with role 'admin')
CREATE POLICY films_admin_write ON films FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY news_admin_write ON news FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY screenings_admin_write ON screenings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY rounds_admin_write ON nomination_rounds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY options_admin_write ON nomination_options FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

-- Votes: anyone may cast one per round (UNIQUE guards duplicates); only admin reads
CREATE POLICY votes_anon_insert ON votes FOR INSERT TO anon, authenticated
  WITH CHECK (voter_id IS NOT NULL AND voter_id <> '');
CREATE POLICY votes_admin_read ON votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

-- ============================================================
-- Rollback (reference only):
-- DROP TABLE IF EXISTS votes, nomination_options, nomination_rounds,
--   screenings, news, films, user_roles CASCADE;
-- ============================================================
