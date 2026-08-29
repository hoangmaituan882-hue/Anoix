# Spec: 管理后台（Admin Console）

- 类型: 前端页面 / 管理控制台
- 路径: `src/app/pages/AdminPage.tsx` / `src/features/admin/`
- 状态: 已上线

## 目的
为放映会社区管理员提供一体化管控工作台：涵盖用户与角色权限管理、周边商品维护、影迷提名池审核并一键入库/排期、投票轮次创建与 6 态流转、作品/新闻内容发布及数据大盘统计。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `AdminPage` | `src/app/pages/AdminPage.tsx` | 后台入口主容器，负责管理员会话检测与 `adminAuth.checkAdmin()` 角色鉴权 |
| `AdminHeader` | `src/features/admin/AdminHeader.tsx` | 后台专属顶栏，包含 8 大功能模块 Tab 切换与退出控制台按钮 |
| `UsersAdmin` | `src/features/admin/UsersAdmin.tsx` | 用户管理面板，支持查看 `user_no` 顺序编号 (001...)、修改角色 (admin/user)、封禁 (ban) 与检索 |
| `PoolAdmin` | `src/features/admin/PoolAdmin.tsx` | 影迷提名池管理，支持一键入库为作品、一键排期放映、批量审核与移除 |
| `RoundsAdmin` | `src/features/admin/RoundsAdmin.tsx` | 选片投票轮次管理，创建新轮次、添加候选作品、推进轮次 6 态流转与统计详情 |
| `ScreeningsAdmin` | `src/features/admin/ScreeningsAdmin.tsx` | 放映会场次编排；顶部 `ScheduleBoard` 时刻表（未排期拖到日历 + 12 格首页预览） |
| `ScheduleBoard` | `src/features/admin/ScheduleBoard.tsx` | 三栏：未排期片库 / 月历拖放 / 已放映 12 格预览（前两格 NEW） |
| `StatsAdmin` | `src/features/admin/StatsAdmin.tsx` | 选片大盘与社区统计看板（投票人数、提名采纳率、活跃度分布） |
| `GoodsAdmin` | `src/features/admin/GoodsAdmin.tsx` | 周边商品数据库 CRUD、淘宝链接与预售状态管理 |
| `TmdbImportModal` | `src/features/admin/TmdbImportModal.tsx` | 后台 TMDB 批量抓取与入库工具弹窗 |

## 数据 / 状态

### 依赖数据层
- `src/lib/pgAdmin.ts`（作品/新闻 PostgREST 直连 SDK）
- `src/lib/adminUsers.ts`（用户管理 API）
- `src/lib/poolAdmin.ts`（提名池管理 API）
- `src/lib/session.ts`（管理员会话凭证）

### 调用的后端 API / PG REST

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/films`, `/news`, `/screenings` | GET / POST / PATCH / DELETE | Bearer (Admin) | PostgREST 端点直连（受底层 RLS 策略保护） |
| `/api/admin/users` | GET | Admin | 获取全量用户列表（包含 `user_no` 与角色） |
| `/api/admin/users/:id/role` | POST | Admin | 分配用户角色（`admin` 或 `user`） |
| `/api/admin/users/:id/ban` | POST | Admin | 封禁 / 解封用户 |
| `/api/admin/nomination-pool` | GET | Admin | 获取全量提名池条目 |
| `/api/admin/nomination-pool/:id/approve` | POST | Admin | 审批提名并一键录入作品库 |
| `/api/admin/nomination-pool/:id/schedule` | POST | Admin | 将提名作品快速排期至指定放映会 |
| `/api/admin/rounds` | GET / POST / PATCH / DELETE | Admin | 投票轮次管理与状态流转 |
| `/api/admin/stats` | GET | Admin | 获取管理后台统计大盘数据 |
| `/api/goods` | GET / POST / PATCH / DELETE | Admin | 周边商品数据维护 |

### 关键状态
- `authState: 'checking' | 'signed-out' | 'signed-in' | 'unauthorized'`: 鉴权状态。
- `currentTab: AdminTab`: 当前管理 Tab（`films` / `news` / `screenings` / `rounds` / `users` / `pool` / `stats` / `goods`）。

## 交互

1. **多重安全屏障拦截**：非管理员或未登录用户进入后显示 `Unauthorized` 界面，无法读取或写入敏感数据。
2. **破坏性操作确认**：删除作品、解散轮次、封禁用户均调用 `ConfirmDialog` 弹窗进行二次确认。
3. **即时开关与微动画**：置顶、发布状态、预售等属性使用 `Switch` 组件即时同步，列表带有平滑过滤。
4. **时刻表排期**：在「放映档案」把未排期片子拖到某一天，同晚可拖动改顺序；保存时写入 `screenings.film_ids` 并回写该片 `screening_date` / `screening_status`。右侧 12 格只反映已放过场次。

## 边界与备注

- **RLS 行级安全**：服务端即便绕过前端，PostgreSQL 的 RLS 规则 (`is_admin()`) 仍会强制校验用户身份，彻底防范越权。
