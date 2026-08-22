# Anoix · 放映会档案站

基于 TRIGGER 官网视觉体系构建的放映会电影动画「记录 / 展示 / 提名」网站。

## 线上地址

- 前台:https://anoix-a213-d4gzgo1mn873d99da.webapps.tcloudbase.com
- CloudBase 环境:`a213-d4gzgo1mn873d99da`(上海 · PG 模式)
- 控制台:https://tcb.cloud.tencent.com/dev?envId=a213-d4gzgo1mn873d99da

## 技术栈

- **前端**:React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + motion + react-router
- **后端**:CloudBase(PostgreSQL + RLS 行级权限 + 静态托管)
- **数据模型**:`films` / `news` / `screenings` / `nomination_rounds` / `nomination_options` / `votes` / `user_roles`(见 `migrations/`)

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # tsc 类型检查
npm run build      # 生产构建 → dist/
```

## 部署

本地构建后通过 CloudBase 部署(serviceName: `anoix`):

```
npm run build
# MCP manageApps deployApp(serviceName=anoix, framework=static, buildPath=dist, installCmd="", buildCmd="")
```

SPA 路由回退已通过 `setWebsiteDocument(index/error = index.html)` 配置;
`/films/:id` 直刷由客户端路由接管。

## 目录结构

```
src/
  app/          # 应用外壳、路由、页面
  components/   # ui/(通用原语) layout/(页眉页脚)
  features/     # films/ news/ goods/ media/ about/ 按领域分组
  lib/          # motion.ts(动画token) repository.ts(数据入口)
  types/        # 领域类型
  data/         # 静态种子数据
migrations/     # CloudBase PG 版本化迁移
```
