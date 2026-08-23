# Anoix · 项目议程（Agenda）

> TRIGGER Inc. 官网复刻 + 放映会选片社区站。本文档记录项目状态、已完成能力、本地待提交改动与后续路线图。

## 1. 项目概览

- **定位**：株式会社 TRIGGER 官网 1:1 复刻，叠加「放映会选片」社区玩法（提名 / 投票 / 广场 / 我的活动）。
- **技术栈**：React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + `motion` + react-router-dom 7 + shadcn/ui。
- **后端**：CloudBase（PostgreSQL + 身份认证）+ Express（`server/`）+ 腾讯云 API v3（用户管理 / TMDB 刮削）。
- **线上**：`https://ces123-299456-11-1407057491.sh.run.tcloudbase.com`
- **环境**：CloudBase envId `a213-d4gzgo1mn873d99da`（上海 · PG 模式 · 个人版）。

## 2. 部署与环境变量

云托管服务 `ces123`（容器型，Dockerfile 构建），GitHub `main` 推送即自动部署。

| 环境变量 | 状态 |
|---|---|
| `CLOUDBASE_ENV_ID` | ✅ 已配 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | ✅ 已配（服务端 PG admin 会话） |
| `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` | ✅ 已配（腾讯云 API v3：用户管理 / TMDB 刮削） |
| `TMDB_API_KEY` | ⚠️ **未配**（TMDB 刮削提名当前 503） |

## 3. 已完成能力

| 模块 | 说明 | 状态 |
|---|---|---|
| 内容展示 | 作品 / 新闻 / 周边 / 媒体 / 放映会 / 历史 | ✅ 线上 |
| 选片投票 | 管理员建轮次 + 用户多票投票（周配额） | ✅ 线上 |
| 用户管理 | 后台 CRUD + 角色 + 封禁（走腾讯云 API v3） | ✅ 线上 |
| 个人系统 | 资料 / 改密 / 我的投票与提名（Tab + 右抽屉） | ✅ 线上 |
| shadcn/ui | 组件库集成（Button/Input/Badge/Sheet/Tabs/...） | ✅ 线上 |
| View Transitions | 页面右滑入 + 主题圆形扩散 + 海报共享元素 | 🔄 本地待推 |

## 4. 当前本地未提交改动（11 个文件，未 push）

> 攒了一大批，等待一次性提交推送。

| 文件 | 改动 |
|---|---|
| `src/app/App.tsx` | `/plaza` 重定向到 `/nominations` |
| `src/app/pages/NominationsPage.tsx` | **合并提名广场 + 轮次**；三层提名入口；hover 动效 |
| `src/app/pages/FilmDetailPage.tsx` | 共享元素 + viewTransition |
| `src/app/pages/HistoryPage.tsx` | viewTransition |
| `src/app/pages/ScreeningsPage.tsx` | viewTransition |
| `src/components/layout/Header.tsx` | 下拉菜单固定宽度修复 + viewTransition + 去 plaza 入口 |
| `src/components/ui/ThemeToggle.tsx` | 主题圆形扩散（VT） |
| `src/features/films/FilmDetailBody.tsx` | 共享元素 prop |
| `src/features/films/FilmDetailModal.tsx` | 共享元素 + viewTransition |
| `src/features/nominations/NominateDialog.tsx` | `initialFilmId` 预选 |
| `src/index.css` | View Transitions CSS（右滑入 + 圆形扩散） |

## 5. 待办事项

### 阻塞项
- [ ] **补 `TMDB_API_KEY`**：去 themoviedb.org 申请 key，配到云托管环境变量，否则「TMDB 刮削提名」返回 503。

### 下一步
- [ ] **一次性提交推送**：把上面 11 个文件 + `migrations/20260825000000_nomination_quota_and_plaza.sql` 一起 commit + push，触发一次部署验证。
- [ ] 上线冒烟：合并后的 `/nominations`、三层提名入口、多票、广场、我的活动、VT 动效。

## 6. 路线图（可选后续）

- [ ] 共享元素扩展：首页 FilmsSection 海报 → 详情（当前只在详情页相关作品 + 快览弹窗生效）。
- [ ] 提名广场「实时排行」继续打磨（已有轮询 + motion layout + 进度条）。
- [ ] 通知系统（投票揭晓 / 新放映会 / 新作品）。
- [ ] 收藏 / 追番（个人中心「我的收藏」）。
- [ ] 放映会报名 / 购票。
- [ ] 补 `@types/react`，获得真正的类型安全。

## 7. 关键约定

- **身份模型**：匿名 = 签名 Cookie（`anoix_voter`）；登录 = 访问令牌 → uid（`callerIdentity`）。
- **配额**：自然周（周一 00:00 Asia/Shanghai）重置；匿名 1 提名 / 2 投票，登录 3 提名 / 6 投票。
- **权限边界**：RLS（`user_roles` admin 白名单 + `is_admin()` security-definer 函数）+ 服务端 `adminGate`。
- **TMDB 代理**：已对全民开放（限流 20/min），仅刮削进提名库（受周提名配额约束）。
