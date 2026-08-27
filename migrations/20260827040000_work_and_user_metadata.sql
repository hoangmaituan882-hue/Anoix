-- ============================================================
-- Work release date + user registration time + sequential user_no
-- ============================================================

-- 1. 放映作品的上映/放映日期 + 电影时长（分钟）
ALTER TABLE films ADD COLUMN IF NOT EXISTS release_date date;
ALTER TABLE films ADD COLUMN IF NOT EXISTS duration integer;

-- 2. 用户注册时间（写入时补 now()）
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS registered_at timestamptz;

-- 3. 顺序用户编号（001 / 002 / ...，由后端在创建用户时分配）
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_no text;

-- 存量数据兜底：registered_at 为空则用 created_at 回填
UPDATE user_roles SET registered_at = created_at WHERE registered_at IS NULL;

-- 存量用户顺序编号回填（001/002/… 按创建时间）
UPDATE user_roles AS ur SET user_no = sub.no FROM (
  SELECT uid, LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') AS no
  FROM user_roles WHERE user_no IS NULL
) sub WHERE ur.uid = sub.uid AND ur.user_no IS NULL;
