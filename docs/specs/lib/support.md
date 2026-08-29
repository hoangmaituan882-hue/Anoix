# Spec: 支撑模块（auth / tcapi / tmdb）

- 类型: 独立支撑模块（不依赖 lib）
- 路径: `server/auth.js` `server/tcapi.js` `server/tmdb.js`

## auth.js — 匿名身份 + 限流

| 导出 | 说明 |
|---|---|
| VOTE_COOKIE | `'anoix_voter'` |
| signVoterId / verifyVoterId | HMAC 签名 / 校验匿名投票 id |
| issueVoterCookie | 下发签名 Cookie |
| parseCookies / resolveVoterId | 解析 Cookie / 取投票 id |
| allowRate | `(key, limit, windowMs)` 内存限流 |
| clientIp | `(req)` 取客户端 IP |

## tcapi.js — 腾讯云 API v3

| 导出 | 说明 |
|---|---|
| tcEnabled | 是否配置了 SecretId/Key |
| tcRequest | `(action, params, region='ap-shanghai')` TC3-HMAC-SHA256 签名请求 |

- 服务：`tcb`(2018-06-08，用户管理) + `tcbr`(2022-02-17，云托管)。
- 抛错带 `.code`/`.message`/`.status`（供 errorHandler 用）。

## tmdb.js — TMDB 刮削代理

| 导出 | 说明 |
|---|---|
| tmdbRouter | `express.Router()`，挂载于 `/api/tmdb`（前置 `tmdbGate` 限流 20/min） |

- 用途：提名时按 `tmdbId` 刮削影片元数据（标题/海报/简介/导演/年份）。
- 依赖 `TMDB_API_KEY`（云托管 EnvParams / 本地 `.env`，不进 git）。