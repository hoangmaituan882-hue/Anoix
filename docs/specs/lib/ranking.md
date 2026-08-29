# Spec: lib/ranking（社内已看时长榜）

- 类型: lib 模块
- 路径: `server/lib/ranking.js`（+ `ranking.test.js`）
- 依赖: `lib/meStats`（`firstScreenedByFilm`、`minutesToHours`）

## 导出

| 导出 | 说明 |
|---|---|
| displayRankName | 昵称 trim → `NO.{user_no}` → `影迷` |
| hoursHistogram | 时长列表 → 26 桶计数 + `maxHours`；最大值落在最后一桶 |
| assembleRanking | 组装 `{ total, top, histogram, histogramMaxHours, me }` |

## assembleRanking 规则

- 宇宙：上海日历下 **已过去** 的 `screenings.film_ids` 去重（同 `me/stats`）。
- 上榜：`user_roles` 且至少看过 1 部宇宙内片目。
- `viewerId` 缺省 → `me=null`（游客）。有 id 但不在榜 → `rank=null`。
- `percentile`：`TOP {(rank/total)*100}%`；`beatRatio`：`((total-rank)/total)*100` 一位小数。
