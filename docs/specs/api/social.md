# Spec: social 路由（通知 / 收藏 / 日历 / 观影 / 年度回顾 / 商品）

- 类型: 路由模块
- 路径: `server/routes/social.js`
- 依赖: `lib/db` `lib/identity` `lib/pure` `auth`

## 端点

| 方法 | 路径 | 鉴权 | 限流 | 说明 |
|---|---|---|---|---|
| GET | /api/notifications | 可选 | 无 | 本人通知（无身份返回 []） |
| POST | /api/notifications/read | 必选 | notif 30/min | 标记已读（`id` 单个 / 缺省全部） |
| GET | /api/favorites | 可选 | 无 | 收藏列表（join films） |
| POST | /api/favorites | 必选 | fav 30/min | 收藏（409 幂等） |
| DELETE | /api/favorites/:filmId | 必选 | fav 30/min | 取消收藏 |
| GET | /api/calendar | 无 | 无 | 日历事件（放映会 + 已排期影片） |
| GET | /api/watch | 可选 | 无 | 观影记录（join 影片标题/图） |
| PUT | /api/watch/:filmId | 必选 | watch 30/min | 评分+短评（原子 upsert） |
| DELETE | /api/watch/:filmId | 必选 | watch 30/min | 删除观影记录 |
| GET | /api/me/year-review?year= | 必选 | 无 | 年度回顾聚合 |
| GET | /api/goods | 无 | 无 | 商品列表（15s 缓存） |

## 错误码

| 码 | 值 |
|---|---|
| 400 | `film_required` |
| 401 | `identity_required`（写操作） |
| 429 | `rate_limited` |
| 502 | `favorite_failed` / `watch_failed` |

## 备注

- **watch 写入用 `pgUpsert`**（PostgREST `resolution=merge-duplicates`），一次原子完成，非 DELETE+POST。
- **年度回顾**：`personaFor(nominations, votes, watched)` 生成称号；year 边界用 `gte.{y}-01-01&lt.{y+1}-01-01`（上界排他）。
- **票价/评分字段**：rating 0–5 整数；review 截断 200 字。
- 匿名身份下 notifications/favorites/watch 均返回空数组（只读友好，写操作 401）。