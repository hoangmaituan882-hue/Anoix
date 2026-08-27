# Spec: lib/pure（纯函数）

- 类型: lib 模块
- 路径: `server/lib/pure.js`（+ `pure.test.js` 10 用例）

## 导出

| 导出 | 签名 | 说明 |
|---|---|---|
| weekStartDateString | `(now=Date.now()) → 'YYYY-MM-DD'` | 该时刻所在自然周的周一（Asia/Shanghai） |
| personaFor | `(n=0, v=0, w=0) → 称号` | 年度回顾称号：旁观者/新晋影迷/选片策展人/投票狂人/放映常客/全能影迷 |
| nextUserNoFromList | `(list=[]) → '001'` | 编号推导纯函数：取最大数字 +1，零填充 3 位 |

## 备注

- 全部无副作用、无 DB 依赖，可单测（已用 `node:test` 覆盖）。
- `personaFor` 阈值：提名 ≥3 / 投票 ≥6 / 观影 ≥3；≥2 个标签 → 全能影迷。
- `nextUserNoFromList` 过滤非数字字符后取数值最大。