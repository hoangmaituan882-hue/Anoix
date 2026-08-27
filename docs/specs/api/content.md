# Spec: content 路由（健康检查 / 内容 / 放映会 / 参与）

- 类型: 路由模块
- 路径: `server/routes/content.js`
- 依赖: `lib/config` `lib/db` `lib/identity` `auth`

## 端点

| 方法 | 路径 | 鉴权 | 限流 | 说明 |
|---|---|---|---|---|
| GET | /api/health | 无 | 无 | 健康检查，`{ok,env,db,time}`，db ∈ ok/disabled/degraded |
| GET | /api/films | 无 | 无 | 全量作品（15s 缓存），`sort_order` 升序 |
| GET | /api/films/:id | 无 | 无 | 单作品，无则 `null` |
| GET | /api/news | 无 | 无 | 已发布动态（15s 缓存），按 pinned 置顶 |
| GET | /api/screenings | 无 | 无 | 放映会列表，`screen_date` 降序 |
| GET | /api/screenings/:id | 无 | 无 | 单场详情 + 关联 `films` |
| GET | /api/rsvp/:screeningId | 可选 | 无 | `{rsvped, count}`（有身份时给出本人是否参与） |
| POST | /api/rsvp/:screeningId | 必选 | rsvp 20/min | 参与（404 无此场次；409 幂等返回 ok） |
| DELETE | /api/rsvp/:screeningId | 必选 | rsvp 20/min | 取消参与 |

## 错误码

| 码 | 场景 |
|---|---|
| 400 | —（此模块无 body 校验失败场景） |
| 401 | `identity_required`（rsvp 写，无 token/cookie） |
| 404 | `not_found` / `screening_not_found` |
| 409 | rsvp 已参与（幂等） |
| 429 | `rate_limited` |

## 备注

- films/news 走 `contentCache`（15s），admin 改库后最多 15s 延迟（无主动失效）。
- 匿名参与以签名 Cookie 身份写入 `rsvps.uid`。