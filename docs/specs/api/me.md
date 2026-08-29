# Spec: me 路由（个人资料 / 改密 / 我的活动）

- 类型: 路由模块
- 路径: `server/routes/me.js`
- 依赖: `lib/db` `lib/identity` `lib/users` `lib/catalog` `lib/meStats` `tcapi` `lib/config`

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/me | 本人资料（token → uid → DescribeEndUsers 匹配，返回 mapUser 形状） |
| PATCH | /api/me | 改昵称/头像（`pickField` 截断：昵称 64、头像 URL 1024） |
| POST | /api/me/password | 改密码（校验 `currentPassword` 后 ModifyEndUserAccount） |
| GET | /api/me/stats | 登录用户放映统计（已看/未看/总时长与片数、按月已放映、提名池去重、周票 SUM） |
| GET | /api/me/activity | 我的提名 + 投票（join 轮次/影片/planned 状态） |

## 鉴权

- 全部要求 `Authorization: Bearer <token>`（`callerIdentity` 验证），否则 401 `unauthorized`。
- **永不信任 body 里的 uid**——一律从 token 的 JWT `sub` 解析。

## 错误码

| 码 | 值 |
|---|---|
| 400 | `bad_request`（密码过短）/ `no_username_account` |
| 401 | `unauthorized` / `wrong_current_password` |
| 404 | `user_not_found` |

## 备注

- `verifyUserPassword`：直连 auth 网关 `signin` 验证旧密码（不落库）。
- `me/stats`：历史场次片单去重（第一次放映日），足迹交集为已看；不算今晚与未来；缺 `duration` 当 0 分钟。
- `me/activity` 是我个人中心「我的投票与提名」的数据源。
- 懒写元数据：`callerIdentity` 首次调用时若无 `user_roles` 行，`ensureUserMeta` 自动补 user_no/registered_at。