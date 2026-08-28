# Spec: lib/middleware（跨切面中间件）

- 类型: lib 模块
- 路径: `server/lib/middleware.js`

## 导出

| 导出 | 签名 | 说明 |
|---|---|---|
| corsMiddleware | `(req,res,next)` | 回显请求 origin + Allow-Credentials；OPTIONS 直接 204 |
| securityHeaders | `(req,res,next)` | nosniff / SAMEORIGIN / referrer-policy / dns-prefetch |
| errorHandler | `(err,req,res,next)` | 统一 JSON 错误：读 `err.status`/`err.code`/`err.message` |
| asyncHandler | `(fn) → middleware` | 包 async 处理器，reject 自动 `next(err)`（消 try/catch 样板） |

## 备注

- **CORS**：非 wildcard（回显 origin + `Vary: Origin`），为匿名投票 Cookie 的跨域场景（本地开发）。
- **errorHandler** 是 Express 错误中间件，必须放在所有路由 + static **之后**（现状已如此）。
- 错误码约定：`err.status`（HTTP 码）+ `err.code`（业务码）；5xx 才会带 `message`。