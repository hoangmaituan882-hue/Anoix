-- ============================================================
-- 放映历史批量导入的铺垫：影片评分标签 + 观看链接(视频/网盘) + 放映日期范围
-- ============================================================

-- 影片：评分标签（豆瓣/TMDB，如 '9.7'；缺失留空等 TMDB 刮削补充）
ALTER TABLE films ADD COLUMN IF NOT EXISTS rating text;

-- 影片：观看链接 + 类型（bilibili 视频 / 网盘导航）
ALTER TABLE films ADD COLUMN IF NOT EXISTS watch_url text;
ALTER TABLE films ADD COLUMN IF NOT EXISTS watch_type text;  -- 'bilibili' | 'pan'

-- 放映会：结束日期（`~` 表示持续/不间断放映范围；为空 = 单日放映）
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS screen_date_end date;