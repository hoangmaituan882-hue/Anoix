# Anoix · 项目议程（Agenda）

> TRIGGER 官网复刻 + 放映会选片社区站。本文档记录项目状态、已完成能力、部署信息与后续路线图。

## 1. 项目概览

- **定位**：株式会社 TRIGGER 官网 1:1 复刻，叠加完整「选片社区」玩法：提名库 → 投票 → 入库 → 排期 → 放映 → 参与 → 观影评分 → 年度回顾。
- **技术栈**：React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + `motion` + react-router-dom 7 + shadcn/ui + `masonic` + `react-day-picker`。
- **后端**：CloudBase（PostgreSQL + 身份认证）+ Express（`server/`）+ 腾讯云 API v3（用户管理 / TMDB 刮削 / 云托管配置）。
- **线上**：`https://ces123-299456-11-1407057491.sh.run.tcloudbase.com`
- **环境**：CloudBase envId `a213-d4gzgo1mn873d99da`（上海 · PG 模式 · 个人版）。

## 2. 部署与环境变量

云托管服务 `ces123`（容器型，Dockerfile 构建），GitHub `main` 推送即自动部署。

| 环境变量 | 状态 |
|---|---|
| `CLOUDBASE_ENV_ID` | ✅ 已配 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | ✅ 已配（2026-08 更新过密码；服务端 PG admin 会话） |
| `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` | ✅ 已配（腾讯云 API v3） |
| `TMDB_API_KEY` | ⚠️ **未配**（TMDB 刮削提名当前 503） |

## 3. 已完成能力（全部已上线）

| 模块 | 说明 |
|---|---|
| 内容展示 | 作品 / 新闻 / 周边 / 媒体 / 放映会 / 历史 |
| 选片主线 | 提名库 + 持续提名 + 轮次(6 态) + 多票投票 + 周配额 + 广场(瀑布流/排行) + 封面流动轮播 |
| 排期 | 后台勾选入库(可逆) + 排期(待定/日历/下周六) + 一场多片 + 放映日历页 `/calendar` |
| 统计 | 后台统计面板（谁提名 / 谁投票 / 人数） |
| 用户管理 | 后台 CRUD + 角色 + 封禁 + 顺序编号 `user_no`(001…) + 注册时间 |
| 个人系统 | 资料 / 改密 / 我的投票与提名 / 收藏 / 观影记录 / 年度回顾(5 幕) |
| 社区互动 | 通知铃铛 + 收藏 + 放映会参与(rsvp) + 观影评分(五星) + 短评 + 批量标记已看 |
| 全站搜索 | ⌘K Command Palette（作品 / 新闻 / 放映会） |
| 商品 | 周边商品 DB 化 + 淘宝链接 + 后台 GoodsAdmin CRUD（5 件种子已入库） |
| 动效 | View Transitions（右滑入 + 圆形扩散 + 共享元素 morph）+ motion 微交互 |
| 交互 | 右键上下文菜单 + 撤票 + 配额进度条 + live 倒计时 + Toast 统一 |
| 弹窗 | 作品详情弹窗（Esc / 上一部下一部 / 收藏 / 评分）+ 作品库返回修复 |
| 数据 | 作品上映日期 `release_date` + 用户注册时间 `registered_at` |

## 4. 部署历史（最近）

| commit | 内容 | deploy |
|---|---|---|
| `65d4fd4` | P1-P5 提名库/排期/统计 | 022 |
| `a694a62` | Round 4 通知/收藏/日历 | 023 |
| `df449b9` | Round 5 参与/观影/搜索/回顾 + 商品 + 弹窗 | 025 |
| `7e8066d` | 上映日期/注册时间/uid 001 | 026 |
| `5ed1b0e` | 忽略设计导出目录 | — |

## 5. 当前状态

- **我的工作**：✅ 全部提交 + 部署 + 冒烟通过。
- **构建健康**：`tsc` + `vite build` 全绿（3251 模块）。
- **另一个 AI 的前端 WIP**：🔄 未提交（泛式 rebrand + credentials/credits/ranking + CalendarPage 大改等 44 项），编译构建干净，待其完成后统一审查 + 提交。

## 6. 待办事项

### 阻塞项
- [ ] **补 `TMDB_API_KEY`**：去 themoviedb.org 申请 key，配到云托管环境变量，否则「TMDB 刮削提名」返回 503。
- [ ] **商品价格/主图**：淘宝 5 件种子商品价格加密、主图懒加载反爬，需后台手动补齐。
- [ ] **未来作品上映日期**：新吊带袜 / 迷宫饭S2 / 边缘行者2 待定。

### 可选
- [ ] 补 `@types/react`，获得真正的类型安全。
- [ ] 放映库卡片展示上映日期（等另一个 AI 停下 FilmsLibraryModal 后再动）。

## 7. 路线图（下一轮候选）

- [ ] 评论区（作品/放映会）
- [ ] 达人榜 / 成就（已有 mock 的 LeaderboardModal，待接真实数据）
- [ ] 用户主页（公开个人页）
- [ ] 选片数据洞察页（recharts）
- [ ] 投票预测竞猜
- [ ] 角色 & 主创数据库（长期内容工程）
- [ ] 点赞推荐语 / 社交分享

## 8. 关键约定

- **身份模型**：匿名 = 签名 Cookie（`anoix_voter`）；登录 = 访问令牌 → uid（`callerIdentity`）。
- **配额**：自然周（周一 00:00 Asia/Shanghai）重置；匿名 1 提名 / 2 投票，登录 3 提名 / 6 投票。
- **权限边界**：RLS（`user_roles` admin 白名单 + `is_admin()` security-definer 函数）+ 服务端 `adminGate`。
- **TMDB 代理**：已对全民开放（限流 20/min），仅刮削进提名库（受周提名配额约束）。
- **写接口限流**：vote/tmdb/admin/rsvp/fav/watch/notif 均走 `allowRate`（clientIp 维度）。
- **用户编号**：`user_roles.user_no` 顺序 001/002/…，`nextUserNo()` 在创建用户时自动分配（不替换 CloudBase uid 内部身份）。
