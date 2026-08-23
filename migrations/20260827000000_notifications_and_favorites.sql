-- ============================================================
-- Round 4: notifications + favorites
-- ============================================================

-- A: notifications (site-internal; uid = recipient identity)
CREATE TABLE IF NOT EXISTS notifications (
  id bigserial PRIMARY KEY,
  uid text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_uid_idx ON notifications(uid);

-- B: favorites (one per user per film)
CREATE TABLE IF NOT EXISTS favorites (
  id bigserial PRIMARY KEY,
  uid text NOT NULL,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (uid, film_id)
);
CREATE INDEX IF NOT EXISTS favorites_uid_idx ON favorites(uid);

-- ---------- Grants + RLS ----------
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO authenticated;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Server writes use the admin token; mirror the films pattern.
CREATE POLICY notifications_admin ON notifications FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY favorites_admin ON favorites FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

-- Owner may read their own (defense in depth; the API also filters by identity).
CREATE POLICY notifications_owner_read ON notifications FOR SELECT TO authenticated
  USING (uid = auth.uid());
CREATE POLICY favorites_owner_read ON favorites FOR SELECT TO authenticated
  USING (uid = auth.uid());
