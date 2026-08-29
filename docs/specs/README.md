# Specs 索引

> Anoix 的逐模块规格说明（spec）。本文档是**导航入口**：共 31 个 spec，覆盖架构、数据表、API、lib 模块、前端功能。

## 统一模板（每个 spec 遵循）

| 小节 | 内容 |
|---|---|
| 元信息 | 类型（路由/lib/数据表/前端功能/组件）+ 路径 + 状态 |
| 目的 | 一句话职责 |
| 接口 / 导出 / 结构 | 端点表 或 导出函数表 或 组件表 |
| 数据 / 状态 | 表字段 或 依赖数据层 + API |
| 权限 / 配额 / 限流 | 身份、RLS、限流键 |
| 错误码 / 交互 / 边界 | 各自模块相关 |

## 导航

### 顶层

| 文件 | 说明 |
|---|---|
| [overview.md](overview.md) | 架构总览：后端结构 + 依赖图 + 数据流 + 身份/权限模型（**先读这个**） |

### data/ — 数据库

| 文件 | 说明 |
|---|---|
| [data/schema.md](data/schema.md) | 17 张表完整 schema（列/约束/RLS/用途） |

### api/ — 后端路由（47 端点）

| 文件 | 端点数 | 说明 |
|---|---|---|
| [api/content.md](api/content.md) | 11 | 健康检查 / 作品（featured + 分页列表） / 新闻 / 放映会 / 官方频道 / 参与 rsvp |
| [api/voting.md](api/voting.md) | 10 | 片库叠票 / 配额 / 提名 / 提名广场（轮次票保留给后台） |
| [api/admin.md](api/admin.md) | 12 | 用户管理 / 提名池 / 排期 / 频道解析 / 统计 |
| [api/social.md](api/social.md) | 11 | 通知 / 收藏 / 日历 / 观影评分 / 年度回顾 / 商品 |
| [api/me.md](api/me.md) | 4 | 个人资料 / 改密 / 我的活动 |
| [api/ranking.md](api/ranking.md) | 1 | 全站社内已看时长榜（可选登录填 `me`） |

### lib/ — 后端库层

| 文件 | 说明 |
|---|---|
| [lib/db.md](lib/db.md) | config + db：env 配置、pgGet/pgWrite/pgUpsert/缓存/重试 |
| [lib/identity.md](lib/identity.md) | 身份解析 + adminGate |
| [lib/quota.md](lib/quota.md) | 周配额（quotaInfo/bump/unbump/QUOTA_LIMITS） |
| [lib/users.md](lib/users.md) | mapUser / nextUserNo / insertUserRole |
| [lib/pure.md](lib/pure.md) | 纯函数：周起始 / 年度称号 / 编号推导（有单测） |
| [lib/catalog.md](lib/catalog.md) | 纯函数：首页 reel / 片库检索 / 周票 clamp（有单测） |
| [lib/meStats.md](lib/meStats.md) | 纯函数：个人放映账口径（有单测） |
| [lib/channel.md](lib/channel.md) | 纯函数：Bilibili/YouTube 链接解析与频道卡片组装（有单测） |
| [lib/ranking.md](lib/ranking.md) | 纯函数：社内已看时长榜组装（有单测） |
| [lib/middleware.md](lib/middleware.md) | CORS / 安全头 / 统一错误处理 |
| [lib/support.md](lib/support.md) | 支撑模块：auth（匿名身份+限流）/ tcapi / tmdb |

### frontend/ — 前端功能

| 文件 | 说明 |
|---|---|
| [frontend/selection.md](frontend/selection.md) | 选片主线：提名 + 投票 + 轮次 + 广场 + 封面流动 |
| [frontend/library.md](frontend/library.md) | 放映库：作品列表 / 详情弹窗 / 批量标记已看 |
| [frontend/screenings.md](frontend/screenings.md) | 放映会：列表 / 详情 / 参与 / 筛选 / 海报弹窗 |
| [frontend/credentials.md](frontend/credentials.md) | 资历档案：3D Coverflow / 护照分享 / 活跃度火焰图 |
| [frontend/credits.md](frontend/credits.md) | 片尾名单：CreditsDropdown / CreditsSheetModal |
| [frontend/ranking.md](frontend/ranking.md) | 时长榜：LeaderboardModal / RankingDropdown / 真实 `/api/ranking` |
| [frontend/profile.md](frontend/profile.md) | 个人中心：资料 / 观影评分 / 年度回顾 / 我的活动 |
| [frontend/calendar.md](frontend/calendar.md) | 放映日历（Cal.com 风格） |
| [frontend/search.md](frontend/search.md) | 全站搜索 ⌘K + 作品统一弹窗 |
| [frontend/admin.md](frontend/admin.md) | 后台各 Admin 模块 |
| [frontend/client-state.md](frontend/client-state.md) | 客户端数据层：repository / community / nominations / pgAdmin |
| [frontend/components.md](frontend/components.md) | 通用组件 + 动效组件 |

## 维护约束（硬性）

> **每次改功能/模块，收尾时必须顺手更新对应 spec，否则视为「没做完」。**

| 改了什么 | 必须更新哪个 spec |
|---|---|
| 新增/改端点、改鉴权/限流/错误码 | `api/*.md` 对应路由 |
| 新增/改表、改字段/约束/RLS | `data/schema.md` |
| 改 lib 导出函数签名/语义 | `lib/*.md` |
| 改前端功能/页面/组件 | `frontend/*.md` |
| 新增模块/端点/表 | **同时新建对应 spec**（按上面统一模板） |

- 元信息「状态」标记 `已上线 / 开发中`；review 时抽查 spec 与代码一致性（漂移即修改）。
- 顶层 `agend.md` 是「项目议程」，这里是「逐模块规格」，两者分工：agend 看全局，spec 看细节。