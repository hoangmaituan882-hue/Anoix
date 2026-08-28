# Spec: 选片主线（提名 / 投票 / 广场 / 轮次）

- 类型: 前端功能 / 页面
- 路径: `src/app/pages/NominationsPage.tsx` / `src/app/pages/PlazaPage.tsx` / `src/features/nominations/`
- 状态: 已上线

## 目的
提供放映会社区完整的选片主线体验：影迷可提交作品提名（支持片库直选与 TMDB 在线刮削）、参与 6 态流转的放映选片投票轮次、管理周配额与撤票，并在提名广场通过 3D CoverFlow 封面流和实时瀑布流查看热度榜单。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `NominationsPage` | `src/app/pages/NominationsPage.tsx` | 选片大本营页面，聚合活跃投票轮次、多票制候选卡片、撤票操作、周配额进度条与历史轮次归档 |
| `PlazaPage` | `src/app/pages/PlazaPage.tsx` | 提名广场独立页面，集成 8s 静默轮询实时排行与 Masonic 虚拟瀑布流 |
| `NominateDialog` | `src/features/nominations/NominateDialog.tsx` | 提名弹窗，支持「片库选择 (`library`)」与「TMDB 刮削 (`tmdb`)」两栏 Tab + 必填推荐寄语 `note` |
| `CoverFlowCarousel` | `src/features/nominations/CoverFlowCarousel.tsx` | 经典 Apple 3D 透视封面流轮播，支持惯性拖拽、中心卡片高亮与 3.5s 自动步进 |
| `FilmContextMenu` | `src/features/nominations/FilmContextMenu.tsx` | 提名卡片右键上下文菜单，支持快速发起同款提名与查看作品详情 |

## 数据 / 状态

### 依赖数据层
- `src/lib/nominations.ts`（配额、提名提交、广场数据、个人活动）
- `src/lib/repository.ts`（片库本地缓存）
- `src/lib/session.ts`（用户登录态与 AccessToken）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/nominations` | GET | 无 | 获取所有轮次、候选选项、关联影片及实时票数 |
| `/api/vote/ticket` | GET | 无 | 签发匿名投票签名 Cookie (`anoix_voter`) |
| `/api/vote` | POST | 必选 | 投一票（多票制，受周配额约束） |
| `/api/vote?roundId=` | GET | 可选 | 查询当前身份在该轮次的已投选项 `optionIds` |
| `/api/vote` | DELETE | 必选 | 撤回投票并回退周配额 |
| `/api/quota` | GET | 可选 | 获取当前自然周的提名/投票配额与已用额度 |
| `/api/nominations` | POST | 必选 | 持续提名（直接入提名池，不绑定轮次） |
| `/api/nominations/:roundId/nominate` | POST | 必选 | 提名进指定轮次（需处于 `collecting` 状态） |
| `/api/nominations/plaza?scope=` | GET | 无 | 提名广场聚合统计（`scope=week` 或 `all`，8s 轮询） |
| `/api/tmdb/search?q=` | GET | 无 (限流) | TMDB 在线电影刮削代理（防抖 450ms） |

### 关键状态
- `rounds: NominationRound[] | null`: 投票轮次列表。
- `myVotes: Record<string, number[]>`: 各轮次当前用户已投的 `option_id` 集合。
- `quota: Quota | null`: 当前自然周配额（包含 `remainingNominations`, `remainingVotes` 等）。
- `scope: 'week' | 'all'`: 广场排行作用域。
- `view: 'masonry' | 'ranking'`: 广场展示视图（瀑布流或排行榜）。

## 交互

1. **3D CoverFlow 封面流**：基于 CSS 3D `perspective(1000px)`、`rotateY(48deg)` 与地面倒影渲染，支持触摸/鼠标拖拽 Scrubbing 与无操作自动轮播。
2. **多票制投票与即时撤票**：点击投票后采用 `AnimatedNumber` 产生数字平滑滚动，并支持随时撤票回退额度。
3. **TMDB 防抖刮削**：在提名弹窗中输入影片名，450ms 防抖请求代理接口，展示海报、原名、年份及演职员。
4. **配额进度条**：直观展示本周剩余票数，额度耗尽时禁用投票按钮并提示重置时间。

## 边界与备注

- **周配额重置**：按中国标准时间（Asia/Shanghai）每周一 00:00 自动重置（匿名 1提/2投，登录用户 3提/6投）。
- **TMDB 依赖**：线上需配置云托管环境变量 `TMDB_API_KEY`；未配置时接口返回 503，前端弹窗捕获错误并提示。
- **轮次 6 态流转**：`draft`（草稿）→ `collecting`（征集）→ `voting`（投票中）→ `closed`（已截止）→ `settled`（已排期入库）→ `archived`（归档）。前端根据状态展示不同徽章与禁用控制。
