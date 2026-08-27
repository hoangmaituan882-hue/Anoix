# Spec: lib/config + lib/db（数据访问层）

- 类型: lib 模块
- 路径: `server/lib/config.js` + `server/lib/db.js`

## config.js — 环境配置（唯一来源）

| 导出 | 说明 |
|---|---|
| ENV_ID | `CLOUDBASE_ENV_ID` |
| ADMIN_USERNAME / ADMIN_PASSWORD | 服务端 PG 会话凭据 |
| PG_BASE | `https://<env>.api.tcloudbasegateway.com/v1/rdb/rest/v1` |
| PORT | `process.env.PORT` 或 8080 |
| DIST_DIR | `../../dist`（静态前端） |
| dbEnabled | `Boolean(ENV_ID && ADMIN_USERNAME && ADMIN_PASSWORD)` |

## db.js — PostgreSQL 访问

| 导出 | 签名 | 说明 |
|---|---|---|
| getAdminToken | `(force=false)` | 登录拿 admin session token，缓存到过期前 60s |
| pgGet | `(path, _retried, _attempt)` | GET，`!ok` 抛错（带 `.status`）；401→重登一次；5xx→退避重试 2 次 |
| pgWrite | `(method, path, body, ...)` | 写，返回 `[status, json]`，不抛 4xx |
| pgUpsert | `(path, body, ...)` | POST + `resolution=merge-duplicates`（原子 upsert） |
| ttlCache | `(ttlMs)` | 内存 TTL 缓存（get/set/clear） |
| contentCache | — | films/news/goods 15s 缓存实例 |

## 备注

- **重试语义**：`_retried`（401 重登）、`_attempt`（5xx 退避 200ms/400ms，最多 2 次）互不干扰。
- Content-type 约定：`pgWrite` 固定 `application/json` + `Prefer: return=representation`；`pgUpsert` 额外 `resolution=merge-duplicates`。
- admin 写走 admin token，RLS 对服务端透明。