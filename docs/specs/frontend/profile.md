# Spec: 个人中心与年度回顾（Profile, Watch Log & Year Review）

- 类型: 前端页面 / 组件
- 路径: `src/app/pages/ProfilePage.tsx` / `src/features/profile/` / `src/features/films/WatchPanel.tsx`
- 状态: 已上线

## 目的
聚合用户的个人身份信息、资料修改（昵称与头像）、密码重置、我的投票与提名记录、收藏夹管理、全量观影足迹（评分与短评），并提供 Spotify-Wrapped 风格的 5 幕沉浸式年度数据回顾。

## 结构 / 组件

| 组件 / 页面 | 路径 | 职责 |
|---|---|---|
| `ProfilePage` | `src/app/pages/ProfilePage.tsx` | 个人中心主页面，包含资料编辑、安全设置、活动记录 Tab、收藏夹与观影足迹 |
| `YearReview` | `src/features/profile/YearReview.tsx` | 全屏 5 幕沉浸式年度回顾（提名贡献、投票参与、观影足迹、五星最爱、年度 Persona 评级） |
| `ActivityDrawer` | `src/features/profile/ActivityDrawer.tsx` | 全局抽屉式「我的活动」侧边栏（通过 `openActivityDrawer()` 唤起），快速查看投票与提名记录 |
| `WatchPanel` | `src/features/films/WatchPanel.tsx` | 针对特定影片打分、写短评或修改历史评价的内嵌表单 |

## 数据 / 状态

### 依赖数据层
- `src/lib/me.ts`（资料与密码修改）
- `src/lib/community.ts`（观影记录、收藏夹、年度回顾）
- `src/lib/nominations.ts`（投票与提名活动）
- `src/lib/session.ts`（登录态维护与登出）

### 调用的后端 API

| 端点 | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/me` | GET | 必选 | 读取个人资料与角色权限 |
| `/api/me` | PATCH | 必选 | 更新昵称与头像 URL |
| `/api/me/password` | POST | 必选 | 修改密码（需校验原密码） |
| `/api/me/activity` | GET | 必选 | 获取本人所有提名与投票明细列表 |
| `/api/favorites` | GET | 必选 | 获取收藏影片列表 |
| `/api/favorites/:filmId` | DELETE | 必选 | 移出收藏夹 |
| `/api/watch` | GET | 必选 | 获取全部观影记录 |
| `/api/watch/:filmId` | PUT / DELETE | 必选 | 保存 / 删除观影评分与短评 |
| `/api/me/year-review?year=` | GET | 必选 | 获取年度观影与社区活跃度汇总数据 |

### 关键状态
- `profile: AdminUser | null`: 用户信息。
- `activity: { votes, nominations } | null`: 个人参与记录。
- `favorites: FavoriteFilm[] | null`: 收藏影片列表。
- `watchLog: WatchItem[] | null`: 观影记录列表。
- `yearReviewOpen: boolean`: 年度回顾全屏弹窗开闭状态。

## 交互

1. **5 幕沉浸式年度回顾**：
   - 背景采用高斯模糊大光斑 (`#ff3650` 与 `#e0fe3d` blur-3xl)。
   - 顶部进度条平滑填充，支持键盘 `←` / `→` 方向键与 `Esc` 键切幕。
   - 数据采用 `AnimatedNumber` 数字滚动跳变，最后一幕支持一键复制年度战报至剪贴板。
2. **观影打分即时响应**：点击 1~5 颗星即时高亮，保存后本地列表与 `watchedMap` 同步刷新。
3. **安全操作二次确认**：退出登录、清空记录等操作带有二次确认。

## 边界与备注

- **访问权限**：未登录用户访问 `/profile` 时会自动拦截并重定向到 `/auth` 登录页。
- **改密约束**：密码长度需至少 6 位，且新密码与确认密码一致。
