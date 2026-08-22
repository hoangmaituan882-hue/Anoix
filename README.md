# Anoix · 放映会档案站

基于 TRIGGER 官网视觉体系构建的放映会电影动画「记录 / 展示 / 提名」网站。

## 线上地址(唯一入口)

- **网站 + API + 管理后台**:https://ces123-299456-11-1407057491.sh.run.tcloudbase.com
  - `/` 网站 · `/films/:id` 详情 · `/admin` 管理后台
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

## 部署(GitHub Actions 自动部署)

推送到 `main` 分支即自动:类型检查 → 构建前端 → 部署静态托管 + 云托管 API。

首次使用需在 GitHub 仓库配置一个 Secret:

1. 打开仓库 **Settings → Secrets and variables → Actions → New repository secret**
2. Name 填 `TCB_API_KEY`,Value 填 CloudBase API Key(service_role,见下)
3. 之后 `git push` 即自动部署;也可在 **Actions** 页手动触发(workflow_dispatch)

**API Key 获取**:云开发平台 → API Key 管理(或让 AI 助手用 `manageAppAuth createApiKey` 创建)。
⚠️ service_role 密钥只放 GitHub Secrets 和云托管环境变量,不要提交进代码。

相关地址:

- 唯一线上入口(见顶部)——前端、API、后台同域
- 服务端 PG 访问使用管理员会话 token(平台 API Key 签发 bug 的过渡方案,修复后可切回)

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
