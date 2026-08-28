# Spec: 放映日历（Screening Calendar）

- 类型: 前端页面
- 路径: `src/app/pages/CalendarPage.tsx`
- 状态: 已上线

## 目的
提供参考 Cal.com / Google Calendar 交互体验的放映与活动排期日历，支持按月/日视图浏览未来放映会、新片上映、线上交流会与连映马拉松，支持全球多时区无缝切换与日历预约。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `CalendarPage` | `src/app/pages/CalendarPage.tsx` | 放映日历大屏页面，左侧月历选择器与时区配置，右侧按所选日期筛选的高亮事件流与场次卡片 |
| 事件色调体系 (`EventTone`) | `CalendarPage.tsx` 内置 | `rose`（连映马拉松）、`amber`（首映/Live）、`blue`（杜比特设放映）、`purple`（线上讨论）、`emerald`（常规放映） |
| 单场多片联动 | `CalendarPage.tsx` 内置 | 每场放映日程清晰标注关联展映影片（`films: [{ id, title, year }]`）并支持一键跳转作品详情 |

## 数据 / 状态

### 依赖数据层
- `src/lib/community.ts`（日历事件数据）
- `src/lib/session.ts`（登录态获取）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/calendar` | GET | 无 | 拉取全量放映日历事件列表（支持日期范围查询） |

### 关键状态
- `selectedDate: string`: 当前高亮选中的日期（YYYY-MM-DD）。
- `activeMonth: Date`: 当前正在查看的月份。
- `activeTimezone: string`: 当前选中的时区（`Asia/Shanghai`, `Asia/Tokyo`, `America/New_York`, `UTC` 等）。
- `selectedType: string`: 事件类型过滤（全部 / 放映 / 直播 / 马拉松）。

## 交互

1. **日历网格选日与微动**：点击日历单元格即时筛选右侧事件，带有高亮指示环与弹性滑动。
2. **多时区即时转换**：切换时区下拉框后，自动重算各场次起止时间字符串并展示对应时区偏移（Offset）。
3. **日程卡片深层导航**：点击日程中的影片标签可直接唤起作品预览弹窗或跳转放映详情。

## 边界与备注

- **静态兜底数据**：若服务端 `/api/calendar` 接口不可用，自动使用内置 `SCHEDULES_DATA` 进行兜底展示。
