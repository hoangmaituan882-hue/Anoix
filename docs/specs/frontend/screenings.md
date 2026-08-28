# Spec: 放映会（Screenings & Detail）

- 类型: 前端功能 / 页面 / 组件
- 路径: `src/features/screenings/` / `src/app/pages/ScreeningsPage.tsx` / `src/app/pages/ScreeningDetailPage.tsx`
- 状态: 已上线

## 目的
展示和归档放映会社区的所有历史与未来场次，提供时间轴列表、海报画廊与特设叠卡 3 种视图模式，支持多维条件 Pills 过滤、票券海报高清预览、放映 RSVP 报名参与与关联展映影片联动。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `ScreeningsPage` | `src/app/pages/ScreeningsPage.tsx` | 放映会列表主页，集成三重视图切换、年份筛选、搜索与海报弹窗 |
| `ScreeningDetailPage` | `src/app/pages/ScreeningDetailPage.tsx` | 放映会详情页 `/screenings/:id`，展示场地、时间、RSVP 参与人次与展映作品列表 |
| `ScreeningFilterPills` | `src/features/screenings/ScreeningFilterPills.tsx` | 多维胶囊筛选器，支持按年份、场地、主题多选过滤与重置 |
| `ScreeningPosterModal` | `src/features/screenings/ScreeningPosterModal.tsx` | 特设放映会海报与票根大图弹窗，支持一键下载与分享 |
| `ScreeningSkeleton` | `src/features/screenings/ScreeningSkeleton.tsx` | 列表加载过程中的骨架屏流光占位 |
| `ScreeningTimelineCard` / `ScreeningPosterCard` / `ScreeningTicketStub` | `src/features/screenings/` | 时间线卡片、海报展卡与实体票根原语组件 |

## 数据 / 状态

### 依赖数据层
- `src/lib/community.ts`（放映详情、RSVP 接口）
- `src/lib/repository.ts`（影片信息联查）
- `src/data/screeningData.ts`（本地精修离线数据）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/screenings` | GET | 无 | 获取全量放映会场次与关联影片 ID |
| `/api/screenings/:id` | GET | 无 | 获取指定放映会详情 |
| `/api/rsvp/:id` | GET | 必选 | 获取当前用户对该场次的报名状态与总报名人数 |
| `/api/rsvp/:id` | POST | 必选 | 报名参与放映会（RSVP +1） |
| `/api/rsvp/:id` | DELETE | 必选 | 取消报名放映会（RSVP -1） |

### 关键状态
- `tab: 'list_view' | 'card_view' | 'pack_view'`: 视图切换状态。
- `filterConditions: FilterCondition[]`: 当前激活的 Pills 过滤规则。
- `activePosterModal: Screening | null`: 当前打开的海报弹窗数据。
- `rsvped: boolean` & `count: number`: 详情页当前用户参与状态与总人数。

## 交互

1. **三维视图动态形变**：Tab 切换采用 `motion.div layoutId="screenings_view_tab"` 弹簧微交互。
2. **特设叠卡视效 (`pack_view`)**：卡牌以物理叠层堆放，鼠标悬浮时产生扇形展开并高亮顶层卡片。
3. **RSVP 即时互动**：点击「参与」按钮带有 `AnimatedNumber` 数字递增动画与参与者头像列表更新。
4. **票根海报弹窗**：点击海报进入大图预览，支持高斯模糊背景与票券编号展示。

## 边界与备注

- **单场多片关联**：单场放映会可包含多个 `film_ids`，前端自动匹配 `repository.films` 并横向渲染影片卡片。
- **离线与弱网降级**：若后端接口超时，自动回退渲染 `src/data/screeningData.ts` 内置数据，确保浏览可用性。
