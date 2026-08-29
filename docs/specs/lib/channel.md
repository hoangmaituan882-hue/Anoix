# Spec: lib/channel（官方频道链接解析）

- 类型: lib 模块
- 路径: `server/lib/channel.js`（+ `channel.test.js`）
- 依赖: 无（`resolveVideoMeta` 可注入 `fetch`）

## 导出

| 导出 | 说明 |
|---|---|
| parseVideoUrl | 识别 Bilibili BV/av、b23 短链、YouTube watch/short/youtu.be；其余为 `other` |
| youtubeThumbnail | `https://i.ytimg.com/vi/{id}/hqdefault.jpg` |
| formatDuration | 秒 → `M:SS` / `H:MM:SS` |
| presentChannelItem | PG 行 → 公开卡片；封面 `http` 升为 `https` |
| assembleChannel | `{ hubUrl, items }` |
| resolveVideoMeta | YouTube oembed + 本地封面；Bilibili `x/web-interface/view` 取 title/pic/duration |

## 备注

- 首页不站内播放，卡片 `url` 新标签打开。
- 短链 `b23.tv` 先 follow 再 parse。
