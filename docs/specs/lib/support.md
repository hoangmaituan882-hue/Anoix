# Spec: 支撑模块（auth / tcapi / tmdb / bangumi）

- 类型: 独立支撑模块（不依赖 lib）
- 路径: `server/auth.js` `server/tcapi.js` `server/tmdb.js` `server/bangumi.js`

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

## bangumi.js — Bangumi（bgm.tv）刮削代理

| 导出 | 说明 |
|---|---|
| bangumiRouter | `express.Router()`，挂载于 `/api/bangumi`（前置 `bangumiGate` 限流 20/min） |

- 端点：`GET /api/bangumi/search?q=`（POST 搜 subjects，type 2 动画 + 6 真人）；`GET /api/bangumi/detail/:id`。
- 用途：动画/番剧的刮削补充（TMDB 对冷门番/小众片覆盖差时用）。
- 反代：`BANGUMI_API_BASE_URL`（默认 `https://bgmapi.anibt.net`）、`BANGUMI_IMAGE_BASE_URL`（默认 `https://bgmimg.anibt.net`）。
- 需要非空 `User-Agent`（bgm API 要求）。