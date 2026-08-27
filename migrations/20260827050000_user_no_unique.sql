-- user_no 唯一约束：防止 nextUserNo() 并发触发的重复编号
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_no_key' AND conrelid = 'user_roles'::regclass) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_no_key UNIQUE (user_no);
  END IF;
END $$;