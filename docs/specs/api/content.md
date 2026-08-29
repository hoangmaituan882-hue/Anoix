# Spec: content 路由（健康检查 / 内容 / 放映会 / 参与）

- 类型: 路由模块
- 路径: `server/routes/content.js`
- 依赖: `lib/config` `lib/db` `lib/identity` `lib/catalog` `auth`

## 端点

| 方法 | 路径 | 鉴权 | 限流 | 说明 |
|---|---|---|---|---|
| GET | /api/health | 无 | 无 | 健康检查，`{ok,env,db,time}`，db ∈ ok/disabled/degraded |
| GET | /api/films/featured | 无 | 无 | 先读场次算出 ≤12 个 id，再 `id=in` 拉卡片；前两张 `isNew` |
| GET | /api/films | 无 | 无 | 无查询参数时：全量 `select=*`（15s 缓存）。带 `q\|category\|sort\|limit` 时：PostgREST Range 分页 `{items,total,offset,limit}`，默认 `sort=screened_desc`，FilmCard 字段 |
| GET | /api/films/:id | 无 | 无 | 单作品详情，无则 `null` |
| GET | /api/news | 无 | 无 | 已发布动态（15s 缓存），`homepageNews`：置顶优先再 `sort_order` |
| GET | /api/channel | 无 | 无 | 首页官方频道 `{ hubUrl, items[] }`，15s 缓存；点卡片跳外站 |
| GET | /api/social-links | 无 | 无 | 页脚社交 `{ items[] }`，15s 缓存；条数可变 |
| GET | /api/screenings/upcoming | 无 | 无 | 今晚+未放映：一场一节点 + 当晚海报；须注册在 `/:id` 之前 |
| GET | /api/screenings/:id | 无 | 无 | 单场详情 + 关联 `films`；标题与 `round_status` 同上 |
| GET | /api/rsvp/:screeningId | 可选 | 无 | `{rsvped, count}`（有身份时给出本人是否参与） |
| POST | /api/rsvp/:screeningId | 必选 | rsvp 20/min | 参与（404 无此场次；409 幂等返回 ok） |
| DELETE | /api/rsvp/:screeningId | 必选 | rsvp 20/min | 取消参与 |

## 列表查询参数（`GET /api/films` 分页模式）

| 参数 | 说明 |
|---|---|
| q | title / title_zh / title_en / director / year |
| category | `all`（默认）/ `tv` / `movie` / `original` |
| sort | `screened_desc`（默认）/ `year_desc` / `year_asc` |
| limit | 1–48，默认 24 |
| offset | 默认 0 |

`/api/films/featured` 必须注册在 `/api/films/:id` 之前。

## 错误码

| 码 | 场景 |
|---|---|
| 400 | —（此模块无 body 校验失败场景） |
| 401 | `identity_required`（rsvp 写，无 token/cookie） |
| 404 | `not_found` / `screening_not_found` |
| 409 | rsvp 已参与（幂等） |
| 429 | `rate_limited` |

## 备注

- 无查询参数的 films/news/channel/social-links 走 `contentCache`（15s）。admin 改社交格子会 `delete('social')`；改动态会 `delete('news')`（`/api/admin/news/flush` 与 reorder）。
- 分页列表用反规范化 `films.screening_date` + `Prefer: count=exact`；`isNew` 仍按场次算出的首页前两 id。
- featured 不拉全库。
- `/api/screenings/upcoming` 必须写在 `/api/screenings/:id` 之前。
- 匿名参与以签名 Cookie 身份写入 `rsvps.uid`。
