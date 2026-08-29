-- Weekly stacked votes on a film (not a nomination-round option).
-- Lifetime tally = SUM(count) GROUP BY film_id.

CREATE TABLE IF NOT EXISTS film_week_votes (
  identity_id text NOT NULL,
  film_id text NOT NULL,
  week_start date NOT NULL,
  count integer NOT NULL DEFAULT 1 CHECK (count > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (identity_id, film_id, week_start)
);

CREATE INDEX IF NOT EXISTS film_week_votes_film_idx ON film_week_votes (film_id);
CREATE INDEX IF NOT EXISTS film_week_votes_week_idx ON film_week_votes (week_start);

GRANT SELECT, INSERT, UPDATE, DELETE ON film_week_votes TO authenticated;
GRANT SELECT ON film_week_votes TO anon;

ALTER TABLE film_week_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS film_week_votes_admin_all ON film_week_votes;
CREATE POLICY film_week_votes_admin_all ON film_week_votes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

CREATE OR REPLACE VIEW film_vote_counts AS
SELECT film_id, SUM(count)::integer AS votes
FROM film_week_votes
GROUP BY film_id;

GRANT SELECT ON film_vote_counts TO anon, authenticated;
