# Spec: 全站搜索（Search Palette & Preview）

- 类型: 前端组件 / 全局能力
- 路径: `src/features/search/SearchPalette.tsx` / `src/lib/filmPreview.ts`
- 状态: 已上线

## 目的
全局 Command Palette（`⌘K` / `Ctrl+K`）检索动画作品、新闻、放映会与快捷导航。

## 结构 / 组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `SearchPalette` | `src/features/search/SearchPalette.tsx` | 快捷键、作品走分页检索、新闻/放映会仍为短列表 |
| `CommandPalette` | `src/components/ui/CommandPalette.tsx` | 渲染、键盘导航、Live 预览；`onQueryChange` 回传输入 |
| `filmPreview` | `src/lib/filmPreview.ts` | 点击作品打开详情弹窗 |

## 数据 / 状态

### 依赖数据层
- `src/lib/catalog.ts`（作品，`limit=8`，防抖 300ms）
- `src/lib/repository.ts`（新闻内存缓存）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/films?q&limit=8` | GET | 无 | 作品命中，与片库同一套排序/匹配 |
| `/api/screenings` | GET | 无 | 弹窗唤起时拉放映会并合并精修数据 |
| `/api/films/:id` | GET | 无 | 点选作品后再拉详情 |

### 关键状态
- `open` / `searchQuery` / `filmHits`（最多 8）
- 放映会与新闻本切片仍用小列表，不跟片库同一分页接口

## 交互

1. `⌘K` / `Ctrl+K` 或顶栏搜索图标。
2. `↑` `↓` Enter Esc。
3. 命中作品调用 `openFilmPreview`。

## 边界与备注

- 作品搜索字段与片库一致（不含 tagline）。
- 输入框客户端过滤仍作用于新闻/放映会/指令；作品命中以服务端列表为准。
