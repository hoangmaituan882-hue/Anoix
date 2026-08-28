# Spec: 片尾名单与点数（Credits Sheet & Ledger）

- 类型: 前端组件
- 路径: `src/features/credits/CreditsDropdown.tsx` / `src/features/credits/CreditsSheetModal.tsx`
- 状态: 已上线

## 目的
管理影迷社区贡献点数（Credits / 制片人点数体系），支持查看点数收支明细账单、快速充值赞助档位与特权兑换。

## 结构 / 组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `CreditsSheetModal` | `src/features/credits/CreditsSheetModal.tsx` | 全局侧边抽屉组件，支持通过 `openCreditsModal(tab)` 唤起，包含充值赞助 (`topup`) 与账单明细 (`usage`) 两大面板 |
| `CreditsDropdown` | `src/features/credits/CreditsDropdown.tsx` | 导航栏快捷下拉浮窗，显示点数余额、等级徽章与最近 3 笔流水摘要 |

## 数据 / 状态

### 依赖数据层
- `src/lib/session.ts`（用户身份与权限）
- `src/lib/community.ts`（社区互动）

### 调用的后端 API
- 当前为客户端点数模型与模拟结算通道（⚠️ 真实支付网关与点数持久化列入后续路线图）。

### 关键状态
- `open: boolean`: 抽屉开启状态。
- `activeTab: 'topup' | 'usage'`: 当前激活 Tab。
- `balance: number`: 当前点数余额。
- `selectedTier: number`: 选中的赞助充值档位（入门礼包 / 热门推荐 / VIP 制片人）。
- `selectedPayMethod: 'wechat' | 'alipay' | 'apple'`: 支付方式选择。
- `isProcessing: boolean`: 支付/兑换中状态。

## 交互

1. **全局事件唤起**：任何组件均可调用 `openCreditsModal('topup' | 'usage')` 从屏幕右侧平滑滑出抽屉（`SPRING_PANEL` 物理弹性曲线）。
2. **模拟支付结算**：选择档位与支付方式后点击确认，展示进度微动画并触发成功 Toast。
3. **明细账本筛选**：支持按放映预约、大赏投票加权、会员重置分类查看流水增减。

## 边界与备注

- **充值结算性质**：目前点数系统为社区积分与模拟充值体验（⚠️ 待确认后续是否接入正式商业支付渠道）。
