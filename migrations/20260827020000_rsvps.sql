-- ============================================================
-- Round 5: screening participation (rsvp)
-- ============================================================

CREATE TABLE IF NOT EXISTS rsvps (
  id bigserial PRIMARY KEY,
  screening_id text NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  uid text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (screening_id, uid)
);
CREATE INDEX IF NOT EXISTS rsvps_screening_idx ON rsvps(screening_id);

GRANT SELECT, INSERT, DELETE ON rsvps TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE rsvps_id_seq TO authenticated;

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY rsvps_admin ON rsvps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
CREATE POLICY rsvps_owner_read ON rsvps FOR SELECT TO authenticated
  USING (uid = auth.uid());
