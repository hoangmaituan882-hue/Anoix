/**
 * Generate the screening-history import migration from docs/screening-history.json.
 * Run: node scripts/gen-screening-import.mjs
 * Output: migrations/20260830120000_screening_history_import.sql (idempotent).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'docs', 'screening-history.json');
const out = path.join(root, 'migrations', '20260830120000_screening_history_import.sql');

const d = JSON.parse(fs.readFileSync(src, 'utf8'));

// Stable film id by order (hist-0001 …).
const filmId = new Map(d.films.map((f, i) => [f.t, `hist-${String(i + 1).padStart(4, '0')}`]));
const esc = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

const filmRows = d.films.map((f, i) =>
  `  (${esc(filmId.get(f.t))}, ${esc(f.t)}, ${esc(f.r)}, ${esc(f.u)}, ${esc(f.y)}, ${i})`,
).join(',\n');
const filmsSql = `INSERT INTO films (id, title, rating, watch_url, watch_type, sort_order) VALUES\n${filmRows}\nON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, watch_url = EXCLUDED.watch_url, watch_type = EXCLUDED.watch_type;`;

const scrRows = d.screenings.map((s, i) => {
  const id = `scr-${String(i + 1).padStart(4, '0')}`;
  const title = s.f.join('、');
  const arr = `ARRAY[${s.f.map((t) => esc(filmId.get(t))).join(', ')}]`;
  return `  (${esc(id)}, ${esc(title)}, ${esc(s.d)}, ${esc(s.e ?? null)}, ${arr})`;
}).join(',\n');
const scrSql = `INSERT INTO screenings (id, title, screen_date, screen_date_end, film_ids) VALUES\n${scrRows}\nON CONFLICT (id) DO NOTHING;`;

const header = `-- ============================================================\n-- 放映历史批量导入（自动生成自 docs/screening-history.json）\n-- 幂等：films upsert / screenings DO NOTHING\n-- ============================================================\n\n`;
fs.writeFileSync(out, header + filmsSql + '\n\n' + scrSql + '\n', 'utf8');

console.log(`films: ${d.films.length} | screenings: ${d.screenings.length} → ${path.relative(root, out)}`);