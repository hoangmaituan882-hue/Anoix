# Spec: 达人榜与放映排位（Ranking & Leaderboard）

- 类型: 前端组件
- 路径: `src/features/ranking/`
- 状态: 已上线

## 目的
呈现放映会社区的影迷活跃度排行榜、观影时长榜、连续打卡榜，并在顶栏下拉与个人中心提供即时排名与段位徽章展示。

## 结构 / 组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `LeaderboardModal` | `src/features/ranking/LeaderboardModal.tsx` | 全站放映达人榜大弹窗，支持通过 `openLeaderboardModal()` 唤起，支持多维度榜单切换与个人悬浮卡 |
| `RankingDropdown` | `src/features/ranking/RankingDropdown.tsx` | 导航栏快捷悬浮下拉菜单，快速查看 Top 3 领跑者与当前位次 |
| `ScreeningStandingCard` | `src/features/ranking/ScreeningStandingCard.tsx` | 个人中心内嵌的排位段位卡片，展示勋章、当前位次、放映时长与升级进度条 |

## 数据 / 状态

### 依赖数据层
- `src/lib/session.ts`（获取当前用户信息）
- `src/lib/community.ts`（观影总数据）

### 调用的后端 API
- 当前内置 `MOCK_LEADERBOARD` 种子数据（⚠️ 待接后端真实排位聚合接口 `/api/ranking`）。

### 关键状态
- `open: boolean`: 弹窗开闭状态。
- `activeTab: 'all' | 'monthly' | 'marathon'`: 榜单维度（总榜 / 月度达人 / 连映马拉松）。

## 交互

1. **冠亚季军高光视效**：前三名分别赋予金色皇冠 (`#ff3650`)、银色奖牌 (`#e0fe3d`)、铜色奖牌 (`#ff9900`) 与光晕背景。
2. **个人席位悬浮吸底**：当前登录用户的排位卡片常驻悬浮于弹窗底部，并标注当前排名与打卡天数。
3. **一键战报分享**：点击分享按钮将个人排名与勋章复制到剪贴板。

## 边界与备注

- **数据源迁移**：目前为前端静态模拟达人榜，已预留 `LeaderboardUser` 接口契约，待后端数据聚合上线后可直接对接。
