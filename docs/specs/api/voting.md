# Spec: voting 路由（投票 / 配额 / 提名）

- 类型: 路由模块
- 路径: `server/routes/voting.js`
- 依赖: `lib/db` `lib/identity` `lib/quota` `lib/catalog` `auth`

## 端点

| 方法 | 路径 | 鉴权 | 限流 | 说明 |
|---|---|---|---|---|
| GET | /api/nominations | 无 | 无 | 轮次 + 候选 + 影片 join + 实时票数（后台/兼容；公网站点不再消费） |
| GET | /api/vote/ticket | 无 | 无 | 签发匿名投票 Cookie |
| GET | /api/vote/mine | 可选 | 无 | 本周叠票 `{ items: [{ filmId, count }] }`；无身份则 `items: []` |
| POST | /api/vote | 必选 | vote 30/min | `{ filmId, count? }` 周叠票（默认 +1，封顶剩余配额）。`roundId+optionId` 为遗留轮次票 |
| GET | /api/vote?roundId= | 可选 | 无 | 本人在该轮次的已投选项 `optionIds`（遗留） |
| DELETE | /api/vote | 必选 | vote 30/min | `{ filmId }` 本周该片 count −1；或遗留 `{ roundId, optionId }` |
| GET | /api/quota | 可选 | 无 | 周配额（匿名给默认额度） |
| POST | /api/nominations | 必选 | nom 20/min | 持续提名 → 提名池（不入轮次）；同人同片同周一票 409 `already_nominated_this_week` |
| POST | /api/nominations/:roundId/nominate | 必选 | nom 20/min | 提名进指定轮次（collecting 态，后台） |
| GET | /api/nominations/plaza | 无 | 无 | 提名广场。`scope=week`（本周一桶，与配额对齐）或 `all`（终身 SUM） |

## 片库叠票 POST 流程

1. 限流 `vote:ip 30/min`。
2. `resolveIdentity` → 401 若无身份。
3. `clampAddVotes(count, remainingVotes)` → 429 `quota_exceeded` / 400 `bad_request`。
4. 影片存在（404）。
5. `filmVoteGate`：`screened` → 409 `already_screened`；`frozen` → 409 `frozen`。
6. upsert `film_week_votes`（`identity_id, film_id, week_start`）`count += n`。
7. `bumpQuota(identityId, 'vote', n)`。
8. 200 `{ ok, count }`。

撤票：本周该片 count −1；减到 0 则删行；`unbumpQuota(..., 1)`。

## 错误码

| 码 | 值 |
|---|---|
| 400 | `bad_request` / `note_required` / `note_too_long` / `film_required` / `option_not_in_round` |
| 401 | `identity_required` |
| 404 | `round_not_found` / `option_not_found` / `film_not_found` / `vote_not_found` |
| 409 | `not_voting` / `not_collecting` / `deadline_passed` / `already_voted` / `already_screened` / `frozen` / `already_nominated_this_week` |
| 429 | `rate_limited` / `quota_exceeded` |
| 502 | `vote_failed` / `revoke_failed` |

## 备注

- 投票/提名 `voter_id`/`nominee_identity_id` **永不信任 body**，从 token/cookie 解析。
- 公开站不跑 collecting→voting→revealed；日历才是排期入口，**不**把周榜 #1 cron 写进周六。
- 同一周可把全部 6 票叠到一部片；下周新行；终身 = `SUM(count)`。
- plaza `week` 与配额同一上海周一，不是滚动 7 天。
- 轮次 `UNIQUE(round_id, voter_id, option_id)` 仍给后台用。
