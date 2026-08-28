# Spec: 客户端数据层（Client State & Repositories）

- 类型: 客户端数据层 / 架构基建
- 路径: `src/lib/`
- 状态: 已上线

## 目的
为前端各功能与页面提供统一、类型安全、响应式且具备离线静态兜底能力的数据访问层，包含内存状态订阅仓储 (`repository`)、用户会话 (`session`)、社区互动 (`community`)、选片系统 (`nominations`) 与管理端直连 SDK (`pgAdmin`)。

## 结构 / 模块职责

| 模块 | 路径 | 职责 |
|---|---|---|
| `repository` | `src/lib/repository.ts` | 核心单例仓储，管理 `films` / `news` / `goods` / `youtube` / `social` 内存缓存，基于 `useSyncExternalStore` 实现组件无损重渲染；`refresh()` 静默拉取服务端数据并热替换 |
| `community` | `src/lib/community.ts` | 社区交互 API Client，封装观影打分、收藏夹、放映 RSVP、消息通知、放映日历与年度回顾 |
| `nominations` | `src/lib/nominations.ts` | 选片业务专有 Client，包含自然周配额查询、提名提交、广场排行榜与个人活动明细 |
| `session` / `cloudbase` | `src/lib/session.ts` / `src/lib/cloudbase.ts` | 腾讯云 CloudBase 认证接入，提供用户登录、注册、登出、会话持久化与 AccessToken 获取 |
| `pgAdmin` / `poolAdmin` / `adminUsers` | `src/lib/pgAdmin.ts` 等 | 管理后台直连 PostgREST 与管理员业务 API 的数据访问模块 |
| `me` | `src/lib/me.ts` | 个人资料维护与改密 API |
| `filmPreview` / `worksModal` | `src/lib/filmPreview.ts` / `src/lib/worksModal.ts` | 跨页面/跨组件的轻量级事件总线订阅器 |

## 数据流与响应式机制

```
┌────────────────────────────────────────────────────────┐
│               UI 组件 (e.g. FilmsSection)              │
│       const films = useRepo(repository.films);         │
└───────────────────────────▲────────────────────────────┘
                            │ useSyncExternalStore 订阅
┌───────────────────────────┴────────────────────────────┐
│              Single Repository Cache (内存)            │
│  - 初始态: 静态种子 (triggerData.ts) -> 首屏瞬间直出   │
│  - 远端刷新: repository.refresh()                      │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP GET /films, /news, /goods
┌───────────────────────────┴────────────────────────────┐
│            CloudBase API / PostgreSQL 数据库            │
└────────────────────────────────────────────────────────┘
```

### 调用的后端 API

| 模块 | 端点范围 | 说明 |
|---|---|---|
| `repository` | `/films`, `/news`, `/api/goods` | 基础公开只读数据，15s 服务端缓存 |
| `community` | `/api/calendar`, `/api/notifications`, `/api/watch`, `/api/favorites`, `/api/rsvp`, `/api/me/year-review` | 社区业务与用户自读数据 |
| `nominations` | `/api/quota`, `/api/nominations`, `/api/nominations/plaza`, `/api/me/activity` | 选片与周配额系统 |
| `pgAdmin` | `/v1/rdb/rest/v1/*` | 管理员直连 PostgREST（带 Bearer admin token） |

## 错误处理与容灾设计

1. **静态种子极速兜底**：若网络离线或 CloudBase 服务端异常，`repository` 自动保持静态数据状态，全站不会白屏。
2. **统一请求封装 (`request<T>`)**：自动附加 `Authorization: Bearer <token>` 请求头；响应非 200 时自动提取后端返回的 `{ error: string }` 并转换为规范的 JavaScript `Error`。
3. **事件总线解耦**：全局弹窗唤起（如 `openFilmPreview`, `openSearch`）通过闭包注册与 `window.dispatchEvent` 实现，避免通过 Context 层层透传 Props。

## 边界与备注

- **SSR / SPA 兼容**：所有 Browser API（`window`, `localStorage`）均包含安全防御性检查。
- **Token 刷新**：CloudBase SDK 在底层自动处理 AccessToken 的续期。
