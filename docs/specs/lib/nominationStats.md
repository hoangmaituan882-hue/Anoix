# Spec: lib/nominationStats（后台提名归因）

- 类型: lib 模块
- 路径: `server/lib/nominationStats.js`（+ `nominationStats.test.js`）
- 依赖: `lib/ranking.displayRankName`

## 导出

| 导出 | 说明 |
|---|---|
| filmAttributionKey | `film_id` → `tmdb_id` → `title`，用于把提名池行归到同一部片 |
| assembleNominationStats | 组装 `{ films, totals }` |

## 口径

- 只统计 **提名池出现过的片目**；`film_week_votes` 里无人提名的片丢掉。
- 登录用户 = `user_roles.uid`。Cookie / 空 id / 不在表里的 uid（含 CloudBase UUID）一律算匿名。**不用** id 长度启发式。
- 提名：池中每一行记 1。票：`SUM(film_week_votes.count)`（终身，含各周叠票）。
- `members[]` 只列出对该片有提名或票的登录用户；名用 `displayRankName`。
- 此载荷只给 `GET /api/admin/stats`。公开广场仍只返合计票数，不含身份。
