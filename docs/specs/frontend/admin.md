# Spec: 管理后台（Admin Console）

- 类型: 前端页面 / 管理控制台
- 路径: `src/app/pages/AdminPage.tsx` / `src/features/admin/`
- 状态: 已上线

## 目的
为放映会社区管理员提供一体化管控工作台：用户与角色、周边商品、首页官方频道（Bilibili 等外链卡片）、页脚社交格子、提名池审核与排期、放映档案、作品/新闻发布及数据大盘。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `AdminPage` | `src/app/pages/AdminPage.tsx` | 后台入口主容器，负责管理员会话检测与 `adminAuth.checkAdmin()` 角色鉴权 |
| `AdminHeader` | `src/features/admin/AdminHeader.tsx` | 后台专属顶栏，9 个功能 Tab 与退出控制台 |
| `UsersAdmin` | `src/features/admin/UsersAdmin.tsx` | 用户管理面板，支持查看 `user_no` 顺序编号 (001...)、修改角色 (admin/user)、封禁 (ban) 与检索 |
| `PoolAdmin` | `src/features/admin/PoolAdmin.tsx` | 影迷提名池管理，支持一键入库为作品、一键排期放映、批量审核与移除 |
| `ChannelAdmin` | `src/features/admin/ChannelAdmin.tsx` | 首页官方频道：查看全部链接 + 粘贴视频链接抓封面 + 拖动排序卡片 |
| `NewsAdmin` | `src/features/admin/NewsAdmin.tsx` | 首页最新动态：钴蓝预览即访客所见，拖动排序/置顶、完整编辑；区块无开关 |
| `SocialAdmin` | `src/features/admin/SocialAdmin.tsx` | 页脚社交格子：预览与页脚同款卡片，可增删拖动，条数可变 |
| `ScreeningsAdmin` | `src/features/admin/ScreeningsAdmin.tsx` | 放映会场次编排；每一场即一轮，标题与已放映/本场/未放映由日期自动标记；顶部 `ScheduleBoard` 时刻表 |
| `ScheduleBoard` | `src/features/admin/ScheduleBoard.tsx` | 三栏：未排期片库 / 月历拖放 / 已放映 12 格预览（前两格 NEW） |
| `StatsAdmin` | `src/features/admin/StatsAdmin.tsx` | 每部提名片的匿名/登录提名与周票；仅后台可见 |
| `GoodsAdmin` | `src/features/admin/GoodsAdmin.tsx` | 周边商品数据库 CRUD、淘宝链接与预售状态管理 |
| `TmdbImportModal` | `src/features/admin/TmdbImportModal.tsx` | 后台 TMDB 批量抓取与入库工具弹窗 |

## 数据 / 状态

### 依赖数据层
- `src/lib/pgAdmin.ts`（作品/新闻 PostgREST 直连 SDK）
- `src/lib/adminUsers.ts`（用户管理 API）
- `src/lib/poolAdmin.ts`（提名池管理 API）
- `src/lib/social.ts`（页脚社交公开读 + 后台增删改排）
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
| `/api/admin/stats` | GET | Admin | 每部提名片匿名 vs `user_roles` 的提名行数与周票 SUM |
| `/api/admin/channel/resolve` | POST | Admin | 解析 Bilibili/YouTube 链接，返回标题与封面 |
| `/api/admin/social-links` | GET / POST / PATCH / DELETE / reorder | Admin | 页脚社交格子 CRUD |
| `/api/admin/news/flush` | POST | Admin | 丢掉 news 15s 缓存 |
| `/api/admin/news/reorder` | POST | Admin | `{ ids }` 写 `sort_order` 并 flush |
| `/channel_settings`, `/channel_videos` | GET / POST / PATCH / DELETE | Bearer (Admin) | 官方频道入口与卡片 CRUD（PostgREST） |
| `/api/goods` | GET / POST / PATCH / DELETE | Admin | 周边商品数据维护 |

### 关键状态
- `authState: 'checking' | 'signed-out' | 'signed-in' | 'unauthorized'`: 鉴权状态。
- `currentTab: AdminTab`: 当前管理 Tab（`films` / `news` / `goods` / `channel` / `social` / `screenings` / `pool` / `stats` / `users`）。

## 交互

1. **多重安全屏障拦截**：非管理员或未登录用户进入后显示 `Unauthorized` 界面，无法读取或写入敏感数据。
2. **破坏性操作确认**：删除作品、删除放映、封禁用户均调用 `ConfirmDialog` 弹窗进行二次确认。
3. **即时开关与微动画**：置顶、发布状态、预售等属性使用 `Switch` 组件即时同步，列表带有平滑过滤。
4. **时刻表排期**：在「放映档案」把未排期片子拖到某一天，同晚可拖动改顺序；保存时写入 `screenings.film_ids` 并回写该片 `screening_date` / `screening_status`。右侧 12 格只反映已放过场次。新建场次不填轮次名称：空白标题按日期写成「YYYY年M月D日放映」，状态由 `screen_date` 相对上海日历日自动标记为已放映 / 本场 / 未放映。
5. **首页最新动态**：钴蓝预览与访客 `GET /api/news` 同一套过滤/排序；拖动改顺序，拖进置顶区会置顶。NEWS 整块没有开关。

## 边界与备注

- **RLS 行级安全**：服务端即便绕过前端，PostgreSQL 的 RLS 规则 (`is_admin()`) 仍会强制校验用户身份，彻底防范越权。
- **无独立选片轮次 Tab**：不创建「TRIGGER 社区选片与投票轮次」一类名称；遗留 `nomination_rounds` 表与 `/api/admin/rounds/:id/status` 后台不再使用。
