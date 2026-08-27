/**
 * Pure, DB-free helpers — extracted so they can be unit-tested in isolation.
 */

/** Start of the natural week (Monday 00:00 Asia/Shanghai) as YYYY-MM-DD. */
export function weekStartDateString(now = Date.now()) {
  const sh = new Date(now + 8 * 3600 * 1000); // shift to Asia/Shanghai (UTC+8)
  const day = sh.getUTCDay(); // 0=Sun, 1=Mon
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(sh.getUTCFullYear(), sh.getUTCMonth(), sh.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

/** Year-in-review persona from annual counts. */
export function personaFor(n = 0, v = 0, w = 0) {
  if (n === 0 && v === 0 && w === 0) return '旁观者 · 来年加油';
  const tags = [];
  if (n >= 3) tags.push('选片策展人');
  if (v >= 6) tags.push('投票狂人');
  if (w >= 3) tags.push('放映常客');
  if (tags.length >= 2) return '全能影迷';
  if (tags.length === 1) return tags[0];
  return '新晋影迷';
}

/** Next sequential user_no given the existing list (max + 1, zero-padded to 3). */
export function nextUserNoFromList(list = []) {
  let max = 0;
  for (const val of list) {
    const n = parseInt(String(val || '').replace(/\D/g, ''), 10) || 0;
    if (n > max) max = n;
  }
  return String(max + 1).padStart(3, '0');
}