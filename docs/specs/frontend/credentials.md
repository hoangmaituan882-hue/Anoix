# Spec: 资历档案（Credentials & Passport）

- 类型: 前端页面 / 组件
- 路径: `src/features/credentials/` / `src/app/pages/CredentialsPage.tsx`
- 状态: 已上线

## 目的
为影迷提供专属的放映会资历档案、影迷身份护照（Community Passport）、放映活跃度热力火焰图（Flame Graph）与 3D 展台分享卡片，量化用户在社区的观影、提名与投票贡献。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `CredentialsPage` | `src/app/pages/CredentialsPage.tsx` | 资历主页面，展示放映等级评级、累计观影时长、展台切换与互动展板 |
| `CredentialsCoverflow` | `src/features/credentials/CredentialsCoverflow.tsx` | 沉浸式 3D 菜谱/放映档案 Coverflow 卡牌轮播，支持 PV 视频弹窗唤起 |
| `CredentialsShareModal` | `src/features/credentials/CredentialsShareModal.tsx` | 影迷护照卡片导出与社交分享弹窗，生成高质量数字勋章与海报二维码 |
| `FlameGraphCard` | `src/features/credentials/FlameGraphCard.tsx` | 活跃度热力火焰图，可视化展示各月份观影与投票参与密集度 |
| `CredentialCard` | `src/features/credentials/CredentialCard.tsx` | 单项资历凭证与成就卡片原子组件 |

## 数据 / 状态

### 依赖数据层
- `src/lib/community.ts`（观影记录、收藏夹）
- `src/lib/catalog.ts` / `src/lib/credentialsCatalog.js`（按 id 解析片库卡片，不读种子 WORKS_LIST）
- `src/lib/nominations.ts`（提名与投票活动流水）
- `src/lib/session.ts`（用户信息与登录态）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/watch` | GET | 必选 | 获取观影明细，计算总时长与评分分布 |
| `/api/me/activity` | GET | 必选 | 获取个人提名与投票历史记录 |
| `/api/films/featured` | GET | 无 | Coverflow 空档用最近放过的卡片填充 |
| `/api/films?limit=` | GET | 无 | featured 不足 5 张时再拉一页列表 |
| `/api/films/:id` | GET | 无 | 观影记录按 id 取海报/预告 |

### 关键状态
- `topTab: 'boards' | 'drops'`: 展板与精选合集切换。
- `coverflowSlides: RiffleRecipeSlide[]`: 3D Coverflow 幻灯片数据集合。
- `statsData: { totalScreenings, totalWatches, avgRating, joinDays, level, percentile, totalHours }`: 资历汇总统计。
- `shareModalOpen: boolean`: 护照分享弹窗状态。

## 交互

1. **3D Coverflow 手势阻尼**：支持桌面鼠标拖拽与触控滑动，配合 `translate3d` 与物理缓动平滑减速。
2. **活跃火焰图悬浮 Tooltip**：鼠标悬停热力色块时显示具体日期、场次与观影条目。
3. **数字护照一键生成与分享**：点击「分享名片」生成包含专属等级徽章、观影总时长、全勤天数的影迷名片，支持一键复制到剪贴板。

## 边界与备注

- **Coverflow 片源**：已看条目用 `catalog.get(film_id)`；不足 5 张用 `featured` / `list`，不再扫 `WORKS_LIST`。
