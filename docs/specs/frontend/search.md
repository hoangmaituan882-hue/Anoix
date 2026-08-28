# Spec: 全站搜索（Search Palette & Preview）

- 类型: 前端组件 / 全局能力
- 路径: `src/features/search/SearchPalette.tsx` / `src/lib/filmPreview.ts`
- 状态: 已上线

## 目的
提供极客风格的全局 Command Palette（`⌘K` / `Ctrl+K`）即时搜索弹窗，一站式检索动画作品、官方新闻资讯、放映会档案与快捷导航指令，并与全局作品详情弹窗无缝联动。

## 结构 / 组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `SearchPalette` | `src/features/search/SearchPalette.tsx` | 搜索调色板主体，监听键盘快捷键、全局事件并整合数据生成搜索项集合 |
| `CommandPalette` | `src/components/ui/CommandPalette.tsx` | 通用 Command Palette 渲染容器，支持实时高亮、键盘导航、分类过滤与右侧 Live 预览卡片 |
| `filmPreview` | `src/lib/filmPreview.ts` | 轻量级全局订阅器，解耦搜索结果点击与根节点 `FilmDetailModal` 弹窗唤起 |

## 数据 / 状态

### 依赖数据层
- `src/lib/repository.ts` (`useRepo(repository.films)`, `useRepo(repository.news)`)
- `src/lib/community.ts`（放映会列表）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/screenings` | GET | 无 | 弹窗唤起时获取最新放映会列表并合并精修数据 |
| 本地缓存 (`repository`) | - | - | 直接读取 `films` 和 `news` 内存缓存进行模糊匹配 |

### 关键状态
- `open: boolean`: 搜索弹窗显示状态。
- `searchQuery: string`: 搜索输入框内容。
- `selectedIndex: number`: 当前键盘聚焦的高亮项索引。
- `commands: CommandItem[]`: 聚合后的所有可搜索项列表。

## 交互

1. **快捷键一键唤起**：按下 `⌘K`（macOS）或 `Ctrl+K`（Windows/Linux），或点击顶栏搜索图标均可唤起。
2. **纯键盘丝滑操作**：`↑` / `↓` 切换选中项，`Enter` 执行对应动作，`Esc` 关闭弹窗。
3. **右侧 Live 视差预览**：高亮不同条目时，右侧实时切换呈现大图海报、导演信息、故事简介与元数据标签。
4. **统一预览唤起**：命中动画作品时直接调用 `openFilmPreview(work)` 打开详情弹窗，无需刷新页面或破坏浏览上下文。

## 边界与备注

- **全字段多语匹配**：搜索词会同时匹配中文名、日文原名、英文名、导演、年份、标签及简介文本。
