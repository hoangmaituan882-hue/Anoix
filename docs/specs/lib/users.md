# Spec: lib/users（用户管理与编号）

- 类型: lib 模块
- 路径: `server/lib/users.js`

## 导出

| 导出 | 签名 | 说明 |
|---|---|---|
| mapUser | `(cloudbaseUser, roleMap) → AdminUser` | 归一化用户形状，合并 role/userNo/registeredAt |
| nextUserNo | `() → '001'` | 读全部 user_no 取最大 +1（零填充 3 位） |
| insertUserRole | `(uid, role, username) → boolean` | 插入 user_roles，UNIQUE user_no 冲突重试最多 5 次 |

## 备注

- `mapUser` 的 `roleMap` 是 `uid → {role, user_no, registered_at}`（来自 user_roles 查询）。
- `insertUserRole` 的 409 分支会再查 uid 是否已存在：已存在→视为成功；否则→user_no 撞号→重试。
- 顺序编号 `user_no` 是**展示编号**，内部身份仍是 CloudBase uid。