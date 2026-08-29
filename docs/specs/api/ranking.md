# Spec: ranking 路由（全站已看时长榜）

- 类型: 路由模块
- 路径: `server/routes/ranking.js`
- 依赖: `lib/db` `lib/identity` `lib/catalog` `lib/meStats` `lib/ranking`

## 端点

| 方法 | 路径 | 鉴权 | 限流 | 说明 |
|---|---|---|---|---|
| GET | /api/ranking | 可选 Bearer | 无 | 终身社内已看时长榜。游客 `me=null`；登录用户带 `me`（未看过社内片目则 `rank=null`） |

## 响应

```
{
  total: number,
  top: [{ rank, uid, name, hours, filmsCount }],
  histogram: number[26],
  histogramMaxHours: number,
  me: null | { rank, hours, filmsCount, percentile, beatRatio, bucketIndex }
}
```

- `top` 最多 20 名。
- 口径与 `/api/me/stats` 已看时长相同：`watch_log` ∩ 过去场次去重片目；缺 `duration` 记 0 分钟仍计 1 部。
- 仅 `user_roles` 成员上榜；匿名 cookie uid 忽略。0 部已看不上榜。
- 排序：时长降序 → 部数降序 → `user_no` 升序（无并列）。
- 源数据 15s 缓存（按上海日历日），`me` 每次按 token 现算。

## 错误码

公开接口，无效 token 不当 401，当作游客（`me=null`）。
