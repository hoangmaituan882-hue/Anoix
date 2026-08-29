# Spec: 客户端数据层（Client State & Repositories）

- 类型: 客户端数据层 / 架构基建
- 路径: `src/lib/`
- 状态: 已上线

## 目的
为前端各功能与页面提供统一、类型安全、响应式的数据访问层。接口失败时壳数据为空，不回落 TRIGGER 种子。

## 结构 / 模块职责

| 模块 | 路径 | 职责 |
|---|---|---|
| `repository` | `src/lib/repository.ts` | 站点壳：`news` / `goods` / 静态 hero；**启动不拉全量 films** |
| `catalog` | `src/lib/catalog.ts` | 片库：`featured()` / `list()` / `get()`；卡片 `mapFilmCard`，详情 `mapFilmDetail` |
| `api` | `src/lib/api/client.ts` | 统一 `/api` fetch：Bearer + `credentials:include` + JSON 错误 |
| `community` | `src/lib/community.ts` | 社区交互 API Client |
| `nominations` | `src/lib/nominations.ts` | 配额、提名、广场、片库叠票 `vote` / `unvote` / `myVotes` |
| `session` / `cloudbase` | `src/lib/session.ts` / `src/lib/cloudbase.ts` | 腾讯云 CloudBase 认证接入，提供用户登录、注册、登出、会话持久化与 AccessToken 获取 |
| `pgAdmin` / `poolAdmin` / `adminUsers` | `src/lib/pgAdmin.ts` 等 | 管理后台直连 PostgREST 与管理员业务 API 的数据访问模块 |
| `channel` | `src/lib/channel.ts` | 首页官方频道：`GET /api/channel`、后台 `POST /api/admin/channel/resolve` |
| `social` | `src/lib/social.ts` | 页脚社交：`GET /api/social-links`、后台增删改排 |
| `newsFeed` | `src/lib/newsFeed.ts` | 再导出首页动态过滤/排序，后台预览与 `GET /api/news` 同口径 |
| `me` | `src/lib/me.ts` | 个人资料、改密、`/api/me/stats` |
| `ranking` | `src/lib/ranking.ts` | 全站已看时长榜 `GET /api/ranking` |
| `filmPreview` / `newsPreview` / `worksModal` | `src/lib/filmPreview.ts` / `src/lib/newsPreview.ts` / `src/lib/worksModal.ts` | 跨页面/跨组件的轻量级事件总线订阅器 |

## 数据流与响应式机制

```
┌────────────────────────────────────────────────────────┐
│     UI：FilmsSection / FilmsLibraryModal / ⌘K          │
│     catalog.featured() / catalog.list() / catalog.get()│
└───────────────────────────▲────────────────────────────┘
                            │ GET /api/films/featured & ?q&limit
┌───────────────────────────┴────────────────────────────┐
│  repository.refresh() 拉 /api/news + /api/goods + /api/social-links │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│            CloudBase API / PostgreSQL 数据库            │
└────────────────────────────────────────────────────────┘
```

### 调用的后端 API

| 模块 | 端点范围 | 说明 |
|---|---|---|
| `repository` | `/api/news`, `/api/goods`, `/api/social-links` | 站点壳；启动不拉片库 |
| `catalog` | `/api/films/featured`, `/api/films?…`, `/api/films/:id` | 首页 reel 与分页片库 |
| `api` | `/api/*` | 统一客户端 |
| `community` | `/api/calendar`, `/api/notifications`, `/api/watch`, `/api/favorites`, `/api/rsvp`, `/api/me/year-review`, `/api/screenings/upcoming` | 社区业务与用户自读数据 |
| `nominations` | `/api/quota`, `/api/nominations`, `/api/nominations/plaza`, `/api/vote`, `/api/vote/mine`, `/api/me/activity` | 选片、叠票与周配额 |
| `ranking` | `/api/ranking` | 全站社内已看时长榜；可选 Bearer 填 `me` |
| `pgAdmin` | `/v1/rdb/rest/v1/*` | 管理员直连 PostgREST（带 Bearer admin token） |

## 错误处理与容灾设计

1. **失败给空**：`repository` 启动为空；`/api/news` 与 `/api/social-links` 失败不回落 TRIGGER 种子。
2. **统一请求封装 (`api<T>`)**：`src/lib/api/client.ts` 附加 Bearer 与 `credentials:include`；非 200 时提取 `{ error }`。
3. **事件总线解耦**：全局弹窗唤起（如 `openFilmPreview`, `openNewsPreview`, `openSearch`）通过闭包注册与 `window.dispatchEvent` 实现，避免通过 Context 层层透传 Props。

## 边界与备注

- **SSR / SPA 兼容**：所有 Browser API（`window`, `localStorage`）均包含安全防御性检查。
- **Token 刷新**：CloudBase SDK 在底层自动处理 AccessToken 的续期。
