/**
 * Homepage NEWS feed: which rows visitors see, and in what order.
 * Homepage block itself is always on — this only filters posts.
 */

export function isHomepageNews(row, now = Date.now()) {
  if (!row) return false;
  if (row.status === 'draft' || row.status === 'archived') return false;
  if (!row.published_at) return row.status === 'published';
  return new Date(row.published_at).getTime() <= now;
}

export function homepageNews(rows, now = Date.now()) {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => isHomepageNews(r, now))
    .sort((a, b) => {
      const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (pin) return pin;
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
}

/** Drag on the homepage preview: drop into the pin zone pins; drop below unpins. */
export function applyHomepageReorder(visible, fromId, toIndex) {
  const list = Array.isArray(visible) ? visible : [];
  const from = list.findIndex((r) => r.id === fromId);
  if (from < 0 || toIndex < 0 || toIndex >= list.length || from === toIndex) return visible;
  const pinCount = list.filter((r) => r.pinned).length;
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(toIndex, 0, moved);
  const pinned = toIndex < pinCount;
  return next.map((r, i) => ({
    ...r,
    sort_order: i,
    pinned: r.id === moved.id ? pinned : !!r.pinned,
  }));
}

export function presentNewsItem(row) {
  if (!row?.id || !String(row.title || '').trim()) return null;
  return {
    id: row.id,
    date: row.date ?? '',
    category: row.category || undefined,
    title: row.title,
    titleZh: row.title_zh ?? undefined,
    titleEn: row.title_en ?? undefined,
    content: row.content ?? '',
    contentZh: row.content_zh ?? undefined,
    contentEn: row.content_en ?? undefined,
    image: row.image ?? undefined,
    link: row.link ?? undefined,
  };
}
