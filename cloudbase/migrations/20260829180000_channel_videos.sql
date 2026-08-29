-- Homepage official channel: hub link + clip cards (Bilibili / YouTube / other).

CREATE TABLE IF NOT EXISTS channel_settings (
  id text PRIMARY KEY,
  hub_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO channel_settings (id, hub_url) VALUES ('home', '')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS channel_videos (
  id text PRIMARY KEY,
  url text NOT NULL,
  platform text NOT NULL DEFAULT 'other',
  video_key text,
  title text NOT NULL DEFAULT '',
  title_zh text,
  thumbnail text,
  duration text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON channel_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON channel_settings TO authenticated;
GRANT SELECT ON channel_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON channel_videos TO authenticated;

ALTER TABLE channel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS channel_settings_public_read ON channel_settings;
CREATE POLICY channel_settings_public_read ON channel_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS channel_settings_admin_write ON channel_settings;
CREATE POLICY channel_settings_admin_write ON channel_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS channel_videos_public_read ON channel_videos;
CREATE POLICY channel_videos_public_read ON channel_videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS channel_videos_admin_write ON channel_videos;
CREATE POLICY channel_videos_admin_write ON channel_videos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
