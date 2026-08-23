-- ============================================================
-- Forward migration: news publish state + vote integrity
--  1. news: add status / published_at / pinned (idempotent — repairs
--     the online drift where these columns exist but the init script
--     never declared them)
--  2. news RLS: public only sees published rows (or scheduled rows whose
--     published_at has arrived); admins read all statuses via a dedicated
--     policy
--  3. votes: enforce that a vote's option belongs to its round via a
--     composite FK (option_id, round_id) → nomination_options(id, round_id)
-- ============================================================

-- ---------- 1. news publish columns ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'news' AND column_name = 'status') THEN
    ALTER TABLE news ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'news' AND column_name = 'published_at') THEN
    ALTER TABLE news ADD COLUMN published_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'news' AND column_name = 'pinned') THEN
    ALTER TABLE news ADD COLUMN pinned boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Status domain constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'news'::regclass AND conname = 'news_status_check'
  ) THEN
    ALTER TABLE news ADD CONSTRAINT news_status_check
      CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));
  END IF;
END $$;

-- ---------- 2. news RLS: publish state enforced in the database ----------
DROP POLICY IF EXISTS news_public_read ON news;
CREATE POLICY news_public_read ON news FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (status = 'scheduled' AND published_at IS NOT NULL AND published_at <= now())
  );

-- Admins read every status (RLS SELECT policies are OR'd together).
DROP POLICY IF EXISTS news_admin_read ON news;
CREATE POLICY news_admin_read ON news FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

-- ---------- 3. votes: option must belong to its round ----------
-- Remove any pre-existing cross-round votes (the very bug this fixes).
DELETE FROM votes v
WHERE NOT EXISTS (
  SELECT 1 FROM nomination_options o
  WHERE o.id = v.option_id AND o.round_id = v.round_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nomination_options'::regclass AND conname = 'nomination_options_id_round_key'
  ) THEN
    ALTER TABLE nomination_options ADD CONSTRAINT nomination_options_id_round_key UNIQUE (id, round_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'votes'::regclass AND conname = 'votes_option_round_fk'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_option_round_fk
      FOREIGN KEY (option_id, round_id) REFERENCES nomination_options (id, round_id) ON DELETE CASCADE;
  END IF;
END $$;

-- ---------- 4. user_roles self-read (role lookup without trusting client uid) ----------
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_self_read ON user_roles;
CREATE POLICY user_roles_self_read ON user_roles FOR SELECT TO authenticated
  USING (uid = auth.uid());
