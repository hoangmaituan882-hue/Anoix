# Spec: admin 路由（用户管理 / 提名池 / 排期 / 统计）

- 类型: 路由模块
- 路径: `server/routes/admin.js`
- 鉴权: 全部经 `adminGate`（admin 限流 120/min + `role='admin'` 校验）
- 依赖: `lib/db` `lib/users` `lib/identity` `lib/socialLinks` `tcapi` `lib/config`

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/admin/users | 用户列表（DescribeEndUsers + user_roles 合并，返回 userNo/registeredAt） |
| POST | /api/admin/users | 创建用户（CreateEndUserAccount + `insertUserRole` 分配 001 编号） |
| PATCH | /api/admin/users/:uid | 改角色 / 封禁 / 重置密码 |
| DELETE | /api/admin/users/:uid | 删除账号 |
| GET | /api/admin/pool | 提名池列表 |
| POST | /api/admin/pool/:id/promote | 勾选入库（TMDB 补建 films + 通知提名者） |
| POST | /api/admin/pool/:id/demote | 退回提名库（可逆） |
| POST | /api/admin/films/:id/schedule | 排期（screening_status + screening_date） |
| POST | /api/admin/channel/resolve | 解析视频链接（Bilibili BV / YouTube），返回标题、封面、canonical URL |
| GET | /api/admin/stats | 每部提名片：匿名提名/票 + 登录用户各自提名与票数 |
| GET | /api/admin/social-links | 页脚社交原行（含排序） |
| POST | /api/admin/social-links | 新增格子（https + 名称） |
| PATCH | /api/admin/social-links/:id | 改名称 / 链接 / 三语简介 |
| DELETE | /api/admin/social-links/:id | 删除格子 |
| POST | /api/admin/social-links/reorder | `{ ids: string[] }` 按数组重排 |
| POST | /api/admin/news/flush | 立刻丢掉 `contentCache` 的 news 键 |
| POST | /api/admin/news/reorder | `{ ids: string[] }` 按数组写 `sort_order` 并 flush |

## 鉴权失败码

| 码 | 值 |
|---|---|
| 429 | `rate_limited`（admin 120/min） |
| 401 | `unauthorized`（无 Bearer） |
| 403 | `not_admin`（角色非 admin） |
| 503 | `user_management_unavailable`（TC 未启用） |

## 业务错误码

| 码 | 值 |
|---|---|
| 400 | `bad_request` / `bad_status` / `no_film` / `name_required` / `bad_url` |
| 404 | `not_found` |
| 409 | 重置被封禁账号密码（「该用户已被封禁…」） |

## 备注

- **创建用户**：`insertUserRole` 带 5 次重试（UNIQUE user_no 冲突自动换号）。
- **promote 幂等**：TMDB 影片已存在则跳过创建，只 PATCH pool（重试安全）；同时给提名者发 `promoted` 通知。
- **demote 可逆**：只把 pool status 重置回 pending，不删影片。
- **排期三态**：unscheduled（待定）/ scheduled（已排期）/ screened（已放映）。
- **命名投票轮次已下线**：不再提供 `POST /api/admin/rounds/:id/status` 与 `POST /api/admin/options/:id/plan`。一场 `screenings` 即一轮，状态由日期自动标记。
- 统计：`assembleNominationStats`；匿名 = 不在 `user_roles`。只读 `nomination_pool` + `film_week_votes`，不读旧 `votes` 表。数字仅此后台端点，不进公开广场。
- 页脚社交：写成功后 `contentCache.delete('social')`，避免 15s 内仍吐旧格子。
- 首页动态：写成功后 `contentCache.delete('news')`。首页 NEWS 区块无开关。