-- Footer SNS tiles: flexible count, admin add/remove/reorder.

CREATE TABLE IF NOT EXISTS social_links (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  desc_zh text NOT NULL DEFAULT '',
  desc_en text NOT NULL DEFAULT '',
  desc_ja text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO social_links (id, name, url, desc_zh, desc_en, desc_ja, sort_order) VALUES
  ('x', 'X', 'https://x.com/trigger_inc', '工作室最新动态与周边商品预告发布于此', 'Official news, production updates, and merchandise announcements', 'スタジオの最新情報やグッズの告知はこちら', 0),
  ('instagram', 'Instagram', 'https://www.instagram.com/trigger_inc/', '工作室最新日常照片与原画插图分享', 'Artworks, behind-the-scenes sketches, and studio photography', 'スタジオの最新情報やグッズ告知はこちら', 1),
  ('youtube', 'YouTube', 'https://www.youtube.com/user/studiotrigger', '幕后制作特辑、主创座谈会、活动现场实录持续更新中', 'Making-of documentaries, creator discussions, and live events', 'メイキング、座談会、イベント密着レポなど更新中', 2),
  ('twitch', 'Twitch', 'https://www.twitch.tv/studio_trigger', '不定期进行作画与制作人在线直播互动', 'Occasional live drawing and creator stream broadcasts', '不定期で生配信中', 3),
  ('discord', 'Discord', 'https://discord.gg/trigger', '供全球粉丝互动交流与社区活动的官方服务器', 'Official global community server connecting fans worldwide', 'ファン同士で繋がれる場を運営中', 4),
  ('patreon', 'Patreon', 'https://www.patreon.com/TRIGGER', '会员专享特权、专属原画流出与独家内容发布', 'Exclusive member rewards, insider sketches, and monthly podcasts', '会員限定特典など配信中', 5)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON social_links TO authenticated;

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_links_public_read ON social_links;
CREATE POLICY social_links_public_read ON social_links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS social_links_admin_write ON social_links;
CREATE POLICY social_links_admin_write ON social_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));
