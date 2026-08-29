/**
 * Footer social tiles: https-only public cards, flexible count.
 */

const HOST_ICON = [
  [['x.com', 'twitter.com'], 'X'],
  [['instagram.com'], 'Instagram'],
  [['youtube.com', 'youtu.be'], 'Youtube'],
  [['twitch.tv'], 'Twitch'],
  [['discord.com', 'discord.gg'], 'MessageSquare'],
  [['patreon.com'], 'Heart'],
];

const NAME_ICON = [
  [['x', 'twitter'], 'X'],
  [['instagram'], 'Instagram'],
  [['youtube'], 'Youtube'],
  [['twitch'], 'Twitch'],
  [['discord'], 'MessageSquare'],
  [['patreon'], 'Heart'],
];

export function isHttpsUrl(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function inferSocialIcon(url, name) {
  try {
    const host = new URL(String(url || '').trim()).hostname.replace(/^www\./, '').toLowerCase();
    for (const [hosts, icon] of HOST_ICON) {
      if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return icon;
    }
  } catch {
    /* name fallback */
  }
  const n = String(name || '').trim().toLowerCase();
  for (const [names, icon] of NAME_ICON) {
    if (names.includes(n)) return icon;
  }
  return 'Link';
}

export function presentSocialLink(row) {
  const name = String(row?.name || '').trim();
  const url = String(row?.url || '').trim();
  if (!name || !isHttpsUrl(url)) return null;
  return {
    id: String(row.id || name),
    name,
    url,
    descZh: String(row.desc_zh || '').trim(),
    descEn: String(row.desc_en || '').trim(),
    descJa: String(row.desc_ja || '').trim(),
    icon: inferSocialIcon(url, name),
  };
}

export function assembleSocialLinks(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  list.sort(
    (a, b) =>
      (Number(a?.sort_order) || 0) - (Number(b?.sort_order) || 0) ||
      String(a?.name || '').localeCompare(String(b?.name || ''), 'zh'),
  );
  return { items: list.map(presentSocialLink).filter(Boolean) };
}

export function socialPayload(row, { name, url, descZh, descEn, descJa, sortOrder } = {}) {
  const nextName = name !== undefined ? String(name || '').trim() : String(row?.name || '').trim();
  const nextUrl = url !== undefined ? String(url || '').trim() : String(row?.url || '').trim();
  if (!nextName) return { ok: false, error: 'name_required' };
  if (!isHttpsUrl(nextUrl)) return { ok: false, error: 'bad_url' };
  const body = {
    name: nextName,
    url: nextUrl,
    desc_zh: descZh !== undefined ? String(descZh || '').trim() : String(row?.desc_zh || ''),
    desc_en: descEn !== undefined ? String(descEn || '').trim() : String(row?.desc_en || ''),
    desc_ja: descJa !== undefined ? String(descJa || '').trim() : String(row?.desc_ja || ''),
  };
  if (sortOrder !== undefined) body.sort_order = Number(sortOrder) || 0;
  return { ok: true, body };
}
