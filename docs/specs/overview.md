# Anoix · 架构总览 Spec

> 本文档是 specs 目录的「地图」：描述后端架构、模块依赖、数据流，以及各 spec 文档的分布。

## 1. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite 6 + Tailwind 4 + motion + react-router 7 |
| 后端 | Express（ESM）+ CloudBase PostgreSQL + 腾讯云 API v3 |
| 数据访问 | PostgREST（`/v1/rdb/rest/v1`）+ TC3-HMAC-SHA256（用户管理/云托管） |
| 部署 | CloudBase CloudRun（容器型，GitHub `main` push 自动部署） |

## 2. 后端结构（薄壳 + lib + routes）

```
server/
├── index.js          ← 44 行组装壳（中间件 + 模块注册 + tmdb + static + errorHandler + listen）
├── auth.js           ← 匿名签名 Cookie、限流、clientIp
├── tcapi.js          ← TC API v3 签名请求（tcRequest / tcEnabled）
├── tmdb.js           ← TMDB 刮削代理路由
├── lib/              ← 无副作用 / 纯逻辑层
│   ├── config.js     ← env 集中读取（ENV_ID/PG_BASE/PORT/DIST_DIR/dbEnabled）
│   ├── db.js         ← pgGet / pgWrite / pgUpsert / getAdminToken / contentCache
│   ├── identity.js   ← callerIdentity / resolveIdentity / resolveVoter / adminGate
│   ├── quota.js      ← quotaInfo / bumpQuota / unbumpQuota / QUOTA_LIMITS
│   ├── users.js      ← mapUser / nextUserNo / insertUserRole
│   ├── pure.js       ← 纯函数：weekStartDateString / personaFor / nextUserNoFromList
│   ├── catalog.js    ← 纯函数：featured 排序 / 片库检索 / 周票 clamp
│   ├── meStats.js    ← 纯函数：个人放映账口径
│   ├── channel.js    ← 纯函数：Bilibili/YouTube 链接解析与频道卡片组装
│   ├── ranking.js    ← 纯函数：社内已看时长榜
│   └── middleware.js ← corsMiddleware / securityHeaders / errorHandler
└── routes/           ← HTTP 端点（直接 import lib，无依赖注入）
    ├── content.js    ← /api/health /films /news /screenings /channel /rsvp
    ├── voting.js     ← /api/vote /quota /nominations /plaza
    ├── admin.js      ← /api/admin/*（用户/提名池/排期/统计）
    ├── social.js     ← /api/notifications /favorites /calendar /watch /me/year-review /goods
    ├── me.js         ← /api/me /me/stats /me/password /me/activity
    └── ranking.js    ← /api/ranking
```

## 3. 模块依赖图

```
routes/* ──→ lib/identity.js ──→ lib/users.js ──→ lib/db.js ──→ lib/config.js
        │         │                    │
        │         └── auth.js          └── lib/pure.js
        ├──→ lib/quota.js ──→ lib/db.js + lib/pure.js
        ├──→ lib/db.js
        ├──→ lib/config.js
        └──→ tcapi.js / auth.js
```

- **无循环依赖**：`route → lib（单向）`；`identity → users → db → config`。
- `auth.js`/`tcapi.js`/`tmdb.js` 是独立支撑模块（不依赖 lib）。

## 4. 数据流（写操作示例：投票）

```
前端 POST /api/vote { filmId, count? }
  → voting.js: 限流 → resolveIdentity → clampAddVotes
  → filmVoteGate（已放过 / 仅未来场 / 开放）
  → upsert film_week_votes.count
  → bumpQuota(..., n)
  → 200 { ok, count }
```

## 5. 身份模型

| 身份 | 来源 | identityId | kind |
|---|---|---|---|
| 登录用户 | Bearer token → 网关验证 → JWT `sub` | 账户 uid | `user` |
| 匿名访客 | 签名 Cookie `anoix_voter` | cookie 哈希 | `anon` |

- **voterId/uid 永不信任 body**，只从 token/cookie 解析。

## 6. 权限模型（两层）

1. **DB 层 RLS**：`films/news/screenings/rounds/options/pool/goods` 公开读 + admin 写；`votes` 匿名可插、admin 读；`notifications/favorites/watch_log/rsvps` admin 写 + owner 自读。
2. **服务端 `adminGate`**：限流 + `callerRole(token)` 校验 `role='admin'`，未过返回 401/403。

> 服务端写操作走 **admin session token**（`getAdminToken`），因此 RLS 对服务端透明。

## 7. Spec 文档分布

| 目录 | 内容 |
|---|---|
| `data/` | 每张表的 schema spec（列/约束/RLS/用途） |
| `api/` | 每个路由模块的端点 spec（方法/鉴权/限流/错误码） |
| `lib/` | 每个 lib 模块的导出函数 spec |
| `frontend/` | 前端页面、功能、客户端数据层与组件的 spec（共 12 篇） |

## 8. 关键约定

- 周配额：自然周（周一 00:00 Asia/Shanghai），匿名 1提/2投、登录 3提/6投。
- 写接口限流：`vote 30/min`、`nom 20/min`、`rsvp 20/min`、`notif/fav/watch 30/min`、`tmdb 20/min`、`admin 120/min`。
- 顺序用户编号：`user_no` 001/002/…，`nextUserNo()` + UNIQUE 约束 + 插入重试。
- 内容缓存：无查询的 films/news/goods 15s TTL（服务端内存）；分页列表与 featured 不走该缓存。