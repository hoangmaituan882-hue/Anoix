# Spec: 放映库 / 作品（Films Library & Detail）

- 类型: 前端功能 / 组件 / 页面
- 路径: `src/features/films/` / `src/app/pages/FilmDetailPage.tsx`
- 状态: 已上线

## 目的
展示放映会社区片库：首页横向 reel（最多 12 张已放过作品）、全库分页弹窗、详情页、观影打分与批量标记已看。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `FilmsSection` | `src/features/films/FilmsSection.tsx` | 首页 reel：`GET /api/films/featured`（≤12，社内放映日）；失败给空，不回落种子 |
| `FilmsLibraryModal` | `src/features/films/FilmsLibraryModal.tsx` | 全库弹窗：分页 24 + 加载更多；分类映射 `tv\|movie\|original`；默认 `screened_desc`；全选=已加载卡片 |
| `FilmDetailBody` | `src/features/films/FilmDetailBody.tsx` | 作品详情核心内容（单一真实源） |
| `FilmDetailModal` | `src/features/films/FilmDetailModal.tsx` | 全局快速详情；prev/next 走 `catalog.list` 首页 24 张，点开再 `get` |
| `WatchPanel` | `src/features/films/WatchPanel.tsx` | 观影记录面板 |
| `FilmDetailPage` | `src/app/pages/FilmDetailPage.tsx` | `/films/:id`，`GET /api/films/:id` |

## 数据 / 状态

### 依赖数据层
- `src/lib/catalog.ts`（featured / list / get）
- `src/lib/community.ts`（观影记录、收藏列表）
- `src/lib/filmPreview.ts`（跨组件弹窗唤起总线）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/films/featured` | GET | 无 | 首页 reel |
| `/api/films?q&category&sort&limit&offset` | GET | 无 | 分页 FilmCard；搜索防抖 300ms |
| `/api/films/:id` | GET | 无 | 详情（点卡片后再拉） |
| `/api/watch` | GET | 必选 | 已看列表 |
| `/api/watch/:filmId` | PUT / DELETE | 必选 | 保存 / 移除观影 |
| `/api/favorites` | GET / POST | 必选 | 收藏 |

### 关键状态
- `filter`: UI 文案 TV Series / Movie / Original Animation → API `tv` / `movie` / `original`
- `sortKey`: `screened`（默认）或 `year`（`year_desc` / `year_asc`）
- `isBatchMode` & `selectedIds`：全选仅覆盖**当前已加载**卡片
- 搜索字段不含 tagline

## 交互

1. 首页滑轨拖拽与 ALL WORKS 打开全库。
2. 片库加载更多；空库显示空态（不是种子全量）。
3. 批量标记已看仍走 `community.saveWatch`。

## 边界与备注

- 首页最多 12 张，**NEW** 为该有序列表前两张（计算得出，不读库 `is_new`）。详情 `GET /api/films/:id` 用同一对 id 打 `isNew`。
- 未来场次不进 reel；没有任何已放过场次时 reel 为空。
