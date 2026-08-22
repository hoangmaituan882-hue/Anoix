/**
 * Seed generator: reads static catalog data and emits INSERT SQL for
 * CloudBase PG (films / news). Run with tsx and pipe the output into
 * managePgDatabase(action="execute") — one statement per table.
 *
 *   npx tsx scripts/seed.ts > /tmp/seed.sql
 */
import { WORKS_LIST, NEWS_LIST } from '../src/data/triggerData';
import { WorkItem, NewsItem } from '../src/types';

const esc = (v: string | null | undefined): string =>
  v == null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;

const bool = (v: boolean | undefined): string => (v ? 'true' : 'false');

const strArr = (v: string[] | undefined): string =>
  v == null || v.length === 0
    ? 'NULL'
    : `ARRAY[${v.map((x) => esc(x)).join(', ')}]::text[]`;

function filmValues(w: WorkItem, index: number): string {
  return `(${esc(w.id)}, ${esc(w.title)}, ${esc(w.titleZh)}, ${esc(w.titleEn)}, ${esc(w.year)}, ${esc(w.category)}, ${esc(w.image)}, ${esc(w.landscapeImage)}, ${esc(w.tagline)}, ${esc(w.description)}, ${esc(w.descriptionZh)}, ${esc(w.descriptionEn)}, ${esc(w.director)}, ${esc(w.characterDesign)}, ${esc(w.seriesComposition)}, ${strArr(w.cast)}, ${strArr(w.streamingPlatforms)}, ${esc(w.officialUrl)}, ${esc(w.trailerUrl)}, ${bool(w.isNew)}, ${index})`;
}

function newsValues(n: NewsItem, index: number): string {
  return `(${esc(n.id)}, ${esc(n.date)}, ${esc(n.category)}, ${esc(n.title)}, ${esc(n.titleZh)}, ${esc(n.titleEn)}, ${esc(n.content)}, ${esc(n.contentZh)}, ${esc(n.contentEn)}, ${esc(n.image)}, ${esc(n.link)}, ${index})`;
}

const filmsSql = `INSERT INTO films (id, title, title_zh, title_en, year, category, image, landscape_image, tagline, description, description_zh, description_en, director, character_design, series_composition, cast_list, streaming_platforms, official_url, trailer_url, is_new, sort_order) VALUES
${WORKS_LIST.map((w, i) => filmValues(w, i)).join(',\n')}
ON CONFLICT (id) DO NOTHING;`;

const newsSql = `INSERT INTO news (id, date, category, title, title_zh, title_en, content, content_zh, content_en, image, link, sort_order) VALUES
${NEWS_LIST.map((n, i) => newsValues(n, i)).join(',\n')}
ON CONFLICT (id) DO NOTHING;`;

console.log('-- ==== FILMS ====');
console.log(filmsSql);
console.log('-- ==== NEWS ====');
console.log(newsSql);
