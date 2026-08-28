# Spec: 通用组件与动效系统（Common UI & Motion System）

- 类型: 通用组件库 / 动效规范
- 路径: `src/components/` / `src/lib/motion.ts` / `src/lib/ease.ts` / `src/styles/transitions.css`
- 状态: 已上线

## 目的
提供 Anoix 全站统一的布局外壳、通用 UI 原语、TRIGGER 品牌矢量资产、物理弹簧动效规范与 View Transitions 视图过渡基建。

## 结构 / 模块划分

### 1. 布局组件（`src/components/layout/`）

| 组件 | 路径 | 职责 |
|---|---|---|
| `Header` | `src/components/layout/Header.tsx` | 浮动三栏毛玻璃顶栏 (`max-w-[1720px]`, `backdrop-blur-md`)，集成矢量 Logo、快速导航、搜索入口、通知铃铛、多语言与用户下拉菜单 |
| `Footer` | `src/components/layout/Footer.tsx` | 底部版权声明、株式会社 TRIGGER 官方社媒外链与备案信息 |
| `PageHero` | `src/components/layout/PageHero.tsx` | 二级页面统一的大标题 Hero 区块与面包屑 |

### 2. 通用 UI 原语（`src/components/ui/`）

| 组件 | 路径 | 职责 |
|---|---|---|
| `DynamicContextMenu` | `src/components/ui/DynamicContextMenu.tsx` | 赛博朋克右键智能上下文菜单（感知作品卡片与全局空白处） |
| `TriggerLogo` | `src/components/ui/TriggerLogo.tsx` | 矢量 SVG 扳机社官方标志，支持 Hover 变色与主题自适应 |
| `Toast` / `ToastProvider` | `src/components/ui/Toast.tsx` | 全局 Toast 容器与 `useToast()` hook（支持 success / error / info） |
| `StatusBadge` | `src/components/ui/StatusBadge.tsx` | 轮次 6 态与放映状态标准化彩色药丸徽章 |
| `ThemeToggle` | `src/components/ui/ThemeToggle.tsx` | 暗黑 / 纸质浅色模式无缝切换器 |
| `ConfirmDialog` | `src/components/ui/ConfirmDialog.tsx` | 模态二次确认弹窗 |
| `VideoModal` | `src/components/ui/VideoModal.tsx` | 统一的 PV 与预告片弹出播放器 |
| `NotFound` | `src/components/ui/NotFound.tsx` | 404 缺省状态与快速返回引导 |
| Radix UI 原语封装 | `button`, `card`, `tabs`, `avatar`, `badge`, `sheet`, `popover`, `dropdown-menu` 等 | shadcn 风格的标准原子组件 |

### 3. 动效组件与系统（`src/components/motion/` & `src/lib/`）

| 动效资产 | 路径 | 职责 |
|---|---|---|
| `TRIGGER_EASE` | `src/lib/motion.ts` | 签名缓动曲线 `[0.16, 1, 0.3, 1]`（快速切入、柔和吸附） |
| Spring 物理系统 | `src/lib/ease.ts` | `SPRING_PRESS` (按压), `SPRING_SWAP` (切换), `SPRING_PANEL` (抽屉), `SPRING_LAYOUT` (胶囊滑块) |
| `transitions.css` | `src/styles/transitions.css` | 涵盖数字弹入、角标 Pop-in、输入溶解清除、错误抖动等 13+ 类动效 Token |
| `AnimatedNumber` | `src/components/motion/AnimatedNumber.tsx` | 数字滚动平滑跳变微动画 |
| `TiltCard` | `src/components/motion/TiltCard.tsx` | 鼠标移动 3D 悬浮视差倾斜 |
| `Marquee` | `src/components/motion/Marquee.tsx` | 跑马灯滚动文本/徽章 |
| `loader.tsx` | `src/components/motion/loader.tsx` | 多形态 Loading 动画（彗星、脉冲等） |

## 关键设计规范

### 1. 色彩与主题 Tokens
- **Dark Mode（默认放映厅赛博）**：基底 `#050505` / `#121212` / `#181818`，文字 `#f5ffe5`（亮黄绿荧光白），强调色 `#ff3650`（扳机赤红）、`#4246ff`（克莱因蓝）、`#e0fe3d`（极光黄）。
- **Light Mode（特种纸质典藏）**：基底 `#f8f7f4` / `#f1efe9`，文字 `#18181b`（高对比墨黑），保护高饱和按钮白字对比度。

### 2. 6 级中文排版尺度
- `.text-page-title` (24px/900)
- `.text-section-title` (18px/700)
- `.text-card-title` (16px/700)
- `.text-body` (14px/400, line-height 1.55)
- `.text-btn` (16px/600)
- `.text-caption` (12px/400)

## 边界与备注

- **View Transitions**：原生调用 `document.startViewTransition`，若浏览器不支持则优雅降级为常规瞬切。
- **无障碍与抗锯齿**：全局启用灰度抗锯齿 (`-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`) 与连字特性。
