-- ============================================================
-- Round 6: goods (merchandise) with taobao links + admin control
-- ============================================================

CREATE TABLE IF NOT EXISTS goods (
  id text PRIMARY KEY,
  series text,
  title text NOT NULL,
  title_zh text,
  title_en text,
  price text,
  image text,
  taobao_url text,
  is_preorder boolean NOT NULL DEFAULT false,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON goods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON goods TO authenticated;

ALTER TABLE goods ENABLE ROW LEVEL SECURITY;
CREATE POLICY goods_public_read ON goods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY goods_admin_write ON goods FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE uid = auth.uid() AND role = 'admin'));

-- Seed: top-5 best-selling products from the Taobao shop (price/image to be filled in admin)
INSERT INTO goods (id, series, title, taobao_url, sort_order) VALUES
  ('goods-taobao-1', '泛式周边', '泛式企鹅睡衣原创可爱毛绒加厚柔软秋冬季居家服情侣男女同款', 'https://item.taobao.com/item.htm?id=742823616547', 0),
  ('goods-taobao-2', '泛式周边', '泛式2025新款休闲针织牛仔裤男女同款春秋宽松直筒长裤', 'https://item.taobao.com/item.htm?id=847972923368', 1),
  ('goods-taobao-3', '泛式周边', '泛式2025凉感短袖T恤春夏季男女同款圆领落肩宽松口袋猫咪感叹号', 'https://item.taobao.com/item.htm?id=923132678977', 2),
  ('goods-taobao-4', '泛式周边', '泛式2025开襟纽扣睡衣套装刺绣企鹅剪花毛绒新款秋冬日常居家服', 'https://item.taobao.com/item.htm?id=749177044680', 3),
  ('goods-taobao-5', '泛式周边', '简约黑白灰休闲纯色运动袜子三双日常吸汗防臭套装纯棉袜', 'https://item.taobao.com/item.htm?id=731182141353', 4)
ON CONFLICT (id) DO NOTHING;
