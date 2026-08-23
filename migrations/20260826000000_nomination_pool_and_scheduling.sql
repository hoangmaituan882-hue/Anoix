-- ============================================================
-- P1-P3: nomination pool + round state machine + film scheduling
-- ============================================================

-- P1: nomination pool — continuous user nominations, separate from the
--     screened film library (films). Not bound to a round.
CREATE TABLE IF NOT EXISTS nomination_pool (
  id bigserial PRIMARY KEY,
  film_id text,
  tmdb_id text,
  title text NOT NULL,
  original_title text,
  year text,
  image text,
  overview text,
  director text,
  note text,
  nominee_identity_id text,
  source text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'pending',
  planned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nomination_pool_status_idx ON nomination_pool(status);
CREATE INDEX IF NOT EXISTS nomination_pool_nominee_idx ON nomination_pool(nominee_identity_id);

-- P2: round state machine — allow draft / reviewing / archived
ALTER TABLE nomination_rounds DROP CONSTRAINT IF EXISTS nomination_rounds_status_check;
ALTER TABLE nomination_rounds ADD CONSTRAINT nomination_rounds_status_check
  CHECK (status IN ('draft', 'collecting', 'reviewing', 'voting', 'revealed', 'archived'));

-- P3: film library scheduling — 待定(unscheduled) / 已排期(scheduled) / 已放映(screened)
ALTER TABLE films ADD COLUMN IF NOT EXISTS screening_status text NOT NULL DEFAULT 'unscheduled';
ALTER TABLE films ADD COLUMN IF NOT EXISTS screening_date date;

-- ---------- Grants + RLS for nomination_pool ----------
GRANT SELECT ON nomination_pool TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON nomination_pool TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE nomination_pool_id_seq TO anon, authenticated;

ALTER TABLE nomination_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY pool_public_read ON nomination_pool FOR SELECT TO anon, authenticated USING (true);

-- Server-side writes use the admin token; mirror the films pattern.
CREATE POLICY pool_admin_write ON nomination_pool FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
