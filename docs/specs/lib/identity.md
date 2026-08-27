# Spec: lib/identity（身份解析 + 管理员门）

- 类型: lib 模块
- 路径: `server/lib/identity.js`

## 导出

| 导出 | 签名 | 说明 |
|---|---|---|
| callerRole | `(accessToken) → role\|null` | 转发 token 到网关读自己角色（RSL self_read） |
| decodeJwtSub | `(token) → uid\|null` | 粉解析 JWT `sub`/`uid`（不验签） |
| callerIdentity | `(accessToken) → {uid,role}\|null` | 网关验 token 后解析 uid + 角色 |
| ensureUserMeta | `(uid)` | 懒写 user_no/registered_at（首次调用） |
| resolveIdentity | `(req) → {identityId,kind}\|null` | Bearer→uid(kind=user)，否则签名 cookie(kind=anon) |
| resolveVoter | `(req) → id\|null` | 投票身份字符串 |
| adminGate | `(req,res,next)` middleware | 限流 120/min + 校验 role=admin |

## 备注

- **安全边界**：token 先由网关「验证签名」，再才本地解 JWT `sub`——伪造 token 被 401 拒。
- `callerIdentity` 里对无 `user_roles` 行的用户 fire-and-forget 调 `ensureUserMeta`（懒注册元数据）。
- `resolveIdentity` 永不信任 body，只从 `Authorization` 头或 `anoix_voter` cookie 解析。