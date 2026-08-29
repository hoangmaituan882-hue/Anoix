# Spec: lib/meStats（个人放映账口径）

- 类型: lib 模块
- 路径: `server/lib/meStats.js`（+ `meStats.test.js`）
- 依赖: 无

## 导出

| 导出 | 说明 |
|---|---|
| minutesToHours | 分钟 → 一位小数小时：`round(minutes / 6) / 10` |
| firstScreenedByFilm | 上海日历下**已过去**场次中每部片子的首次放映日；今晚与未来场忽略 |
| assembleMeStats | 已看 / 未看 / 总时长与部数、按月已放映、提名去重、周票 SUM |

## 口径

- 宇宙：`firstScreenedByFilm` 的 unique `film_id`。
- 已看：`watch_log` ∩ 宇宙；缺 `duration` 记 0 分钟，仍计 1 部。
- 提名：`nomination_pool.film_id` 去重。周票：`film_week_votes.count` 求和（不含旧 `votes` 表）。
