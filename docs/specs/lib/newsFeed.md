# Spec: lib/newsFeed（首页最新动态可见性）

- 类型: lib 模块
- 路径: `server/lib/newsFeed.js`（+ `newsFeed.test.js`）；前端 `src/lib/newsFeed.ts` 再导出
- 依赖: 无（纯函数）

## 导出

| 导出 | 说明 |
|---|---|
| isHomepageNews | 草稿/归档不进首页；无 `published_at` 时仅 `published`；有时间戳则 `published_at <= now`（定时到点即可见，无需 cron） |
| homepageNews | 过滤后再 **置顶优先**，同组按 `sort_order` 升序。`GET /api/news` 与后台预览共用 |
| applyHomepageReorder | 首页预览拖动：丢进当前置顶区则置顶，拖到其后则取消置顶，并重写 `sort_order` 0..n |
| presentNewsItem | PG 行 → 前台 `NewsItem`；无标题则 `null` |

## 口径

- 首页 NEWS **区块始终展示**，没有整块开关。空列表时区块仍在，只是没有条目。
- 置顶只影响条目顺序，不隐藏整块。
