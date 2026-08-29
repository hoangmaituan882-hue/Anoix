# Spec: lib/socialLinks（页脚社交格子）

- 类型: lib 模块
- 路径: `server/lib/socialLinks.js`（+ `socialLinks.test.js`）
- 依赖: 无

## 导出

| 导出 | 说明 |
|---|---|
| isHttpsUrl | 仅接受 `https:` |
| inferSocialIcon | 按 host（x/instagram/youtube/twitch/discord/patreon）再按名称；否则 `Link` |
| presentSocialLink | 无名称或非 https → `null` |
| assembleSocialLinks | `sort_order` 升序 → `{ items }`；空表零格 |
| socialPayload | 后台写入校验：`name_required` / `bad_url` |

## 口径

- 格子数 = 通过校验的行数，不是固定 6。
- 公开 `GET /api/social-links` 只返 `items`；身份拆分不在此。
