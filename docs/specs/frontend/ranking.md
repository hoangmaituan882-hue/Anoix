# Spec: 达人榜与放映排位（Ranking & Leaderboard）

- 类型: 前端组件
- 路径: `src/features/ranking/`
- 状态: 已上线

## 目的

用社内已看时长（与 `/api/me/stats` 同一口径）展示终身榜，导航胶囊、下拉、名人堂弹窗与个人中心卡片读同一 `GET /api/ranking`。

## 结构 / 组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `LeaderboardModal` | `src/features/ranking/LeaderboardModal.tsx` | 终身榜 Top 20 + 底部「你」；由 `Header` 挂载，`openLeaderboardModal()` 唤起 |
| `RankingDropdown` | `src/features/ranking/RankingDropdown.tsx` | 导航胶囊与下拉：Top 3、时长分布、本人位次或登录 CTA |
| `ScreeningStandingCard` | `src/features/ranking/ScreeningStandingCard.tsx` | 个人中心位次卡片 |
| `HoursSpectrum` | `src/features/ranking/HoursSpectrum.tsx` | 26 柱真实小时桶直方图 |

## 数据 / 状态

- `src/lib/ranking.ts`：`fetchRanking()` → `GET /api/ranking`（可选 Bearer）
- 游客：胶囊展示榜首时长 `Top · {h}h`，下拉 Top 3 +「登录查看我的位次」，不造 `#42`
- 登录未上榜：胶囊 `#—`；已上榜：`#n · xh`
- 直方图为真实小时分布；无「本周席位 / 年度 / 本月 / 马拉松」假数据

## 交互

1. 前三名名次底色区分；当前用户在 Top 20 内标注「你」。
2. 登录用户位次卡吸底；游客为登录 CTA。
3. 分享复制本人 `#rank · hours · percentile` 文本（未上榜不造排名）。
