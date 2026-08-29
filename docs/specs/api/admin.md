# Spec: admin 路由（用户管理 / 提名池 / 排期 / 轮次 / 统计）

- 类型: 路由模块
- 路径: `server/routes/admin.js`
- 鉴权: 全部经 `adminGate`（admin 限流 120/min + `role='admin'` 校验）
- 依赖: `lib/db` `lib/users` `lib/identity` `tcapi` `lib/config`

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/admin/users | 用户列表（DescribeEndUsers + user_roles 合并，返回 userNo/registeredAt） |
| POST | /api/admin/users | 创建用户（CreateEndUserAccount + `insertUserRole` 分配 001 编号） |
| PATCH | /api/admin/users/:uid | 改角色 / 封禁 / 重置密码 |
| DELETE | /api/admin/users/:uid | 删除账号 |
| POST | /api/admin/options/:id/plan | 候选「已通过」勾选入库（planned=true） |
| GET | /api/admin/pool | 提名池列表 |
| POST | /api/admin/pool/:id/promote | 勾选入库（TMDB 补建 films + 通知提名者） |
| POST | /api/admin/pool/:id/demote | 退回提名库（可逆） |
| POST | /api/admin/films/:id/schedule | 排期（screening_status + screening_date） |
| POST | /api/admin/channel/resolve | 解析视频链接（Bilibili BV / YouTube），返回标题、封面、canonical URL |
| POST | /api/admin/rounds/:id/status | 遗留：轮次 6 态流转（后台 UI 已移除） |
| GET | /api/admin/stats | 统计（谁提名 / 谁投票，含匿名判定） |

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
| 400 | `bad_request` / `bad_status` / `no_film` |
| 404 | `not_found` |
| 409 | 重置被封禁账号密码（「该用户已被封禁…」） |

## 备注

- **创建用户**：`insertUserRole` 带 5 次重试（UNIQUE user_no 冲突自动换号）。
- **promote 幂等**：TMDB 影片已存在则跳过创建，只 PATCH pool（重试安全）；同时给提名者发 `promoted` 通知。
- **demote 可逆**：只把 pool status 重置回 pending，不删影片。
- **排期三态**：unscheduled（待定）/ scheduled（已排期）/ screened（已放映）。
- **命名投票轮次已废弃**：后台不再创建 `nomination_rounds`；`POST /api/admin/rounds/:id/status` 仅遗留。一场 `screenings` 即一轮，状态由日期自动标记。
- 统计：匿名 cookie id（长度 >30）显示为「匿名」。