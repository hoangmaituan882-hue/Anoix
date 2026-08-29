# Anoix · 项目议程（Agenda）

> TRIGGER 官网复刻 + 放映会选片社区站。本文档只记「全局概览 + 约定 + 待办」，**逐模块细节全部在 [docs/specs/](docs/specs/)（先读 [README](docs/specs/README.md)）**。

## 概览

- **定位**：株式会社 TRIGGER 官网 1:1 复刻 + 选片社区闭环（提名 → 投票 → 入库 → 排期 → 放映 → 参与 → 评分 → 年度回顾）。
- **技术栈**：React 19 + TS + Vite 6 + Tailwind 4 + `motion`；后端 CloudBase PG + Express + 腾讯云 API v3。
- **线上**：`https://ces123-299456-11-1407057491.sh.run.tcloudbase.com`
- **环境**：envId `a213-d4gzgo1mn873d99da`（上海 PG）。

## 文档导航

- **架构 / 表 / API / lib / 前端** → [docs/specs/README.md](docs/specs/README.md)（31 个 spec）。
- 改任何模块后**同步更新对应 spec**（见下方「关键约定」）。

## 部署 & 环境变量

云托管 `ces123`（Dockerfile 构建），GitHub `main` push 自动部署。

| 环境变量 | 状态 |
|---|---|
| `CLOUDBASE_ENV_ID` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` | ✅ 已配 |
| `TMDB_API_KEY` | ✅ 已配（云托管环境变量；勿写入仓库） |

## 待办

**阻塞**
- [x] 补 `TMDB_API_KEY`（themoviedb.org 申请 → 云托管环境变量）。
- [ ] 商品 5 件种子的价格/主图（淘宝加密反爬，后台手动补）。
- [ ] 未来作品上映日期（新吊带袜 / 迷宫饭S2 / 边缘行者2）。

**可选**
- [ ] `@types/react` 类型安全。
- [ ] 放映库卡片上映日期展示（等另一个 AI 停下 FilmsLibraryModal）。

## 路线图（候选）

- [ ] 评论区 · 用户主页 · 选片数据洞察（recharts）· 投票竞猜 · 角色/主创库 · 推荐语点赞

## 关键约定

- **身份**：匿名 = 签名 Cookie `anoix_voter`；登录 = Bearer → `callerIdentity` uid；**永不信任 body 里的身份**。
- **配额**：自然周（周一 00:00 Asia/Shanghai），匿名 1提/2投、登录 3提/6投。
- **权限**：DB RLS（admin 白名单 + `is_admin()`）+ 服务端 `adminGate`。
- **限流**：写接口走 `allowRate`（vote/nom/rsvp/notif/fav/watch/tmdb/admin）。
- **用户编号**：`user_no` 001/002/…（展示用；内部身份仍是 CloudBase uid）。
- **Spec 同步（硬性）**：改功能/模块收尾必同步更新 `docs/specs/*`，否则视为没做完（映射见 [specs README](docs/specs/README.md)）。

## 开发准则（lazy senior developer）

> You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.
>
> Before writing any code, stop at the first rung that holds:
> - Does this need to be built at all? (YAGNI)
> - Does it already exist in this codebase? Reuse the helper / util / pattern already here, don't re-write it.
> - Does the standard library already do this? Use it.
> - Does a native platform feature cover it? Use it.
> - Does an already-installed dependency solve it? Use it.
> - Can this be one line? Make it one line.
> - Only then: write the minimum code that works.
>
> The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.
>
> **Bug fix = root cause, not symptom**: a report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.
>
> Rules:
> - No abstractions that weren't explicitly requested.
> - No new dependency if it can be avoided.
> - No boilerplate nobody asked for.
> - Deletion over addition. Boring over clever. Fewest files possible.
> - Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a bug waiting to happen.
> - Question complex requests: "Do you actually need X, or does Y cover it?"
> - Pick the edge-case-correct option when two stdlib approaches are the same size; lazy means less code, not the flimsier algorithm.
> - Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a comment naming the ceiling and the upgrade path.
> - Not lazy about: understanding the problem (read it fully + trace the real flow before picking a rung), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs, anything explicitly requested.
> - Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind — the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.