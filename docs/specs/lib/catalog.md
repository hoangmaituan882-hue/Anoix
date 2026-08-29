# Spec: lib/catalog（片库排序 / 检索 / 周票）

- 类型: lib 模块
- 路径: `server/lib/catalog.js`（+ `catalog.test.js`）
- 依赖: 无（纯函数）

## 导出

| 导出 | 签名 | 说明 |
|---|---|---|
| shanghaiDateString | `(now=Date.now()) → 'YYYY-MM-DD'` | Asia/Shanghai 日历日 |
| latestPastClubDate | `(dates, today) → day\|null` | 不晚于 today 的最近社内放映日 |
| filmVoteGate | `(dates, today) → 'open'\|'frozen'\|'screened'` | 无日期=open；仅未来=frozen；任一过去=screened |
| clubIndexByFilm | `(screenings) → Map` | `film_id → { dates, order: Map<day, film_ids index> }` |
| rankFeatured | `(films, screenings, today) → FilmCard[]` | 最多 12 张；只含已放过；同夜按 `film_ids[]`；前两张 `isNew` |
| placeFilmOnNight | `(screenings, filmId, date, insertIndex?)` | 拖到某日：没有场次则建 `night-YYYY-MM-DD` |
| moveFilmBetweenNights | `(screenings, filmId, fromDate, toDate, insertIndex?)` | 从一天挪到另一天（fromDate 空则等于 place） |
| reorderNight | `(screenings, date, orderedIds)` | 同晚改 `film_ids` 顺序 |
| filmScheduleFields | `(dates, today)` | `{ screening_date: 最近已放过日\|null, screening_status }` |
| sortScreenedDesc | `(films, latestById)` | 已放过按社内日新→旧；从未放过垫底再按年份降序 |
| matchFilmQuery | `(film, q)` | 匹配 title / title_zh / title_en / director / year（不含 tagline） |
| matchFilmCategory | `(film, category)` | `all\|tv\|movie\|original`（Netflix/Original → original） |
| paginate | `(items, offset, limit)` | `{ items, total, offset, limit }` |
| clampAddVotes | `(requested, remaining)` | 默认 +1，封顶剩余配额 |
| yearNum | `(str) → number` | 抽四位年份 |

## 备注

- 首页 reel 与片库默认序都认 **社内** `screenings.screen_date`，不认院线 `release_date`。
- 未来场次不进 featured；空 reel 合法（前端可用种子兜底）。
- 保存场次后用 `filmScheduleFields` 回写 `films.screening_date`（只认已放过）与 `screening_status`。
