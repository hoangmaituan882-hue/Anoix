# Spec: 放映库 / 作品（Films Library & Detail）

- 类型: 前端功能 / 组件 / 页面
- 路径: `src/features/films/` / `src/app/pages/FilmDetailPage.tsx`
- 状态: 已上线

## 目的
展示株式会社 TRIGGER 历年动画作品官方档案，提供大屏横向画廊展台、作品库大弹窗、多维条件筛选排序、3D 视差倾斜卡片、演职员表、PV 播放器、观影打分与批量标记已看功能。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `FilmsSection` | `src/features/films/FilmsSection.tsx` | 首页红黑分割大型 Hero 区块，左侧人物主视觉海报 + 右侧横向拖拽滑轨与进度条 |
| `FilmsLibraryModal` | `src/features/films/FilmsLibraryModal.tsx` | 全库作品弹窗，支持分类 Tab、年份升降序、多选批量模式 (`isBatchMode`) 与已看状态同步 |
| `FilmDetailBody` | `src/features/films/FilmDetailBody.tsx` | 作品详情核心内容（单一真实源），展示剧照、海报、上映日期、时长、演职员名单与流媒体链接 |
| `FilmDetailModal` | `src/features/films/FilmDetailModal.tsx` | 全局快速详情弹窗，支持键盘 Esc、上/下一部切换、收藏与五星评分 |
| `WatchPanel` | `src/features/films/WatchPanel.tsx` | 详情页内嵌的观影记录面板（1~5 星打分、写短评、一键保存/移除） |
| `FilmDetailPage` | `src/app/pages/FilmDetailPage.tsx` | 独立路由页面 `/films/:id`，支持完整 URL 深层分享与原生 View Transitions 过渡 |

## 数据 / 状态

### 依赖数据层
- `src/lib/repository.ts` (`useRepo(repository.films)`)
- `src/lib/community.ts`（观影记录、收藏列表）
- `src/lib/filmPreview.ts`（跨组件弹窗唤起总线）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/films` (通过 `repository.refresh()`) | GET | 无 | 从 CloudBase PG 拉取全量作品列表（15s 内存缓存） |
| `/api/watch` | GET | 必选 | 获取个人已看作品列表（含评分与短评） |
| `/api/watch/:filmId` | PUT | 必选 | 保存/修改指定影片的观影评分与短评 |
| `/api/watch/:filmId` | DELETE | 必选 | 移除指定影片的观影记录 |
| `/api/favorites` | GET / POST | 必选 | 获取 / 添加喜爱作品收藏 |
| `/api/favorites/:filmId` | DELETE | 必选 | 取消喜爱作品收藏 |

### 关键状态
- `filter: 'all' | 'TV Series' | 'Movie' | 'Original Animation'`: 分类过滤。
- `searchQuery: string`: 标题、导演、年份模糊匹配。
- `sortOrder: 'desc' | 'asc'`: 年份升降序排布。
- `isBatchMode: boolean` & `selectedIds: Set<string>`: 批量选择标记已看模式与选中项。
- `watchedMap: Record<string, WatchItem>`: 当前用户已看影片缓存映射。

## 交互

1. **首页滑轨拖拽**：鼠标按住横向拖拽与滚轮惯性滑动，底部实时同步滚动百分比进度条。
2. **3D 悬浮视差 (`TiltCard`)**：卡片随鼠标移动产生微 3D 俯仰与光影反光。
3. **批量标记已看**：点击「批量管理」进入多选模式，勾选多部作品后一键标记已看，批量触发 `community.saveWatch` 并弹出完成 Toast。
4. **共享元素变形 (View Transitions)**：详情页海报使用 `viewTransitionName` 实现从缩略图到全屏详情的无缝平滑 Morph 放大。
5. **右键上下文菜单**：在任何作品卡片上右键可快速标记已看、加入收藏、复制链接或播放 PV。

## 边界与备注

- **双层数据兜底**：页面首屏瞬间使用 `src/data/triggerData.ts` 静态数据极速渲染，后台静默拉取远端 PG 数据库并由 `useSyncExternalStore` 无损热替换。
- **多语言标题回退**：按当前语言偏好优先读取 `titleZh` / `titleEn`，缺失时自动回退原名 `title`。
