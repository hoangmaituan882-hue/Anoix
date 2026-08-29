# Spec: 选片主线（提名 / 叠票 / 广场）

- 类型: 前端功能 / 页面
- 路径: `src/app/pages/NominationsPage.tsx` / `src/features/nominations/`
- 状态: 已上线

## 目的
影迷从片库或 TMDB 提名，并在广场对**任意未放过（且未冻结）的片子**叠周票。公开站不再展示 collecting→voting→revealed 轮次选票；排期以日历为准。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `NominationsPage` | `src/app/pages/NominationsPage.tsx` | 配额、CoverFlow、广场瀑布流/排行、± 叠票、发起提名 |
| `NominateDialog` | `src/features/nominations/NominateDialog.tsx` | 片库 Tab 走 `catalog.list`（20 条、300ms 防抖）+ TMDB 刮削 + 必填推荐语 |
| `CoverFlowCarousel` | `src/features/nominations/CoverFlowCarousel.tsx` | 3D 封面流 |
| `FilmContextMenu` | `src/features/nominations/FilmContextMenu.tsx` | 右键提名 / 详情 |

## 数据 / 状态

### 依赖数据层
- `src/lib/nominations.ts`（配额、提名、广场、`vote` / `unvote` / `myVotes`）
- `src/lib/catalog.ts`（提名弹窗片库）
- `src/lib/session.ts`

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/vote/ticket` | GET | 无 | 匿名 Cookie |
| `/api/vote/mine` | GET | 可选 | 本周每片已叠票数 |
| `/api/vote` | POST | 必选 | `{ filmId }` 叠 +1 |
| `/api/vote` | DELETE | 必选 | `{ filmId }` 本周 −1 |
| `/api/quota` | GET | 可选 | 周配额 |
| `/api/nominations` | POST | 必选 | 入提名池 |
| `/api/nominations/plaza?scope=` | GET | 无 | `week` = 本周一桶；`all` = 终身 |
| `/api/tmdb/search?q=` | GET | 无 (限流) | 刮削代理（450ms 防抖） |

### 关键状态
- `myVotes: Record<filmId, count>`：本周叠票。
- `quota`：上海周一重置（匿名 1/2，登录 3/6）。
- `scope: 'week' | 'all'`、`view: 'masonry' | 'ranking'`。

## 交互

1. 广场卡片 ±：可把本周全部票叠到一部。
2. 已放过 / 仅未来场：接口 409，Toast 说明。
3. 同人同片同周只能提名一次。

## 边界与备注

- 不 cron 自动把周榜 #1 写进周六。
- 后台不再维护命名投票轮次；一场 `screenings` 即一轮。遗留 `nomination_rounds` 接口仍在库里，前后台 UI 都不走。
- `/plaza` 重定向到 `/nominations`（已无独立 Plaza 页）。
- 广场只展示合计提名/票数；匿名 vs 登录拆分只在后台 `GET /api/admin/stats`。
