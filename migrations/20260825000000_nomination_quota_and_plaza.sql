-- ============================================================
-- Forward migration: nomination plaza + weekly quota + multi-vote
-- ============================================================

-- 1. Nomination pool: identity + source + planned (approved into screening plan)
ALTER TABLE nomination_options ADD COLUMN IF NOT EXISTS nominee_identity_id text;
ALTER TABLE nomination_options ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';
ALTER TABLE nomination_options ADD COLUMN IF NOT EXISTS planned boolean NOT NULL DEFAULT false;

-- 2. Multi-vote: relax UNIQUE(round_id, voter_id) -> (round_id, voter_id, option_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'votes'::regclass AND conname = 'votes_round_id_voter_id_key') THEN
    ALTER TABLE votes DROP CONSTRAINT votes_round_id_voter_id_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'votes'::regclass AND conname = 'votes_round_id_voter_id_option_id_key') THEN
    ALTER TABLE votes ADD CONSTRAINT votes_round_id_voter_id_option_id_key
      UNIQUE (round_id, voter_id, option_id);
  END IF;
END $$;

-- 3. Weekly quota (natural week, Monday 00:00 Asia/Shanghai)
CREATE TABLE IF NOT EXISTS user_quota (
  identity_id text NOT NULL,
  week_start date NOT NULL,
  nominations_used integer NOT NULL DEFAULT 0,
  votes_used integer NOT NULL DEFAULT 0,
  PRIMARY KEY (identity_id, week_start)
);
