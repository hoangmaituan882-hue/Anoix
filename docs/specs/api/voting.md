# Spec: voting 路由（投票 / 配额 / 提名）

- 类型: 路由模块
- 路径: `server/routes/voting.js`
- 依赖: `lib/db` `lib/identity` `lib/quota` `auth`

## 端点

| 方法 | 路径 | 鉴权 | 限流 | 说明 |
|---|---|---|---|---|
| GET | /api/nominations | 无 | 无 | 轮次 + 候选 + 影片 join + 实时票数 |
| GET | /api/vote/ticket | 无 | 无 | 签发匿名投票 Cookie |
| POST | /api/vote | 必选 | vote 30/min | 投一票（多票制，配额内） |
| GET | /api/vote?roundId= | 可选 | 无 | 本人投票状态 `{voted,optionIds}` |
| DELETE | /api/vote | 必选 | vote 30/min | 撤票（回退配额） |
| GET | /api/quota | 可选 | 无 | 周配额（匿名给默认额度） |
| POST | /api/nominations | 必选 | nom 20/min | 持续提名 → 提名池（不入轮次） |
| POST | /api/nominations/:roundId/nominate | 必选 | nom 20/min | 提名进指定轮次（collecting 态） |
| GET | /api/nominations/plaza | 无 | 无 | 提名广场（聚合提名数 + 票数） |

## 投票 POST 流程（写操作须按此顺序）

1. 字段校验（roundId 非空、optionId 正整数）。
2. 限流 `vote:ip 30/min`。
3. `resolveIdentity` → 401 若无身份。
4. `quotaInfo` → 429 `quota_exceeded` 若剩余为 0。
5. 校验轮次存在（404）、`status=voting`（409）、deadline 未过（409）。
6. 校验候选 `option_id`（404）+ 属于该轮次（400 `option_not_in_round`）。
7. `pgWrite('POST','/votes')` → 409 `already_voted`（UNIQUE 防重复）、502 其他。
8. `bumpQuota(identityId,'vote')`。

## 错误码

| 码 | 值 |
|---|---|
| 400 | `bad_request` / `note_required` / `note_too_long` / `film_required` / `option_not_in_round` |
| 401 | `identity_required` |
| 404 | `round_not_found` / `option_not_found` / `film_not_found` / `vote_not_found` |
| 409 | `not_voting` / `not_collecting` / `deadline_passed` / `already_voted` |
| 429 | `rate_limited` / `quota_exceeded` |
| 502 | `vote_failed` / `revoke_failed` |

## 备注

- 投票/提名 `voter_id`/`nominee_identity_id` **永不信任 body**，从 token/cookie 解析。
- 多票制：`UNIQUE(round_id, voter_id, option_id)`，同一人选多项互不冲突。
- 提名 source：library（片库）/ tmdb（刮削）/ user（持续提名）。
- plaza scope：`week`（默认，近 7 天）/ `all`。