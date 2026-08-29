# Spec: 放映日历（Screening Calendar）

- 类型: 前端页面
- 路径: `src/app/pages/CalendarPage.tsx`
- 状态: 已上线

## 目的
按月浏览社内放映场次：一场一格，日期来自 `screenings.screen_date`（Asia/Shanghai 日历日）。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `CalendarPage` | `src/app/pages/CalendarPage.tsx` | 左侧场次摘要，中间月历色条，右侧当日场次与真实 RSVP |

## 数据 / 状态

### 依赖数据层
- `src/lib/community.ts`（`/api/calendar`、`/api/rsvp`）
- `src/lib/catalog.ts`（点片名拉详情）
- `src/lib/scheduleOps.ts`（`screeningRoundStatus` 上色）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/calendar` | GET | 无 | 全量场次事件 |
| `/api/rsvp/:id` | GET / POST / DELETE | 写需登录 | 预约 / 取消预约该晚 |

### 关键状态
- `selectedDate: string`: 当前高亮日期（YYYY-MM-DD），默认上海今日。
- `schedules`: `GET /api/calendar` 映射后的场次条。

## 交互

1. 点格子或色条筛选右侧场次。
2. 点片名打开作品预览；点标题进 `/screenings/:id`。
3. 「预约席位」走真实 RSVP，未登录去 `/auth`。

## 边界与备注

- 无 TRIGGER 直播假数据、无 Cal.com 假时段预约。拉失败则空日历，不回落到种子片单。
- 时区下拉仅对照；排期本身是上海日历日，不做时钟换算。
- 色条：已放映 emerald、今晚 amber、未放映 blue。
