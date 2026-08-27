# Spec: lib/quota（周配额）

- 类型: lib 模块
- 路径: `server/lib/quota.js`

## 导出

| 导出 | 说明 |
|---|---|
| QUOTA_LIMITS | `{ user: { nominations:3, votes:6 }, anon: { nominations:1, votes:2 } }` |
| quotaInfo | `(identityId, kind) → {nominationsUsed, votesUsed, remaining...}` |
| bumpQuota | `(identityId, 'nomination'|'vote')` +1 |
| unbumpQuota | `(identityId, 'nomination'|'vote')` −1（下限 0） |

## 备注

- 周期键：`week_start = weekStartDateString()`（周一 00:00 Asia/Shanghai）。
- 存储：`user_quota(identity_id, week_start)` 主键天然按周隔离。
- `quotaInfo` 查询失败时回退为「已用 0，全额度」（不阻断流程）。
- bump 无行则 POST，有行则 PATCH +1；unbump 无行则跳过。