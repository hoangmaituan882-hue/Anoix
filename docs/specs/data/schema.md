# Spec: 数据库 Schema

> 来源：`migrations/*.sql`（已全部应用）。共 17 张表。RLS 默认启用；服务端写操作走 admin token 绕开 RLS。

## 内容类

### `films` — 放映作品库

用途：放映库的核心实体（作品）。

| 列 | 类型 | 说明 |
|---|---|---|
| id | text PK | 如 `kill-la-kill` / `tmdb-xxx` |
| title / title_zh / title_en | text | 三种语言标题 |
| year | text | 年份（字符串） |
| category | text | TV Series / Movie / … |
| image / landscape_image | text | 竖版/横版海报 URL |
| tagline / description(_zh/_en) | text | 简介 |
| director / character_design / series_composition | text | 主创 |
| cast_list / streaming_platforms | text[] | 声优 / 平台 |
| official_url / trailer_url | text | 官网 / 预告 |
| is_new | boolean | 是否新作标签 |
| screening_status | text | `unscheduled/scheduled/screened` |
| screening_date | date | 排期日期 |
| release_date | date | **上映日期**（较新加） |
| duration | integer | **时长分钟**（较新加） |
| sort_order | integer | 排序 |
| created_at / updated_at | timestamptz | 时间戳 |

RLS：公开读 `films_public_read`；admin 写 `films_admin_write`。

### `news` — 动态公告

| 列 | 类型 |
|---|---|
| id | text PK |
| date / category / title(_zh/_en) / content(_zh/_en) | text |
| image / link | text |
| status | text | `draft/published/archived`（Check） |
| published_at | timestamptz |
| pinned | boolean |
| sort_order / created_at | — |

RLS：公开读（`news_public_read`）；admin 读写（`news_admin_write` + `news_admin_read`）。

### `screenings` — 放映会档案

| 列 | 类型 |
|---|---|
| id | text PK |
| title | text |
| screen_date | date NOT NULL |
| venue / theme | text |
| film_ids | text[]（关联 films.id） |
| gallery | text[] |
| recap | text |
| created_at | timestamptz |

RLS：公开读 `screenings_public_read`；admin 写。

### `goods` — 周边商品

| 列 | 类型 |
|---|---|
| id | text PK（`goods-taobao-N`） |
| series / title(_zh/_en) | text |
| price | text（淘宝价加密，留空待填） |
| image | text |
| taobao_url | text（单一淘宝链接） |
| is_preorder | boolean |
| description / sort_order / created_at / updated_at | — |

RLS：公开读 `goods_public_read`；admin 写。种子 5 件淘宝 TOP5 已入库（price/image 空）。

### `channel_settings` — 首页官方频道入口

单行 `id='home'`。`hub_url` 为首页「查看全部」外链（Bilibili 空间/合集等）。公开读；admin 写。

### `channel_videos` — 官方频道卡片

| 列 | 类型 |
|---|---|
| id | text PK |
| url | text（点卡片跳转的外链） |
| platform | text `bilibili` / `youtube` / `other` |
| video_key | text（BV 号或 YouTube id） |
| title / title_zh | text |
| thumbnail / duration | text |
| sort_order / created_at / updated_at | — |

RLS：公开读；admin 写。无种子；后台粘贴链接解析封面后写入。

## 选片类

### `nomination_rounds` — 轮次（遗留）

后台 UI 已不再创建命名轮次；一场 `screenings` 即一轮。本表仍在库中，供旧数据与遗留接口读取。

| 列 | 类型 |
|---|---|
| id | text PK |
| title | text |
| status | text | 6 态：`draft/collecting/reviewing/voting/revealed/archived`（Check） |
| deadline | timestamptz |
| created_at | — |

### `nomination_options` — 轮次候选（提名）

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| round_id | text FK → rounds（CASCADE） |
| film_id | text FK → films（SET NULL） |
| nominator | text（'用户'/'匿名'） |
| nominee_identity_id | text（提名者身份） |
| source | text `admin/library/tmdb/user` |
| planned | boolean（勾选入库） |
| note / votes_count / created_at | — |

约束：`UNIQUE(id, round_id)`；FK votes 强一致（`votes_option_round_fk`）。

### `votes` — 投票

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| round_id | text FK → rounds（CASCADE） |
| option_id | bigint FK → options（CASCADE） |
| voter_id | text（uid 或匿名 cookie） |
| created_at | — |

约束：`UNIQUE(round_id, voter_id, option_id)`（多票制）。RLS：匿名/登录可插（`votes_anon_insert`，voter_id 非空）；admin 读（`votes_admin_read`）。

### `nomination_pool` — 提名池（持续提名）

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| film_id / tmdb_id | text（二选一标识） |
| title / original_title / year / image / overview / director / note | text |
| nominee_identity_id | text |
| source | text `user/admin...` |
| status | text `pending/promoted` |
| planned | boolean |
| created_at | — |

索引：status、nominee_identity_id。RLS：公开读 / admin 写。

### `film_week_votes` — 按周叠票（片，不是轮次选项）

用途：同一身份同一自然周对同一部片只一行，`count` 可叠到周配额上限。终身票数 = `SUM(count)`（视图 `film_vote_counts`）。

| 列 | 类型 | 说明 |
|---|---|---|
| identity_id | text | uid 或匿名 cookie |
| film_id | text | films.id |
| week_start | date | 周一（Asia/Shanghai） |
| count | integer | `> 0` |
| updated_at | timestamptz | |

主键：`(identity_id, film_id, week_start)`。RLS：admin 全开；服务端写走 admin token。

### `user_quota` — 周配额

| 列 | 类型 |
|---|---|
| identity_id | text（uid 或 cookie） |
| week_start | date（周一） |
| nominations_used / votes_used | integer |

主键：`(identity_id, week_start)`。

## 用户/社区类

### `user_roles` — 用户角色 + 元数据

| 列 | 类型 |
|---|---|
| uid | text PK（CloudBase 账户 uid） |
| username | text |
| role | text `admin/user`（Check） |
| created_at | timestamptz |
| registered_at | timestamptz（**注册时间**） |
| user_no | text（**顺序编号 001…**，UNIQUE） |

RLS：self_read（认证用户读自己）、admin_write。`is_admin()` security-definer 函数供 RLS 用。

### `notifications` — 站内通知

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| uid | text（接收者 identity） |
| type / title / body | text |
| read | boolean |
| created_at | — |

索引：uid。RLS：admin 写、owner 自读。

### `favorites` — 收藏

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| uid | text |
| film_id | text FK → films（CASCADE） |
| created_at | — |

约束：`UNIQUE(uid, film_id)`。RLS：admin 写、owner 自读。

### `watch_log` — 观影记录 + 评分

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| film_id | text FK → films（CASCADE） |
| uid | text |
| rating | integer（0–5 星） |
| review | text（短评 ≤200） |
| watched_at | timestamptz |

约束：`UNIQUE(film_id, uid)`（upsert 键）。RLS：admin 写、owner 自读。

### `rsvps` — 放映会参与

| 列 | 类型 |
|---|---|
| id | bigserial PK |
| screening_id | text FK → screenings（CASCADE） |
| uid | text |
| created_at | — |

约束：`UNIQUE(screening_id, uid)`。索引：screening_id。RLS：admin 写、owner 自读。