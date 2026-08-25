-- ============================================================
-- Round 5: watch log + rating + review
-- ============================================================

CREATE TABLE IF NOT EXISTS watch_log (
  id bigserial PRIMARY KEY,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  uid text NOT NULL,
  rating integer NOT NULL DEFAULT 0,
  review text,
  watched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (film_id, uid)
);
CREATE INDEX IF NOT EXISTS watch_log_uid_idx ON watch_log(uid);

GRANT SELECT, INSERT, UPDATE, DELETE ON watch_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE watch_log_id_seq TO authenticated;

ALTER TABLE watch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY watch_log_admin ON watch_log FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY watch_log_owner_read ON watch_log FOR SELECT TO authenticated
  USING (uid = auth.uid());
