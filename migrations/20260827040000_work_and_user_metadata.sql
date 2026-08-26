-- ============================================================
-- Work release date + user registration time + sequential user_no
-- ============================================================

-- 1. 放映作品的上映/放映日期
ALTER TABLE films ADD COLUMN IF NOT EXISTS release_date date;

-- 2. 用户注册时间（写入时补 now()）
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS registered_at timestamptz;

-- 3. 顺序用户编号（001 / 002 / ...，由后端在创建用户时分配）
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_no text;

-- 存量数据兜底：registered_at 为空则用 created_at 回填
UPDATE user_roles SET registered_at = created_at WHERE registered_at IS NULL;
